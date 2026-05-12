"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
import { 
  Menu, X, LayoutDashboard, UserPlus, LogOut, Search, Clock, ArrowLeft, ShieldCheck, Activity, Users, ChevronRight
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "enroll" | "attendance">("dashboard");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

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

    const unsubAttend = onSnapshot(
      query(collection(db, "attendance"), 
      where("date", ">=", fromDate), 
      where("date", "<=", toDate)), 
      (snap) => {
        setAttendanceLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    return () => { unsubStaff(); unsubAttend(); };
  }, [fromDate, toDate]);

  // Shared Logic for processing time and status
  const processSessions = (name: string) => {
    const personLogs = attendanceLogs
      .filter(l => l.name === name)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

    const sessions: any[] = [];
    let totalMs = 0;

    for (let i = 0; i < personLogs.length; i += 2) {
      const inLog = personLogs[i];
      const outLog = personLogs[i + 1];
      let workTime = "--:--";
      let status = "ON DUTY";
      let outTimeStr = "--:--";

      if (outLog) {
        const diffMs = outLog.timestamp?.toDate().getTime() - inLog.timestamp?.toDate().getTime();
        totalMs += diffMs;
        const totalMins = Math.floor(diffMs / 60000);
        workTime = `${Math.floor(totalMins/60).toString().padStart(2,'0')}:${(totalMins%60).toString().padStart(2,'0')}`;
        outTimeStr = outLog.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false});
        status = "OUT";
      }

      if(inLog) {
        sessions.push({
          name,
          date: inLog.date,
          inTime: inLog.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}),
          outTime: outTimeStr,
          workTime,
          status
        });
      }
    }

    const totalMins = Math.floor(totalMs / 60000);
    const cumulativeTime = `${Math.floor(totalMins/60).toString().padStart(2,'0')}:${(totalMins%60).toString().padStart(2,'0')}`;
    return { sessions, cumulativeTime };
  };

  const masterSummary = useMemo(() => {
    return staffList.map(staff => {
      const { sessions, cumulativeTime } = processSessions(staff.name);
      if (sessions.length === 0) return { name: staff.name, date: fromDate, inTime: "--:--", outTime: "--:--", workTime: "00:00", status: "ABSENT" };
      const latest = sessions[sessions.length - 1];
      return { ...latest, workTime: cumulativeTime };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, attendanceLogs, searchTerm, fromDate, toDate]);

  const detailedView = useMemo(() => {
    if (!selectedStaff) return [];
    const { sessions } = processSessions(selectedStaff);
    return [...sessions].reverse();
  }, [selectedStaff, attendanceLogs]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest animate-pulse">Establishing_Secure_Link...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-black text-[12px] uppercase tracking-tighter">Diamond_Fort</h1>
              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Admin_Control</p>
            </div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            <button onClick={() => {setActiveTab("dashboard"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "dashboard" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <LayoutDashboard size={16}/> Dashboard
            </button>
            <button onClick={() => {setActiveTab("attendance"); setSelectedStaff(null); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendance" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <Clock size={16}/> Attendance
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <UserPlus size={16}/> Enrollment
            </button>
          </nav>

          <button onClick={() => signOut(auth)} className="mt-8 px-5 py-4 text-red-500 text-[10px] font-black uppercase border border-red-50 rounded-2xl bg-red-50/50 flex items-center gap-4 hover:bg-red-500 hover:text-white transition-all group">
            <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-500"/> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-40">
        <span className="font-black text-[10px] uppercase tracking-widest">Mission_Control</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-50 rounded-lg">
          {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      <main className="flex-1 p-6 lg:p-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* DASHBOARD TAB (DEFAULT) */}
          {activeTab === "dashboard" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header>
                <h2 className="text-5xl font-black uppercase tracking-tighter">Strategic_Overview</h2>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-[0.3em] mt-3">Mission 2K36 // Live Operations</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <Users className="text-slate-200 mb-6" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total_Innovators</p>
                  <p className="text-6xl font-black mt-2 text-slate-900">{staffList.length}</p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <Activity className="text-emerald-400 mb-6" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Currently_On_Duty</p>
                  <p className="text-6xl font-black mt-2 text-emerald-500">{masterSummary.filter(s => s.status === 'ON DUTY').length}</p>
                </div>
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab("attendance")}>
                   <Clock className="text-emerald-400 group-hover:rotate-12 transition-transform" size={32} />
                   <div>
                    <p className="text-[11px] font-black uppercase tracking-widest">Go to Register</p>
                    <ChevronRight className="mt-2 group-hover:translate-x-2 transition-transform" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === "attendance" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                  {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-3 bg-white border shadow-sm rounded-2xl hover:bg-slate-50"><ArrowLeft size={18}/></button>}
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{selectedStaff || "Attendance_Register"}</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Audit Mode: {fromDate} → {toDate}</p>
                  </div>
                </div>
                {!selectedStaff && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-1 bg-white p-1 rounded-2xl border shadow-sm">
                      <input type="date" max={today} className="px-3 py-2 bg-transparent text-[10px] font-black uppercase" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <div className="flex items-center text-slate-300 px-1">—</div>
                      <input type="date" max={today} className="px-3 py-2 bg-transparent text-[10px] font-black uppercase" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="text" placeholder="SEARCH PERSONNEL..." className="pl-10 pr-6 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-[10px] font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                )}
              </header>

              <div className="space-y-4">
                <div className="hidden lg:grid grid-cols-6 px-12 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  <div>Date</div><div>Innovator</div><div>In_Time</div><div>Out_Time</div><div>{selectedStaff ? "Duration" : "Total_Hours"}</div><div className="text-right">Status</div>
                </div>

                {(selectedStaff ? detailedView : masterSummary).map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && row.status !== "ABSENT" && setSelectedStaff(row.name)} className={`bg-white border border-slate-50 rounded-[2.5rem] p-6 lg:px-12 lg:py-6 shadow-sm transition-all ${!selectedStaff && row.status !== "ABSENT" ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : ""}`}>
                    <div className="grid grid-cols-2 lg:grid-cols-6 items-center gap-y-6 lg:gap-4">
                      <div className="text-[11px] font-black text-slate-900">{row.date}</div>
                      <div className="text-[13px] font-black text-slate-900 uppercase tracking-tighter">{row.name}</div>
                      <div className="text-[12px] font-mono font-bold text-slate-600">{row.inTime}</div>
                      <div className="text-[12px] font-mono font-black text-slate-600">
                        {row.outTime === "--:--" ? (row.status === 'ON DUTY' ? <span className="text-emerald-500 animate-pulse">ACTIVE</span> : "--:--") : row.outTime}
                      </div>
                      <div className="text-[11px] font-mono font-black text-emerald-600">{row.workTime}</div>
                      <div className="text-right">
                        <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          row.status === 'ON DUTY' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          row.status === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENROLLMENT TAB */}
          {activeTab === "enroll" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
              <EnrollForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}