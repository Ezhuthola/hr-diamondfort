"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
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

  // 1. Clock Sync
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. AI & Staff Synchronization
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

        setStatus("SYNCING_STAFF_DATA...");
        const querySnapshot = await getDocs(collection(db, "staff"));
        const labeledDescriptors = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            if (!data.faceDescriptor) return null;
            return new faceapi.LabeledFaceDescriptors(
              data.name, 
              [new Float32Array(data.faceDescriptor)]
            );
          })
          .filter((item): item is faceapi.LabeledFaceDescriptors => item !== null);
        
        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.40));
        }

        // --- CAMERA UPDATE: SET TO REAR (environment) ---
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });

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

  // 3. Hardened Attendance Logic
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
      const now = Date.now();
      
      let nextType = "IN";
      let displayMsg = "Status: CHECKED_IN";

      if (!lastLogSnap.empty) {
        const lastLog = lastLogSnap.docs[0].data();
        const lastTime = lastLog.timestamp?.toDate().getTime() || now;
        const diffMinutes = (now - lastTime) / 1000 / 60;

        if (diffMinutes < 5) {
          const remaining = Math.ceil(5 - diffMinutes);
          setStatus(`COOLDOWN: WAIT ${remaining} MIN`);
          
          setTimeout(() => {
            setIdentifiedUser(null);
            setIsLogging(false);
            setStatus("SCANNING_ACTIVE");
          }, 3500);
          return;
        }

        if (lastLog.type === "IN") {
          nextType = "OUT";
          displayMsg = "Status: CHECKED_OUT";
        }
      }

      await addDoc(collection(db, "attendance"), { 
        name, 
        type: nextType, 
        timestamp: serverTimestamp(), 
        date: today, 
        node: "DIAMOND_FORT_KIOSK_01" 
      });

      setSessionInfo(displayMsg);
      setStatus("LOG_SUCCESSFUL");

      setTimeout(() => {
        setIdentifiedUser(null);
        setSessionInfo(null);
        setIsLogging(false);
        setStatus("SCANNING_ACTIVE");
      }, 5000);

    } catch (err: any) {
      setStatus(`SYNC_FAILURE: ${err.message}`);
      setIsLogging(false);
      setIdentifiedUser(null);
    }
  };

  // 4. Scanning Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraReady && faceMatcher && !isLogging) {
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
              recordAttendance(match.label);
            }
          }
        }
      }, 700); 
    }
    return () => clearInterval(interval);
  }, [isCameraReady, faceMatcher, identifiedUser, isLogging]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col items-center justify-between p-6">
      <header className="w-full flex justify-between items-center border-b border-slate-200 pb-4 max-w-4xl">
        <div className="text-left">
          <span className="text-[11px] font-black tracking-tighter text-slate-900 block">
            DIAMOND_FORT // BIOMETRIC_GATE
          </span>
          <span className={`text-[9px] font-bold uppercase ${status.includes('WAIT') || status.includes('COOLDOWN') ? 'text-amber-500' : 'text-emerald-600'}`}>
            ● {status}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold text-slate-900 tracking-widest">{currentTime}</div>
        </div>
      </header>

      <main className="relative w-full max-w-sm aspect-[3/4] my-4">
        <div className="absolute -inset-2 bg-gradient-to-b from-slate-200 to-white rounded-[2.5rem] shadow-xl"></div>
        <div className="relative w-full h-full border-4 border-white rounded-[2rem] overflow-hidden bg-slate-900 flex items-center justify-center">
          {/* --- CSS UPDATE: REMOVED scale-x-[-1] FOR REAR CAMERA --- */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover grayscale opacity-80" 
          />
          
          {identifiedUser && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in duration-300 ${
              status.includes('COOLDOWN') ? 'bg-amber-500/95' : 'bg-emerald-600/95'
            }`}>
              <div className="w-20 h-20 mb-4 border-4 border-white rounded-full flex items-center justify-center">
                <span className="text-4xl font-black">!</span>
              </div>
              <h2 className="text-2xl font-black uppercase mb-2">{identifiedUser}</h2>
              <p className="text-[11px] font-bold tracking-widest uppercase">
                {sessionInfo || status}
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center space-y-4">
        <div className="flex flex-col gap-1">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            Identity Persistence Threshold: 0.40
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            Temporal Buffer: 300s
          </p>
        </div>
        <Link 
          href="/admin" 
          className="inline-block text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest border-b border-slate-200 transition-colors"
        >
          [ ACCESS_CONTROL_UNIT ]
        </Link>
      </footer>
    </div>
  );
}