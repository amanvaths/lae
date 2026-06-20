"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, type Address } from "viem";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeCoinAbi, erc20BalanceAbi } from "@/lib/lae-club/abis";
import { Panel, Pill } from "@/components/dashboard/ui";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { useToast } from "@/providers/ToastProvider";
import { formatWalletError } from "@/lib/wallet/errors";

type OrderRow = {
  id: bigint;
  seller: Address;
  laeAmount: bigint;
  pricePerLae: bigint;
  active: boolean;
};

export function LaeOnChainP2P() {
  const { address } = useAccount();
  const { push } = useToast();
  const [sellAmount, setSellAmount] = useState("");
  const [pricePerLae, setPricePerLae] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const enabled = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "p2pEnabled",
  });
  const nextId = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "nextOrderId",
  });
  const paymentToken = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "p2pPaymentToken",
  });
  const laeBalance = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const orderIds = useMemo(() => {
    const n = nextId.data ?? 0n;
    const ids: bigint[] = [];
    for (let i = 1n; i <= n; i++) ids.push(i);
    return ids.slice(-20).reverse();
  }, [nextId.data]);

  const { writeContractAsync, data: txHash } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  async function approvePayment(spender: Address, amount: bigint) {
    const token = paymentToken.data as Address | undefined;
    if (!token || token === "0x0000000000000000000000000000000000000000") {
      throw new Error("P2P payment token not configured");
    }
    await writeContractAsync({
      address: token,
      abi: [
        ...erc20BalanceAbi,
        {
          type: "function",
          name: "approve",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ type: "bool" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "approve",
      args: [spender, amount],
    });
  }

  async function createOrder() {
    if (!address) return;
    const laeAmount = parseEther(sellAmount || "0");
    const price = parseEther(pricePerLae || "0");
    if (laeAmount <= 0n || price <= 0n) return;
    setPending("create");
    try {
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "createP2POrder",
        args: [laeAmount, price],
      });
      setSellAmount("");
      setPricePerLae("");
      push("Sell order created", "success");
    } catch (e) {
      push(formatWalletError(e), "error");
    } finally {
      setPending(null);
    }
  }

  async function fillOrder(order: OrderRow) {
    if (!address) return;
    const payment = (order.laeAmount * order.pricePerLae) / parseEther("1");
    setPending(`fill-${order.id}`);
    try {
      await approvePayment(LAE_CONTRACTS.laeCoin, payment);
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "fillP2POrder",
        args: [order.id],
      });
      push("Order filled", "success");
    } catch (e) {
      push(formatWalletError(e), "error");
    } finally {
      setPending(null);
    }
  }

  async function cancelOrder(orderId: bigint) {
    setPending(`cancel-${orderId}`);
    try {
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "cancelP2POrder",
        args: [orderId],
      });
      push("Order cancelled", "success");
    } catch (e) {
      push(formatWalletError(e), "error");
    } finally {
      setPending(null);
    }
  }

  if (enabled.data === false) {
    return (
      <Panel title="P2P marketplace">
        <p className="text-sm text-slate-400">P2P trading is currently disabled by admin.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel title="Sell LAE (on-chain)">
        <p className="mb-4 text-sm text-slate-400">
          List LAE for sale. Buyers pay with the configured payment token via{" "}
          <code className="text-brand-300">fillP2POrder</code>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-500">LAE amount</span>
            <input
              type="number"
              min="0"
              step="any"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Price per LAE (payment token)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={pricePerLae}
              onChange={(e) => setPricePerLae(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-white"
            />
          </label>
        </div>
        {address && (
          <p className="mt-2 text-xs text-slate-500">
            Your LAE balance: {fmtEther((laeBalance.data as bigint | undefined) ?? 0n, 4)}
          </p>
        )}
        <button
          type="button"
          onClick={() => void createOrder()}
          disabled={!address || pending !== null || receipt.isLoading}
          className="btn-primary mt-4"
        >
          {pending === "create" ? "Creating…" : "Create sell order"}
        </button>
      </Panel>

      <Panel title="Open orders">
        <div className="space-y-3">
          {orderIds.length === 0 && (
            <p className="text-sm text-slate-500">No orders yet.</p>
          )}
          {orderIds.map((id) => (
            <OrderCard
              key={id.toString()}
              orderId={id}
              address={address}
              pending={pending}
              onFill={fillOrder}
              onCancel={cancelOrder}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function OrderCard({
  orderId,
  address,
  pending,
  onFill,
  onCancel,
}: {
  orderId: bigint;
  address?: Address;
  pending: string | null;
  onFill: (o: OrderRow) => Promise<void>;
  onCancel: (id: bigint) => Promise<void>;
}) {
  const order = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "p2pOrders",
    args: [orderId],
  });

  if (!order.data) return null;
  const [seller, laeAmount, pricePerLae, active] = order.data as [Address, bigint, bigint, boolean];
  if (!active) return null;

  const payment = (laeAmount * pricePerLae) / parseEther("1");
  const isSeller = address?.toLowerCase() === seller.toLowerCase();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <p className="font-mono text-sm text-white">Order #{orderId.toString()}</p>
        <p className="text-xs text-slate-500">Seller {truncateAddress(seller)}</p>
        <p className="mt-1 text-sm text-slate-300">
          {fmtEther(laeAmount, 4)} LAE · {fmtEther(pricePerLae, 6)} / LAE
        </p>
        <p className="text-xs text-brand-300">Total payment ≈ {fmtEther(payment, 6)}</p>
      </div>
      <div className="flex gap-2">
        {!isSeller && address && (
          <button
            type="button"
            className="btn-primary !py-2 !text-xs"
            disabled={pending !== null}
            onClick={() =>
              void onFill({ id: orderId, seller, laeAmount, pricePerLae, active })
            }
          >
            {pending === `fill-${orderId}` ? "Buying…" : "Buy"}
          </button>
        )}
        {isSeller && (
          <button
            type="button"
            className="btn-ghost !py-2 !text-xs"
            disabled={pending !== null}
            onClick={() => void onCancel(orderId)}
          >
            {pending === `cancel-${orderId}` ? "Cancelling…" : "Cancel"}
          </button>
        )}
        {isSeller && <Pill tone="gold">Your listing</Pill>}
      </div>
    </div>
  );
}
