"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
import { Menu, X, LayoutDashboard, UserPlus, LogOut, ExternalLink, Users, Calendar, Search } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll" | "attendance">("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else { setUserEmail(user.email); setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  // Sync Staff & Attendance
  useEffect(() => {
    const staffQ = query(collection(db, "staff"), orderBy("name", "asc"));
    const unsubStaff = onSnapshot(staffQ, (snap) => {
      setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const attendanceQ = query(collection(db, "attendance"), where("date", "==", filterDate));
    const unsubAttendance = onSnapshot(attendanceQ, (snap) => {
      setAttendanceLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStaff(); unsubAttendance(); };
  }, [filterDate]);

  // Logic: Calculate Status for the Register
  const registerData = useMemo(() => {
    return staffList.map(staff => {
      // Find all logs for this specific staff member on the selected date
      const personLogs = attendanceLogs.filter(log => log.name === staff.name)
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      
      const lastLog = personLogs[0]; // Most recent action
      
      let status = "ABSENT";
      let timeLabel = "--:--";

      if (lastLog) {
        status = lastLog.type === "IN" ? "CHECKED_IN" : "CHECKED_OUT";
        timeLabel = lastLog.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Pending";
      }

      return { ...staff, status, lastAction: timeLabel };
    }).filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staffList, attendanceLogs, searchTerm]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest animate-pulse text-slate-400">Initializing_Secure_Terminal...</div>;

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
            <h1 className="text-sm font-black uppercase tracking-tight">Diamond_Fort</h1>
            <p className="text-[8px] text-slate-400 tracking-[0.3em]">ADMIN_NODE_01</p>
          </div>
          <nav className="flex-1 space-y-2">
            <button onClick={() => {setActiveTab("overview"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase transition-all ${activeTab === "overview" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"}`}>
              <LayoutDashboard size={14} /> Overview
            </button>
            <button onClick={() => {setActiveTab("attendance"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase transition-all ${activeTab === "attendance" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"}`}>
              <Calendar size={14} /> Attendance Register
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <UserPlus size={14} /> Enroll Staff
            </button>
          </nav>
          <button onClick={() => signOut(auth)} className="mt-auto flex items-center justify-center gap-2 p-4 text-red-500 text-[10px] font-bold uppercase border border-red-50 rounded-2xl bg-red-50/30 hover:bg-red-50 transition-all"><LogOut size={14}/> Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* REGISTER TAB */}
          {activeTab === "attendance" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Attendance_Register</h2>
                  <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-widest">Real-time Personnel Tracking</p>
                </div>
                <div className="flex gap-2">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                     <input 
                       type="text" 
                       placeholder="SEARCH NAME..." 
                       className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:outline-none focus:border-slate-400 w-full"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                   </div>
                   <input 
                     type="date" 
                     className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:outline-none"
                     value={filterDate}
                     onChange={(e) => setFilterDate(e.target.value)}
                   />
                </div>
              </header>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-8 py-5">Last Activity</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {registerData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-tight">{row.name}</td>
                        <td className="px-8 py-5 text-[10px] font-mono text-slate-400">{row.lastAction}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                            row.status === 'ABSENT' ? 'bg-red-50 text-red-500' : 
                            row.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600' : 
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {row.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Command_Interface</h2>
                  <p className="text-[10px] text-slate-400 uppercase mt-1">Operational Summary</p>
                </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active_Staff</span>
                  <div className="text-4xl font-black mt-2 text-slate-900">{staffList.length}</div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Present_Today</span>
                  <div className="text-4xl font-black mt-2 text-emerald-500">
                    {registerData.filter(r => r.status !== 'ABSENT').length}
                  </div>
                </div>
                <div onClick={() => setActiveTab("attendance")} className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform">
                   <Calendar size={24} className="text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest mt-4">View_Full_Register →</span>
                </div>
              </div>
            </div>
          )}

          {/* ENROLL TAB */}
          {activeTab === "enroll" && (
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