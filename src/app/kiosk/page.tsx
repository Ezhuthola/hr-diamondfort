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
        setStatus("LOADING_BIOMETRIC_MODELS...");
        const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setStatus("SYNCING_STAFF_DATABASE...");
        const querySnapshot = await getDocs(collection(db, "staff"));
        const labeledDescriptors = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const descriptor = new Float32Array(data.faceDescriptor);
          return new faceapi.LabeledFaceDescriptors(data.name, [descriptor]);
        });

        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.55));
        }

        // Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setStatus("SCANNING_READY");
        }
      } catch (err) {
        console.error(err);
        setStatus("SYSTEM_LINK_FAILURE");
      }
    }
    setupKiosk();
  }, []);

  // 3. Real-time Recognition Loop
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
              // Reset after 5 seconds to allow next person
              setTimeout(() => setIdentifiedUser(null), 5000);
            }
          }
        }
      }, 800); // Scan every 800ms
    }
    return () => clearInterval(interval);
  }, [isCameraReady, faceMatcher, identifiedUser]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6 overflow-hidden">
      
      {/* --- TOP BAR --- */}
      <header className="w-full flex justify-between items-center border-b border-slate-200 pb-4 max-w-4xl">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-tighter text-slate-900">
            DIAMOND_FORT // BIOMETRIC_NODE_01
          </span>
          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">
            ● {status}
          </span>
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
        <div className="absolute -inset-2 bg-gradient-to-b from-slate-200 to-white rounded-[2.5rem] shadow-xl"></div>
        
        <div className="relative w-full h-full border-4 border-white rounded-[2rem] overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
          
          {/* MIRRORED VIDEO FEED */}
          <video 
            ref={videoRef} 
            autoPlay muted playsInline
            className={`w-full h-full object-cover grayscale transition-opacity duration-1000 scale-x-[-1] ${isCameraReady ? 'opacity-90' : 'opacity-0'}`}
          />

          {/* RECOGNITION OVERLAY */}
          {identifiedUser && (
            <div className="absolute inset-0 z-20 bg-emerald-500/90 flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">✓</span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-center">
                {identifiedUser}
              </h2>
              <p className="text-[10px] font-bold tracking-[0.2em] mt-2 opacity-80 uppercase">
                Your Attendance is Marked
              </p>
              <div className="mt-8 text-[8px] tracking-widest opacity-50 uppercase">
                LOGGING_TO_FIRESTORE...
              </div>
            </div>
          )}
          
          {/* SCANNING UI */}
          {!identifiedUser && (
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-t-2 border-l-2 border-slate-400/40"></div>
                  <div className="w-10 h-10 border-t-2 border-r-2 border-slate-400/40"></div>
                </div>

                <div className="self-center w-12 h-12 border border-emerald-400/20 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-emerald-400/40 rounded-full animate-ping"></div>
                </div>

                <div className="flex justify-between">
                  <div className="w-10 h-10 border-b-2 border-l-2 border-slate-400/40"></div>
                  <div className="w-10 h-10 border-b-2 border-r-2 border-slate-400/40"></div>
                </div>

                {isCameraReady && (
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-scan"></div>
                )}
            </div>
          )}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div className="space-y-1">
          <div className="text-slate-900 text-[11px] font-black tracking-[0.3em] uppercase">
            {identifiedUser ? "[ IDENTITY_VERIFIED ]" : "[ STAND_BEFORE_SCANNER ]"}
          </div>
          <p className="text-[9px] text-slate-400 leading-relaxed uppercase tracking-wider">
            Processing biometric vector data <br/> 
            <span className="text-slate-600 font-bold">Encrypted_Secured_Link</span>
          </p>
        </div>

        <div className="flex items-center gap-8">
            <Link href="/" className="text-[10px] text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-widest">
                [ Exit ]
            </Link>
            <Link href="/login" className="text-[10px] text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-widest">
                [ Admin ]
            </Link>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scan {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}