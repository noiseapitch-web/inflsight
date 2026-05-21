export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { fmtWon } from "@/lib/metrics/calculator";
import CampaignsClient from "@/components/campaign/CampaignsClient";

async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { creators: true, contents: true } }, contents: { select: { fee: true } } },
  });
  return campaigns.map(c => ({
    id: c.id, name: c.name, brandName: c.brandName, status: c.status,
    startDate: c.startDate?.toLocaleDateString("ko-KR") ?? null,
    endDate:   c.endDate?.toLocaleDateString("ko-KR") ?? null,
    creatorCount: c._count.creators, contentCount: c._count.contents,
    totalFee: c.contents.reduce((s, x) => s + (x.fee ?? 0), 0),
  }));
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignsClient initialCampaigns={campaigns} />;
}
