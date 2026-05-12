"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Back to home screen after logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">
        <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        SECURE_SESSION_INITIALIZING...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex">
      
      {/* --- MINIMAL SIDEBAR --- */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col justify-between p-8">
        <div>
          <div className="mb-12">
            <h1 className="text-sm font-black tracking-tighter text-slate-900 uppercase">
              Diamond_Fort
            </h1>
            <p className="text-[8px] text-slate-400 uppercase tracking-[0.3em] mt-1">Admin_Node_01</p>
          </div>

          <nav className="space-y-2">
            <div className="text-[9px] text-slate-300 font-bold uppercase mb-4 tracking-widest">Navigation</div>
            
            {/* Simple Enrollment Menu */}
            <button className="w-full text-left p-4 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200 flex justify-between items-center group">
              Enroll Employee
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[8px] text-slate-400 uppercase mb-1">User_Auth</div>
            <div className="text-[9px] font-bold text-slate-700 truncate">{userEmail}</div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full border border-red-100 bg-red-50/30 text-red-600 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            [ Logout_Session ]
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col bg-slate-50/50">
        <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">System_Status: Operational</span>
          </div>
          <Link href="/kiosk" className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest border-b border-transparent hover:border-slate-900 pb-1">
            Switch_to_Kiosk
          </Link>
        </header>

        <div className="p-12 max-w-5xl">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Command_Interface</h2>
            <p className="text-xs text-slate-400 mt-2 tracking-wide uppercase">Select a module from the sidebar to begin.</p>
          </div>

          {/* Placeholder for Enrollment Form */}
          <div className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50 flex flex-col items-center justify-center text-slate-300 transition-all hover:border-slate-300">
             <div className="w-12 h-12 border-2 border-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl">+</span>
             </div>
             <div className="text-[10px] font-bold tracking-[0.5em] uppercase">Ready_to_Enroll</div>
          </div>
        </div>
      </main>

    </div>
  );
}