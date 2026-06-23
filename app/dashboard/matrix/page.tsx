"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import { MatrixLevelCard } from "@/components/lae-club/MatrixLevelCard";
import { MatrixStatusPanel } from "@/components/lae-club/MatrixStatusPanel";
import { LAE_LEVELS } from "@/lib/lae-club/constants";
import { buildSlotsFromApi, buildMatrixSlots } from "@/lib/lae-club/matrix-slots";
import {
  useLaeUser,
  useLaeLevelPrices,
  useLaeMatrixLevel,
  useLaeAllMatrixLevels,
  useLaeMatrixFillCounts,
  useLaeIdsForAddresses,
} from "@/lib/lae-club/hooks";
import {
  useLaeMatrixTreeApi,
  useLaeMatrixOverviewApi,
} from "@/lib/lae-club/matrix-api";

export default function MatrixPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(1);
  const user = useLaeUser();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const prices = useLaeLevelPrices();

  // Primary source: backend matrix tree API (contract = source of truth, served from DB).
  const overviewApi = useLaeMatrixOverviewApi(userIdNum);
  const treeApi = useLaeMatrixTreeApi(userIdNum, selectedLevel ?? 1, {
    enabled: selectedLevel !== null,
  });

  // Contract fallback — only used when the API is unavailable, plus heldForUpgrade.
  const allLevels = useLaeAllMatrixLevels();
  const fillCounts = useLaeMatrixFillCounts();
  const matrix = useLaeMatrixLevel(selectedLevel ?? 1, {
    enabled: selectedLevel !== null,
  });
  // Safety net: resolve fallback referral addresses → #id so the tree never
  // shows raw hex when the API momentarily fails.
  const fallbackIds = useLaeIdsForAddresses(matrix.referrals);

  if (user.isLoading) {
    return <QueryLoading label="Loading LAE Club matrix…" />;
  }

  if (user.isError) {
    return (
      <Panel title="Matrix">
        <p className="text-sm text-red-300">Could not load profile from chain.</p>
      </Panel>
    );
  }

  if (!user.registered) {
    return (
      <Panel title="Matrix">
        <p className="text-sm text-slate-400">Register on LAE Club to view your matrix.</p>
      </Panel>
    );
  }

  const nextLevelPrice = prices.prices?.find((p) => p.level === (selectedLevel ?? 1) + 1);

  // Tree rendering: prefer API slots; fall back to contract referrals only if API failed.
  const tree = treeApi.tree;
  const apiSlots = tree ? buildSlotsFromApi(tree.slots) : undefined;
  const treeActiveForSlots = tree?.active ?? matrix.active;
  const fallbackSlots = !apiSlots
    ? buildMatrixSlots(matrix.referrals, treeActiveForSlots, fallbackIds.idByAddress)
    : undefined;
  const renderSlots = apiSlots ?? fallbackSlots;
  const treeActive = tree?.active ?? matrix.active;
  const treeReinvest = tree ? BigInt(Math.max(0, tree.cycle - 1)) : matrix.reinvestCount;
  const treeEarning = tree ? BigInt(tree.totalEarning || "0") : matrix.totalEarning;
  const treeFilled = tree?.filledSpots ?? matrix.filledSpots;
  const treeLoading =
    selectedLevel !== null && treeApi.isLoading && matrix.isLoading;
  const treeError = treeApi.isError && matrix.isError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-to-r from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8] bg-clip-text text-transparent">
            Silver
          </span>{" "}
          <span className="text-white/50">&</span>{" "}
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#B8860B] bg-clip-text text-transparent">
            Gold
          </span>{" "}
          <span className="text-white">Matrix</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          12 levels · 14 spots · live contract data · User #{String(user.userId ?? "—")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: LAE_LEVELS }, (_, i) => i + 1).map((lvl) => {
          const o = overviewApi.overview?.levels[lvl - 1];
          const levelActive = o ? o.active : allLevels.levels[lvl - 1]?.active === true;
          const price = prices.prices?.find((p) => p.level === lvl);
          const filled = o ? o.filled : fillCounts.fills[lvl - 1] ?? 0;

          return (
            <MatrixLevelCard
              key={lvl}
              level={lvl}
              active={levelActive}
              selected={selectedLevel === lvl}
              price={price?.priceFormatted ?? "—"}
              filled={levelActive ? filled : 0}
              loading={
                overviewApi.isLoading && allLevels.isLoading && fillCounts.isLoading
              }
              onClick={() =>
                setSelectedLevel((prev) => (prev === lvl ? null : lvl))
              }
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedLevel !== null && (
          <motion.div
            key={selectedLevel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid gap-4 lg:grid-cols-[1fr_280px]"
          >
            <Panel
              title={`Level ${selectedLevel} · Matrix Tree`}
              className="border border-[#D4AF37]/20 bg-black/40"
            >
              {treeLoading ? (
                <QueryLoading label="Loading matrix tree…" />
              ) : treeError ? (
                <p className="text-sm text-red-300">Failed to load level {selectedLevel} data.</p>
              ) : !treeActive ? (
                <p className="text-sm text-slate-400">
                  Level {selectedLevel} is locked. Upgrade to activate this slot on-chain.
                </p>
              ) : (
                <MatrixVisualizer
                  slots={renderSlots}
                  levelActive={treeActive}
                  level={selectedLevel}
                  reinvestCount={treeReinvest}
                  totalEarning={treeEarning}
                />
              )}
            </Panel>

            <MatrixStatusPanel
              level={selectedLevel}
              filled={treeFilled}
              cycle={treeReinvest ?? 0n}
              totalEarning={treeEarning}
              heldForUpgrade={matrix.heldForUpgrade}
              nextUpgradeCost={nextLevelPrice?.priceFormatted}
              levelActive={treeActive}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
