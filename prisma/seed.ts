// 샘플 데이터 없음 — 빈 DB로 시작
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("✅ DB 준비 완료 (빈 상태로 시작)");
}
main().catch(console.error).finally(() => prisma.$disconnect());
