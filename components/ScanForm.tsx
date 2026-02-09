
import React, { useState } from 'react';

interface ScanFormProps {
  onScan: (host: string) => void;
  isLoading: boolean;
}

const ScanForm: React.FC<ScanFormProps> = ({ onScan, isLoading }) => {
  const [host, setHost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (host.trim()) {
      onScan(host.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter Target Host (e.g. 192.168.1.1 or scanme.nmap.org)"
          className="w-full bg-slate-900 border-2 border-slate-800 text-slate-200 pl-12 pr-32 py-4 rounded-xl focus:outline-none focus:border-cyan-500/50 transition-all mono placeholder:text-slate-600 shadow-lg shadow-black/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !host}
          className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg transition-all flex items-center gap-2 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>ANALYZING...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>RUN SCAN</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 mono flex items-center gap-2 px-2">
        <span className="text-amber-500/80">⚠️</span> AI-Simulated Intelligence Scan. For educational purposes.
      </p>
    </form>
  );
};

export default ScanForm;
