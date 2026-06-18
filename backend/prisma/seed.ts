import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rootWallet = "0x0000000000000000000000000000000000000001";
  const rootCode = "SENSOROOT";

  let root = await prisma.user.findFirst({
    where: { walletAddress: rootWallet },
  });

  if (!root) {
    root = await prisma.user.create({
      data: {
        walletAddress: rootWallet,
        referralCode: rootCode,
        username: "SENSO Root",
        isAdmin: true,
        treePath: "/",
        treeDepth: 0,
        wallet: { create: {} },
      },
    });

    const treePath = `/${root.id}/`;
    root = await prisma.user.update({
      where: { id: root.id },
      data: { treePath, treeDepth: 1 },
    });

    console.log("Created root user with referral code:", rootCode);
    console.log("Root treePath:", treePath);
  }

  await prisma.systemConfig.upsert({
    where: { key: "staking_eligibility" },
    create: {
      key: "staking_eligibility",
      value: { minTokens: 5_000_000, minClubLevel: 10 },
    },
    update: {},
  });

  await prisma.systemConfig.upsert({
    where: { key: "wom_rewards" },
    create: {
      key: "wom_rewards",
      value: { defaultDai: 10, defaultTokens: 1000 },
    },
    update: {},
  });

  await prisma.systemConfig.upsert({
    where: { key: "cache_ttl" },
    create: {
      key: "cache_ttl",
      value: { dashboard: 60, leaderboard: 300 },
    },
    update: {},
  });

  await prisma.systemConfig.upsert({
    where: { key: "sponsor_payment" },
    create: {
      key: "sponsor_payment",
      value: { enabled: false, clubPercent: 0, pilotPercent: 0 },
    },
    update: {},
  });

  await prisma.systemConfig.upsert({
    where: { key: "token_reward" },
    create: {
      key: "token_reward",
      value: {
        mode: "FIXED_SLT",
        clubWelcomePercent: 0.5,
        clubDirectPercent: 0.1,
        pilotWelcomePercent: 1.0,
        pilotDirectPercent: 0.1,
      },
    },
    update: {},
  });

  await prisma.systemConfig.upsert({
    where: { key: "pilot_incentive" },
    create: {
      key: "pilot_incentive",
      value: { enabled: true, recipient: "sponsor" },
    },
    update: {},
  });

  console.log("Seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
