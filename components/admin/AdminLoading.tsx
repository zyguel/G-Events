"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLoadingProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
  withCard?: boolean;
}

export default function AdminLoading({ 
  message = "Loading...", 
  className = "", 
  fullPage = false,
  withCard = false
}: AdminLoadingProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-6 p-12 text-center ${className}`}>
      <div className="relative">
        {/* Large subtle glow */}
        <div className="absolute inset-0 bg-[#3D518C] opacity-[0.08] blur-3xl rounded-full animate-pulse" />
        
        {/* Premium Spinner */}
        <div className="relative z-10 flex items-center justify-center">
          <Loader2 
            className="w-14 h-14 text-[#3D518C] dark:text-indigo-400/80 animate-[spin_1.5s_linear_infinite]" 
            strokeWidth={1.2}
          />
          {/* Pulse center point */}
          <div className="absolute w-2 h-2 bg-[#3D518C] dark:bg-indigo-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(61,81,140,0.5)]" />
        </div>
      </div>
      
      {message && (
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.3em] uppercase opacity-70">
            {message}
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1 h-1 bg-[#3D518C] dark:bg-indigo-400/40 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  if (withCard) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[40vh]">
      {content}
    </div>
  );
}
