import React, { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { auth } from '../firebase';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LogOut, User, Mail, Shield, Settings, MapPin, Camera, Mic, HardDrive, Bell, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function PengaturanUser() {
  const { user, role } = useFirebase();
  const { showToast } = useToast();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  
  const [permissions, setPermissions] = useState({
    geolocation: 'prompt',
    camera: 'prompt',
    microphone: 'prompt'
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const geo = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      const mic = await navigator.permissions.query({ name: 'microphone' as any });

      setPermissions({
        geolocation: geo.state,
        camera: cam.state,
        microphone: mic.state
      });

      geo.onchange = () => setPermissions(prev => ({ ...prev, geolocation: geo.state }));
      cam.onchange = () => setPermissions(prev => ({ ...prev, camera: cam.state }));
      mic.onchange = () => setPermissions(prev => ({ ...prev, microphone: mic.state }));
    } catch (e) {
      console.error('Permission query not supported', e);
    }
  };

  const requestPermission = async (type: 'geolocation' | 'camera' | 'microphone') => {
    try {
      if (type === 'geolocation') {
        navigator.geolocation.getCurrentPosition(() => checkPermissions(), () => checkPermissions());
      } else if (type === 'camera') {
        await navigator.mediaDevices.getUserMedia({ video: true });
        checkPermissions();
      } else if (type === 'microphone') {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        checkPermissions();
      }
      showToast(`Izin ${type} berhasil diminta`, 'success');
    } catch (e) {
      showToast(`Gagal meminta izin ${type}`, 'error');
    }
  };

  const handleLogout = () => {
    setLogoutConfirm(true);
  };

  const confirmLogout = () => {
    auth.signOut();
    setLogoutConfirm(false);
  };

  const PermissionItem = ({ 
    icon: Icon, 
    label, 
    status, 
    onClick 
  }: { 
    icon: any, 
    label: string, 
    status: string, 
    onClick: () => void 
  }) => (
    <div className="p-4 border-b border-zinc-800 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          status === 'granted' ? "bg-emerald-500/10 text-emerald-500" : 
          status === 'denied' ? "bg-rose-500/10 text-rose-500" : "bg-zinc-800 text-zinc-400"
        )}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-200">{label}</p>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            status === 'granted' ? "text-emerald-500" : 
            status === 'denied' ? "text-rose-500" : "text-zinc-500"
          )}>
            {status === 'granted' ? 'Diizinkan' : status === 'denied' ? 'Ditolak' : 'Belum Diatur'}
          </p>
        </div>
      </div>
      {status !== 'granted' && (
        <button 
          onClick={onClick}
          className="text-[10px] font-black text-emerald-500 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all border border-emerald-500/20"
        >
          AKTIFKAN
        </button>
      )}
    </div>
  );

  return (
    <div className="p-4 pb-24 space-y-6 max-w-2xl mx-auto">
      <div className="pt-12">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Pengaturan</h1>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Kelola Akun & Izin Aplikasi</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/30 p-8 rounded-[32px] border border-zinc-800 shadow-sm flex flex-col items-center gap-6"
      >
        <div className="relative">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profil" className="w-28 h-28 rounded-[32px] border-4 border-emerald-500/20 shadow-2xl object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-28 h-28 rounded-[32px] bg-emerald-600 flex items-center justify-center font-black text-white text-4xl shadow-2xl border-4 border-emerald-500/20">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl">
            <Shield size={20} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">{user?.displayName || 'Pengguna'}</h2>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mt-1">{role || 'Anggota'}</p>
        </div>
      </motion.div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Informasi Akun</h3>
        <div className="bg-zinc-900/30 rounded-[32px] border border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Nama Lengkap</p>
              <p className="text-sm font-bold text-zinc-200">{user?.displayName || 'Tidak diatur'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Email Terdaftar</p>
              <p className="text-sm font-bold text-zinc-200">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Izin Aplikasi (Metadata)</h3>
        <div className="bg-zinc-900/30 rounded-[32px] border border-zinc-800 shadow-sm overflow-hidden">
          <PermissionItem 
            icon={MapPin} 
            label="Lokasi (Geolocation)" 
            status={permissions.geolocation} 
            onClick={() => requestPermission('geolocation')}
          />
          <PermissionItem 
            icon={Camera} 
            label="Kamera" 
            status={permissions.camera} 
            onClick={() => requestPermission('camera')}
          />
          <PermissionItem 
            icon={Mic} 
            label="Mikrofon" 
            status={permissions.microphone} 
            onClick={() => requestPermission('microphone')}
          />
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black py-5 rounded-[32px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
      >
        <LogOut size={20} />
        Keluar dari Aplikasi
      </button>

      <ConfirmDialog
        isOpen={logoutConfirm}
        title="Keluar Akun"
        message="Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu masuk kembali untuk mengakses data."
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
