import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, FileText, Map as MapIcon, LayoutDashboard, 
  Menu, X, Calendar, BarChart, Book, MessageCircle, 
  GraduationCap, FileCheck, Database, ShieldCheck, LogOut,
  Compass, Search, Bell, Sun, Moon
} from 'lucide-react';
import { useFirebase } from '../FirebaseProvider';
import { useTheme } from '../ThemeProvider';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const { user, loading, role } = useFirebase();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const sideNavItems = [
    { name: 'Agenda', icon: Calendar, path: '/agenda', color: 'text-orange-400' },
    { name: 'Al-Quran', icon: Book, path: '/alquran', color: 'text-emerald-400' },
    { name: 'Perpustakaan AI', icon: Search, path: '/ai', color: 'text-blue-400' },
    { name: 'Chat E2EE', icon: MessageCircle, path: '/chat', color: 'text-indigo-400' },
    { name: 'Kaderisasi', icon: GraduationCap, path: '/pengembangan-kader', color: 'text-violet-400' },
    { name: 'Beasiswa', icon: FileCheck, path: '/beasiswa', color: 'text-yellow-400' },
    { name: 'Template Surat', icon: FileText, path: '/template-surat', color: 'text-pink-400' },
    { name: 'Kas & Inventaris', icon: Database, path: '/kas-inventaris', color: 'text-teal-400' },
    { name: 'Surat Masuk', icon: FileText, path: '/surat-masuk', color: 'text-indigo-400' },
    { name: 'Surat Keluar', icon: FileText, path: '/surat-keluar', color: 'text-rose-400' },
    { name: 'Kunjungan', icon: Compass, path: '/kunjungan', color: 'text-amber-400' },
    { name: 'Database Pimpinan', icon: Database, path: '/database-pimpinan', color: 'text-emerald-400' },
    ...(role === 'admin' ? [
      { name: 'Admin Panel', icon: ShieldCheck, path: '/admin-users', color: 'text-red-400' },
    ] : []),
  ];

  const bottomNavItems = [
    { name: 'Beranda', icon: Home, path: '/', color: 'text-emerald-400' },
    { name: 'Anggota', icon: Users, path: '/anggota', color: 'text-blue-400' },
    { name: 'Visitasi', icon: Compass, path: '/visitasi', color: 'text-amber-400' },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/laporan', color: 'text-pink-400' },
    ...(role === 'admin' ? [
      { name: 'Master PK', icon: Database, path: '/admin/pk', color: 'text-teal-400' },
    ] : []),
  ];

  return (
    <div className={cn(
      "min-h-screen flex overflow-hidden transition-colors duration-500",
      theme === 'dark' ? "bg-black text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Desktop Persistent Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col w-72 p-8 shadow-2xl z-50 border-r transition-colors duration-500",
        theme === 'dark' ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"
      )}>
        <div className="flex flex-col mb-10">
          <h1 className={cn(
            "text-2xl font-black tracking-tighter leading-none transition-colors",
            theme === 'dark' ? "text-white" : "text-zinc-900"
          )}>CARUBAN</h1>
          <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase">Core Platform</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 -mx-2 px-2">
          <div className="mb-6">
            <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Main Menu</h3>
            <div className="space-y-1">
              {[...bottomNavItems, ...sideNavItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl transition-all group border",
                    isActive(item.path) 
                      ? (theme === 'dark' ? "bg-zinc-900 text-white border-zinc-800 shadow-lg" : "bg-zinc-100 text-zinc-900 border-zinc-200 shadow-md")
                      : "text-zinc-500 border-transparent hover:bg-zinc-900/50 hover:text-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      isActive(item.path) ? (theme === 'dark' ? "bg-zinc-800" : "bg-white shadow-sm") : "bg-transparent"
                    )}>
                      <item.icon size={18} className={cn(
                        "transition-transform group-active:scale-90",
                        isActive(item.path) ? (item.color || "text-emerald-400") : "text-zinc-600 group-hover:text-zinc-400"
                      )} />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  </div>
                  {isActive(item.path) && (
                    <motion.div layoutId="active-indicator-desktop" className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(
          "mt-auto pt-6 border-t transition-colors",
          theme === 'dark' ? "border-zinc-900" : "border-zinc-200"
        )}>
          <button 
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-4 p-4 w-full rounded-2xl mb-2 transition-all group border",
              theme === 'dark' ? "text-zinc-400 border-zinc-900 hover:bg-zinc-900" : "text-zinc-600 border-zinc-200 hover:bg-zinc-100"
            )}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-black text-sm uppercase tracking-widest">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <div className={cn(
            "flex items-center gap-4 p-4 mb-4 rounded-3xl border transition-colors",
            theme === 'dark' ? "bg-zinc-900/50 border-zinc-900" : "bg-zinc-100 border-zinc-200"
          )}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Role</span>
              <span className="text-xs font-bold text-white">{role || 'Anggota'}</span>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-4 p-4 w-full rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-black text-sm uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <div className={cn(
        "flex-1 flex flex-col relative min-h-screen transition-colors duration-500",
        theme === 'dark' ? "bg-zinc-950" : "bg-white"
      )}>
        
        {/* Futuristic Header */}
        <header className={cn(
          "sticky top-0 backdrop-blur-xl border-b p-4 flex justify-between items-center z-40 transition-colors duration-500",
          theme === 'dark' ? "bg-zinc-950/80 border-zinc-900" : "bg-white/80 border-zinc-200"
        )}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSideNavOpen(true)}
              className={cn(
                "lg:hidden p-2.5 rounded-2xl transition-all active:scale-90 border",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              )}
            >
              <Menu size={20} className="text-emerald-400" />
            </button>
            <div className="flex flex-col">
              <h1 className={cn(
                "text-lg font-black tracking-tighter leading-none transition-colors",
                theme === 'dark' ? "text-white" : "text-zinc-900"
              )}>CARUBAN</h1>
              <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase">Core Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2.5 rounded-2xl transition-all border lg:hidden",
                theme === 'dark' ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200"
              )}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className={cn(
              "p-2.5 rounded-2xl relative border transition-all",
              theme === 'dark' ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200"
            )}>
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
            </button>
            <Link to="/pengaturan" className="p-1 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg shadow-emerald-500/20">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-xl object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Morphing Side Navigation */}
        <AnimatePresence>
          {isSideNavOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSideNavOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%', skewX: 10 }}
                animate={{ x: 0, skewX: 0 }}
                exit={{ x: '-100%', skewX: -10 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-zinc-950 border-r border-zinc-900 z-[60] p-8 flex flex-col shadow-2xl lg:hidden"
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Navigation</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter">EXPLORE</h2>
                  </div>
                  <button 
                    onClick={() => setIsSideNavOpen(false)}
                    className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 border border-zinc-800 active:scale-90 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 -mx-2 px-2">
                  <div className="mb-6">
                    <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Fitur Ekstra</h3>
                    <div className="space-y-1">
                      {sideNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSideNavOpen(false)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl transition-all group border",
                            isActive(item.path) 
                              ? "bg-zinc-900 text-white border-zinc-800 shadow-lg" 
                              : "text-zinc-500 border-transparent hover:bg-zinc-900/50 hover:text-zinc-300"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                              isActive(item.path) ? "bg-zinc-800" : "bg-transparent"
                            )}>
                              <item.icon size={20} className={cn(
                                "transition-transform group-active:scale-90",
                                isActive(item.path) ? item.color : "text-zinc-600 group-hover:text-zinc-400"
                              )} />
                            </div>
                            <span className="font-bold text-sm tracking-tight">{item.name}</span>
                          </div>
                          {isActive(item.path) && (
                            <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-zinc-900">
                  <div className="flex items-center gap-4 p-4 mb-4 bg-zinc-900/50 rounded-3xl border border-zinc-900">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Role</span>
                      <span className="text-xs font-bold text-white">{role || 'Anggota'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-4 p-4 w-full rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group"
                  >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-black text-sm uppercase tracking-widest">Logout</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ 
                  type: 'spring',
                  damping: 25,
                  stiffness: 200,
                  duration: 0.4 
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t flex justify-around items-center p-3 pb-safe z-40 transition-colors duration-500",
          theme === 'dark' ? "bg-zinc-950/80 border-zinc-900" : "bg-white/80 border-zinc-200"
        )}>
          {bottomNavItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={cn(
                "relative flex flex-col items-center gap-1 transition-all duration-300",
                isActive(item.path) ? "text-emerald-400 scale-110" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {isActive(item.path) && (
                <motion.div 
                  layoutId="bottomNavGlow"
                  className="absolute -top-3 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              )}
              <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter",
                isActive(item.path) ? "opacity-100" : "opacity-60"
              )}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
