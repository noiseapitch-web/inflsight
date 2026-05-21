export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api/response";

// GET /api/creators
export async function GET() {
  try {
    const data = await prisma.creator.findMany({
      orderBy: { createdAt: "desc" },
      include: { accounts: true, _count: { select: { contents: true } } },
    });
    return ok(data);
  } catch (e) { return handleError(e); }
}

// POST /api/creators — 크리에이터 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, handle, profileUrl, platform, category } = body;

    if (!name?.trim()) return fail("이름을 입력해주세요", 400);
    if (!handle?.trim()) return fail("핸들(@계정명)을 입력해주세요", 400);
    if (!platform) return fail("플랫폼을 선택해주세요", 400);

    const creator = await prisma.creator.create({
      data: {
        name: name.trim(),
        category: category?.trim() || null,
        accounts: {
          create: {
            platform,
            handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`,
            profileUrl: profileUrl?.trim() || `https://instagram.com/${handle.trim().replace("@", "")}`,
            oauthStatus: "NONE",
          },
        },
      },
      include: { accounts: true },
    });

    return ok(creator, 201);
  } catch (e) { return handleError(e); }
}
