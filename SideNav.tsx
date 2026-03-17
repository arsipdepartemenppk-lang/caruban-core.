import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Compass, FileText, Calendar, 
  BarChart, Database, Shield, Settings, 
  MessageCircle, BookOpen, GraduationCap, 
  Award, Layers, LogOut, Menu, X, ChevronRight,
  Wallet, Box, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase } from './FirebaseProvider';
import { auth } from '../firebase';

const SideNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user, role } = useFirebase();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Beranda', path: '/', color: 'text-emerald-500' },
    { icon: MessageCircle, label: 'Chat Koordinasi', path: '/chat', color: 'text-blue-500' },
    { icon: Users, label: 'Data Anggota', path: '/anggota', color: 'text-purple-500' },
    { icon: Compass, label: 'Data Visitasi', path: '/visitasi', color: 'text-amber-500' },
    { icon: FileText, label: 'Surat Masuk', path: '/surat-masuk', color: 'text-indigo-500' },
    { icon: FileText, label: 'Surat Keluar', path: '/surat-keluar', color: 'text-rose-500' },
    { icon: Wallet, label: 'Kas & Inventaris', path: '/kas', color: 'text-teal-500' },
    { icon: Layout, label: 'Template Master', path: '/kas-template', color: 'text-emerald-400' },
    { icon: Calendar, label: 'Agenda Kegiatan', path: '/agenda', color: 'text-orange-500' },
    { icon: BarChart, label: 'Pelaporan', path: '/laporan', color: 'text-cyan-500' },
  ];

  const extraItems = [
    { icon: GraduationCap, label: 'Beasiswa', path: '/beasiswa', color: 'text-yellow-500' },
    { icon: BookOpen, label: 'Perpustakaan AI', path: '/perpustakaan', color: 'text-emerald-400' },
    { icon: Award, label: 'Kaderisasi', path: '/kaderisasi', color: 'text-violet-500' },
    { icon: Layers, label: 'Template Surat', path: '/templates', color: 'text-pink-500' },
  ];

  const adminItems = [
    { icon: Shield, label: 'User Management', path: '/admin/users', color: 'text-red-500' },
    { icon: Database, label: 'Master PK', path: '/admin/pk', color: 'text-indigo-400' },
  ];

  const toggleNav = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleNav}
        className="fixed top-4 left-4 z-[60] p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-white shadow-xl active:scale-95 transition-all lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Morphing Sidebar */}
      <motion.nav 
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          transition: { type: 'spring', damping: 20, stiffness: 100 }
        }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className="fixed top-0 left-0 bottom-0 bg-zinc-950 border-r border-zinc-900 z-[55] hidden lg:flex flex-col shadow-2xl overflow-hidden group"
      >
        {/* Nav Header */}
        <div className="p-6 pt-10 border-b border-zinc-900 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 p-0.5 shrink-0">
              <div className="w-full h-full rounded-xl bg-zinc-950 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <Home size={20} className="text-emerald-500" />
                )}
              </div>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  <h2 className="font-black text-white text-sm leading-tight">{user?.displayName || 'User'}</h2>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{role || 'Anggota'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-6">
          <div>
            {!isCollapsed && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 whitespace-nowrap"
              >
                Menu Utama
              </motion.h3>
            )}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <NavLink key={item.path} item={item} active={location.pathname === item.path} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 whitespace-nowrap"
              >
                Fitur Tambahan
              </motion.h3>
            )}
            <div className="space-y-1">
              {extraItems.map((item) => (
                <NavLink key={item.path} item={item} active={location.pathname === item.path} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {(role === 'admin' || role === 'pimpinan') && (
            <div>
              {!isCollapsed && (
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 whitespace-nowrap"
                >
                  Administrasi
                </motion.h3>
              )}
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <NavLink key={item.path} item={item} active={location.pathname === item.path} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav Footer */}
        <div className="p-3 border-t border-zinc-900">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all group overflow-hidden"
          >
            <LogOut size={20} className="shrink-0 group-hover:rotate-12 transition-transform" />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-bold whitespace-nowrap"
              >
                Keluar Akun
              </motion.span>
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Sidebar (Standard Slide-in) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleNav}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
            />
            <motion.nav 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-900 z-[55] flex flex-col shadow-2xl overflow-hidden lg:hidden"
            >
              <div className="p-8 pt-20 border-b border-zinc-900">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 p-0.5">
                    <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                      ) : (
                        <Home size={24} className="text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-black text-white leading-tight">{user?.displayName || 'User'}</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{role || 'Anggota'}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-8">
                <div>
                  <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Menu Utama</h3>
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={toggleNav} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Fitur Tambahan</h3>
                  <div className="space-y-1">
                    {extraItems.map((item) => (
                      <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={toggleNav} />
                    ))}
                  </div>
                </div>
                {(role === 'admin' || role === 'pimpinan') && (
                  <div>
                    <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Administrasi</h3>
                    <div className="space-y-1">
                      {adminItems.map((item) => (
                        <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={toggleNav} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-zinc-900">
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                >
                  <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-bold">Keluar Akun</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

interface NavLinkProps {
  item: any;
  active: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ item, active, onClick, isCollapsed }) => (
  <Link 
    to={item.path} 
    onClick={onClick}
    className={`flex items-center p-3 rounded-xl transition-all group relative ${
      active ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
    }`}
  >
    <div className="flex items-center gap-4 shrink-0">
      <item.icon size={20} className={active ? item.color : 'text-zinc-600 group-hover:text-zinc-400'} />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs font-bold whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
    {active && (
      <motion.div 
        layoutId="active-pill" 
        className="absolute right-2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
      />
    )}
  </Link>
);

export default SideNav;
