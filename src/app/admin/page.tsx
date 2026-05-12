"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import EnrollForm from "./EnrollForm"; 
import { 
  Menu, X, LayoutDashboard, UserPlus, LogOut, Calendar, Search, Clock, ArrowLeft, ShieldCheck, Briefcase
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

  // Master Logic: Expands logs into session rows
  const registerRows = useMemo(() => {
    const rows: any[] = [];
    
    staffList.forEach(staff => {
      const personLogs = attendanceLogs
        .filter(l => l.name === staff.name)
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

      if (personLogs.length === 0) {
        // Only show ABSENT if the range is a single day (today)
        if (fromDate === toDate) {
          rows.push({ name: staff.name, date: fromDate, inTime: "--:--", outTime: "--:--", workTime: "--:--", status: "ABSENT" });
        }
        return;
      }

      // Group logs by Date to handle multiple sessions in one day
      const logsByDate = personLogs.reduce((acc: any, log) => {
        if (!acc[log.date]) acc[log.date] = [];
        acc[log.date].push(log);
        return acc;
      }, {});

      Object.keys(logsByDate).forEach(date => {
        const dayLogs = logsByDate[date];
        for (let i = 0; i < dayLogs.length; i += 2) {
          const inLog = dayLogs[i];
          const outLog = dayLogs[i+1];
          
          let workTime = "--:--";
          let status = "ON DUTY";
          let outTimeStr = "--:--";

          if (outLog) {
            const diffMs = outLog.timestamp?.toDate().getTime() - inLog.timestamp?.toDate().getTime();
            const totalMins = Math.floor(diffMs / 60000);
            workTime = `${Math.floor(totalMins/60).toString().padStart(2,'0')}:${(totalMins%60).toString().padStart(2,'0')}`;
            outTimeStr = outLog.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false});
            status = "OUT";
          }

          rows.push({
            name: staff.name,
            date: date,
            inTime: inLog.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}),
            outTime: outTimeStr,
            workTime,
            status
          });
        }
      });
    });

    return rows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
               .sort((a, b) => b.date.localeCompare(a.date)); // Most recent date first
  }, [staffList, attendanceLogs, searchTerm, fromDate, toDate]);

  const displayData = selectedStaff ? registerRows.filter(r => r.name === selectedStaff) : registerRows;

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">Initialising_Protocol...</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-mono flex flex-col lg:flex-row">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
           <div className="mb-12 flex items-center gap-2">
            <ShieldCheck size={20} />
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
          </div>
          <nav className="space-y-2 flex-1">
            <button onClick={() => {setActiveTab("attendance"); setSelectedStaff(null); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendance" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400"}`}>
              <Clock size={16}/> Register
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400"}`}>
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
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={16}/></button>}
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{selectedStaff ? selectedStaff : "Workforce_Register"}</h2>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">RANGE: {fromDate} TO {toDate}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-1">
                    <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <input type="date" max={today} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="FILTER NAME..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </header>

              <div className="space-y-4">
                <div className="hidden lg:grid grid-cols-6 px-10 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div>Date</div><div>Personnel</div><div>In</div><div>Out</div><div>Work</div><div className="text-right">Status</div>
                </div>

                {displayData.map((row, idx) => (
                  <div key={idx} onClick={() => !selectedStaff && setSelectedStaff(row.name)} className={`bg-white border border-slate-100 rounded-[2.2rem] p-6 lg:px-10 lg:py-5 shadow-sm transition-all ${!selectedStaff ? "cursor-pointer hover:border-slate-300" : ""}`}>
                    <div className="grid grid-cols-2 lg:grid-cols-6 items-center gap-y-6 lg:gap-4">
                      <div>
                        <p className="text-[11px] font-black text-slate-900">{row.date}</p>
                        <p className="text-[7px] text-slate-400 uppercase lg:hidden font-bold">Log_Date</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tighter">{row.name}</p>
                        <p className="text-[7px] text-slate-400 uppercase lg:hidden font-bold">Innovator</p>
                      </div>
                      <div className="text-[12px] font-mono font-bold text-slate-600">{row.inTime}</div>
                      <div className="text-[12px] font-mono font-black text-slate-600">
                        {row.outTime === "--:--" ? (row.status === 'ON DUTY' ? <span className="text-emerald-500 animate-pulse">ACTIVE</span> : "--:--") : row.outTime}
                      </div>
                      <div className="text-[11px] font-mono font-black text-emerald-600">
                        {row.workTime}
                      </div>
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