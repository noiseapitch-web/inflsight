// POST /api/sync — Instagram Business Login API 지표 수집
// 공식 문서 기준: graph.instagram.com/v25.0/{id}/insights
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/oauth/token";

const IG_BASE = "https://graph.instagram.com/v25.0";

async function fetchAndSave(creatorId: string, accessToken: string) {
  const results: { contentId: string; status: string }[] = [];

  // ─── 1. 계정 기본 정보 수집 ────────────────────────────
  try {
    // Instagram Business Login에서 가능한 필드들 (공식 문서 기준)
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

  // ─── 2. 콘텐츠 지표 수집 ──────────────────────────────
  const contents = await prisma.content.findMany({
    where: { creatorId, platform: "INSTAGRAM", platformMediaId: { not: null } },
  });

  for (const content of contents) {
    if (!content.platformMediaId) continue;
    try {
      // 2-1. 기본 필드 (likes, comments)
      const mediaRes = await fetch(
        `${IG_BASE}/${content.platformMediaId}?fields=id,media_type,media_product_type,like_count,comments_count,timestamp&access_token=${accessToken}`
      );
      if (!mediaRes.ok) {
        results.push({ contentId: content.id, status: `API_ERROR_${mediaRes.status}` });
        continue;
      }
      const media = await mediaRes.json() as {
        media_type?: string;
        media_product_type?: string;
        like_count?: number;
        comments_count?: number;
      };

      const now = new Date();
      const snapshotData: { metricName: string; metricValue: number }[] = [];

      if (typeof media.like_count === "number") {
        snapshotData.push({ metricName: "likes_count", metricValue: media.like_count });
      }
      if (typeof media.comments_count === "number") {
        snapshotData.push({ metricName: "comments_count", metricValue: media.comments_count });
      }

      // 2-2. Insights API로 조회수·도달·공유수·저장수 수집
      // 공식 문서: /{media-id}/insights?metric=views,reach,shares,saved
      // 콘텐츠 타입에 따라 다른 metric 사용 가능
      const isVideo = media.media_type === "VIDEO";
      const productType = media.media_product_type; // FEED, REELS, STORY
      
      // 모든 타입 공통 metric
      const metrics: string[] = ["reach", "shares", "saved", "total_interactions", "views"];
      // FEED, REELS에서만 가능한 metric
      if (productType === "FEED" || productType === "REELS") {
        metrics.push("profile_visits", "profile_activity");
      }

      try {
        const insightsRes = await fetch(
          `${IG_BASE}/${content.platformMediaId}/insights?metric=${metrics.join(",")}&access_token=${accessToken}`
        );
        if (insightsRes.ok) {
          const insights = await insightsRes.json() as {
            data?: { name: string; values: { value: number }[] }[];
          };
          insights.data?.forEach(metric => {
            const value = metric.values?.[0]?.value;
            if (typeof value === "number") {
              // metric name 매핑: views → video_views (기존 코드 호환)
              const dbName = metric.name === "views" ? "video_views" : metric.name;
              snapshotData.push({ metricName: dbName, metricValue: value });
            }
          });
        }
      } catch (e) {
        console.error("[sync] insights fetch error:", e);
      }

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
      await new Promise(r => setTimeout(r, 300)); // rate limit 방지
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

  // 토큰 D-7 이내면 갱신 시도
  for (const account of accounts) {
    if (!account.tokenExpiry || !account.accessToken) continue;
    const daysLeft = (account.tokenExpiry.getTime() - Date.now()) / 86_400_000;
    if (daysLeft <= 7) {
      try {
        const decrypted = decryptToken(account.accessToken);
        const refreshRes = await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${decrypted}`
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
