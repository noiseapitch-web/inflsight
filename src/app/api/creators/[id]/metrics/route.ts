export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api/response";

// POST /api/creators/[id]/metrics — 수동 지표 입력
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { contentId, likes, comments, videoViews, shares, note } = body;

    if (!contentId) return fail("contentId가 필요합니다", 400);

    // 해당 콘텐츠가 이 크리에이터 것인지 확인
    const content = await prisma.content.findFirst({
      where: { id: contentId, creatorId: params.id },
    });
    if (!content) return fail("콘텐츠를 찾을 수 없습니다", 404);

    const collectedAt = new Date();
    const entries = [
      { name: "likes_count",    value: likes      ? parseInt(likes)      : null },
      { name: "comments_count", value: comments   ? parseInt(comments)   : null },
      { name: "video_views",    value: videoViews ? parseInt(videoViews) : null },
      { name: "shares",         value: shares     ? parseInt(shares)     : null },
    ].filter(e => e.value !== null && !isNaN(e.value as number));

    if (entries.length === 0) return fail("입력된 지표가 없습니다", 400);

    await prisma.contentMetricSnapshot.createMany({
      data: entries.map(e => ({
        contentId,
        metricName:  e.name,
        metricValue: e.value,
        source:      "MANUAL_INPUT",
        confidence:  "MEDIUM",
        collectedAt,
        rawJson:     { note: note || "수동 입력" },
      })),
    });

    return ok({ saved: entries.length, note: "source: MANUAL_INPUT, confidence: MEDIUM" });
  } catch (e) { return handleError(e); }
}
