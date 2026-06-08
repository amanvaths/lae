"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInViewOnce } from "@/components/ui/useInViewOnce";

const raw = [
  { m: "Jan", v: 4 },
  { m: "Feb", v: 9 },
  { m: "Mar", v: 14 },
  { m: "Apr", v: 22 },
  { m: "May", v: 31 },
  { m: "Jun", v: 47 },
  { m: "Jul", v: 58 },
  { m: "Aug", v: 79 },
  { m: "Sep", v: 96 },
  { m: "Oct", v: 124 },
];

export function GrowthChart() {
  const { ref: wrap, inView } = useInViewOnce<HTMLDivElement>();
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);
  const height = 300;

  useEffect(() => {
    const handle = () => {
      if (wrap.current) setWidth(wrap.current.clientWidth || 640);
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    if (!ref.current || !inView) return;
    const margin = { top: 20, right: 20, bottom: 32, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint<string>()
      .domain(raw.map((d) => d.m))
      .range([0, w]);
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(raw, (d) => d.v) ?? 100) * 1.1])
      .range([h, 0]);

    // gradient
    const defs = svg.append("defs");
    const grad = defs
      .append("linearGradient")
      .attr("id", "areaGrad")
      .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#1e9bff").attr("stop-opacity", 0.5);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#1e9bff").attr("stop-opacity", 0);

    // grid
    g.append("g")
      .attr("stroke", "rgba(255,255,255,0.05)")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", 0).attr("x2", w)
      .attr("y1", (d) => y(d)).attr("y2", (d) => y(d));

    // axes labels
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(12))
      .call((s) => s.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#64748b").style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}K`).tickSize(0).tickPadding(10))
      .call((s) => s.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#64748b").style("font-size", "11px");

    const area = d3
      .area<(typeof raw)[number]>()
      .x((d) => x(d.m)!)
      .y0(h)
      .y1((d) => y(d.v))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<(typeof raw)[number]>()
      .x((d) => x(d.m)!)
      .y((d) => y(d.v))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(raw).attr("fill", "url(#areaGrad)").attr("d", area).attr("opacity", 0)
      .transition().duration(900).delay(400).attr("opacity", 1);

    const path = g
      .append("path")
      .datum(raw)
      .attr("fill", "none")
      .attr("stroke", "#48bcff")
      .attr("stroke-width", 2.5)
      .attr("d", line)
      .style("filter", "drop-shadow(0 0 6px rgba(72,188,255,0.6))");

    const len = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", `${len} ${len}`)
      .attr("stroke-dashoffset", len)
      .transition()
      .duration(1400)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

    // dots
    g.selectAll("circle")
      .data(raw)
      .join("circle")
      .attr("cx", (d) => x(d.m)!)
      .attr("cy", (d) => y(d.v))
      .attr("r", 0)
      .attr("fill", "#fff")
      .attr("stroke", "#1e9bff")
      .attr("stroke-width", 2)
      .transition()
      .delay((_, i) => 600 + i * 90)
      .duration(400)
      .attr("r", 3.5);
  }, [inView, width]);

  return (
    <div ref={wrap} className="w-full">
      <svg ref={ref} width={width} height={height} />
    </div>
  );
}
