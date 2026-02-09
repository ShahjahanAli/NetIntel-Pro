
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DeviceInfo } from '../types';

interface NetworkGraphProps {
  data: DeviceInfo | null;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = svgRef.current.clientWidth;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = [
      { id: data.host, label: data.host, type: 'host', group: 1 },
      ...data.services.map((s) => ({
        id: `${s.port}`,
        label: `${s.name} (${s.port})`,
        type: 'service',
        group: 2
      }))
    ];

    const links = data.services.map((s) => ({
      source: data.host,
      target: `${s.port}`,
      value: 1
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', (d) => d.type === 'host' ? 12 : 8)
      .attr('fill', (d) => d.type === 'host' ? '#22d3ee' : '#6366f1')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d) => d.label)
      .attr('x', 15)
      .attr('y', 5)
      .attr('fill', '#94a3b8')
      .style('font-size', '12px')
      .style('font-family', 'JetBrains Mono');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-800 p-4 overflow-hidden relative">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        Topology Visualization
      </h3>
      <svg ref={svgRef} className="w-full h-[400px]" />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <p className="text-slate-500 mono text-sm">Waiting for scan data...</p>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
