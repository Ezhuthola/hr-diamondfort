"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Camera
  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Camera access is required for the Biometric Kiosk. Please enable permissions and use HTTPS.");
      }
    }
    startVideo();

    // Cleanup stream on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6 overflow-hidden">
      
      {/* --- TOP BAR --- */}
      <header className="w-full flex justify-between items-center border-b border-slate-200 pb-4 max-w-4xl">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-tighter text-slate-900">
            DIAMOND_FORT // BIOMETRIC_NODE_01
          </span>
          <span className="text-[9px] text-emerald-600 font-bold">● SYSTEM_ACTIVE</span>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900 tracking-widest">
            {currentTime || "--:--:--"}
          </div>
          <div className="text-[9px] text-slate-400 uppercase">Local_Node_Time</div>
        </div>
      </header>

      {/* --- MAIN SCANNER VIEWPORT --- */}
      <main className="relative w-full max-w-sm aspect-[3/4] mt-4 mb-4">
        {/* Decorative Frame Background */}
        <div className="absolute -inset-2 bg-gradient-to-b from-slate-200 to-white rounded-[2.5rem] shadow-xl"></div>
        
        <div className="relative w-full h-full border-4 border-white rounded-[2rem] overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
          
          {/* Loading State */}
          {!isCameraReady && (
            <div className="text-slate-400 text-[10px] flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
              <span>LINKING_OPTICS...</span>
            </div>
          )}

          {/* MIRRORED VIDEO FEED */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover grayscale opacity-90 scale-x-[-1]"
          />
          
          {/* SCANNING OVERLAY UI */}
          <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
              {/* Corner Brackets */}
              <div className="flex justify-between">
                <div className="w-10 h-10 border-t-2 border-l-2 border-slate-400/40"></div>
                <div className="w-10 h-10 border-t-2 border-r-2 border-slate-400/40"></div>
              </div>

              {/* Central Target Reticle (Optional/Decorative) */}
              <div className="self-center w-12 h-12 border border-emerald-400/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-400/40 rounded-full"></div>
              </div>

              <div className="flex justify-between">
                <div className="w-10 h-10 border-b-2 border-l-2 border-slate-400/40"></div>
                <div className="w-10 h-10 border-b-2 border-r-2 border-slate-400/40"></div>
              </div>

              {/* Scanning Line Animation */}
              {isCameraReady && (
                <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-scan"></div>
              )}
          </div>
        </div>
      </main>

      {/* --- FOOTER INSTRUCTIONS --- */}
      <footer className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div className="space-y-1">
          <div className="text-slate-900 text-[11px] font-black tracking-[0.3em] uppercase">
            [ STAND_BEFORE_SCANNER ]
          </div>
          <p className="text-[9px] text-slate-400 leading-relaxed uppercase tracking-wider">
            Position face within the frame for <br/> 
            <span className="text-slate-600 font-bold">AI_BIOMETRIC_RECOGNITION</span>
          </p>
        </div>

        <div className="flex items-center gap-8">
            <Link href="/" className="group flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-300 group-hover:text-slate-900 transition-colors">[ SYSTEM_EXIT ]</span>
            </Link>
            <Link href="/dashboard" className="group flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-300 group-hover:text-slate-900 transition-colors">[ ADMIN_LOG ]</span>
            </Link>
        </div>
      </footer>

      {/* --- ANIMATIONS --- */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}