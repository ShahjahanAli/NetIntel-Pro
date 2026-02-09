
import React from 'react';
import { ThreatIntelligenceItem } from '../types';

interface ThreatIntelligenceFeedProps {
  items: ThreatIntelligenceItem[];
  isLoading: boolean;
}

const ThreatIntelligenceFeed: React.FC<ThreatIntelligenceFeedProps> = ({ items, isLoading }) => {
  const severityColors = {
    critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Threat Feed</h3>
        </div>
        <span className="text-[9px] font-bold text-slate-600 mono uppercase tracking-tighter">Live Recon Stream</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/50">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-cyan-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[10px] text-slate-500 mono uppercase">Aggregating Intel...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-600 italic">Synchronizing with global threat databases...</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${severityColors[item.severity]}`}>
                  {item.severity}
                </span>
                <span className="text-[9px] text-slate-600 mono">{item.timestamp}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1 leading-tight group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                {item.description}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Source: {item.source}</span>
                <div className="flex gap-1">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-sm mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-950/50 border-t border-slate-800">
         <button className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors border border-dashed border-slate-800 rounded uppercase tracking-widest">
           View Security Bulletin Archive
         </button>
      </div>
    </div>
  );
};

export default ThreatIntelligenceFeed;
