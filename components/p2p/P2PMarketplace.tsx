"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  ShoppingCart,
  Tag,
  XCircle,
  Wallet,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, type Address } from "viem";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeCoinAbi, erc20BalanceAbi } from "@/lib/lae-club/abis";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: bigint;
  seller: Address;
  laeAmount: bigint;
  pricePerLae: bigint;
  active: boolean;
};

const TABS = [
  { id: "sell", label: "Sell LAE", short: "Sell", icon: Tag },
  { id: "buy", label: "Buy LAE", short: "Buy", icon: ShoppingCart },
  { id: "my", label: "My Orders", short: "Mine", icon: Wallet },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function P2PMarketplace() {
  const [tab, setTab] = useState<TabId>("buy");
  const { address, isConnected } = useAccount();

  const enabled = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "p2pEnabled",
  });

  return (
    <section className="relative px-3 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-16 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,195,26,0.06),transparent)]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Hero header */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10 sm:h-14 sm:w-14">
              <ArrowLeftRight className="h-6 w-6 text-brand-400 sm:h-7 sm:w-7" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-white sm:text-3xl">
                P2P Marketplace
              </h1>
              <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
                Trade LAE tokens directly with club members
              </p>
            </div>
          </div>
          {!isConnected && (
            <div className="w-full sm:w-auto">
              <ConnectWallet full />
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat icon={Shield} label="Escrow" value="Smart Contract" />
          <MiniStat icon={ArrowLeftRight} label="Fee" value="0%" />
          <MiniStat icon={TrendingUp} label="Settlement" value="Instant" />
          <MiniStat
            icon={Wallet}
            label="Your LAE"
            value={<LaeBalanceDisplay address={address} />}
          />
        </div>

        {/* Disabled notice */}
        {enabled.data === false && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm text-red-200">
            P2P trading is currently disabled by admin. Check back later.
          </div>
        )}

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:text-sm",
                tab === t.id
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="p2p-tab-bg"
                  className="absolute inset-0 rounded-lg border border-brand-500/30 bg-brand-500/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className="relative h-4 w-4 shrink-0" />
              <span className="relative truncate">{t.short}</span>
              <span className="relative hidden truncate sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "sell" && <SellPanel address={address} />}
            {tab === "buy" && <BuyPanel address={address} />}
            {tab === "my" && <MyOrdersPanel address={address} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function LaeBalanceDisplay({ address }: { address?: Address }) {
  const laeBalance = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  if (!address) return "—";
  return fmtEther((laeBalance.data as bigint | undefined) ?? 0n, 2);
}

function SellPanel({ address }: { address?: Address }) {
  const [sellAmount, setSellAmount] = useState("");
  const [pricePerLae, setPricePerLae] = useState("");
  const [pending, setPending] = useState(false);

  const laeBalance = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync, data: txHash } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  async function createOrder() {
    if (!address) return;
    const laeAmt = parseEther(sellAmount || "0");
    const price = parseEther(pricePerLae || "0");
    if (laeAmt <= 0n || price <= 0n) return;
    setPending(true);
    try {
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "createP2POrder",
        args: [laeAmt, price],
      });
      setSellAmount("");
      setPricePerLae("");
    } catch (e) {
      console.error(e);
    }
    setPending(false);
  }

  const total =
    sellAmount && pricePerLae
      ? (parseFloat(sellAmount) * parseFloat(pricePerLae)).toFixed(4)
      : "0";

  return (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/5 bg-brand-500/[0.03] px-6 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo variant="coin" size={36} />
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Create Sell Order
            </h3>
            <p className="text-xs text-slate-400">
              List your LAE tokens for sale to other members
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
              LAE Amount
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 pr-16 font-mono text-white placeholder:text-slate-600 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-400">
                LAE
              </span>
            </div>
            {address && (
              <p className="mt-2 text-xs text-slate-500">
                Balance:{" "}
                <span className="text-slate-300">
                  {fmtEther((laeBalance.data as bigint | undefined) ?? 0n, 4)} LAE
                </span>
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Price per LAE
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={pricePerLae}
                onChange={(e) => setPricePerLae(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 pr-20 font-mono text-white placeholder:text-slate-600 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-400">
                USDT
              </span>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total you receive</span>
            <span className="font-mono font-bold text-white">
              {total} USDT
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void createOrder()}
          disabled={!address || pending || receipt.isLoading}
          className="btn-primary mt-6 w-full !py-3.5 !text-sm"
        >
          {pending || receipt.isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating Order...
            </span>
          ) : !address ? (
            "Connect Wallet"
          ) : (
            "Create Sell Order"
          )}
        </button>
      </div>
    </div>
  );
}

function BuyPanel({ address }: { address?: Address }) {
  const [pending, setPending] = useState<string | null>(null);
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

  const { writeContractAsync } = useWriteContract();

  const orderIds = useMemo(() => {
    const n = nextId.data ?? 0n;
    const ids: bigint[] = [];
    for (let i = 1n; i <= n; i++) ids.push(i);
    return ids.slice(-20).reverse();
  }, [nextId.data]);

  async function approveAndFill(order: OrderRow) {
    if (!address) return;
    const token = paymentToken.data as Address | undefined;
    if (!token) return;
    const payment = (order.laeAmount * order.pricePerLae) / parseEther("1");
    setPending(`fill-${order.id}`);
    try {
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
        args: [LAE_CONTRACTS.laeCoin, payment],
      });
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "fillP2POrder",
        args: [order.id],
      });
    } catch (e) {
      console.error(e);
    }
    setPending(null);
  }

  return (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/5 bg-brand-500/[0.03] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Open Orders
            </h3>
            <p className="text-xs text-slate-400">
              Buy LAE from other club members
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {orderIds.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ArrowLeftRight className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">No open orders right now</p>
            <p className="text-xs text-slate-500">
              Be the first to create a sell order!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderIds.map((id) => (
              <OrderCard
                key={id.toString()}
                orderId={id}
                address={address}
                pending={pending}
                onFill={approveAndFill}
                mode="buy"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyOrdersPanel({ address }: { address?: Address }) {
  const [pending, setPending] = useState<string | null>(null);
  const nextId = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "nextOrderId",
  });
  const { writeContractAsync } = useWriteContract();

  const orderIds = useMemo(() => {
    const n = nextId.data ?? 0n;
    const ids: bigint[] = [];
    for (let i = 1n; i <= n; i++) ids.push(i);
    return ids.slice(-30).reverse();
  }, [nextId.data]);

  async function cancelOrder(orderId: bigint) {
    setPending(`cancel-${orderId}`);
    try {
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "cancelP2POrder",
        args: [orderId],
      });
    } catch (e) {
      console.error(e);
    }
    setPending(null);
  }

  if (!address) {
    return (
      <div className="glass flex flex-col items-center gap-4 px-6 py-16 text-center">
        <Wallet className="h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">
          Connect your wallet to view your orders
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/5 bg-brand-500/[0.03] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10">
            <Wallet className="h-5 w-5 text-brand-400" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              My Orders
            </h3>
            <p className="text-xs text-slate-400">
              Manage your active sell orders
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {orderIds.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Tag className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">
              You haven&apos;t created any orders yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderIds.map((id) => (
              <OrderCard
                key={id.toString()}
                orderId={id}
                address={address}
                pending={pending}
                onCancel={cancelOrder}
                mode="my"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  orderId,
  address,
  pending,
  onFill,
  onCancel,
  mode,
}: {
  orderId: bigint;
  address?: Address;
  pending: string | null;
  onFill?: (o: OrderRow) => Promise<void>;
  onCancel?: (id: bigint) => Promise<void>;
  mode: "buy" | "my";
}) {
  const order = useReadContract({
    address: LAE_CONTRACTS.laeCoin,
    abi: laeCoinAbi,
    functionName: "p2pOrders",
    args: [orderId],
  });

  if (!order.data) return null;
  const [seller, laeAmount, pricePerLae, active] = order.data as [
    Address,
    bigint,
    bigint,
    boolean,
  ];
  if (!active) return null;

  const isSeller = address?.toLowerCase() === seller.toLowerCase();
  if (mode === "my" && !isSeller) return null;
  if (mode === "buy" && isSeller) return null;

  const payment = (laeAmount * pricePerLae) / parseEther("1");

  return (
    <motion.div
      layout
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-brand-500/20 hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-500/20 bg-brand-500/[0.08]">
          <span className="font-mono text-xs font-bold text-brand-300">
            #{orderId.toString()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {fmtEther(laeAmount, 4)} LAE
          </p>
          <p className="text-xs text-slate-500">
            {truncateAddress(seller)} · {fmtEther(pricePerLae, 6)} / LAE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-slate-400">Total</p>
          <p className="font-mono text-sm font-bold text-brand-300">
            {fmtEther(payment, 4)}
          </p>
        </div>

        {mode === "buy" && onFill && (
          <button
            type="button"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            disabled={pending !== null}
            onClick={() =>
              void onFill({
                id: orderId,
                seller,
                laeAmount,
                pricePerLae,
                active,
              }).catch(console.error)
            }
          >
            {pending === `fill-${orderId}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Buy"
            )}
          </button>
        )}
        {mode === "my" && onCancel && (
          <button
            type="button"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            disabled={pending !== null}
            onClick={() => void onCancel(orderId).catch(console.error)}
          >
            {pending === `cancel-${orderId}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Cancel"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass flex items-center gap-3 p-3 sm:p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.6rem] uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
