export type SlotTreeNode = {
  name: string;
  reward?: string;
  tone?: "gold" | "silver" | "root";
  sublabel?: string;
  spot?: number;
  children?: SlotTreeNode[];
};

/**
 * Silver & Gold Matrix tree for any slot.
 * Structure: YOU → 2 (Upline 1, 2) → 4 (3–6) → 8 (7–14)
 * Silver spots: 3, 6, 8, 9, 11, 12 (Your Income)
 * Gold spots: 1, 2, 4, 5, 7, 10, 13, 14 (Flow & System)
 */
export function getSlotTree(slotId: number): SlotTreeNode {
  return {
    name: `Slot ${slotId}`,
    sublabel: "YOU",
    tone: "root",
    children: [
      {
        name: "Upline 1",
        sublabel: "Income",
        spot: 1,
        tone: "gold",
        children: [
          {
            name: "Your",
            sublabel: "Income",
            spot: 3,
            tone: "silver",
            children: [
              { name: "Downline 1", sublabel: "Income", spot: 7, tone: "gold" },
              { name: "Your", sublabel: "Income", spot: 8, tone: "silver" },
            ],
          },
          {
            name: "Next",
            sublabel: "Slot",
            spot: 4,
            tone: "gold",
            children: [
              { name: "Your", sublabel: "Income", spot: 9, tone: "silver" },
              { name: "Downline 1", sublabel: "Income", spot: 10, tone: "gold" },
            ],
          },
        ],
      },
      {
        name: "Upline 2",
        sublabel: "Income",
        spot: 2,
        tone: "gold",
        children: [
          {
            name: "Next",
            sublabel: "Slot",
            spot: 5,
            tone: "gold",
            children: [
              { name: "Your", sublabel: "Income", spot: 11, tone: "silver" },
              { name: "Your", sublabel: "Income", spot: 12, tone: "silver" },
            ],
          },
          {
            name: "Your",
            sublabel: "Income",
            spot: 6,
            tone: "silver",
            children: [
              { name: "Downline 2", sublabel: "Income", spot: 13, tone: "gold" },
              { name: "Recycle", sublabel: "Sponsor", spot: 14, tone: "gold" },
            ],
          },
        ],
      },
    ],
  };
}

export const SLOT_TREE_META: Record<
  number,
  { members: number; cycles: number; status: string }
> = Object.fromEntries(
  Array.from({ length: 15 }, (_, i) => {
    const id = i + 1;
    return [
      id,
      {
        members: Math.min(14, 4 + id),
        cycles: Math.max(0, id - 2),
        status: id === 1 ? "Entry slot" : id < 8 ? "Active matrix" : "Advanced",
      },
    ];
  })
);
