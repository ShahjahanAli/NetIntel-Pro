
import React, { useState } from 'react';
import { DeviceInfo, Subdomain, Service } from '../types';

interface ScanDetailsProps {
  data: DeviceInfo | Subdomain;
  onSubdomainClick?: (sub: Subdomain) => void;
  isSubdomainView?: boolean;
}

const ScanDetails: React.FC<ScanDetailsProps> = ({ data, onSubdomainClick, isSubdomainView }) => {
  const [expandedPorts, setExpandedPorts] = useState<Set<number>>(new Set());
  const [expandedSubServices, setExpandedSubServices] = useState<Record<number, Set<number>>>({});
  const [showQR, setShowQR] = useState(false);

  const toggleExpand = (port: number) => {
    const next = new Set(expandedPorts);
    if (next.has(port)) next.delete(port);
    else next.add(port);
    setExpandedPorts(next);
  };

  const toggleSubExpand = (e: React.MouseEvent, subIdx: number, port: number) => {
    e.stopPropagation(); 
    setExpandedSubServices(prev => {
      const subPorts = new Set(prev[subIdx] || []);
      if (subPorts.has(port)) subPorts.delete(port);
      else subPorts.add(port);
      return { ...prev, [subIdx]: subPorts };
    });
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const confidence = data.os ? Math.min(Math.max(data.os.confidence, 0), 100) : 0;
  const offset = circumference - (confidence / 100) * circumference;

  const getSeverityStyles = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === 'critical') return 'bg-rose-500/30 text-rose-400 border-rose-500/50 shadow-rose-500/20';
    if (s === 'high') return 'bg-orange-500/30 text-orange-400 border-orange-500/50 shadow-orange-500/10';
    return 'bg-amber-500/30 text-amber-400 border-amber-500/50';
  };

  const getProviderIcon = (provider?: string) => {
    const p = provider?.toLowerCase() || '';
    if (p.includes('aws') || p.includes('amazon')) {
      return (
        <svg className="w-4 h-4 text-[#FF9900]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.17,14c-.16,0-.31,0-.46.06a1.32,1.32,0,0,0-.39.23,1.6,1.6,0,0,0-.28.38,1.4,1.4,0,0,0-.14.5,3.22,3.22,0,0,0,.15,1.13,2,2,0,0,0,.45.82,2.05,2.05,0,0,0,.75.5,2.69,2.69,0,0,0,1,.18,2.77,2.77,0,0,0,.92-.15,2,2,0,0,0,.7-.41,1.91,1.91,0,0,0,.44-.61,2,2,0,0,0,.16-.76v-.66c0-.44-.1-.77-.28-1a1.27,1.27,0,0,0-.73-.34Zm1.37-4.4a3.15,3.15,0,0,0-2.28.87,3,3,0,0,0-.87,2.23v.1h1.37v-.1a1.69,1.69,0,0,1,.53-1.28,1.83,1.83,0,0,1,1.25-.46,1.75,1.75,0,0,1,1.23.44,1.52,1.52,0,0,1,.48,1.18,1.6,1.6,0,0,1-.13.68,1.38,1.38,0,0,1-.39.5,4,4,0,0,1-.66.38,7,7,0,0,1-.92.36,6.33,6.33,0,0,0-1.74.8,3,3,0,0,0-.9,2.3,3.12,3.12,0,0,0,.3,1.36,3.48,3.48,0,0,0,.86,1.09,4,4,0,0,0,1.3.7,5.55,5.55,0,0,0,1.61.23,5.32,5.32,0,0,0,2.16-.41,4.42,4.42,0,0,0,1.6-.95v1.07h1.37V13.1A3.18,3.18,0,0,0,18.82,10.47,3.61,3.61,0,0,0,16.54,9.6ZM12,18a36.46,36.46,0,0,1-10.45-1.5,1,1,0,0,1,.28-1.94c3,.85,6.58,1.29,10.23,1.29s7.25-.44,10.23-1.29a1,1,0,0,1,1.2,1,1,1,0,0,1-.66.94A36.46,36.46,0,0,1,12,18Z"/>
        </svg>
      );
    }
    if (p.includes('google') || p.includes('gcp')) {
      return (
        <svg className="w-4 h-4 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      );
    }
    if (p.includes('azure')) {
      return (
        <svg className="w-4 h-4 text-[#0078D4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.43 14.36L8.4 17.2l-3.35-7.46 8.38 4.62zm1.62-1.01L19 15.6l-8.38-4.62 4.43 2.37zM12 2L3.5 19h17L12 2zm0 4.14L17.26 17H6.74L12 6.14z"/>
        </svg>
      );
    }
    return null;
  };

  const services = data.services || [];
  const deviceInfo = !isSubdomainView ? (data as DeviceInfo) : null;
  const hasHardwareInfo = !!(deviceInfo?.macAddress || deviceInfo?.vendor);

  // QR Code Data construction
  const qrData = `HOST:${data.host}|IP:${data.ip}|ISP:${data.hostingProvider || 'N/A'}|OS:${data.os?.name || 'N/A'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=22d3ee&bgcolor=0f172a`;

  return (
    <div className="space-y-6">
      {/* QR Identity Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)] max-w-sm w-full relative">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h3 className="text-lg font-black text-cyan-400 uppercase tracking-widest mb-1">Identity Matrix</h3>
                <p className="text-[10px] text-slate-500 mono uppercase">Encrypted Host Signature</p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-cyan-500/20 rounded-xl blur-xl group-hover:bg-cyan-500/40 transition-all"></div>
                <div className="relative bg-slate-950 p-4 rounded-xl border border-cyan-500/40">
                  <img src={qrUrl} alt="Target Identity QR" className="w-48 h-48 block" />
                </div>
              </div>
              <div className="w-full space-y-2 mt-2">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">HOST</span>
                  <span className="text-[10px] text-white mono font-black">{data.host}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">IP</span>
                  <span className="text-[10px] text-white mono font-black">{data.ip}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 text-center italic leading-tight">
                Scan for rapid field deployment of intelligence parameters to mobile terminal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Target Status Bar - Dynamic Height Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        
        {/* Dynamic Target Identification Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl relative overflow-hidden group flex flex-col min-h-full">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all transform group-hover:scale-110 pointer-events-none">
            <svg className="w-16 h-16 text-cyan-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-slate-500 block font-black tracking-[0.2em] uppercase">Target Node</span>
              <button 
                onClick={() => setShowQR(true)}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-slate-500 hover:text-cyan-400 group/qr"
                title="Identity QR"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </button>
            </div>
            <h4 className="text-xl font-black text-white mono truncate mb-4">{data.host}</h4>

            <div className={`grid gap-4 mt-auto ${hasHardwareInfo ? 'grid-cols-1' : 'grid-cols-1'}`}>
              <div className="flex flex-col gap-3">
                {/* IP Metric */}
                <div className="flex items-center gap-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                  <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                    <span className="text-[10px] font-black text-cyan-400 mono">IP</span>
                  </div>
                  <span className="text-sm font-black text-slate-100 mono tracking-tight">{data.ip}</span>
                </div>

                {/* ISP Metric */}
                <div className="flex items-center gap-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <span className="text-[10px] font-black text-indigo-400 mono">ISP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(data.hostingProvider)}
                    <span className="text-xs text-slate-200 font-bold uppercase tracking-wider">{data.hostingProvider || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Conditional Block */}
              {hasHardwareInfo && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  {deviceInfo?.macAddress && (
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">MAC ADDR</span>
                      <span className="text-[11px] text-slate-300 font-bold mono truncate">{deviceInfo.macAddress}</span>
                    </div>
                  )}
                  {deviceInfo?.vendor && (
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">VENDOR</span>
                      <span className="text-[11px] text-emerald-400 font-black uppercase tracking-tighter truncate">{deviceInfo.vendor}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OS Fingerprint Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col min-h-full">
          <span className="text-[10px] text-slate-500 block mb-3 font-black tracking-[0.2em] uppercase">Fingerprint</span>
          {data.os ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-4 py-2">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r={radius} fill="transparent" stroke="currentColor" strokeWidth="3" className="text-slate-800" />
                    <circle cx="20" cy="20" r={radius} fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-cyan-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="relative z-10 w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700">
                    <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-slate-100 text-lg leading-tight tracking-tight truncate">{data.os.name}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-[11px] text-slate-500 mono font-bold truncate">RELEASE: {data.os.version}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${confidence > 80 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'}`}></span>
                      <span className={`text-[10px] font-black tracking-tighter uppercase ${confidence > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {confidence}% MATCH
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-600 italic">Fingerprint analytics unavailable.</p>
            </div>
          )}
        </div>

        {/* Network Metrics Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col min-h-full">
          <span className="text-[10px] text-slate-500 block mb-3 font-black tracking-[0.2em] uppercase">Metrics</span>
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-slate-600 font-bold uppercase mono mb-1">Latency</p>
                <p className="text-2xl font-black text-white italic tracking-tighter">{(data as any).latency || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-600 font-bold uppercase mono mb-1">Status</p>
                <p className="text-sm text-cyan-400 font-black mono uppercase tracking-tight">ACTIVE</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Uptime</span>
                <span className="text-xs text-indigo-400 font-black uppercase tracking-tighter">
                  {(data as any).uptime || 'MEASURING...'}
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Summary */}
      <div className="bg-gradient-to-r from-cyan-900/10 to-indigo-900/10 border border-cyan-500/20 p-6 rounded-xl relative overflow-hidden backdrop-blur-sm">
        <h4 className="text-xs font-black text-cyan-400 mb-3 flex items-center gap-2 tracking-[0.2em] uppercase">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          EXECUTIVE INTEL SUMMARY
        </h4>
        <p className="text-slate-300 leading-relaxed text-sm font-medium">{data.intelligenceSummary || "No detailed summary available for this node."}</p>
      </div>

      {/* Infrastructure Correlation Section */}
      {!isSubdomainView && deviceInfo?.relatedInfrastructure && deviceInfo.relatedInfrastructure.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 2.015 3 4.5S13.657 12 12 12s-3-2.015-3-4.5 1.343-4.5 3-4.5m0 18c-1.657 0-3-2.015-3-4.5S10.343 12 12 12m0 12c1.657 0 3-2.015 3-4.5S13.657 12 12 12" /></svg>
              External Asset Correlation
            </h4>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mono">Passive Discovery Mode</span>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {deviceInfo.relatedInfrastructure.map((asset, idx) => {
                const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(asset);
                const isDomain = asset.includes('.');
                return (
                  <div key={idx} className="group flex items-center gap-3 bg-slate-950/50 border border-slate-800 hover:border-emerald-500/40 p-3 rounded-lg transition-all hover:bg-slate-900 shadow-sm min-w-[180px]">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                      {isIP ? (
                        <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-300 mono group-hover:text-emerald-300 transition-colors">{asset}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                        {isIP ? 'Neighboring IP' : isDomain ? 'Associated Domain' : 'Asset Node'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subdomain Discovery Recon */}
      {!isSubdomainView && (data as DeviceInfo).subdomains && (data as DeviceInfo).subdomains.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Perimeter Nodes Enumerated
            </h4>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {(data as DeviceInfo).subdomains.map((sub, idx) => {
              const subIdx = idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => onSubdomainClick?.(sub)}
                  className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group hover:bg-slate-900/40 hover:shadow-2xl flex flex-col border-l-4 border-l-transparent hover:border-l-cyan-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-indigo-400 mono uppercase tracking-widest">{sub.type}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${sub.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                  </div>
                  <h5 className="text-lg font-black text-slate-100 mono group-hover:text-cyan-400 truncate mb-1 transition-colors">{sub.host}</h5>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] text-slate-400 font-bold mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{sub.ip}</p>
                    <div className="flex items-center gap-1.5">
                      {getProviderIcon(sub.hostingProvider)}
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{sub.hostingProvider || 'Unknown'}</span>
                    </div>
                  </div>

                  {sub.services && sub.services.length > 0 && (
                    <div className="flex-1">
                      <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        RECON LOG
                        <div className="h-px bg-slate-800 flex-1"></div>
                      </div>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {sub.services.map((s, sIdx) => {
                          const hasVulns = s.vulnerabilities && s.vulnerabilities.length > 0;
                          const isSubExpanded = expandedSubServices[subIdx]?.has(s.port);
                          return (
                            <div key={sIdx} className="flex flex-col gap-2">
                              <div 
                                onClick={(e) => hasVulns && toggleSubExpand(e, subIdx, s.port)}
                                className={`flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border transition-all ${hasVulns ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 cursor-pointer shadow-[inset_0_0_10px_rgba(244,63,94,0.05)]' : 'border-slate-800/40'}`}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-black mono ${hasVulns ? 'text-rose-400' : 'text-cyan-400'}`}>{s.port}</span>
                                    <span className={`text-[11px] font-black mono ${hasVulns ? 'text-rose-100' : 'text-slate-100'}`}>{s.name}</span>
                                    {hasVulns && (
                                       <svg className="w-3 h-3 text-rose-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasVulns && (
                                    <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                                      THREAT
                                    </span>
                                  )}
                                  <svg className={`w-3 h-3 text-slate-500 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>
                              {isSubExpanded && s.vulnerabilities.map(v => (
                                <div key={v.id} className="ml-2 pl-3 border-l-2 border-rose-500/50 space-y-2 py-1 bg-rose-500/5 rounded-r-lg p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-white mono">{v.id}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${getSeverityStyles(v.severity)}`}>{v.severity}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">{v.description}</p>
                                  {v.remediation && (
                                    <p className="text-[9px] text-emerald-400 mono italic mt-1 font-bold">Fix: {v.remediation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em]">Focused Recon</span>
                     <svg className="w-5 h-5 text-cyan-500 transform translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discovered Services Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
            Discovery Log
          </h4>
          <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-3 py-1.5 rounded-full font-black mono border border-cyan-500/20 uppercase tracking-widest">{services.length} ACTIVE ENDPOINTS</span>
        </div>
        <div className="overflow-x-auto">
          {services.length > 0 ? (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mono border-b border-slate-800">Endpoint</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mono border-b border-slate-800">State</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mono border-b border-slate-800">Service</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mono border-b border-slate-800">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {services.map((service) => {
                  const hasVulns = service.vulnerabilities.length > 0;
                  const isExpanded = expandedPorts.has(service.port);
                  return (
                    <React.Fragment key={service.port}>
                      <tr 
                        className={`transition-all group cursor-pointer ${hasVulns ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-slate-800/40'}`}
                        onClick={() => hasVulns && toggleExpand(service.port)}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`text-lg font-black mono leading-none ${hasVulns ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-cyan-400'}`}>{service.port}</span>
                            <span className={`font-black mono text-[10px] mt-1 uppercase tracking-widest ${hasVulns ? 'text-rose-400/60' : 'text-slate-600'}`}>{service.protocol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${service.state === 'open' ? (hasVulns ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {service.state}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`font-black mono text-sm flex items-center gap-2 transition-colors ${hasVulns ? 'text-rose-100' : 'text-slate-100'}`}>
                               {hasVulns && (
                                  <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                               )}
                               {service.name}
                               {hasVulns && (
                                <svg className={`w-4 h-4 text-rose-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                              )}
                            </span>
                            <span className={`font-bold mono text-[11px] mt-0.5 ${hasVulns ? 'text-rose-300/60' : 'text-slate-500'}`}>{service.version}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {hasVulns ? (
                            <div className="flex flex-col items-start gap-1">
                                <span className="bg-rose-600 text-white text-[9px] px-2 py-0.5 rounded font-black mono tracking-widest uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                  CRITICAL THREAT
                                </span>
                                <span className="text-rose-400 text-[9px] font-black mono ml-1">
                                  {service.vulnerabilities.length} CVE IDENTIFIED
                                </span>
                            </div>
                          ) : (
                            <span className="text-emerald-500/40 text-[10px] mono font-black uppercase tracking-[0.2em]">Validated Clean</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && service.vulnerabilities.map((v) => (
                        <tr key={v.id} className="bg-slate-950/80">
                          <td colSpan={5} className="px-10 py-6">
                            <div className="border-l-4 border-rose-500/50 pl-6 py-2">
                              <div className="flex items-center gap-4 mb-3">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-lg ${getSeverityStyles(v.severity)} uppercase tracking-[0.2em]`}>
                                  {v.severity} ALERT
                                </span>
                                <span className="text-xs font-black text-white mono tracking-widest">{v.id}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-2xl font-medium">{v.description}</p>
                              {v.remediation && (
                                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 max-w-2xl flex gap-3">
                                  <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                  <p className="text-xs text-emerald-300 font-bold leading-relaxed">
                                    <span className="block text-[10px] font-black uppercase mb-1 tracking-widest text-emerald-500">Security Recommendation</span>
                                    {v.remediation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center bg-slate-950/20">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active services detected on this interface</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanDetails;
