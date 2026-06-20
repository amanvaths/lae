"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInViewOnce } from "@/components/ui/useInViewOnce";
import type { SlotTreeNode } from "@/lib/slot-trees";

const GOLD_PRIMARY = "#D4A017";
const GOLD_BRIGHT = "#FFD700";
const GOLD_GLOW = "rgba(255,215,0,0.35)";
const SILVER_PRIMARY = "#C0C0C0";
const SILVER_BRIGHT = "#E8E8E8";
const ROOT_BG = "#D4A017";

const defaultTree: SlotTreeNode = {
  name: "Slot 1",
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
            { name: "DL 1", spot: 7, tone: "gold" },
            { name: "Your", spot: 8, tone: "silver" },
          ],
        },
        {
          name: "Next",
          sublabel: "Slot",
          spot: 4,
          tone: "gold",
          children: [
            { name: "Your", spot: 9, tone: "silver" },
            { name: "DL 1", spot: 10, tone: "gold" },
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
            { name: "Your", spot: 11, tone: "silver" },
            { name: "Your", spot: 12, tone: "silver" },
          ],
        },
        {
          name: "Your",
          sublabel: "Income",
          spot: 6,
          tone: "silver",
          children: [
            { name: "DL 2", spot: 13, tone: "gold" },
            { name: "Recycle", spot: 14, tone: "gold" },
          ],
        },
      ],
    },
  ],
};

export function NetworkTree({
  data = defaultTree,
  height = 420,
  treeId = "network-tree",
}: {
  data?: SlotTreeNode;
  height?: number;
  treeId?: string;
}) {
  const { ref: wrap, inView } = useInViewOnce<HTMLDivElement>();
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);
  const gradId = `linkGrad-${treeId}`;

  useEffect(() => {
    const handle = () => wrap.current && setWidth(wrap.current.clientWidth || 640);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [wrap]);

  useEffect(() => {
    if (!ref.current || !inView) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = d3.hierarchy(data);
    const layout = d3.tree<SlotTreeNode>().size([width - 60, height - 90]);
    layout(root);

    const g = svg.append("g").attr("transform", `translate(30,44)`);

    const defs = svg.append("defs");

    const lg = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0").attr("y1", "0")
      .attr("x2", "0").attr("y2", "1");
    lg.append("stop").attr("offset", "0%").attr("stop-color", GOLD_BRIGHT).attr("stop-opacity", 0.85);
    lg.append("stop").attr("offset", "100%").attr("stop-color", GOLD_PRIMARY).attr("stop-opacity", 0.3);

    const goldGrad = defs
      .append("linearGradient")
      .attr("id", `goldBg-${treeId}`)
      .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    goldGrad.append("stop").attr("offset", "0%").attr("stop-color", "#D4A017");
    goldGrad.append("stop").attr("offset", "100%").attr("stop-color", "#8B6914");

    const silverGrad = defs
      .append("linearGradient")
      .attr("id", `silverBg-${treeId}`)
      .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    silverGrad.append("stop").attr("offset", "0%").attr("stop-color", SILVER_BRIGHT);
    silverGrad.append("stop").attr("offset", "100%").attr("stop-color", "#A0A0A0");

    const rootGrad = defs
      .append("linearGradient")
      .attr("id", `rootBg-${treeId}`)
      .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    rootGrad.append("stop").attr("offset", "0%").attr("stop-color", "#FFD700");
    rootGrad.append("stop").attr("offset", "100%").attr("stop-color", "#B8860B");

    const glow = defs
      .append("filter")
      .attr("id", `glow-${treeId}`)
      .attr("x", "-50%").attr("y", "-50%")
      .attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", 4).attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const linkGen = d3
      .linkVertical<d3.HierarchyPointLink<SlotTreeNode>, d3.HierarchyPointNode<SlotTreeNode>>()
      .x((d) => d.x)
      .y((d) => d.y);

    const links = g
      .selectAll("path.link")
      .data(root.links() as d3.HierarchyPointLink<SlotTreeNode>[])
      .join("path")
      .attr("fill", "none")
      .attr("stroke", `url(#${gradId})`)
      .attr("stroke-width", 2)
      .attr("d", linkGen as never);

    links.each(function () {
      const l = (this as SVGPathElement).getTotalLength();
      d3.select(this)
        .attr("stroke-dasharray", `${l} ${l}`)
        .attr("stroke-dashoffset", l)
        .transition()
        .duration(700)
        .delay(100)
        .attr("stroke-dashoffset", 0);
    });

    const node = g
      .selectAll("g.node")
      .data(root.descendants() as d3.HierarchyPointNode<SlotTreeNode>[])
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("opacity", 0);

    node.transition().delay((_, i) => 150 + i * 50).duration(450).style("opacity", 1);

    const isRoot = (d: d3.HierarchyPointNode<SlotTreeNode>) => d.data.tone === "root";
    const isGold = (d: d3.HierarchyPointNode<SlotTreeNode>) => d.data.tone === "gold";

    const nodeW = (d: d3.HierarchyPointNode<SlotTreeNode>) => isRoot(d) ? 70 : d.depth >= 3 ? 48 : 58;
    const nodeH = (d: d3.HierarchyPointNode<SlotTreeNode>) => isRoot(d) ? 32 : d.depth >= 3 ? 28 : 30;

    node
      .append("rect")
      .attr("x", (d) => -nodeW(d) / 2)
      .attr("y", (d) => -nodeH(d) / 2)
      .attr("width", (d) => nodeW(d))
      .attr("height", (d) => nodeH(d))
      .attr("rx", 6)
      .attr("fill", (d) =>
        isRoot(d)
          ? `url(#rootBg-${treeId})`
          : isGold(d)
            ? `url(#goldBg-${treeId})`
            : `url(#silverBg-${treeId})`
      )
      .attr("stroke", (d) =>
        isRoot(d) ? "#FFD700" : isGold(d) ? "#D4A017" : "#C0C0C0"
      )
      .attr("stroke-width", (d) => isRoot(d) ? 2.5 : 1.5)
      .style("filter", (d) =>
        isRoot(d) ? `url(#glow-${treeId})` : "none"
      );

    node
      .filter((d) => !!d.data.spot)
      .append("circle")
      .attr("cx", 0)
      .attr("cy", (d) => -nodeH(d) / 2 - 2)
      .attr("r", 7)
      .attr("fill", (d) => isGold(d) ? GOLD_PRIMARY : SILVER_PRIMARY)
      .attr("stroke", (d) => isGold(d) ? "#FFD700" : SILVER_BRIGHT)
      .attr("stroke-width", 1);

    node
      .filter((d) => !!d.data.spot)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", (d) => -nodeH(d) / 2 - 2)
      .attr("dy", "0.35em")
      .attr("fill", "#111")
      .style("font-size", "7px")
      .style("font-weight", "800")
      .text((d) => String(d.data.spot ?? ""));

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.data.sublabel ? "-0.1em" : "0.35em")
      .attr("fill", (d) => isRoot(d) ? "#111" : isGold(d) ? "#111" : "#222")
      .style("font-size", (d) => isRoot(d) ? "11px" : d.depth >= 3 ? "7px" : "8px")
      .style("font-weight", "700")
      .text((d) => d.data.name);

    node
      .filter((d) => !!d.data.sublabel)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .attr("fill", (d) => isRoot(d) ? "#333" : isGold(d) ? "#3a2a00" : "#444")
      .style("font-size", (d) => d.depth >= 3 ? "6px" : "7px")
      .style("font-weight", "600")
      .text((d) => d.data.sublabel ?? "");

    const freeLabels = root.descendants().filter(
      (d) => d.depth === 3 && d.parent
    ) as d3.HierarchyPointNode<SlotTreeNode>[];

    const freeGroups = new Map<string, number[]>();
    freeLabels.forEach((d) => {
      const px = String(d.parent!.x);
      if (!freeGroups.has(px)) freeGroups.set(px, []);
      freeGroups.get(px)!.push(d.x);
    });

    freeGroups.forEach((xs) => {
      if (xs.length < 2) return;
      const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const maxY = Math.max(...freeLabels.map((d) => d.y));
      g.append("text")
        .attr("x", midX)
        .attr("y", maxY + 22)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .style("font-size", "7px")
        .style("font-weight", "700")
        .style("letter-spacing", "2px")
        .text("FREE");
    });

  }, [inView, width, height, data, gradId, treeId]);

  return (
    <div ref={wrap} className="w-full min-w-0">
      <svg ref={ref} width={width} height={height} className="max-w-full" />
    </div>
  );
}
