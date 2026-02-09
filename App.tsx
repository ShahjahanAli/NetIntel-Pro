
import React, { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import NetworkGraph from './components/NetworkGraph';
import ScanDetails from './components/ScanDetails';
import NetworkMap from './components/NetworkMap';
import ThreatIntelligenceFeed from './components/ThreatIntelligenceFeed';
import { DeviceInfo, Subdomain, ScanHistoryItem, NetworkNode, NetworkLink, ThreatIntelligenceItem } from './types';
import { generateIntelligenceReport, generateThreatIntelligence } from './services/geminiService';

const SCAN_TASKS = [
  "Initializing deep reconnaissance engine...",
  "Resolving global DNS and IP allocations...",
  "Executing stealth port discovery scan...",
  "Probing service versions and banners...",
  "Analyzing OS TCP/IP stack fingerprints...",
  "Executing subdomain enumeration payload...",
  "Mapping external infrastructure assets...",
  "Compiling executive intelligence report..."
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');
  const [scanResult, setScanResult] = useState<DeviceInfo | null>(null);
  const [activeFocus, setActiveFocus] = useState<DeviceInfo | Subdomain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThreatLoading, setIsThreatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [threats, setThreats] = useState<ThreatIntelligenceItem[]>([]);
  
  const [scanProgress, setScanProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [discoveredNodes, setDiscoveredNodes] = useState<NetworkNode[]>([]);
  const [discoveredLinks, setDiscoveredLinks] = useState<NetworkLink[]>([]);

  useEffect(() => {
    if (discoveredNodes.length === 0) {
      setDiscoveredNodes([{
        id: 'gateway-01',
        label: 'LOCAL GATEWAY',
        type: 'gateway',
        status: 'online',
        ip: '192.168.1.1'
      }]);
    }
    
    const fetchInitialThreats = async () => {
      setIsThreatLoading(true);
      const initialThreats = await generateThreatIntelligence(null);
      setThreats(initialThreats);
      setIsThreatLoading(false);
    };
    fetchInitialThreats();
  }, []);

  const handleSubdomainClick = (sub: Subdomain) => {
    setActiveFocus(sub);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPrimary = () => {
    setActiveFocus(scanResult);
  };

  const simulateProgress = () => {
    let currentStep = 0;
    setScanProgress(0);
    setCurrentTask(SCAN_TASKS[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < SCAN_TASKS.length) {
        setCurrentTask(SCAN_TASKS[currentStep]);
        setScanProgress((currentStep / SCAN_TASKS.length) * 100);
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return interval;
  };

  const handleScan = async (host: string) => {
    setIsLoading(true);
    setIsThreatLoading(true);
    setError(null);
    setActiveFocus(null);
    
    const progressInterval = simulateProgress();

    try {
      const result = await generateIntelligenceReport(host);
      
      // Complete progress immediately when data returns
      setScanProgress(100);
      setCurrentTask("Synchronizing intelligence data...");
      
      setTimeout(() => {
        setScanResult(result);
        setActiveFocus(result);
        
        generateThreatIntelligence(result).then(setThreats);
        
        setHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          host: result.host,
          timestamp: new Date().toLocaleTimeString(),
          status: 'completed',
          uptime: result.uptime
        }, ...prev.slice(0, 9)]);

        setDiscoveredNodes(prev => {
          const newNodes = [...prev];
          if (!newNodes.find(n => n.id === result.ip)) {
            newNodes.push({
              id: result.ip,
              label: `${result.host} (${result.ip})`,
              type: 'host',
              status: 'online',
              ip: result.ip
            });
          }
          result.subdomains.forEach(sub => {
            if (!newNodes.find(n => n.id === sub.ip)) {
              newNodes.push({
                id: sub.ip,
                label: sub.host,
                type: 'subdomain',
                status: sub.status === 'online' ? 'online' : 'offline',
                ip: sub.ip
              });
            }
          });
          return newNodes;
        });

        setDiscoveredLinks(prev => {
          const newLinks = [...prev];
          if (!newLinks.find(l => (l.source === 'gateway-01' && l.target === result.ip))) {
            newLinks.push({ source: 'gateway-01', target: result.ip, value: 1 });
          }
          result.subdomains.forEach(sub => {
            if (!newLinks.find(l => (l.source === result.ip && l.target === sub.ip))) {
              newLinks.push({ source: result.ip, target: sub.ip, value: 2 });
            }
          });
          return newLinks;
        });

        setIsLoading(false);
        setIsThreatLoading(false);
        clearInterval(progressInterval);
      }, 800);

    } catch (err) {
      setError('Analysis failed. Ensure valid target hostname.');
      setIsLoading(false);
      setIsThreatLoading(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-cyan-500/30">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">NetIntel <span className="text-cyan-400">Pro</span></h1>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <button onClick={() => setActiveTab('dashboard')} className={`text-xs font-bold tracking-widest ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}>DASHBOARD</button>
            <button onClick={() => setActiveTab('map')} className={`text-xs font-bold tracking-widest ${activeTab === 'map' ? 'text-cyan-400' : 'text-slate-400'}`}>NETWORK MAP</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {activeTab === 'dashboard' ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8 order-2 lg:order-1">
              <ScanForm onScan={handleScan} isLoading={isLoading} />
              
              {isLoading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div 
                      className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-500 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        SCAN IN PROGRESS
                      </h3>
                      <p className="text-sm font-bold text-slate-100 mono">{currentTask}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-cyan-500 mono italic">{Math.round(scanProgress)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mono">Node Resolution</span>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mono">Port Mapping</span>
                    </div>
                  </div>
                </div>
              )}

              {activeFocus && !isLoading && (
                <div className="space-y-4">
                  {activeFocus !== scanResult && (
                    <button 
                      onClick={handleBackToPrimary}
                      className="flex items-center gap-2 text-xs font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                      Back to Primary Infrastructure ({scanResult?.host})
                    </button>
                  )}
                  <ScanDetails 
                    data={activeFocus} 
                    onSubdomainClick={handleSubdomainClick} 
                    isSubdomainView={activeFocus !== scanResult}
                  />
                </div>
              )}

              {!activeFocus && !isLoading && (
                <div className="h-[400px] bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mono uppercase text-xs">
                  Ready for Intelligence deployment...
                </div>
              )}
            </div>

            <div className="w-full lg:w-96 space-y-8 order-1 lg:order-2">
              <NetworkGraph data={scanResult} />
              <ThreatIntelligenceFeed items={threats} isLoading={isThreatLoading} />
            </div>
          </div>
        ) : (
          <NetworkMap 
            nodes={discoveredNodes} 
            links={discoveredLinks} 
            onNodeClick={(node) => {
              if (node.type === 'subdomain') {
                const sub = scanResult?.subdomains.find(s => s.ip === node.id);
                if (sub) handleSubdomainClick(sub);
              } else if (node.type === 'host' && scanResult) {
                setActiveFocus(scanResult);
              }
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
