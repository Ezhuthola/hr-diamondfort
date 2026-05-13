"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import EnrollForm from "./EnrollForm"; 
import { 
  LayoutDashboard, UserPlus, LogOut, Search, Clock, ArrowLeft, ShieldCheck, Activity, Users, ChevronRight, Trash2, Menu, X
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "enroll" | "attendance">("dashboard");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // DATE LOCK: Current Date calculation
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

  const handleDeleteStaff = async (id: string) => {
    if(confirm("Permanently remove this employee?")) {
      await deleteDoc(doc(db, "staff", id));
    }
  };

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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs uppercase tracking-widest animate-pulse">Establishing_Link...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="mb-12 flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
          </div>
          
          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { id: 'attendance', icon: Clock, label: 'Registry' },
              { id: 'enroll', icon: UserPlus, label: 'Employees' }
            ].map((item) => (
              <button key={item.id} onClick={() => {setActiveTab(item.id as any); setSelectedStaff(null); setIsMenuOpen(false)}} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? "bg-black text-white shadow-xl shadow-black/20" : "text-slate-500 hover:bg-slate-50"}`}>
                <item.icon size={20}/> {item.label}
              </button>
            ))}
          </nav>

          <button onClick={() => signOut(auth)} className="mt-4 px-6 py-4 text-red-600 text-[10px] font-black uppercase rounded-2xl bg-red-50 flex items-center gap-4 hover:bg-red-600 hover:text-white transition-all">
            <LogOut size={20}/> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
        <span className="font-black text-sm uppercase tracking-widest text-slate-900">Control_Panel</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 bg-slate-100 rounded-2xl text-slate-900">
          {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
              <header>
                <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900">Operational Pulse</h2>
                <div className="h-1.5 w-24 bg-black mt-4"></div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between h-56 lg:h-64">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total_Employees</p>
                  <p className="text-7xl lg:text-8xl font-black text-slate-900">{staffList.length}</p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between h-56 lg:h-64">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Currently_On_Duty</p>
                  <p className="text-7xl lg:text-8xl font-black text-emerald-500">{masterSummary.filter(s => s.status === 'ON DUTY').length}</p>
                </div>
                <button onClick={() => setActiveTab("attendance")} className="bg-black p-10 rounded-[3rem] text-white flex flex-col justify-between h-56 lg:h-64 hover:bg-slate-900 transition-all group md:col-span-2 xl:col-span-1">
                   <Clock className="text-emerald-400" size={40} />
                   <p className="text-sm font-black uppercase tracking-widest flex items-center justify-between">Registry_Audit <ChevronRight size={24} className="group-hover:translate-x-3 transition-transform"/></p>
                </button>
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="flex items-center gap-5">
                  {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm text-slate-900 hover:bg-slate-50"><ArrowLeft size={24}/></button>}
                  <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900">{selectedStaff || "Workforce_Registry"}</h2>
                </div>
                {!selectedStaff && (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex bg-white p-1.5 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto">
                      <input type="date" max={today} className="px-5 py-4 text-xs font-black uppercase bg-transparent" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <div className="w-px bg-slate-100 my-3"></div>
                      <input type="date" max={today} className="px-5 py-4 text-xs font-black uppercase bg-transparent" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="relative flex-1 md:w-80">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type="text" placeholder="FILTER NAME..." className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 shadow-sm rounded-3xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {(selectedStaff ? detailedView : masterSummary).map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && row.status !== "ABSENT" && setSelectedStaff(row.name)} 
                    className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 shadow-sm flex flex-col justify-between transition-all ${!selectedStaff && row.status !== "ABSENT" ? "cursor-pointer active:scale-[0.98] hover:border-black hover:shadow-xl" : ""}`}>
                    
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-2">
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{row.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.date}</p>
                      </div>
                      <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                        row.status === 'ON DUTY' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        row.status === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {row.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-10 border-t border-slate-100">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In</p>
                        <p className="text-base font-mono font-black text-slate-900">{row.inTime}</p>
                      </div>
                      <div className="space-y-2 border-x border-slate-100 px-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Out</p>
                        <p className="text-base font-mono font-black text-slate-900">
                          {row.outTime === "--:--" && row.status === 'ON DUTY' ? <span className="text-emerald-500 animate-pulse uppercase">Active</span> : row.outTime}
                        </p>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-base font-mono font-black text-emerald-600">{row.workTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPLOYEES MANAGEMENT */}
          {activeTab === "enroll" && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <EnrollForm />
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-4">
                    <Users size={32} /> Employee_List
                  </h3>
                  <span className="bg-black text-white text-xs font-black px-6 py-2 rounded-full">{staffList.length} TOTAL</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-black transition-all group">
                      <div>
                        <p className="text-sm font-black uppercase tracking-tighter text-slate-900">{staff.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{staff.role || 'Personnel'}</p>
                      </div>
                      <button onClick={() => handleDeleteStaff(staff.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}