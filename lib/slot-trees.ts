export type SlotTreeNode = {
  name: string;
  reward?: string;
  children?: SlotTreeNode[];
};

/** Matrix-style tree for a given slot — structure scales with slot level */
export function getSlotTree(slotId: number): SlotTreeNode {
  const tier = Math.min(4, Math.ceil(slotId / 4));
  const r = (base: number) => `+${Math.max(2, base - Math.floor((slotId - 1) / 3))}%`;

  const downline = (n: number, depth: number): SlotTreeNode => ({
    name: `D${n}`,
    reward: r(8 - depth),
    children:
      depth < tier
        ? [
            { name: `L${n}a`, reward: r(5 - depth) },
            { name: `L${n}b`, reward: r(4 - depth) },
          ]
        : undefined,
  });

  const tree: SlotTreeNode = {
    name: `Slot ${slotId}`,
    reward: "YOU",
    children: [
      {
        name: "Upline 1",
        reward: r(12),
        children: [downline(1, 1), downline(2, 1)],
      },
      {
        name: "Upline 2",
        reward: r(10),
        children: [downline(3, 1), ...(slotId > 2 ? [downline(4, 1)] : [])],
      },
      {
        name: "You",
        reward: r(11),
        children: [
          downline(5, 1),
          downline(6, 1),
          ...(slotId > 6 ? [downline(7, 2)] : []),
        ],
      },
    ],
  };

  if (slotId >= 10) {
    tree.children!.push({
      name: "Spillover",
      reward: "auto",
      children: [{ name: "Fill", reward: "+slot" }, { name: "Recycle", reward: "↻" }],
    });
  }

  if (slotId >= 14) {
    tree.children!.push({
      name: "Upgrade",
      reward: "→15",
      children: [{ name: "Next", reward: "max" }],
    });
  }

  return tree;
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
