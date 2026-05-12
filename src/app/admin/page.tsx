"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnrollForm from "./EnrollForm"; 
import { 
  Menu, X, LayoutDashboard, UserPlus, LogOut, Calendar, Search, Clock, ArrowLeft, ShieldCheck, ExternalLink, Users, Activity
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll" | "attendance">("attendance");
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

      sessions.push({
        name,
        date: inLog.date,
        inTime: inLog.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}),
        outTime: outTimeStr,
        workTime,
        status
      });
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">Accessing_Mission_Control...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* Sidebar - Restored Full Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
           <div className="mb-12 flex items-center gap-2">
            <ShieldCheck size={20} className="text-slate-900" />
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
          </div>
          
          <nav className="space-y-2 flex-1">
            <button onClick={() => {setActiveTab("overview"); setSelectedStaff(null); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <LayoutDashboard size={16}/> Overview
            </button>
            <button onClick={() => {setActiveTab("attendance"); setSelectedStaff(null); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendance" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <Clock size={16}/> Register
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <UserPlus size={16}/> Enrollment
            </button>
            
            <div className="pt-4 border-t border-slate-50">
              <Link href="/kiosk" className="w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all">
                <ExternalLink size={16}/> Open Kiosk
              </Link>
            </div>
          </nav>

          <button onClick={() => signOut(auth)} className="mt-8 p-4 text-red-500 text-[10px] font-black uppercase border border-red-50 rounded-2xl bg-red-50/50 flex items-center gap-2 justify-center hover:bg-red-100 transition-all">
            <LogOut size={16}/> Terminate
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Overview Tab - The Strategic Pulse */}
          {activeTab === "overview" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Operational_Pulse</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                  <Users className="mb-4 text-slate-300" size={24} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</p>
                  <p className="text-5xl font-black mt-2">{staffList.length}</p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                  <Activity className="mb-4 text-emerald-400" size={24} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On Duty Now</p>
                  <p className="text-5xl font-black mt-2 text-emerald-500">{masterSummary.filter(s => s.status === 'ON DUTY').length}</p>
                </div>
                <button onClick={() => setActiveTab("attendance")} className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between hover:scale-[1.02] transition-all">
                  <Clock size={28} className="text-emerald-400" />
                  <p className="text-[11px] font-black uppercase tracking-widest mt-6">Review Register →</p>
                </button>
              </div>
            </div>
          )}

          {/* Attendance Tab - (No changes to logic, just full restoration) */}
          {activeTab === "attendance" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={16}/></button>}
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{selectedStaff ? selectedStaff : "Master_Registry"}</h2>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">{fromDate} - {toDate}</p>
                </div>
                {!selectedStaff && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-1">
                      <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <input type="text" placeholder="FILTER..." className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                )}
              </header>

              <div className="space-y-4">
                <div className="hidden lg:grid grid-cols-6 px-10 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div>Date</div><div>Personnel</div><div>In</div><div>Out</div><div>{selectedStaff ? "Work" : "Total"}</div><div className="text-right">Status</div>
                </div>

                {(selectedStaff ? detailedView : masterSummary).map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && row.status !== "ABSENT" && setSelectedStaff(row.name)} className={`bg-white border border-slate-100 rounded-[2.2rem] p-6 lg:px-10 lg:py-5 shadow-sm transition-all ${!selectedStaff && row.status !== "ABSENT" ? "cursor-pointer hover:border-slate-300" : ""}`}>
                    <div className="grid grid-cols-2 lg:grid-cols-6 items-center gap-y-6 lg:gap-4">
                      <div><p className="text-[11px] font-black text-slate-900">{row.date}</p></div>
                      <div><p className="text-[13px] font-black text-slate-900 uppercase tracking-tighter">{row.name}</p></div>
                      <div className="text-[12px] font-mono font-bold text-slate-600">{row.inTime}</div>
                      <div className="text-[12px] font-mono font-black text-slate-600">
                        {row.outTime === "--:--" ? (row.status === 'ON DUTY' ? <span className="text-emerald-500 animate-pulse">ACTIVE</span> : "--:--") : row.outTime}
                      </div>
                      <div className="text-[11px] font-mono font-black text-emerald-600">{row.workTime}</div>
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
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

          {activeTab === "enroll" && <div className="max-w-2xl mx-auto"><EnrollForm /></div>}
        </div>
      </main>
    </div>
  );
}