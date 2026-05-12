"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import EnrollForm from "./EnrollForm"; 
import { 
  Menu, X, LayoutDashboard, UserPlus, LogOut, Calendar, Search, Clock, ArrowLeft, ShieldCheck
} from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "enroll" | "attendance">("attendance");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Date Range Defaults
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

    // Load data within date range
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

  // helper to format duration HH:mm
  const formatDuration = (ms: number) => {
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const mins = (totalMins % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}`;
  };

  // Main Registry Logic (Aggregated by Person)
  const registerSummary = useMemo(() => {
    return staffList.map(staff => {
      const personLogs = attendanceLogs
        .filter(l => l.name === staff.name)
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

      let totalMs = 0;
      let status = "ABSENT";
      let lastIn = "--:--";
      let lastOut = "--:--";

      // Process in pairs for multiple sessions per day
      for (let i = 0; i < personLogs.length; i += 2) {
        const inLog = personLogs[i];
        const outLog = personLogs[i + 1];
        
        if (inLog) {
          lastIn = inLog.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          status = "WORKING";
        }
        if (outLog) {
          lastOut = outLog.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          totalMs += (outLog.timestamp?.toDate().getTime() - inLog.timestamp?.toDate().getTime());
          status = "OUT";
        }
      }

      return { 
        name: staff.name, 
        totalHours: formatDuration(totalMs), 
        status, 
        lastIn, 
        lastOut,
        rawLogs: personLogs // for drill-down
      };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, attendanceLogs, searchTerm]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">Initialising_Protocol...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* Sidebar (Existing logic remains) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
           <div className="mb-12 flex items-center gap-2">
            <ShieldCheck size={20} />
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
          </div>
          <nav className="space-y-2 flex-1">
            <button onClick={() => {setActiveTab("attendance"); setSelectedStaff(null); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendance" ? "bg-slate-900 text-white" : "text-slate-400"}`}>
              <Clock size={16}/> Register
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white" : "text-slate-400"}`}>
              <UserPlus size={16}/> Enrollment
            </button>
          </nav>
          <button onClick={() => signOut(auth)} className="p-4 text-red-500 text-[10px] font-black uppercase border border-red-50 rounded-2xl bg-red-50/50"><LogOut size={16}/></button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {activeTab === "attendance" && (
            <div className="space-y-8">
              {!selectedStaff ? (
                <>
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter">Registry_Overview</h2>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Active Range: {fromDate} to {toDate}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex gap-1">
                        <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                      <input type="text" placeholder="FILTER..." className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </header>

                  <div className="grid grid-cols-1 gap-4">
                    {registerSummary.map((row) => (
                      <div key={row.name} onClick={() => setSelectedStaff(row.name)} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:border-slate-400 cursor-pointer transition-all">
                        <div className="grid grid-cols-2 lg:grid-cols-5 items-center">
                          <div className="col-span-2 lg:col-span-1"><p className="text-sm font-black uppercase">{row.name}</p></div>
                          <div className="text-[12px] font-mono font-bold text-slate-400 lg:block hidden">IN: {row.lastIn}</div>
                          <div className="text-[12px] font-mono font-bold text-slate-400 lg:block hidden">OUT: {row.lastOut}</div>
                          <div className="text-[12px] font-mono font-black text-emerald-600">{row.totalHours}</div>
                          <div className="text-right">
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${row.status === 'WORKING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{row.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="animate-in slide-in-from-left-4 duration-500 space-y-8">
                   <button onClick={() => setSelectedStaff(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={14}/> Back to Master Register
                   </button>
                   
                   <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter">{selectedStaff}</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Individual Session Report</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Total_Time_InRange</p>
                        <p className="text-3xl font-black text-emerald-500">{registerSummary.find(s => s.name === selectedStaff)?.totalHours}</p>
                      </div>
                   </div>

                   <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-10 py-6">Date</th>
                            <th className="px-10 py-6">Check In</th>
                            <th className="px-10 py-6">Check Out</th>
                            <th className="px-10 py-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {attendanceLogs
                            .filter(l => l.name === selectedStaff)
                            .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                            .map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6 text-[11px] font-black text-slate-900 uppercase">{log.date}</td>
                              <td className="px-10 py-6 text-[11px] font-mono font-bold text-slate-500">{log.type === 'IN' ? log.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) : '--'}</td>
                              <td className="px-10 py-6 text-[11px] font-mono font-bold text-slate-500">{log.type === 'OUT' ? log.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) : '--'}</td>
                              <td className="px-10 py-6 text-right">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {log.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "enroll" && <EnrollForm />}
        </div>
      </main>
    </div>
  );
}