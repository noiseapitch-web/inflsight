export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import OAuthClient from "@/components/oauth/OAuthClient";

async function getData() {
  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      accounts: { where: { platform: "INSTAGRAM" } },
    },
  });

  return creators.map(cr => {
    const acc = cr.accounts[0] ?? null;
    const daysLeft = acc?.tokenExpiry
      ? Math.floor((acc.tokenExpiry.getTime() - Date.now()) / 86_400_000)
      : null;
    return {
      id: cr.id,
      name: cr.name,
      handle: acc?.handle ?? null,
      oauthStatus: acc?.oauthStatus ?? "NONE",
      tokenExpiry: acc?.tokenExpiry?.toISOString() ?? null,
      daysLeft,
      hasIgAccount: !!acc,
    };
  });
}

export default async function OAuthPage() {
  const creators = await getData();
  return <OAuthClient creators={creators} />;
}
