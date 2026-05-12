"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import EnrollForm from "./EnrollForm"; 
import { 
  Menu, X, LayoutDashboard, UserPlus, LogOut, Search, Clock, ArrowLeft, ShieldCheck, Activity, Users, ChevronRight, Trash2
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
    if(confirm("Permanently remove this innovator from the registry?")) {
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest animate-pulse">Establishing_Link...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-10 flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white"><ShieldCheck size={18} /></div>
            <h1 className="font-black text-xs uppercase tracking-tighter">Diamond_Fort</h1>
          </div>
          
          <nav className="space-y-1 flex-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { id: 'attendance', icon: Clock, label: 'Register' },
              { id: 'enroll', icon: UserPlus, label: 'Personnel' }
            ].map((item) => (
              <button key={item.id} onClick={() => {setActiveTab(item.id as any); setSelectedStaff(null); setIsMenuOpen(false)}} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? "bg-black text-white" : "text-slate-400 hover:bg-slate-50"}`}>
                <item.icon size={16}/> {item.label}
              </button>
            ))}
          </nav>

          <button onClick={() => signOut(auth)} className="mt-4 px-4 py-3 text-red-500 text-[10px] font-black uppercase rounded-xl bg-red-50 flex items-center gap-3 hover:bg-red-500 hover:text-white transition-all">
            <LogOut size={16}/> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE NAV TOGGLE */}
      <div className="lg:hidden h-14 bg-white border-b px-5 flex items-center justify-between sticky top-0 z-40">
        <span className="font-black text-[9px] uppercase tracking-widest">Mission_Control</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 bg-slate-100 rounded-lg">
          {isMenuOpen ? <X size={18}/> : <Menu size={18}/>}
        </button>
      </div>

      <main className="flex-1 p-5 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">Strategic_Pulse</h2>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Live Operational Data</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between h-40">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Innovators</p>
                  <p className="text-5xl font-black">{staffList.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between h-40">
                  <p className="text-[9px] font-black text-slate-400 uppercase">On Duty</p>
                  <p className="text-5xl font-black text-emerald-500">{masterSummary.filter(s => s.status === 'ON DUTY').length}</p>
                </div>
                <button onClick={() => setActiveTab("attendance")} className="bg-black p-8 rounded-[2rem] text-white flex flex-col justify-between h-40 hover:scale-[1.02] transition-all group">
                   <Clock className="text-emerald-400" size={24} />
                   <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Register <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/></p>
                </button>
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <header className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-2 bg-white border rounded-full"><ArrowLeft size={16}/></button>}
                  <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">{selectedStaff || "Workforce_Registry"}</h2>
                </div>
                {!selectedStaff && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex bg-white p-1 rounded-xl border shadow-sm">
                      <input type="date" max={today} className="flex-1 px-3 py-2 text-[9px] font-black bg-transparent" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <input type="date" max={today} className="flex-1 px-3 py-2 text-[9px] font-black bg-transparent border-l" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="text" placeholder="FILTER NAME..." className="w-full pl-10 pr-4 py-3 bg-white border shadow-sm rounded-xl text-[9px] font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                )}
              </header>

              <div className="grid grid-cols-1 gap-3">
                {(selectedStaff ? detailedView : masterSummary).map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && row.status !== "ABSENT" && setSelectedStaff(row.name)} 
                    className={`bg-white border rounded-[1.5rem] p-5 shadow-sm transition-all ${!selectedStaff && row.status !== "ABSENT" ? "cursor-pointer active:scale-95" : ""}`}>
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-1">{row.name}</p>
                        <p className="text-[8px] font-bold text-slate-400">{row.date}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase border ${row.status === 'ON DUTY' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400'}`}>
                        {row.status}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 mt-5 border-t pt-4">
                      <div className="text-center border-r">
                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">In</p>
                        <p className="text-[10px] font-mono font-bold">{row.inTime}</p>
                      </div>
                      <div className="text-center border-r">
                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Out</p>
                        <p className="text-[10px] font-mono font-bold">{row.outTime === "--:--" && row.status === 'ON DUTY' ? 'ACTIVE' : row.outTime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">{selectedStaff ? "Work" : "Total"}</p>
                        <p className="text-[10px] font-mono font-black text-emerald-600">{row.workTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENROLLMENT & LIST */}
          {activeTab === "enroll" && (
            <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
              <div className="max-w-xl mx-auto"><EnrollForm /></div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Users size={20} /> Registered_Personnel
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="bg-white p-5 rounded-2xl border flex items-center justify-between group">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tighter">{staff.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{staff.role || 'Innovator'}</p>
                      </div>
                      <button onClick={() => handleDeleteStaff(staff.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
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