"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    startVideo();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="text-[11px] font-bold tracking-tighter text-slate-900">
          DIAMOND_FORT // BIOMETRIC_NODE_01
        </div>
        <div className="text-[11px] text-slate-500 font-bold">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full max-w-md aspect-[3/4] border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center mt-8">
        {!isCameraReady && (
          <div className="text-slate-400 text-[10px] animate-pulse flex flex-col items-center gap-2">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></span>
            INITIALIZING_OPTICS...
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-cover grayscale opacity-90"
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-slate-400 opacity-50"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-slate-400 opacity-50"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-slate-400 opacity-50"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-slate-400 opacity-50"></div>
            {/* Scanning Line Animation */}
            {isCameraReady && (
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/30 animate-scan shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
            )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="w-full max-w-md text-center py-8">
        <div className="text-slate-900 text-xs font-bold tracking-[0.2em] uppercase mb-2">
          [ STAND_BEFORE_SCANNER ]
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
          ENSURE FACE IS VISIBLE. AI RECOGNITION ACTIVE.
        </p>
      </div>

      <Link href="/" className="text-[10px] text-slate-300 hover:text-slate-600 transition-colors">
        [ SYSTEM_EXIT ]
      </Link>

      <style jsx>{`
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}