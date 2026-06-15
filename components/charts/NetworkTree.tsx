"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInViewOnce } from "@/components/ui/useInViewOnce";
import type { SlotTreeNode } from "@/lib/slot-trees";

const defaultTree: SlotTreeNode = {
  name: "You",
  reward: "+12%",
  children: [
    {
      name: "L1",
      reward: "+8%",
      children: [
        { name: "L2", reward: "+5%", children: [{ name: "L3", reward: "+3%" }, { name: "L3" }] },
        { name: "L2", reward: "+5%", children: [{ name: "L3" }] },
      ],
    },
    {
      name: "L1",
      reward: "+8%",
      children: [
        { name: "L2", reward: "+5%", children: [{ name: "L3" }, { name: "L3" }] },
        { name: "L2", reward: "+5%" },
      ],
    },
  ],
};

export function NetworkTree({
  data = defaultTree,
  height = 380,
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
    const layout = d3.tree<SlotTreeNode>().size([width - 40, height - 70]);
    layout(root);

    const g = svg.append("g").attr("transform", `translate(20,36)`);

    const linkGen = d3
      .linkVertical<d3.HierarchyPointLink<SlotTreeNode>, d3.HierarchyPointNode<SlotTreeNode>>()
      .x((d) => d.x)
      .y((d) => d.y);

    const defs = svg.append("defs");
    const lg = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0")
      .attr("y1", "0")
      .attr("x2", "0")
      .attr("y2", "1");
    lg.append("stop").attr("offset", "0%").attr("stop-color", "#ffc31a").attr("stop-opacity", 0.85);
    lg.append("stop").attr("offset", "100%").attr("stop-color", "#ffc31a").attr("stop-opacity", 0.2);

    const links = g
      .selectAll("path.link")
      .data(root.links() as d3.HierarchyPointLink<SlotTreeNode>[])
      .join("path")
      .attr("fill", "none")
      .attr("stroke", `url(#${gradId})`)
      .attr("stroke-width", 1.5)
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

    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 20 : d.depth === 1 ? 15 : 12))
      .attr("fill", (d) => (d.depth === 0 ? "#ffc31a" : "#191919"))
      .attr("stroke", (d) => (d.depth === 0 ? "#ffe082" : "#ffc31a88"))
      .attr("stroke-width", 1.5)
      .style("filter", (d) =>
        d.depth === 0 ? "drop-shadow(0 0 10px rgba(255,195,26,0.6))" : "none"
      );

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.32em")
      .attr("fill", (d) => (d.depth === 0 ? "#0a0a0a" : "#fff"))
      .style("font-size", (d) => (d.depth === 0 ? "10px" : "8px"))
      .style("font-weight", "600")
      .text((d) => d.data.name);

    node
      .filter((d) => !!d.data.reward)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.depth === 0 ? "2.5em" : "2.2em"))
      .attr("fill", "#34d399")
      .style("font-size", "8px")
      .style("font-weight", "700")
      .text((d) => d.data.reward!);
  }, [inView, width, height, data, gradId]);

  return (
    <div ref={wrap} className="w-full min-w-0">
      <svg ref={ref} width={width} height={height} className="max-w-full" />
    </div>
  );
}
