"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [status, setStatus] = useState("INITIALIZING_AI...");
  const [identifiedUser, setIdentifiedUser] = useState<string | null>(null);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

  // 1. Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize AI & Fetch Staff from Firestore
  useEffect(() => {
    async function setupKiosk() {
      try {
        // Updated to a more reliable CDN
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        
        setStatus("LOADING_AI_MODELS...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setStatus("SYNCING_DATABASE...");
        const querySnapshot = await getDocs(collection(db, "staff"));
        
        if (querySnapshot.empty) {
          setStatus("READY: NO_STAFF_FOUND");
        } else {
          const labeledDescriptors = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const descriptor = new Float32Array(data.faceDescriptor);
            return new faceapi.LabeledFaceDescriptors(data.name, [descriptor]);
          });
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.55));
        }

        setStatus("OPENING_CAMERA...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setStatus("SCANNING_ACTIVE");
        }
      } catch (err: any) {
        console.error("Kiosk Error:", err);
        // This will display the specific error (e.g. Permission Denied)
        setStatus(`ERROR: ${err.message || 'LINK_FAILED'}`);
      }
    }
    setupKiosk();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  // 3. Recognition Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraReady && faceMatcher) {
      interval = setInterval(async () => {
        if (videoRef.current && !identifiedUser) {
          const detection = await faceapi
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            if (match.label !== "unknown") {
              setIdentifiedUser(match.label);
              setTimeout(() => setIdentifiedUser(null), 5000);
            }
          }
        }
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isCameraReady, faceMatcher, identifiedUser]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6 overflow-hidden">
      
      <header className="w-full flex justify-between items-center border-b border-slate-200 pb-4 max-w-4xl">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black tracking-tighter text-slate-900">
            DIAMOND_FORT // BIOMETRIC_NODE_01
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-tighter ${status.includes('ERROR') ? 'text-red-500' : 'text-emerald-600'}`}>
            ● {status}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900 tracking-widest">{currentTime || "00:00:00"}</div>
          <div className="text-[9px] text-slate-400 uppercase">Local_Time</div>
        </div>
      </header>

      <main className="relative w-full max-w-sm aspect-[3/4] my-4">
        <div className="absolute -inset-2 bg-gradient-to-b from-slate-200 to-white rounded-[2.5rem] shadow-xl"></div>
        <div className="relative w-full h-full border-4 border-white rounded-[2rem] overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
          
          <video 
            ref={videoRef} 
            autoPlay muted playsInline
            className={`w-full h-full object-cover grayscale scale-x-[-1] transition-opacity duration-500 ${isCameraReady ? 'opacity-80' : 'opacity-0'}`}
          />

          {identifiedUser && (
            <div className="absolute inset-0 z-30 bg-emerald-600/95 flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300 text-center">
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="text-3xl font-bold">✓</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                {identifiedUser}
              </h2>
              <p className="text-[11px] font-bold tracking-[0.3em] opacity-90 uppercase leading-relaxed">
                Attendance Recorded <br /> Access Granted
              </p>
            </div>
          )}
          
          {!identifiedUser && isCameraReady && (
            <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-10">
                <div className="flex justify-between">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400/50"></div>
                  <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400/50"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400/50"></div>
                  <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400/50"></div>
                </div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-scan"></div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div className="space-y-1">
          <div className="text-slate-900 text-[11px] font-black tracking-[0.3em] uppercase">
            {identifiedUser ? "[ VERIFIED ]" : "[ STAND_BEFORE_OPTICS ]"}
          </div>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            Cross-Referencing Biometric Signatures
          </p>
        </div>

        <div className="flex items-center gap-10">
            <Link href="/" className="text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest">[ HOME ]</Link>
            <Link href="/admin" className="text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest">[ ADMIN ]</Link>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3.5s linear infinite;
        }
      `}</style>
    </div>
  );
}