"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
import { Menu, X, LayoutDashboard, UserPlus, LogOut, ExternalLink, Users } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffCount, setStaffCount] = useState(0);
  const [staffList, setStaffList] = useState<any[]>([]);
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

  // Real-time Staff Registry Listener
  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffList(list);
      setStaffCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-mono flex flex-col lg:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50">
        <h1 className="text-xs font-black tracking-tighter text-slate-900 uppercase">Diamond_Fort</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* --- COLLAPSIBLE SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-8">
          <div className="hidden lg:block mb-12">
            <h1 className="text-sm font-black tracking-tighter text-slate-900 uppercase">Diamond_Fort</h1>
            <p className="text-[8px] text-slate-400 uppercase tracking-[0.3em] mt-1">Admin_Node_01</p>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="text-[9px] text-slate-300 font-bold uppercase mb-4 tracking-widest">Control_Modules</div>
            
            <button 
              onClick={() => { setActiveTab("overview"); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === "overview" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard size={14} /> Dashboard_Home
            </button>

            <button 
              onClick={() => { setActiveTab("enroll"); setIsMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === "enroll" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus size={14} /> Enroll_Staff
              </div>
              <span className={activeTab === "enroll" ? "opacity-100" : "opacity-0"}>→</span>
            </button>
          </nav>

          <div className="mt-auto pt-8 space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[8px] text-slate-400 uppercase mb-1">Authenticated_As</div>
              <div className="text-[9px] font-bold text-slate-700 truncate">{userEmail}</div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-100 bg-red-50/30 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
            >
              <LogOut size={14} /> [ Logout ]
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col bg-slate-50/30 overflow-y-auto">
        <header className="hidden lg:flex h-20 border-b border-slate-200 bg-white items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">System_Status: Operational</span>
          </div>
          <Link href="/kiosk" className="flex items-center gap-2 text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-all uppercase tracking-widest">
            Switch_to_Kiosk <ExternalLink size={12} />
          </Link>
        </header>

        <div className="p-6 lg:p-12 max-w-6xl mx-auto w-full">
          {activeTab === "overview" ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Command_Interface</h2>
                <p className="text-xs text-slate-400 mt-2 tracking-wide uppercase">Operational overview for Mission 2K36.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total_Enrolled</div>
                    <div className="text-4xl font-black text-slate-900">{staffCount}</div>
                    <p className="text-[9px] text-emerald-500 mt-2 font-bold uppercase">● Active_Registry</p>
                </div>
                <div 
                  onClick={() => setActiveTab("enroll")}
                  className="lg:col-span-2 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50 flex items-center justify-center gap-4 text-slate-300 transition-all hover:border-slate-400 hover:bg-white cursor-pointer group"
                >
                  <div className="w-10 h-10 border-2 border-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">+</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">Add_New_Staff</div>
                </div>
              </div>

              {/* Real-time Enrolled Registry */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Users size={16} className="text-slate-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Enrolled_Innovators</h3>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID_Reference</th>
                        <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{staff.name}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[9px] font-mono text-slate-400">#{staff.id.substring(0, 8)}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold uppercase">Stored</span>
                          </td>
                        </tr>
                      ))}
                      {staffList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-8 py-12 text-center text-[10px] text-slate-300 uppercase tracking-widest">No_Staff_Enrolled_Yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
                  [ Close_Module ]
                </button>
              </div>
              
              {/* Enrollment Form renders the camera and success message internally */}
              <div className="bg-white rounded-[3rem] border border-slate-200 p-2 shadow-xl overflow-hidden">
                <EnrollForm />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}