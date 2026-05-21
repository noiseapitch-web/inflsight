export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toInput, calculate, fmtWon, fmtPct } from "@/lib/metrics/calculator";
import CreatorsClient from "@/components/creator/CreatorsClient";

async function getCreators() {
  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
    include: { accounts: true, contents: { include: { metrics: { orderBy: { collectedAt: "desc" } } } } },
  });
  return creators.map(cr => {
    let totalFee = 0;
    const cpvList: number[] = [], lrList: number[] = [];
    cr.contents.forEach(c => {
      if (c.fee) totalFee += c.fee;
      const lat: Record<string, typeof c.metrics[0]> = {};
      c.metrics.forEach(m => { if (!lat[m.metricName] || m.collectedAt > lat[m.metricName].collectedAt) lat[m.metricName] = m; });
      const calc = calculate(toInput(Object.values(lat).map(m => ({ metricName: m.metricName, metricValue: m.metricValue })), { fee: c.fee }));
      if (calc.cpv.value !== null) cpvList.push(calc.cpv.value);
      if (calc.like_rate.value !== null) lrList.push(calc.like_rate.value);
    });
    const avgCpv = cpvList.length ? cpvList.reduce((a, b) => a + b) / cpvList.length : null;
    const avgLr  = lrList.length  ? lrList.reduce((a, b) => a + b) / lrList.length  : null;
    const igAcc  = cr.accounts.find(a => a.platform === "INSTAGRAM");
    return { id: cr.id, name: cr.name, category: cr.category, totalFee, avgCpv, avgLr, contentCount: cr.contents.length, igAcc: igAcc ? { handle: igAcc.handle, oauthStatus: igAcc.oauthStatus, platform: igAcc.platform } : null, accounts: cr.accounts.map(a => ({ platform: a.platform, handle: a.handle })) };
  });
}

export default async function CreatorsPage() {
  const creators = await getCreators();
  return <CreatorsClient initialCreators={creators} />;
}
