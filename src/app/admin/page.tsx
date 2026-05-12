"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
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
  ExternalLink,
  ShieldCheck
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
      // 1. Filter logs for this person and SORT ASCENDING (Chronological order)
      const logs = attendanceLogs
        .filter(l => l.name === staff.name)
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      
      const entryCount = logs.length;
      const hasIn = entryCount > 0;
      // Logical constraint: Even count = IN + OUT completed
      const isComplete = entryCount > 0 && entryCount % 2 === 0;

      let status = "ABSENT";
      let inTime = "--:--";
      let outTime = "--:--";
      let workTime = "";

      if (hasIn) {
        const inLog = logs[0];
        inTime = inLog.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (isComplete) {
          const outLog = logs[entryCount - 1];
          outTime = outLog.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          status = "OUT";

          // Calculate Duration between first IN and last OUT
          const diff = (outLog.timestamp?.toDate().getTime() || 0) - (inLog.timestamp?.toDate().getTime() || 0);
          const hrs = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          workTime = `${hrs}h ${mins}m`;
        } else {
          status = "WORKING";
        }
      }

      return { name: staff.name, inTime, outTime, workTime, status };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, attendanceLogs, searchTerm]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-mono space-y-4">
      <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing_Node_Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <div className="lg:hidden h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-slate-900" />
          <span className="font-black text-[11px] tracking-tighter uppercase">Diamond_Fort</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-50 rounded-lg">
          {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform duration-300 lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="mb-12 hidden lg:block">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-slate-900" />
              <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
            </div>
            <p className="text-[8px] text-slate-400 tracking-[0.4em] font-bold">MISSION_2K36_ADMIN</p>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'attendance', label: 'Register', icon: <Clock size={16}/> },
              { id: 'enroll', label: 'Enrollment', icon: <UserPlus size={16}/> },
              { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={16}/> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => {setActiveTab(tab.id as any); setIsMenuOpen(false)}} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-slate-100">
            <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 text-[10px] font-black uppercase border border-red-50 rounded-2xl bg-red-50/50 hover:bg-red-100 transition-all flex items-center gap-2 justify-center">
              <LogOut size={16}/> Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Command View */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* REGISTER VIEW */}
          {activeTab === "attendance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Workforce_Registry</h2>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-2">Operational Chronology // {filterDate}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text" 
                      placeholder="FILTER BY NAME..." 
                      className="w-full sm:w-64 pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black focus:outline-none focus:ring-2 ring-slate-100 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <input 
                    type="date" 
                    className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black focus:outline-none"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </header>

              <div className="space-y-4">
                {/* Header Labels (Desktop) */}
                <div className="hidden lg:grid grid-cols-6 px-10 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="col-span-2">Innovator</div>
                  <div>Arrival</div>
                  <div>Departure</div>
                  <div>Duration</div>
                  <div className="text-right">Status</div>
                </div>

                {registerData.map((row) => (
                  <div key={row.name} className="bg-white border border-slate-100 rounded-[2rem] p-6 lg:px-10 lg:py-6 shadow-sm hover:shadow-md transition-all">
                    <div className="grid grid-cols-2 lg:grid-cols-6 items-center gap-y-6 lg:gap-4">
                      
                      <div className="col-span-2 lg:col-span-2">
                        <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{row.name}</p>
                        <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-widest lg:hidden">Innovator Identity</p>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[12px] font-mono font-black text-slate-800">{row.inTime}</span>
                        <span className="text-[8px] text-slate-400 uppercase lg:hidden font-bold mt-1">Check_In</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[12px] font-mono font-black text-slate-800">
                          {row.outTime === "--:--" ? (row.status === 'WORKING' ? <span className="text-slate-300">PENDING</span> : "--:--") : row.outTime}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase lg:hidden font-bold mt-1">Check_Out</span>
                      </div>

                      <div className="hidden lg:block">
                        {row.workTime ? (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            {row.workTime}
                          </span>
                        ) : "--"}
                      </div>

                      <div className="col-span-2 lg:col-span-1 text-right">
                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          row.status === 'WORKING' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                          row.status === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {row.status === 'WORKING' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />}
                          {row.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Enrollment_Engine</h2>
                <button onClick={() => setActiveTab("attendance")} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">[ Exit_Module ]</button>
              </div>
              <div className="bg-white rounded-[3rem] border p-2 shadow-2xl overflow-hidden">
                <EnrollForm />
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Operational_Pulse</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
                  <Users className="mb-4 text-slate-300" size={24} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total_Innovators</p>
                  <p className="text-5xl font-black mt-2">{staffList.length}</p>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
                  <Clock className="mb-4 text-emerald-400" size={24} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active_Sessions</p>
                  <p className="text-5xl font-black mt-2 text-emerald-500">{registerData.filter(r => r.status === 'WORKING').length}</p>
                </div>
                <Link href="/kiosk" className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between hover:scale-[1.03] transition-all shadow-2xl shadow-slate-300">
                  <ExternalLink size={28} className="text-emerald-400" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] mt-6">Open_Biometric_Kiosk →</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}