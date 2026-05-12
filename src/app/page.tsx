import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      
      {/* Brand Header */}
      <div className="mb-14 text-center">
        <h1 className="text-2xl font-black tracking-tighter sm:text-3xl text-slate-900 border-b-2 border-blue-600 pb-1">
          HOTEL DIAMOND <span className="text-blue-600">FORT</span>
        </h1>
        <p className="mt-2 text-slate-500 font-bold uppercase tracking-[0.1em] text-[10px]">
          ATTENDANCE MANAGEMENT SYSTEM
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-6">
        
        {/* HR Dashboard - Emerald Green */}
        <Link 
          href="/admin"
          className="flex h-28 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(6,78,59,1)]"
        >
          <span className="text-xl font-bold tracking-tighter">HR DASHBOARD</span>
          <span className="text-[10px] text-emerald-100 uppercase font-mono mt-1">ACCESS CONTROL</span>
        </Link>

        {/* Attendance Kiosk - Royal Blue */}
        <Link 
          href="/kiosk"
          className="flex h-28 flex-col items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]"
        >
          <span className="text-xl font-bold tracking-tighter">ATTENDANCE KIOSK</span>
          <span className="text-[10px] text-blue-100 uppercase font-mono mt-1">BIOMETRIC SCAN</span>
        </Link>

      </div>

      {/* Footer Info */}
      <footer className="mt-20">
        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-2 border border-slate-100 px-4 py-2 rounded-full shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          SYST_READY // 192.168.1.8
        </div>
      </footer>
    </main>
  );
}