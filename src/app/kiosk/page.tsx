"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [status, setStatus] = useState("INITIALIZING_AI...");
  const [identifiedUser, setIdentifiedUser] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<string | null>(null);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  // Clock Sync
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AI & Data Initialization
  useEffect(() => {
    async function setupKiosk() {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        setStatus("LOADING_AI_MODELS...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setStatus("SYNCING_STAFF...");
        const querySnapshot = await getDocs(collection(db, "staff"));
        const labeledDescriptors = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return new faceapi.LabeledFaceDescriptors(data.name, [new Float32Array(data.faceDescriptor)]);
        });
        
        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.55));
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setStatus("SCANNING_ACTIVE");
        }
      } catch (err: any) {
        setStatus(`SYSTEM_ERROR: ${err.message}`);
      }
    }
    setupKiosk();
  }, []);

  const recordAttendance = async (name: string) => {
    if (isLogging) return;
    setIsLogging(true);
    setStatus("VERIFYING_LAST_LOG...");

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const q = query(
        collection(db, "attendance"),
        where("name", "==", name),
        where("date", "==", today),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      
      const lastLogSnap = await getDocs(q);
      let nextType = "IN";
      let displayMsg = "Status: CHECKED_IN";

      if (!lastLogSnap.empty) {
        const lastLog = lastLogSnap.docs[0].data();
        const lastTime = lastLog.timestamp?.toDate().getTime() || Date.now();
        const now = Date.now();
        const diffMinutes = (now - lastTime) / 1000 / 60;

        // 5-Minute Buffer Check
        if (diffMinutes < 5) {
          setStatus("BUFFER_ACTIVE: WAIT 5 MIN");
          setTimeout(() => {
            setIdentifiedUser(null);
            setIsLogging(false);
            setStatus("SCANNING_ACTIVE");
          }, 4000);
          return;
        }

        // Toggle to OUT and Calculate Hours
        if (lastLog.type === "IN") {
          nextType = "OUT";
          const hours = Math.floor(diffMinutes / 60);
          const mins = Math.floor(diffMinutes % 60);
          const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          displayMsg = `CHECKED_OUT | Worked: ${durationStr}`;
        }
      }

      await addDoc(collection(db, "attendance"), {
        name,
        type: nextType,
        timestamp: serverTimestamp(),
        date: today,
        node: "BIOMETRIC_NODE_01"
      });

      setSessionInfo(displayMsg);
      setStatus("ENTRY_SUCCESS");

      setTimeout(() => {
        setIdentifiedUser(null);
        setSessionInfo(null);
        setIsLogging(false);
        setStatus("SCANNING_ACTIVE");
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus(`LOG_FAILURE: ${err.message}`);
      setIsLogging(false);
      setIdentifiedUser(null);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraReady && faceMatcher && !isLogging) {
      interval = setInterval(async () => {
        if (videoRef.current && !identifiedUser) {
          const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            if (match.label !== "unknown") {
              setIdentifiedUser(match.label);
              recordAttendance(match.label);
            }
          }
        }
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isCameraReady, faceMatcher, identifiedUser, isLogging]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6 overflow-hidden">
      <header className="w-full flex justify-between items-center border-b border-slate-200 pb-4 max-w-4xl">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black tracking-tighter text-slate-900">DIAMOND_FORT // NODE_01</span>
          <span className={`text-[9px] font-bold uppercase tracking-tighter ${status.includes('ERROR') || status.includes('FAILURE') || status.includes('WAIT') ? 'text-red-500' : 'text-emerald-600'}`}>
            ● {status}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900 tracking-widest">{currentTime}</div>
          <div className="text-[9px] text-slate-400 uppercase">Local_Time</div>
        </div>
      </header>

      <main className="relative w-full max-w-sm aspect-[3/4] my-4">
        <div className="absolute -inset-2 bg-gradient-to-b from-slate-200 to-white rounded-[2.5rem] shadow-xl"></div>
        <div className="relative w-full h-full border-4 border-white rounded-[2rem] overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover grayscale scale-x-[-1] transition-opacity duration-500 ${isCameraReady ? 'opacity-80' : 'opacity-0'}`} />

          {identifiedUser && (
            <div className={`absolute inset-0 z-30 ${status.includes('WAIT') ? 'bg-amber-500/95' : 'bg-emerald-600/95'} flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300 text-center`}>
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl font-bold">{status.includes('WAIT') ? '!' : '✓'}</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{identifiedUser}</h2>
              <p className="text-[12px] font-bold tracking-[0.1em] uppercase leading-relaxed">
                {sessionInfo || status}
              </p>
            </div>
          )}
          
          {!identifiedUser && isCameraReady && (
            <div className="absolute inset-0 pointer-events-none p-10 z-10">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-scan"></div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div className="space-y-1">
          <div className="text-slate-900 text-[11px] font-black tracking-[0.3em] uppercase">
            [ BIOMETRIC_SHIFT_LOGIC ]
          </div>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">Auto IN/OUT // 5M Safety Buffer</p>
        </div>
        <Link href="/admin" className="text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest">[ ADMIN ]</Link>
      </footer>

      <style jsx>{`
        @keyframes scan { 0% { top: 10%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
}