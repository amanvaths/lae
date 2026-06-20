export const contractKeys = {
  all: ["contract"] as const,
  user: (address?: string) => [...contractKeys.all, "user", address] as const,
  wallet: (address?: string) => [...contractKeys.all, "wallet", address] as const,
  club: (address?: string) => [...contractKeys.all, "club", address] as const,
  pilot: (address?: string) => [...contractKeys.all, "pilot", address] as const,
  pending: () => [...contractKeys.all, "pending"] as const,
  referrals: (address?: string) => [...contractKeys.all, "referrals", address] as const,
  events: (address?: string) => [...contractKeys.all, "events", address] as const,
  prices: () => [...contractKeys.all, "prices"] as const,
};
