"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
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
        // If not logged in, force them back to the login gate
        router.push("/login");
      } else {
        setUserEmail(user.email);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">
        <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        Establishing_Secure_Link...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex">
      
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-6">
        <div>
          <div className="mb-10">
            <h1 className="text-sm font-black tracking-tighter text-slate-900 uppercase">
              Diamond_Fort
            </h1>
            <p className="text-[8px] text-slate-400 uppercase tracking-[0.2em]">Command_Center</p>
          </div>

          <nav className="space-y-1">
            <div className="text-[9px] text-slate-400 font-bold uppercase mb-4 tracking-widest opacity-50">Main_Modules</div>
            <button className="w-full text-left p-3 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
              [ Dashboard ]
            </button>
            <button className="w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest transition-all">
              [ Staff_Directory ]
            </button>
            <button className="w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest transition-all">
              [ Attendance_Logs ]
            </button>
            <button className="w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest transition-all">
              [ System_Settings ]
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="text-[8px] text-slate-400 uppercase mb-2">Authenticated_As:</div>
          <div className="text-[9px] font-bold truncate mb-4">{userEmail}</div>
          <button 
            onClick={handleLogout}
            className="text-[10px] text-red-500 font-bold uppercase hover:underline"
          >
            [ Terminate_Session ]
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Node_Status: Online</span>
          </div>
          <Link href="/kiosk" className="text-[10px] bg-slate-100 px-4 py-2 rounded-full font-bold hover:bg-slate-200 transition-all">
            GO_TO_KIOSK →
          </Link>
        </header>

        {/* Content Body */}
        <div className="p-10">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Overview</h2>
            <p className="text-xs text-slate-400 mt-1">Mission 2K36 // Infrastructure Management</p>
          </div>

          {/* Metric Grid (Blank States) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total_Staff</div>
                <div className="text-3xl font-black text-slate-900">00</div>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Present_Today</div>
                <div className="text-3xl font-black text-slate-900">00</div>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">System_Alerts</div>
                <div className="text-3xl font-black text-slate-300">NONE</div>
            </div>
          </div>

          {/* Placeholder for future module content */}
          <div className="mt-10 w-full aspect-video border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 gap-4">
             <div className="text-[10px] font-bold tracking-[0.4em] uppercase">Module_Waiting_Deployment</div>
             <p className="text-[9px] max-w-xs text-center leading-relaxed">
               Ready to initialize the Staff Enrollment and Face Analysis engine.
             </p>
          </div>
        </div>
      </main>

    </div>
  );
}