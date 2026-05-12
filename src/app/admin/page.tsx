"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; // We will import the form component here

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
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
      router.push("/");
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
            
            <button 
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === "overview" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              Dashboard_Home
            </button>

            <button 
              onClick={() => setActiveTab("enroll")}
              className={`w-full text-left p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all flex justify-between items-center group ${
                activeTab === "enroll" ? "bg-slate-900 text-white shadow-slate-200" : "text-slate-400 hover:bg-slate-50 shadow-none"
              }`}
            >
              Enroll Employee
              <span className={activeTab === "enroll" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}>→</span>
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
      <main className="flex-1 flex flex-col bg-slate-50/50 overflow-y-auto">
        <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">System_Status: Operational</span>
          </div>
          <Link href="/kiosk" className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest border-b border-transparent hover:border-slate-900 pb-1">
            Switch_to_Kiosk
          </Link>
        </header>

        <div className="p-12 max-w-5xl">
          {activeTab === "overview" ? (
            <>
              <div className="mb-12">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Command_Interface</h2>
                <p className="text-xs text-slate-400 mt-2 tracking-wide uppercase">Operational overview for Mission 2K36.</p>
              </div>

              <div 
                onClick={() => setActiveTab("enroll")}
                className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50 flex flex-col items-center justify-center text-slate-300 transition-all hover:border-slate-400 hover:bg-white cursor-pointer"
              >
                <div className="w-12 h-12 border-2 border-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl">+</span>
                </div>
                <div className="text-[10px] font-bold tracking-[0.5em] uppercase text-slate-400">Initialize_Enrollment_Module</div>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enrollment_Engine</h2>
                  <p className="text-xs text-slate-400 mt-2 tracking-wide uppercase">Capturing Biometric Face Signature</p>
                </div>
                <button 
                  onClick={() => setActiveTab("overview")}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                >
                  [ Cancel ]
                </button>
              </div>
              
              {/* This is where the Enrollment Form component renders */}
              <EnrollForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}