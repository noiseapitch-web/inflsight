export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api/response";

// GET /api/campaigns
export async function GET() {
  try {
    const data = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { creators: true, contents: true } },
        contents: { select: { fee: true } },
      },
    });
    return ok(data.map(c => ({ ...c, totalFee: c.contents.reduce((s, x) => s + (x.fee ?? 0), 0) })));
  } catch (e) { return handleError(e); }
}

// POST /api/campaigns — 캠페인 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, brandName, startDate, endDate, budget } = body;

    if (!name?.trim()) return fail("캠페인명을 입력해주세요", 400);

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        brandName: brandName?.trim() || null,
        budget: budget ? parseInt(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "DRAFT",
      },
    });

    return ok(campaign, 201);
  } catch (e) { return handleError(e); }
}
