"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added back for the Link components
import EnrollForm from "./EnrollForm"; // CRITICAL: This was missing in the last snippet
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  UserPlus, 
  LogOut, 
  Users, 
  Calendar, 
  Search, 
  Clock, 
  ExternalLink 
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll" | "attendance">("attendance");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setLoading(false);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    const unsubStaff = onSnapshot(query(collection(db, "staff"), orderBy("name", "asc")), (snap) => {
      setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAttend = onSnapshot(query(collection(db, "attendance"), where("date", "==", filterDate)), (snap) => {
      setAttendanceLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubStaff(); unsubAttend(); };
  }, [filterDate]);

  const registerData = useMemo(() => {
    return staffList.map(staff => {
      const logs = attendanceLogs
        .filter(l => l.name === staff.name)
        .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
      
      const checkIn = logs.find(l => l.type === "IN");
      const checkOut = logs.find(l => l.type === "OUT");

      let status = "ABSENT";
      let workTime = "";

      if (checkIn && !checkOut) status = "ON WORK";
      else if (checkIn && checkOut) {
        status = "OUT";
        const diff = (checkOut.timestamp?.toDate().getTime() || 0) - (checkIn.timestamp?.toDate().getTime() || 0);
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        workTime = `${hrs}h ${mins}m`;
      }

      return {
        name: staff.name,
        inTime: checkIn ? checkIn.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "--:--",
        outTime: checkOut ? checkOut.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "--:--",
        workTime,
        status
      };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, attendanceLogs, searchTerm]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] tracking-widest">INITIALIZING_SECURE_SESSION...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-14 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-50">
        <span className="font-black text-[10px] tracking-widest uppercase">Diamond_Fort</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={18}/> : <Menu size={18}/>}</button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="mb-10 hidden lg:block">
            <h1 className="font-black text-sm uppercase">Diamond_Fort</h1>
            <p className="text-[8px] text-slate-400 tracking-widest">MISSION_2K36</p>
          </div>
          <nav className="space-y-1 flex-1">
            {[
              { id: 'attendance', label: 'Register', icon: <Clock size={14}/> },
              { id: 'enroll', label: 'Enroll Staff', icon: <UserPlus size={14}/> },
              { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={14}/> }
            ].map(tab => (
              <button key={tab.id} onClick={() => {setActiveTab(tab.id as any); setIsMenuOpen(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-slate-100">
             <button onClick={() => signOut(auth)} className="w-full p-3 text-red-500 text-[10px] font-bold uppercase border border-red-50 rounded-xl bg-red-50/50 flex items-center gap-2 justify-center"><LogOut size={14}/> Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Attendance_Register</h2>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Live_Workforce_Manifest</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input type="text" placeholder="SEARCH..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <input type="date" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
              </header>

              <div className="space-y-3">
                <div className="hidden lg:grid grid-cols-5 px-6 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <div>Personnel</div><div>In_Time</div><div>Out_Time</div><div>Work_Time</div><div className="text-right">Status</div>
                </div>

                {registerData.map((row) => (
                  <div key={row.name} className="bg-white border border-slate-100 rounded-2xl p-5 lg:px-6 lg:py-4 shadow-sm">
                    <div className="grid grid-cols-2 lg:grid-cols-5 items-center gap-4">
                      <div className="col-span-2 lg:col-span-1">
                        <p className="text-[11px] font-black uppercase text-slate-900">{row.name}</p>
                        <p className="text-[8px] text-slate-400 uppercase lg:hidden mt-1 font-bold">Innovator</p>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-slate-600">{row.inTime}</div>
                      <div className="text-[10px] font-mono font-bold text-slate-600">{row.outTime}</div>
                      <div className="hidden lg:block text-[10px] font-bold text-emerald-600">{row.workTime || (row.status === 'ON WORK' ? 'ACTIVE' : '--')}</div>
                      <div className="col-span-2 lg:col-span-1 text-right">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          row.status === 'ON WORK' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                          row.status === 'OUT' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        }`}>{row.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8 flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Enroll_Module</h2>
                <button onClick={() => setActiveTab("attendance")} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">[ Cancel ]</button>
              </header>
              <div className="bg-white rounded-[2.5rem] border p-2 shadow-xl overflow-hidden">
                <EnrollForm />
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-2xl font-black uppercase tracking-tighter">System_Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Personnel_Count</p>
                  <p className="text-4xl font-black">{staffList.length}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">On_Work_Today</p>
                  <p className="text-4xl font-black text-emerald-500">{registerData.filter(r => r.status !== 'ABSENT').length}</p>
                </div>
                <Link href="/kiosk" className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <ExternalLink size={20} className="text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Go_To_Kiosk_Node →</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}