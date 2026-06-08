"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInViewOnce } from "@/components/ui/useInViewOnce";

type Node = { name: string; reward?: string; children?: Node[] };

const tree: Node = {
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

export function NetworkTree() {
  const { ref: wrap, inView } = useInViewOnce<HTMLDivElement>();
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);
  const height = 380;

  useEffect(() => {
    const handle = () =>
      wrap.current && setWidth(wrap.current.clientWidth || 640);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    if (!ref.current || !inView) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = d3.hierarchy(tree);
    const layout = d3.tree<Node>().size([width - 60, height - 90]);
    layout(root);

    const g = svg.append("g").attr("transform", `translate(30,40)`);

    const linkGen = d3
      .linkVertical<d3.HierarchyPointLink<Node>, d3.HierarchyPointNode<Node>>()
      .x((d) => d.x)
      .y((d) => d.y);

    const links = g
      .selectAll("path.link")
      .data(root.links() as d3.HierarchyPointLink<Node>[])
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "url(#linkGrad)")
      .attr("stroke-width", 1.5)
      .attr("d", linkGen as never);

    const defs = svg.append("defs");
    const lg = defs.append("linearGradient").attr("id", "linkGrad")
      .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    lg.append("stop").attr("offset", "0%").attr("stop-color", "#1e9bff").attr("stop-opacity", 0.8);
    lg.append("stop").attr("offset", "100%").attr("stop-color", "#8b5cf6").attr("stop-opacity", 0.3);

    links.each(function () {
      const l = (this as SVGPathElement).getTotalLength();
      d3.select(this)
        .attr("stroke-dasharray", `${l} ${l}`)
        .attr("stroke-dashoffset", l)
        .transition()
        .duration(900)
        .delay(200)
        .attr("stroke-dashoffset", 0);
    });

    const node = g
      .selectAll("g.node")
      .data(root.descendants() as d3.HierarchyPointNode<Node>[])
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("opacity", 0);

    node
      .transition()
      .delay((_, i) => 300 + i * 80)
      .duration(500)
      .style("opacity", 1);

    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 22 : 16))
      .attr("fill", (d) => (d.depth === 0 ? "#1e9bff" : "#0c0f1a"))
      .attr("stroke", (d) => (d.depth === 0 ? "#83d6ff" : "#8b5cf6"))
      .attr("stroke-width", 1.5)
      .style("filter", (d) =>
        d.depth === 0 ? "drop-shadow(0 0 12px rgba(30,155,255,0.8))" : "none"
      );

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.32em")
      .attr("fill", "#fff")
      .style("font-size", (d) => (d.depth === 0 ? "11px" : "9px"))
      .style("font-weight", "600")
      .text((d) => d.data.name);

    node
      .filter((d) => !!d.data.reward)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.depth === 0 ? "2.6em" : "2.4em"))
      .attr("fill", "#34d399")
      .style("font-size", "9px")
      .style("font-weight", "700")
      .text((d) => d.data.reward!);
  }, [inView, width]);

  return (
    <div ref={wrap} className="w-full">
      <svg ref={ref} width={width} height={height} />
    </div>
  );
}
