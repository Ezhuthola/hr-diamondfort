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
    if(confirm("Permanently remove this personnel?")) {
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs uppercase tracking-widest animate-pulse">Syncing_Data...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
          </div>
          
          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { id: 'attendance', icon: Clock, label: 'Registry' },
              { id: 'enroll', icon: UserPlus, label: 'Personnel' }
            ].map((item) => (
              <button key={item.id} onClick={() => {setActiveTab(item.id as any); setSelectedStaff(null); setIsMenuOpen(false)}} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? "bg-black text-white shadow-lg shadow-black/10" : "text-slate-500 hover:bg-slate-50"}`}>
                <item.icon size={18}/> {item.label}
              </button>
            ))}
          </nav>

          <button onClick={() => signOut(auth)} className="mt-4 px-5 py-4 text-red-600 text-[10px] font-black uppercase rounded-2xl bg-red-50 flex items-center gap-4 hover:bg-red-600 hover:text-white transition-all">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <span className="font-black text-xs uppercase tracking-widest text-slate-900">Control_Panel</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-100 rounded-xl text-slate-900">
          {isMenuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="mb-8">
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900">Operational_Pulse</h2>
                <div className="h-1 w-20 bg-black mt-2"></div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-48 lg:h-56">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total_Innovators</p>
                  <p className="text-6xl lg:text-7xl font-black text-slate-900">{staffList.length}</p>
                </div>
                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-48 lg:h-56">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently_On_Duty</p>
                  <p className="text-6xl lg:text-7xl font-black text-emerald-500">{masterSummary.filter(s => s.status === 'ON DUTY').length}</p>
                </div>
                <button onClick={() => setActiveTab("attendance")} className="bg-black p-8 lg:p-10 rounded-[2.5rem] text-white flex flex-col justify-between h-48 lg:h-56 hover:bg-slate-900 transition-all group">
                   <Clock className="text-emerald-400" size={32} />
                   <p className="text-xs font-black uppercase tracking-widest flex items-center justify-between">Registry_Audit <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform"/></p>
                </button>
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <header className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900 hover:bg-slate-50"><ArrowLeft size={20}/></button>}
                  <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900">{selectedStaff || "Workforce_Registry"}</h2>
                </div>
                {!selectedStaff && (
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                      <input type="date" max={today} className="flex-1 px-4 py-3 text-[10px] font-black uppercase bg-transparent" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <div className="w-px bg-slate-100 my-2"></div>
                      <input type="date" max={today} className="flex-1 px-4 py-3 text-[10px] font-black uppercase bg-transparent" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" placeholder="FILTER BY NAME..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                )}
              </header>

              <div className="grid grid-cols-1 gap-4">
                {(selectedStaff ? detailedView : masterSummary).map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && row.status !== "ABSENT" && setSelectedStaff(row.name)} 
                    className={`bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 shadow-sm transition-all ${!selectedStaff && row.status !== "ABSENT" ? "cursor-pointer active:scale-[0.98] hover:border-slate-400" : ""}`}>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{row.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.date}</p>
                      </div>
                      <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                        row.status === 'ON DUTY' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        row.status === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {row.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-6">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Check_In</p>
                        <p className="text-sm font-mono font-black text-slate-900">{row.inTime}</p>
                      </div>
                      <div className="space-y-1 border-x border-slate-100 px-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Check_Out</p>
                        <p className="text-sm font-mono font-black text-slate-900">
                          {row.outTime === "--:--" && row.status === 'ON DUTY' ? <span className="text-emerald-500 animate-pulse">ACTIVE</span> : row.outTime}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{selectedStaff ? "Session" : "Total_Hours"}</p>
                        <p className="text-sm font-mono font-black text-emerald-600">{row.workTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PERSONNEL MANAGEMENT */}
          {activeTab === "enroll" && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="max-w-xl mx-auto bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <EnrollForm />
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                    <Users size={24} /> Registered_Personnel
                  </h3>
                  <span className="bg-slate-100 text-[10px] font-black px-4 py-1.5 rounded-full">{staffList.length} TOTAL</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow group">
                      <div>
                        <p className="text-xs font-black uppercase tracking-tighter text-slate-900">{staff.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{staff.role || 'Innovator'}</p>
                      </div>
                      <button onClick={() => handleDeleteStaff(staff.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
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