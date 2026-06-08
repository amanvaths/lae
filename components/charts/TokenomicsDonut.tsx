"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useInViewOnce } from "@/components/ui/useInViewOnce";

export type Slice = { label: string; value: number; color: string };

export function TokenomicsDonut({
  data,
  size = 320,
}: {
  data: Slice[];
  size?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { ref: wrap, inView } = useInViewOnce<HTMLDivElement>();

  useEffect(() => {
    if (!ref.current || !inView) return;

    const radius = size / 2;
    const thickness = 38;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${size} ${size}`)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<Slice>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.025);

    const arc = d3
      .arc<d3.PieArcDatum<Slice>>()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .cornerRadius(8);

    const arcs = pie(data);

    const paths = g
      .selectAll("path")
      .data(arcs)
      .join("path")
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#05060a")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 8px rgba(30,155,255,0.25))");

    paths
      .transition()
      .duration(1100)
      .delay((_, i) => i * 120)
      .attrTween("d", function (d) {
        const i = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          d
        );
        return (t) => arc(i(t) as d3.PieArcDatum<Slice>) ?? "";
      });

    // center label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#fff")
      .style("font-size", "26px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-display)")
      .text("1B");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.4em")
      .attr("fill", "#64748b")
      .style("font-size", "12px")
      .style("letter-spacing", "0.1em")
      .text("MAX SUPPLY");
  }, [data, size, inView]);

  return (
    <div ref={wrap} className="flex justify-center">
      <svg ref={ref} width={size} height={size} />
    </div>
  );
}
