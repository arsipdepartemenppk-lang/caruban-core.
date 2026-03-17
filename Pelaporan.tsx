import React, { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { useTheme } from '../components/ThemeProvider';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Users, FileText, Compass, Activity, Database, Calendar, GraduationCap, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Pelaporan: React.FC = () => {
  const { db } = useFirebase();
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState([
    { name: 'Anggota', count: 0, color: '#10b981', icon: Users, coll: 'members' },
    { name: 'S. Masuk', count: 0, color: '#6366f1', icon: FileText, coll: 'suratMasuk' },
    { name: 'S. Keluar', count: 0, color: '#f43f5e', icon: FileText, coll: 'suratKeluar' },
    { name: 'Visitasi', count: 0, color: '#f59e0b', icon: Compass, coll: 'visitasis' },
    { name: 'Pimpinan', count: 0, color: '#8b5cf6', icon: Users, coll: 'pimpinan' },
    { name: 'Master PK', count: 0, color: '#0ea5e9', icon: Database, coll: 'pks' },
    { name: 'Agenda', count: 0, color: '#f97316', icon: Calendar, coll: 'agendas' },
    { name: 'Kaderisasi', count: 0, color: '#ec4899', icon: GraduationCap, coll: 'kaderisasi' },
  ]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!db) return;

    const unsubscribes = stats.map((stat, index) => {
      return onSnapshot(collection(db, stat.coll), (snapshot) => {
        setStats(prev => {
          return prev.map((s, i) => {
            if (i === index) {
              return { ...s, count: snapshot.size };
            }
            return s;
          });
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "p-4 pb-24 min-h-screen font-sans transition-colors duration-500",
      isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      <div className="mb-12 pt-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">PELAPORAN</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Visualisasi Data Real-time</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
          isOnline 
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
        )}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={stat.name}
            className={cn(
              "border rounded-[32px] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all",
              isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
              style={{ backgroundColor: stat.color }}
            />
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/5"
              style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
            >
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.name}</p>
            <p className="text-3xl font-black tabular-nums tracking-tighter">{stat.count}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Bar Chart: Overview */}
        <div className={cn(
          "border rounded-[40px] p-8 relative overflow-hidden transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-black tracking-tight">Ringkasan Data</h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live Data</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#52525b' : '#a1a1aa', fontSize: 10, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#52525b' : '#a1a1aa', fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip 
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#09090b' : '#ffffff', 
                    border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[12, 12, 4, 4]} 
                  barSize={40}
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Distribution */}
        <div className={cn(
          "border rounded-[40px] p-8 relative overflow-hidden transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <h2 className="text-xl font-black tracking-tight mb-10">Distribusi Kelompok</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#09090b' : '#ffffff', 
                    border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {stats.map((s) => (
              <div key={s.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[8px] font-black text-zinc-500 uppercase truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Area Chart: Activity Volume */}
        <div className={cn(
          "lg:col-span-2 border rounded-[40px] p-8 relative overflow-hidden transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <h2 className="text-xl font-black tracking-tight mb-10">Volume Aktivitas</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Growth Trend */}
        <div className={cn(
          "border rounded-[40px] p-8 relative overflow-hidden transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <h2 className="text-xl font-black tracking-tight mb-10">Tren Pertumbuhan</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Line type="step" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={cn(
          "border rounded-[32px] p-6 flex items-center justify-between transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Aktivitas Terdaftar</p>
              <p className="text-lg font-black">{stats.reduce((acc, curr) => acc + curr.count, 0)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12%</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Bulan ini</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pelaporan;
