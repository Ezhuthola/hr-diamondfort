"use client";

import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function EnrollForm() {
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("INITIALIZING_SYSTEM...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Initialize AI Models and Camera on Load
  useEffect(() => {
    const initialize = async () => {
      try {
        // High-speed CDN for the face-api model weights
        const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
        setStatus("AI_ENGINE_ONLINE");
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
      } catch (err) {
        console.error(err);
        setStatus("SYSTEM_ERROR: CHECK_CAMERA_PERMISSIONS");
      }
    };
    initialize();

    // Cleanup camera when leaving the page
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleEnroll = async () => {
    if (!name.trim()) {
      setStatus("ERROR: IDENTITY_LABEL_REQUIRED");
      return;
    }
    if (!videoRef.current) return;

    setIsProcessing(true);
    setStatus("EXTRACTING_BIOMETRIC_DATA...");

    try {
      // 2. Perform training capture (Single Face Detection)
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("ERROR: NO_FACE_IN_SIGHT");
        setIsProcessing(false);
        return;
      }

      // 3. Convert Float32Array to standard Number Array for Firestore compatibility
      const descriptorArray = Array.from(detection.descriptor);

      // 4. Record to the 'staff' collection in Firestore
      await addDoc(collection(db, "staff"), {
        name: name.trim(),
        faceDescriptor: descriptorArray, // The 128-digit vector
        createdAt: serverTimestamp(),
        node: "DIAMOND_FORT_ADMIN_01",
        status: "active"
      });

      setStatus(`SUCCESS: ${name} DATA_TRAINED`);
      setName(""); // Clear input for next enrollment
    } catch (err) {
      console.error(err);
      setStatus("AUTH_FAILURE: SECURE_LINK_DENIED");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-xl animate-in fade-in duration-700">
      <div className="space-y-6">
        {/* Name Entry Field */}
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
            Employee_Identity_Label
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs focus:outline-none focus:border-slate-900 transition-all font-bold placeholder:text-slate-300"
            placeholder="ENTER FULL NAME"
          />
        </div>

        {/* Training Camera Feed */}
        <div className="relative aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover grayscale brightness-110 contrast-125 scale-x-[-1] transition-opacity duration-700 ${modelsLoaded ? 'opacity-90' : 'opacity-0'}`} 
          />
          
          {/* Loading Indicator for AI Brain */}
          {!modelsLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-white rounded-full animate-spin"></div>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest">Waking_AI...</span>
            </div>
          )}

          {/* Viewfinder Overlays */}
          <div className="absolute inset-0 border-[30px] border-black/5 pointer-events-none"></div>
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/30"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/30"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/30"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/30"></div>
        </div>

        {/* Execution Button */}
        <div className="pt-2">
          <button 
            onClick={handleEnroll}
            disabled={isProcessing || !modelsLoaded || !name}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            {isProcessing ? "VECTORIZING_FACE..." : "[ COMMENCE_ENROLLMENT ]"}
          </button>
          
          {/* Dynamic Status Log */}
          <div className="mt-4 flex items-center justify-center gap-2">
             <span className={`w-1 h-1 rounded-full ${status.includes('ERROR') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
             <p className={`text-[9px] font-bold tracking-tighter uppercase ${status.includes('ERROR') ? 'text-red-500' : 'text-slate-400'}`}>
                {status}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}