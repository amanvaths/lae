/**
 * Legacy contract hooks — re-export only what's still used by remaining components.
 * Active LAE Club hooks are in @/lib/lae-club/hooks.
 */
export { useInvalidateOnChain, useLaeEventWatcher } from "./useReads";
export { useWalletOnChain, useIsRootAdmin } from "./useReads";
export { useDaiAllowance, useApproveDai, useApproveDaiAndWait, useDaiFaucet } from "./useWrites";
