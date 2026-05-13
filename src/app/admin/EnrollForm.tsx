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

  // 1. Initialize AI Models and REAR Camera
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
        
        // SWITCHED TO REAR CAMERA (environment)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
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

      // Convert Float32Array to standard Number Array
      const descriptorArray = Array.from(detection.descriptor);

      // Record full profile to Firestore
      await addDoc(collection(db, "staff"), {
        ...formData,
        faceDescriptor: descriptorArray,
        createdAt: serverTimestamp(),
        node: "DIAMOND_FORT_ADMIN_01",
        status: "active"
      });

      setStatus(`SUCCESS: ${formData.name} ENROLLED`);
      // Reset form
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-xl animate-in fade-in duration-700">
      <div className="space-y-4">
        
        {/* Full Name & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold"
              placeholder="ENTER NAME"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Gender</label>
            <select 
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Contact & Designation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Contact Number</label>
            <input 
              type="text" 
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold"
              placeholder="PHONE"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Designation</label>
            <input 
              type="text" 
              value={formData.designation}
              onChange={(e) => setFormData({...formData, designation: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold"
              placeholder="POSITION"
            />
          </div>
        </div>

        {/* Department Dropdown */}
        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Department</label>
          <select 
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold"
          >
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Contact Address</label>
          <textarea 
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold resize-none"
            placeholder="RESIDENTIAL ADDRESS"
          />
        </div>

        {/* Training Camera Feed - UPDATED CSS for Rear Camera (No Mirroring) */}
        <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover grayscale brightness-110 contrast-125 transition-opacity duration-700 ${modelsLoaded ? 'opacity-90' : 'opacity-0'}`} 
            // Removed scale-x-[-1] because it is the back camera
          />
          
          <div className="absolute inset-0 border-[30px] border-black/5 pointer-events-none"></div>
        </div>

        {/* Execution Button */}
        <div className="pt-2">
          <button 
            onClick={handleEnroll}
            disabled={isProcessing || !modelsLoaded || !formData.name}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-black transition-all shadow-xl active:scale-95"
          >
            {isProcessing ? "VECTORIZING_BIOMETRICS..." : "[ COMMENCE_ENROLLMENT ]"}
          </button>
          
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