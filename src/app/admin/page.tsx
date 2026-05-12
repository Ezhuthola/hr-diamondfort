"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
import { Menu, X, LayoutDashboard, UserPlus, LogOut, ExternalLink, Users, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else { setUserEmail(user.email); setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-[10px] uppercase">Initializing_Secure_Session...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col lg:flex-row">
      
      {/* Mobile Nav */}
      <div className="lg:hidden h-16 bg-white border-b flex items-center justify-between px-6 z-50">
        <span className="font-black text-xs uppercase tracking-tighter">Diamond_Fort</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transform transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="mb-10 hidden lg:block">
            <h1 className="text-sm font-black uppercase">Diamond_Fort</h1>
            <p className="text-[8px] text-slate-400 tracking-[0.3em]">ADMIN_NODE_01</p>
          </div>
          <nav className="flex-1 space-y-2">
            <button onClick={() => {setActiveTab("overview"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase transition-all ${activeTab === "overview" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}>
              <LayoutDashboard size={14} /> Overview
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400"}`}>
              <UserPlus size={14} /> Enroll Staff
            </button>
          </nav>
          <button onClick={() => signOut(auth)} className="mt-auto flex items-center justify-center gap-2 p-4 text-red-500 text-[10px] font-bold uppercase border border-red-50 rounded-2xl bg-red-50/30"><LogOut size={14}/> Logout</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === "overview" ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Command_Interface</h2>
                  <p className="text-[10px] text-slate-400 uppercase mt-1">Personnel Management // Mission 2K36</p>
                </div>
                <Link href="/kiosk" className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kiosk_Mode <ExternalLink size={12}/></Link>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total_Staff</span>
                  <span className="text-4xl font-black mt-2">{staffList.length}</span>
                </div>
                <div onClick={() => setActiveTab("enroll")} className="lg:col-span-2 border-2 border-dashed rounded-[2rem] flex items-center justify-center gap-4 text-slate-300 hover:bg-white hover:border-slate-400 cursor-pointer transition-all">
                  <div className="w-10 h-10 border rounded-full flex items-center justify-center">+</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Initialize_Enrollment</span>
                </div>
              </div>

              {/* Staff Registry Table */}
              <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex items-center gap-3">
                  <Users size={16} className="text-slate-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Enrolled_Innovators</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] uppercase font-bold">
                    <thead className="bg-slate-50/30 text-slate-400">
                      <tr>
                        <th className="px-8 py-4">Name</th>
                        <th className="px-8 py-4">Reference_ID</th>
                        <th className="px-8 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {staffList.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-8 py-5 text-slate-700">{s.name}</td>
                          <td className="px-8 py-5 text-slate-400 font-mono">#{s.id.slice(0,8)}</td>
                          <td className="px-8 py-5 text-right"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[8px]">Secured</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Enrollment_Engine</h2>
                <button onClick={() => setActiveTab("overview")} className="text-[10px] font-bold text-slate-400 uppercase">[ Cancel ]</button>
              </div>
              <div className="bg-white rounded-[3rem] border p-2 shadow-xl overflow-hidden">
                <EnrollForm />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}