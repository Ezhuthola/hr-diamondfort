"use client";

import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function EnrollForm() {
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    contact: "",
    address: "",
    department: "Front Office",
    designation: ""
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("INITIALIZING_SYSTEM...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const departments = [
    "Accounts", "Front Office", "House Keeping", "Kitchen", 
    "Restaurant", "Bar", "Security", "Administration", "Management"
  ];

  useEffect(() => {
    const initialize = async () => {
      try {
        const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
        setStatus("AI_ENGINE_ONLINE");
        
        // REAR CAMERA with PORTRAIT focus
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            aspectRatio: 0.75 // Encourages portrait 3:4 ratio
          } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
      } catch (err) {
        console.error(err);
        setStatus("SYSTEM_ERROR: CHECK_CAMERA_PERMISSIONS");
      }
    };
    initialize();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleEnroll = async () => {
    if (!formData.name.trim() || !formData.contact.trim()) {
      setStatus("ERROR: NAME_AND_CONTACT_REQUIRED");
      return;
    }
    if (!videoRef.current) return;

    setIsProcessing(true);
    setStatus("EXTRACTING_BIOMETRIC_DATA...");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("ERROR: NO_FACE_IN_SIGHT");
        setIsProcessing(false);
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);

      await addDoc(collection(db, "staff"), {
        ...formData,
        faceDescriptor: descriptorArray,
        createdAt: serverTimestamp(),
        node: "DIAMOND_FORT_ADMIN_01",
        status: "active"
      });

      setStatus(`SUCCESS: ${formData.name} ENROLLED`);
      setFormData({
        name: "",
        gender: "Male",
        contact: "",
        address: "",
        department: "Front Office",
        designation: ""
      }); 
    } catch (err) {
      console.error(err);
      setStatus("AUTH_FAILURE: SECURE_LINK_DENIED");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-10 font-mono">
      <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-5">
        
        {/* Responsive Grid for Inputs */}
        <div className="grid grid-cols-1 gap-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              placeholder="NAME"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gender</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact</label>
              <input 
                type="tel" 
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none"
                placeholder="PHONE"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
              <select 
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none"
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Designation</label>
              <input 
                type="text" 
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none"
                placeholder="POSITION"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Residential Address</label>
            <textarea 
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold resize-none outline-none"
              placeholder="STREET, CITY, PIN"
            />
          </div>
        </div>

        {/* PORTRAIT CAMERA AREA (3:4 Ratio) */}
        <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover grayscale brightness-110 contrast-125 transition-opacity duration-700 ${modelsLoaded ? 'opacity-90' : 'opacity-0'}`} 
          />
          <div className="absolute inset-0 border-[20px] border-black/5 pointer-events-none"></div>
          {!modelsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Responsive Button */}
        <div className="space-y-4">
          <button 
            onClick={handleEnroll}
            disabled={isProcessing || !modelsLoaded || !formData.name}
            className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-20 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
          >
            {isProcessing ? "VECTORIZING..." : "[ COMMENCE ENROLLMENT ]"}
          </button>
          
          <div className="flex items-center justify-center gap-2">
             <span className={`w-1.5 h-1.5 rounded-full ${status.includes('ERROR') ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
             <p className={`text-[10px] font-bold tracking-tight uppercase ${status.includes('ERROR') ? 'text-red-500' : 'text-slate-500'}`}>
                {status}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}