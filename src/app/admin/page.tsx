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
      const logs = attendanceLogs
        .filter(l => l.name === staff.name)
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      
      const entryCount = logs.length;
      const hasIn = entryCount > 0;
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

          // Calculate Duration HH:mm
          const diffMs = (outLog.timestamp?.toDate().getTime() || 0) - (inLog.timestamp?.toDate().getTime() || 0);
          const totalMins = Math.floor(diffMs / 60000);
          const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
          const mins = (totalMins % 60).toString().padStart(2, '0');
          workTime = `${hrs}:${mins}`;
        } else {
          status = "WORKING";
        }
      }

      return { name: staff.name, inTime, outTime, workTime, status };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, attendanceLogs, searchTerm]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-mono">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing_Diamond_Fort...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-mono flex flex-col lg:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-slate-900" />
          <span className="font-black text-[11px] tracking-tighter uppercase">Diamond_Fort</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-50 rounded-lg">
          {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform duration-300 lg:relative lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="mb-12 hidden lg:block">
            <h1 className="font-black text-sm uppercase tracking-tight">Diamond_Fort</h1>
            <p className="text-[8px] text-slate-400 tracking-[0.4em] font-bold">MISSION_2K36_ADMIN</p>
          </div>

          <nav className="space-y-2 flex-1">
            <button onClick={() => {setActiveTab("attendance"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendance" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <Clock size={16}/> Register
            </button>
            <button onClick={() => {setActiveTab("enroll"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "enroll" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <UserPlus size={16}/> Enrollment
            </button>
            <button onClick={() => {setActiveTab("overview"); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}>
              <LayoutDashboard size={16}/> Dashboard
            </button>
          </nav>

          <button onClick={() => signOut(auth)} className="mt-8 p-4 text-red-500 text-[10px] font-black uppercase border border-red-50 rounded-2xl bg-red-50/50 flex items-center gap-2 justify-center">
            <LogOut size={16}/> Terminate
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {activeTab === "attendance" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Workforce_Registry</h2>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-2">Operational Chronology // {filterDate}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="FILTER NAME..." 
                    className="pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </header>

              <div className="space-y-4">
                {/* Desktop Labels */}
                <div className="hidden lg:grid grid-cols-6 px-10 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="col-span-2">Innovator</div>
                  <div>Check_In</div>
                  <div>Check_Out</div>
                  <div>Duration</div>
                  <div className="text-right">Status</div>
                </div>

                {registerData.map((row) => (
                  <div key={row.name} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:px-10 lg:py-6 shadow-sm">
                    <div className="grid grid-cols-2 lg:grid-cols-6 items-center gap-y-6 lg:gap-4">
                      
                      <div className="col-span-2 lg:col-span-2">
                        <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{row.name}</p>
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

                      {/* Work Duration Column */}
                      <div className="flex flex-col lg:block">
                        <span className={`text-[12px] font-mono font-black ${row.workTime ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {row.workTime || "--:--"}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase lg:hidden font-bold mt-1">Work_Duration</span>
                      </div>

                      <div className="col-span-1 lg:col-span-1 text-right">
                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          row.status === 'WORKING' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                          row.status === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
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

          {activeTab === "enroll" && <div className="max-w-3xl mx-auto"><EnrollForm /></div>}

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
               <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Innovators</p>
                  <p className="text-5xl font-black mt-2">{staffList.length}</p>
                </div>
                <Link href="/kiosk" className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between hover:scale-[1.03] transition-all">
                  <ExternalLink size={28} className="text-emerald-400" />
                  <p className="text-[11px] font-black uppercase tracking-widest mt-6">Open_Kiosk →</p>
                </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}