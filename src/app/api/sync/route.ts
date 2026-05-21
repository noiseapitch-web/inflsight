export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/oauth/token";

const IG_BASE = "https://graph.instagram.com";

async function fetchAndSave(creatorId: string, accessToken: string) {
  const results: { contentId: string; status: string }[] = [];

  try {
    const profileRes = await fetch(
      `${IG_BASE}/me?fields=id,username,followers_count,follows_count,media_count&access_token=${accessToken}`
    );
    if (profileRes.ok) {
      const profile = await profileRes.json() as {
        followers_count?: number;
        follows_count?: number;
        media_count?: number;
      };
      const account = await prisma.creatorAccount.findFirst({
        where: { creatorId, platform: "INSTAGRAM" },
      });
      if (account) {
        const now = new Date();
        if (typeof profile.followers_count === "number") {
          await prisma.accountMetricSnapshot.create({
            data: { accountId: account.id, metricName: "follower_count", metricValue: profile.followers_count, source: "OFFICIAL_API", confidence: "HIGH", collectedAt: now },
          });
        }
        if (typeof profile.follows_count === "number") {
          await prisma.accountMetricSnapshot.create({
            data: { accountId: account.id, metricName: "following_count", metricValue: profile.follows_count, source: "OFFICIAL_API", confidence: "HIGH", collectedAt: now },
          });
        }
        if (typeof profile.media_count === "number") {
          await prisma.accountMetricSnapshot.create({
            data: { accountId: account.id, metricName: "media_count", metricValue: profile.media_count, source: "OFFICIAL_API", confidence: "HIGH", collectedAt: now },
          });
        }
      }
    }
  } catch (e) { console.error("[sync] profile fetch error:", e); }

  const contents = await prisma.content.findMany({
    where: { creatorId, platform: "INSTAGRAM", platformMediaId: { not: null } },
  });

  for (const content of contents) {
    if (!content.platformMediaId) continue;
    try {
      const fields = "id,like_count,comments_count,media_type,timestamp,video_views";
      const mediaRes = await fetch(
        `${IG_BASE}/${content.platformMediaId}?fields=${fields}&access_token=${accessToken}`
      );
      if (!mediaRes.ok) { results.push({ contentId: content.id, status: `API_ERROR_${mediaRes.status}` }); continue; }
      const media = await mediaRes.json() as {
        media_type?: string;
        like_count?: number;
        comments_count?: number;
        video_views?: number;
      };

      const now = new Date();
      const isVideo = media.media_type === "VIDEO";

      const snapshotData = [
        { metricName: "likes_count", metricValue: media.like_count ?? null },
        { metricName: "comments_count", metricValue: media.comments_count ?? null },
        { metricName: "video_views", metricValue: isVideo ? (media.video_views ?? null) : null },
      ].filter(s => s.metricValue !== null) as { metricName: string; metricValue: number }[];

      if (snapshotData.length > 0) {
        await prisma.contentMetricSnapshot.createMany({
          data: snapshotData.map(s => ({
            contentId: content.id,
            metricName: s.metricName,
            metricValue: s.metricValue,
            source: "OFFICIAL_API" as const,
            confidence: "HIGH" as const,
            collectedAt: now,
          })),
        });
      }

      results.push({ contentId: content.id, status: "success" });
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      results.push({ contentId: content.id, status: `error: ${String(e)}` });
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = req.nextUrl;
  const specificCreatorId = searchParams.get("creatorId");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !specificCreatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.creatorAccount.findMany({
    where: {
      platform: "INSTAGRAM",
      oauthStatus: "CONNECTED",
      tokenExpiry: { gt: new Date() },
      ...(specificCreatorId ? { creatorId: specificCreatorId } : {}),
    },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ ok: true, message: "연동된 계정 없음", results: [] });
  }

  const allResults: { creatorId: string; handle?: string; results?: { contentId: string; status: string }[]; error?: string }[] = [];

  for (const account of accounts) {
    if (!account.accessToken) continue;
    try {
      const decrypted = decryptToken(account.accessToken);
      const results = await fetchAndSave(account.creatorId, decrypted);
      allResults.push({ creatorId: account.creatorId, handle: account.handle, results });
    } catch (e) {
      allResults.push({ creatorId: account.creatorId, error: String(e) });
    }
  }

  for (const account of accounts) {
    if (!account.tokenExpiry || !account.accessToken) continue;
    const daysLeft = (account.tokenExpiry.getTime() - Date.now()) / 86_400_000;
    if (daysLeft <= 7) {
      try {
        const decrypted = decryptToken(account.accessToken);
        const refreshRes = await fetch(
          `${IG_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${decrypted}`
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json() as { access_token?: string; expires_in?: number };
          if (data.access_token) {
            const newExpiry = new Date(Date.now() + (data.expires_in ?? 5184000) * 1000);
            await prisma.creatorAccount.update({
              where: { id: account.id },
              data: { accessToken: data.access_token, tokenExpiry: newExpiry, oauthStatus: "CONNECTED" },
            });
          }
        }
      } catch { /* 갱신 실패 무시 */ }
    }
  }

  return NextResponse.json({ ok: true, syncedAccounts: accounts.length, results: allResults });
}
