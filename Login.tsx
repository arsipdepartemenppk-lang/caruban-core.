import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/user-disabled':
        return 'Akun ini telah dinonaktifkan.';
      case 'auth/user-not-found':
        return 'Pengguna tidak ditemukan.';
      case 'auth/wrong-password':
        return 'Kata sandi salah.';
      case 'auth/email-already-in-use':
        return 'Email sudah terdaftar.';
      case 'auth/weak-password':
        return 'Kata sandi terlalu lemah (minimal 6 karakter).';
      case 'auth/network-request-failed':
        return 'Koneksi internet bermasalah.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Semua kolom harus diisi.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid.');
      return;
    }

    if (!isLogin && !fullName) {
      setError('Nama lengkap harus diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: fullName });
        
        // Create user document with default role 'anggota'
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          role: 'anggota',
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      setForgotMessage('Masukkan email yang valid.');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotMessage('Email reset kata sandi telah dikirim!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMessage('');
      }, 3000);
    } catch (err: any) {
      setForgotMessage(getFriendlyErrorMessage(err.code));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen p-6 transition-colors duration-500",
      isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={cn(
            "p-3 rounded-2xl border transition-all active:scale-90",
            isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
          )}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors",
          isDark ? "bg-emerald-500/10" : "bg-emerald-500/5"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors",
          isDark ? "bg-blue-500/10" : "bg-blue-500/5"
        )} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className={cn(
            "text-3xl font-black tracking-tight mb-2 transition-colors",
            isDark ? "text-white" : "text-zinc-900"
          )}>Caruban Core</h1>
          <p className="text-zinc-500 text-sm">Sistem Informasi & Media Sosial Internal</p>
        </div>

        <div className={cn(
          "backdrop-blur-xl border p-8 rounded-[40px] shadow-2xl transition-colors",
          isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white/80 border-zinc-200"
        )}>
          <div className={cn(
            "flex p-1 rounded-2xl mb-8 transition-colors",
            isDark ? "bg-black/50" : "bg-zinc-100"
          )}>
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                isLogin 
                  ? (isDark ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-sm') 
                  : 'text-zinc-500'
              )}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                !isLogin 
                  ? (isDark ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-sm') 
                  : 'text-zinc-500'
              )}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Nama Lengkap" 
                    className={cn(
                      "w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all",
                      isDark ? "bg-black/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Alamat Email" 
                className={cn(
                  "w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all",
                  isDark ? "bg-black/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                )} 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Kata Sandi" 
                className={cn(
                  "w-full border rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-emerald-500 transition-all",
                  isDark ? "bg-black/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                )} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-emerald-500 hover:text-emerald-400 font-bold"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses...' : (isLogin ? 'Masuk Sekarang' : 'Daftar Akun')}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-xs font-medium">
          &copy; 2026 Caruban Core Mobile. All rights reserved.
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "relative w-full max-w-sm border p-8 rounded-[40px] shadow-2xl transition-colors",
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute right-6 top-6 text-zinc-600 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2 className={cn(
                "text-xl font-bold mb-2 transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>Reset Kata Sandi</h2>
              <p className="text-zinc-500 text-sm mb-6">Masukkan email Anda untuk menerima tautan reset kata sandi.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input 
                    required
                    type="email" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)} 
                    placeholder="Email Anda" 
                    className={cn(
                      "w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all",
                      isDark ? "bg-black/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )} 
                  />
                </div>
                {forgotMessage && (
                  <p className={`text-xs font-bold text-center py-2 rounded-lg ${forgotMessage.includes('dikirim') ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {forgotMessage}
                  </p>
                )}
                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Mengirim...' : 'Kirim Tautan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
