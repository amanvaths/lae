"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther, type Address } from "viem";
import { CONTRACTS, MAX_UINT256 } from "../addresses";
import { sensoLimitlessAbi } from "../abis";
import { erc20Abi } from "../abis/erc20";
import { sensoSpinAbi } from "../abis/sensoSpin";
import { sensoStakingAbi } from "../abis/sensoStaking";
import { makeWithdrawRef, getSponsorFromUrl } from "../services/utils";
import { useInvalidateOnChain, usePendingQueue } from "./useReads";
import { useToast } from "@/providers/ToastProvider";

function useTxToast() {
  const { push } = useToast();
  return {
    onSubmit: (label: string) => push(`${label} — confirm in wallet`, "info"),
    onSuccess: (label: string) => push(`${label} confirmed`, "success"),
    onError: (label: string, err: unknown) =>
      push(`${label} failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error"),
  };
}

export function useDaiAllowance(spender: Address = CONTRACTS.senso) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACTS.dai,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });
}

export function useSltAllowance(spender: Address = CONTRACTS.staking) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACTS.slt,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });
}

export function useRegisterOnChain() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();
  const client = usePublicClient();

  return useCallback(
    async (sponsor?: Address) => {
      let target = sponsor ?? getSponsorFromUrl();
      if (!target && client) {
        target = await client.readContract({
          address: CONTRACTS.senso,
          abi: sensoLimitlessAbi,
          functionName: "rootSponsor",
        });
      }
      if (!target) throw new Error("Sponsor address required");
      toast.onSubmit("Register");
      const hash = await writeContractAsync({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "register",
        args: [target],
      });
      toast.onSuccess("Registration");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast, client]
  );
}

export function useRegisterAndWait() {
  const register = useRegisterOnChain();
  const client = usePublicClient();
  return useCallback(
    async (sponsor?: Address) => {
      const hash = await register(sponsor);
      if (client && hash) {
        await client.waitForTransactionReceipt({ hash });
      }
      return hash;
    },
    [register, client]
  );
}

export function useDaiFaucet() {
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (amountEth = "100") => {
      toast.onSubmit("Faucet");
      const hash = await writeContractAsync({
        address: CONTRACTS.dai,
        abi: erc20Abi,
        functionName: "faucet",
        args: [parseEther(amountEth)],
      });
      if (client) {
        await client.waitForTransactionReceipt({ hash });
      }
      toast.onSuccess(`Faucet — ${amountEth} mDAI minted`);
      invalidate();
      return hash;
    },
    [writeContractAsync, client, invalidate, toast]
  );
}

export function useApproveDai() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (spender: Address = CONTRACTS.senso) => {
      toast.onSubmit("DAI approve");
      const hash = await writeContractAsync({
        address: CONTRACTS.dai,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, MAX_UINT256],
      });
      toast.onSuccess("DAI approved");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function useApproveDaiAndWait() {
  const approve = useApproveDai();
  const client = usePublicClient();
  return useCallback(
    async (spender: Address = CONTRACTS.senso) => {
      const hash = await approve(spender);
      if (client && hash) {
        await client.waitForTransactionReceipt({ hash });
      }
      return hash;
    },
    [approve, client]
  );
}

export function useApproveSlt() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (spender: Address = CONTRACTS.staking) => {
      toast.onSubmit("SLT approve");
      const hash = await writeContractAsync({
        address: CONTRACTS.slt,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, MAX_UINT256],
      });
      toast.onSuccess("SLT approved");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function usePurchaseClub() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (level: number) => {
      toast.onSubmit(`Club L${level} purchase`);
      const hash = await writeContractAsync({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "purchaseClub",
        args: [level],
      });
      toast.onSuccess("Club purchase");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function usePurchaseClubAndWait() {
  const purchase = usePurchaseClub();
  const client = usePublicClient();
  return useCallback(
    async (level: number) => {
      const hash = await purchase(level);
      if (client && hash) {
        await client.waitForTransactionReceipt({ hash });
      }
      return hash;
    },
    [purchase, client]
  );
}

export function usePurchasePilot() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (level: number) => {
      toast.onSubmit(`Pilot L${level} purchase`);
      const hash = await writeContractAsync({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "purchasePilot",
        args: [level],
      });
      toast.onSuccess("Pilot purchase");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function useProcessPending() {
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();
  const pending = usePendingQueue();
  const [processing, setProcessing] = useState(false);
  const [processedTotal, setProcessedTotal] = useState(0);

  const run = useCallback(async () => {
    if (!client) throw new Error("No RPC client");
    setProcessing(true);
    setProcessedTotal(0);
    try {
      let remaining = Number(
        await client.readContract({
          address: CONTRACTS.senso,
          abi: sensoLimitlessAbi,
          functionName: "pendingLength",
        })
      );
      while (remaining > 0) {
        toast.onSubmit(`Processing queue (${remaining} pending)`);
        const hash = await writeContractAsync({
          address: CONTRACTS.senso,
          abi: sensoLimitlessAbi,
          functionName: "processPending",
          args: [10n],
        });
        if (client && hash) {
          await client.waitForTransactionReceipt({ hash });
        }
        setProcessedTotal((n) => n + Math.min(remaining, 10));
        remaining = Number(
          await client.readContract({
            address: CONTRACTS.senso,
            abi: sensoLimitlessAbi,
            functionName: "pendingLength",
          })
        );
      }
      toast.onSuccess("Queue processed");
    } catch (err) {
      toast.onError("Queue processing", err);
      throw err;
    } finally {
      setProcessing(false);
      invalidate();
    }
  }, [writeContractAsync, client, invalidate, toast]);

  return { run, processing, processedTotal, pending: pending.data ?? 0n };
}

export function useWithdrawOnChain() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (amountEth: string) => {
      if (!address) throw new Error("Wallet not connected");
      const amount = parseEther(amountEth);
      const withdrawRef = makeWithdrawRef(address);
      toast.onSubmit("Withdraw");
      const hash = await writeContractAsync({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "withdraw",
        args: [amount, withdrawRef],
      });
      toast.onSuccess("Withdraw");
      invalidate();
      return hash;
    },
    [address, writeContractAsync, invalidate, toast]
  );
}

export function useExecuteSpin() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(async () => {
    toast.onSubmit("Spin");
    const hash = await writeContractAsync({
      address: CONTRACTS.spin,
      abi: sensoSpinAbi,
      functionName: "spin",
    });
    toast.onSuccess("Spin");
    invalidate();
    return hash;
  }, [writeContractAsync, invalidate, toast]);
}

export function useStakeOnChain() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (amountEth: string) => {
      toast.onSubmit("Stake SLT");
      const hash = await writeContractAsync({
        address: CONTRACTS.staking,
        abi: sensoStakingAbi,
        functionName: "stake",
        args: [parseEther(amountEth)],
      });
      toast.onSuccess("Stake");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function useReleaseStake() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateOnChain();
  const toast = useTxToast();

  return useCallback(
    async (index: number) => {
      toast.onSubmit("Release stake");
      const hash = await writeContractAsync({
        address: CONTRACTS.staking,
        abi: sensoStakingAbi,
        functionName: "release",
        args: [BigInt(index)],
      });
      toast.onSuccess("Stake released");
      invalidate();
      return hash;
    },
    [writeContractAsync, invalidate, toast]
  );
}

export function useWaitTx(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({ hash });
}
