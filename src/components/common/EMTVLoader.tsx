import React from 'react';
import { Database, Cpu, Network } from 'lucide-react';

interface EMTVLoaderProps {
  message?: string;
}

export const EMTVLoader: React.FC<EMTVLoaderProps> = ({ message = 'Processing...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute w-40 h-40 border-t-4 border-b-4 border-emerald-500 rounded-full animate-[spin_3s_linear_infinite] shadow-[0_0_30px_rgba(16,185,129,0.3)]"></div>
        {/* Inner reverse spinning ring */}
        <div className="absolute w-32 h-32 border-l-4 border-r-4 border-purple-500 rounded-full animate-[spin_2s_linear_reverse_infinite] shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
        
        {/* Center EMTV Text */}
        <div className="z-10 flex flex-col items-center">
          <span className="text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">
            EMTV
          </span>
        </div>
        
        {/* Decorative Tech Icons */}
        <div className="absolute -top-8 animate-bounce delay-75">
          <Cpu className="text-emerald-400 w-8 h-8 drop-shadow-md" />
        </div>
        <div className="absolute -bottom-8 animate-bounce delay-150">
          <Database className="text-purple-400 w-8 h-8 drop-shadow-md" />
        </div>
        <div className="absolute -left-10 animate-pulse delay-200">
          <Network className="text-emerald-400 w-7 h-7 drop-shadow-md" />
        </div>
        <div className="absolute -right-10 animate-pulse delay-300">
          <Network className="text-purple-400 w-7 h-7 drop-shadow-md" />
        </div>
      </div>
      
      <div className="mt-16 text-emerald-400 font-mono text-sm uppercase tracking-[0.3em] animate-pulse font-bold bg-slate-900/50 px-6 py-2 rounded-full border border-emerald-500/20 shadow-inner">
        {message}
      </div>
    </div>
  );
};
