export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api/response";

// POST /api/contents — 콘텐츠 URL 등록
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, creatorId, url, contentType, postedAt, fee } = body;

    if (!campaignId) return fail("캠페인을 선택해주세요", 400);
    if (!creatorId) return fail("크리에이터를 선택해주세요", 400);
    if (!url?.trim()) return fail("콘텐츠 URL을 입력해주세요", 400);

    // 플랫폼 자동 판별
    let platform: "INSTAGRAM" | "YOUTUBE" | "TIKTOK" | "UNKNOWN" = "UNKNOWN";
    if (url.includes("instagram.com")) platform = "INSTAGRAM";
    else if (url.includes("youtube.com") || url.includes("youtu.be")) platform = "YOUTUBE";
    else if (url.includes("tiktok.com")) platform = "TIKTOK";

    // 콘텐츠 타입 자동 판별
    let resolvedType = contentType;
    if (!resolvedType) {
      if (url.includes("/reel/") || url.includes("/reels/")) resolvedType = "reel";
      else if (url.includes("/p/")) resolvedType = "feed_image";
      else if (url.includes("/shorts/")) resolvedType = "shorts";
    }

    const content = await prisma.content.create({
      data: {
        campaignId,
        creatorId,
        url: url.trim(),
        platform,
        contentType: resolvedType || null,
        postedAt: postedAt ? new Date(postedAt) : null,
        fee: fee ? parseInt(fee) : null,
      },
    });

    return ok(content, 201);
  } catch (e) { return handleError(e); }
}
