import { NextResponse } from "next/server";
export const ok = <T>(data: T, status = 200) => NextResponse.json({ ok: true, data }, { status });
export const fail = (msg: string, status = 400, details?: unknown) => NextResponse.json({ ok: false, error: msg, details: details ?? null }, { status });
export function handleError(err: unknown) {
  if (err instanceof Error) { console.error(err.message); return fail(err.message, 500); }
  return fail("서버 오류", 500);
}
