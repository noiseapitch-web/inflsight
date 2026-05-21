export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toInput, calculate, fmtWon, fmtPct } from "@/lib/metrics/calculator";
import DashboardClient from "@/components/dashboard/DashboardClient";

async function getData() {
  const [creators, campaigns, contents] = await Promise.all([
    prisma.creator.findMany({ include: { accounts: true } }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.content.findMany({
      include: { metrics: { orderBy: { collectedAt: "desc" } }, creator: { select: { name: true } } },
      orderBy: { postedAt: "desc" },
      take: 50,
    }),
  ]);

  const isEmpty = creators.length === 0 && campaigns.length === 0;

  // 지표 계산
  let totalFee = 0;
  const cpvList: number[] = [];
  const lrList: number[] = [];

  const recentContents = contents.slice(0, 5).map(c => {
    if (c.fee) totalFee += c.fee;
    const lat: Record<string, typeof c.metrics[0]> = {};
    c.metrics.forEach(m => {
      if (!lat[m.metricName] || m.collectedAt > lat[m.metricName].collectedAt) lat[m.metricName] = m;
    });
    const arr = Object.values(lat).map(m => ({ metricName: m.metricName, metricValue: m.metricValue }));
    const calc = calculate(toInput(arr, { fee: c.fee }));
    if (calc.cpv.value !== null) cpvList.push(calc.cpv.value);
    if (calc.like_rate.value !== null) lrList.push(calc.like_rate.value);
    return {
      id: c.id,
      creatorName: c.creator.name,
      platform: c.platform,
      views: lat["video_views"]?.metricValue ?? null,
      cpv: calc.cpv.value,
      lr: calc.like_rate.value,
      fee: c.fee ?? null,
      src: Object.values(lat)[0]?.source ?? "UNKNOWN",
      url: c.url,
    };
  });

  // 전체 fee는 contents 전체에서
  contents.forEach(c => { if (c.fee) totalFee += c.fee; });
  // 중복 제거 (recentContents에서 이미 더했으니 다시 계산)
  totalFee = contents.reduce((s, c) => s + (c.fee ?? 0), 0);

  const avgCpv = cpvList.length ? cpvList.reduce((a, b) => a + b) / cpvList.length : null;
  const avgLr  = lrList.length  ? lrList.reduce((a, b) => a + b) / lrList.length  : null;
  const oauthCount = creators.flatMap(c => c.accounts).filter(a => a.oauthStatus === "CONNECTED").length;

  return {
    isEmpty,
    stats: {
      creatorCount: creators.length,
      campaignCount: campaigns.length,
      contentCount: contents.length,
      oauthCount,
      totalFee,
      avgCpv,
      avgLr,
    },
    recentCampaigns: campaigns.slice(0, 3).map(c => ({
      id: c.id, name: c.name, brandName: c.brandName, status: c.status,
    })),
    recentContents,
    creators: creators.slice(0, 4).map(c => ({
      id: c.id, name: c.name,
      igAcc: c.accounts.find(a => a.platform === "INSTAGRAM") ?? null,
    })),
  };
}

export default async function DashboardPage() {
  const data = await getData();
  return <DashboardClient data={data} />;
}
