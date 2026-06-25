"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { Panel, PageHeading } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import { MatrixStatusPanel } from "@/components/lae-club/MatrixStatusPanel";
import { MatrixLevelCard } from "@/components/lae-club/MatrixLevelCard";
import { LAE_MATRIX_SIZE, LAE_LAST_LEVEL } from "@/lib/lae-club/constants";
import { buildSlotsFromApi } from "@/lib/lae-club/matrix-slots";
import { useMatrixCoreUser } from "@/lib/lae-club/matrix-core-hooks";
import { useLaeLevelPrices } from "@/lib/lae-club/hooks";
import { incomeStringToWei } from "@/lib/contracts/format";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeClubMatrixAbi } from "@/lib/lae-club/matrix-core-abi";
import {
  useLaeMatrixTreeApi,
  useLaeMatrixOverviewApi,
} from "@/lib/lae-club/matrix-api";
import { cn } from "@/lib/utils";

const LEGEND = [
  { label: "Active", color: "bg-emerald-400" },
  { label: "Filled", color: "bg-[#D4AF37]" },
  { label: "Open", color: "bg-sky-400" },
  { label: "Locked", color: "bg-slate-500" },
  { label: "Recycle", color: "bg-rose-400" },
] as const;

export default function MatrixPage() {
  const user = useMatrixCoreUser();
  const { address } = useAccount();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const overviewApi = useLaeMatrixOverviewApi(userIdNum);
  const levelPrices = useLaeLevelPrices();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedCycle, setSelectedCycle] = useState(1);

  const slotActiveReads = useReadContracts({
    contracts: Array.from({ length: LAE_LAST_LEVEL }, (_, i) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "isUserSlotActive" as const,
      args: user.userId ? [user.userId, i + 1] : undefined,
    })),
    query: { enabled: !!user.userId, staleTime: 15_000 },
  });

  const selectedMatrixRow = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "usersXMatrix",
    args: address ? [address, selectedLevel] : undefined,
    query: { enabled: !!address, staleTime: 10_000 },
  });

  const treeApi = useLaeMatrixTreeApi(userIdNum, selectedLevel, selectedCycle, {
    enabled: !!userIdNum,
  });

  const overviewLevels = overviewApi.overview?.levels ?? [];
  const levelData = overviewLevels.find((l) => l.level === selectedLevel);
  const chainReinvest = selectedMatrixRow.data
    ? Number((selectedMatrixRow.data as readonly unknown[])[1] ?? 0)
    : 0;
  const currentCycle =
    levelData?.currentCycle ?? (chainReinvest > 0 ? chainReinvest + 1 : 1);

  useEffect(() => {
    setSelectedCycle(currentCycle);
  }, [selectedLevel]);

  const priceForLevel = (lvl: number) =>
    levelPrices.prices?.find((p) => p.level === lvl)?.priceFormatted ??
    (0.001 * 2 ** (lvl - 1)).toString();

  const isLevelActiveOnChain = (lvl: number) => {
    const r = slotActiveReads.data?.[lvl - 1];
    return Boolean(r?.result);
  };

  const isLevelActive = (lvl: number) => {
    const fromOverview = overviewLevels.find((l) => l.level === lvl);
    if (fromOverview?.active) return true;
    return isLevelActiveOnChain(lvl);
  };

  const filledForLevel = (lvl: number) => {
    const li = overviewLevels.find((l) => l.level === lvl);
    if (li) {
      return li.cycles?.find((c) => c.cycle === li.currentCycle)?.filled ?? 0;
    }
    if (lvl === selectedLevel && treeApi.tree) {
      return treeApi.tree.filledSpots;
    }
    return 0;
  };

  if (user.isLoading) {
    return <QueryLoading label="Loading LAE Club profile…" />;
  }

  if (user.isError) {
    return (
      <Panel title="Matrix">
        <p className="text-sm text-red-300">Could not load profile.</p>
      </Panel>
    );
  }

  if (!user.registered) {
    return (
      <Panel title="Matrix">
        <p className="text-sm text-slate-400">Register on LAE Club to view your 14-position matrix.</p>
      </Panel>
    );
  }

  const tree = treeApi.tree;
  const slots = tree ? buildSlotsFromApi(tree.slots) : undefined;
  const cardsLoading =
    overviewApi.isLoading &&
    overviewLevels.length === 0 &&
    slotActiveReads.isLoading;

  return (
    <div className="space-y-6">
      <PageHeading
        icon={LayoutGrid}
        title="Silver & Gold Matrix"
        subtitle={`${LAE_LAST_LEVEL} levels · ${LAE_MATRIX_SIZE} spots per level · Live contract data · User #${String(user.userId ?? "—")}`}
        action={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`h-2 w-2 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: LAE_LAST_LEVEL }, (_, i) => i + 1).map((lvl) => {
          const li = overviewLevels.find((l) => l.level === lvl);
          return (
            <MatrixLevelCard
              key={lvl}
              level={lvl}
              active={isLevelActive(lvl)}
              selected={selectedLevel === lvl}
              price={priceForLevel(lvl)}
              filled={filledForLevel(lvl)}
              loading={cardsLoading}
              onClick={() => {
                setSelectedLevel(lvl);
                setSelectedCycle(li?.currentCycle ?? 1);
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/50">
          Cycle
        </span>
        {Array.from({ length: currentCycle }, (_, i) => i + 1).map((c) => {
          const oc = levelData?.cycles?.find((x) => x.cycle === c);
          const treeFilled =
            c === selectedCycle && tree && selectedLevel === levelData?.level
              ? tree.filledSpots
              : undefined;
          const filled = treeFilled ?? oc?.filled;
          const isActive = selectedCycle === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCycle(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-premium",
                isActive
                  ? "border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/[0.05] text-[#D4AF37] shadow-[inset_0_1px_0_0_rgba(212,175,55,0.12)]"
                  : "border-white/10 text-slate-400 hover:-translate-y-0.5 hover:border-white/20 hover:text-slate-200"
              )}
            >
              Cycle {c}
              {filled != null ? ` · ${filled}/${LAE_MATRIX_SIZE}` : ""}
              {oc?.completed ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedLevel}-${selectedCycle}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="grid gap-4 lg:grid-cols-[1fr_280px]"
        >
          <Panel
            title={`Slot ${selectedLevel} · Cycle ${selectedCycle}`}
            className="border border-[#D4AF37]/20 bg-black/40"
          >
            {treeApi.isLoading ? (
              <QueryLoading label="Loading matrix tree from API…" />
            ) : treeApi.isError || !tree || !slots ? (
              <p className="text-sm text-red-300">
                Matrix API unavailable. Ensure LAEClubMatrix is deployed and the indexer is running.
              </p>
            ) : (
              <MatrixVisualizer
                slots={slots}
                levelActive
                level={selectedLevel}
                reinvestCount={BigInt(selectedCycle - 1)}
                totalEarning={incomeStringToWei(tree.totalEarned)}
              />
            )}
          </Panel>

          <MatrixStatusPanel
            level={selectedLevel}
            filled={tree?.filledSpots ?? 0}
            cycle={BigInt(selectedCycle - 1)}
            totalEarning={tree ? incomeStringToWei(tree.totalEarned) : 0n}
            heldForUpgrade={0n}
            levelActive
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
