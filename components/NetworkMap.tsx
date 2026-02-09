
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../types';

interface NetworkMapProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
}

const NetworkMap: React.FC<NetworkMapProps> = ({ nodes, links, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 600
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g.container-group');
    if (g.empty()) return;

    const bounds = (g.node() as SVGGElement).getBBox();
    const fullWidth = dimensions.width;
    const fullHeight = dimensions.height;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width === 0 || height === 0) return;

    const padding = 40;
    const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }, [nodes, dimensions]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const g = svg.append('g').attr('class', 'container-group');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    
    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    const link = g.append('g')
      .attr('stroke', '#1e293b')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => d.value === 2 ? '5 5' : 'none')
      .attr('opacity', 0.6);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer');

    node.append('circle')
      .attr('r', d => d.type === 'gateway' ? 18 : d.type === 'host' ? 14 : 11)
      .attr('fill', d => d.type === 'gateway' ? '#f59e0b' : d.type === 'host' ? '#22d3ee' : '#818cf8')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2)
      .attr('class', d => d.status === 'online' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]' : '');

    node.append('text')
      .text(d => d.label)
      .attr('x', 20)
      .attr('y', 5)
      .attr('fill', '#94a3b8')
      .style('font-size', '11px')
      .attr('class', 'mono font-bold select-none');

    node.on('mouseenter', (e, d: any) => { 
        setHoveredNode(d); 
        setTooltipPos({ x: e.clientX, y: e.clientY }); 
        d3.select(e.currentTarget).select('circle').transition().duration(200).attr('r', (node: any) => (node.type === 'gateway' ? 22 : node.type === 'host' ? 18 : 14));
    })
    .on('mousemove', (e) => setTooltipPos({ x: e.clientX, y: e.clientY }))
    .on('mouseleave', (e, d: any) => { 
        setHoveredNode(null); 
        d3.select(e.currentTarget).select('circle').transition().duration(200).attr('r', (node: any) => (node.type === 'gateway' ? 18 : node.type === 'host' ? 14 : 11));
    })
    .on('click', (e, d: any) => { 
        e.stopPropagation(); 
        onNodeClick?.(d); 
    });

    simulation.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Auto fit after a short delay to allow simulation to settle slightly
    const timer = setTimeout(handleZoomToFit, 1000);

    return () => { 
      simulation.stop();
      clearTimeout(timer);
    };
  }, [nodes, links, dimensions, onNodeClick, handleZoomToFit]);

  return (
    <div ref={containerRef} className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative min-h-[600px] shadow-2xl">
      {/* Header Info */}
      <div className="absolute top-4 left-4 z-10 p-3 bg-slate-950/80 border border-slate-800 rounded-lg backdrop-blur flex flex-col gap-1">
        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          Topology Explorer
        </h3>
        <p className="text-[10px] text-slate-500 mono uppercase tracking-tight">Interactive Infrastructure Map</p>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={handleZoomToFit}
          className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg backdrop-blur text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all group shadow-lg"
          title="Zoom to Fit"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 p-4 bg-slate-950/80 border border-slate-800 rounded-xl backdrop-blur-md shadow-xl max-w-[200px]">
        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-slate-800">Operational Key</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b] border border-slate-900 shadow-[0_0_5px_rgba(245,158,11,0.3)]"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Gateway Node</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#22d3ee] border border-slate-900 shadow-[0_0_5px_rgba(34,211,238,0.3)]"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Primary Host</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#818cf8] border border-slate-900 shadow-[0_0_5px_rgba(129,140,248,0.3)]"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Edge Subdomain</span>
          </div>
          <div className="h-px bg-slate-800 my-2"></div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-slate-700"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct Uplink</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 border-b border-dashed border-slate-700"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Edge Propagation</span>
          </div>
        </div>
      </div>

      {hoveredNode && (
        <div 
          className="fixed z-[100] p-4 bg-slate-950 border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[200px]" 
          style={{ left: tooltipPos.x + 20, top: tooltipPos.y - 40 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{hoveredNode.type}</span>
            <div className={`w-2 h-2 rounded-full ${hoveredNode.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
          </div>
          <p className="text-sm font-black text-white mono mb-1">{hoveredNode.label}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
            <span className="text-[9px] font-bold text-slate-500 uppercase">IP Mapped</span>
            <span className="text-[10px] text-slate-300 font-bold mono">{hoveredNode.ip || 'INTERNAL'}</span>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-[600px] outline-none" />
    </div>
  );
};

export default NetworkMap;
