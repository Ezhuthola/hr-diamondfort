"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirecting to the new 'admin' route
      router.push("/admin");
    } catch (err: any) {
      console.error("Auth Error:", err.code);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-mono flex flex-col items-center justify-center p-6">
      
      {/* Branding / Infrastructure Label */}
      <div className="mb-8 text-center">
        <h2 className="text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-2">
          Mission_2K36 // Infrastructure
        </h2>
        <div className="h-[1px] w-12 bg-slate-200 mx-auto"></div>
      </div>

      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm transition-all">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase">
            Diamond_Fort
          </h1>
          <p className="text-[9px] text-emerald-600 font-bold tracking-widest mt-1">
            SECURE_ADMIN_ACCESS
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest ml-1">
              Command_ID
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
              placeholder="vineeth@ezhuthola.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest ml-1">
              Access_Secret
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>

          {status === "error" && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[9px] p-3 rounded-xl font-bold text-center animate-pulse">
              [ AUTH_FAILURE ]: INVALID_CREDENTIALS
            </div>
          )}

          <button 
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black active:scale-[0.97] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-slate-200"
          >
            {status === "loading" ? "VERIFYING..." : "[ INITIATE_SESSION ]"}
          </button>
        </form>

        {/* System Footer */}
        <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
            <Link href="/" className="text-[9px] text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest font-bold">
                ← Return_to_Main
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] text-slate-300 uppercase tracking-tighter">Encrypted_End_to_End</span>
            </div>
        </div>
      </div>

      <p className="mt-8 text-[9px] text-slate-300 uppercase tracking-widest">
        Property of Ezhuthola EdTech Pvt Ltd
      </p>
    </div>
  );
}