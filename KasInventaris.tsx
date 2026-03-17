import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Box, Wallet, TrendingUp, TrendingDown, Search, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KasInventaris: React.FC = () => {
  const { user, role } = useFirebase();
  const [data, setData] = useState<any[]>([]);
  const [cashData, setCashData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaBarang: '',
    kondisi: 'Baik'
  });
  const [cashFormData, setCashFormData] = useState({
    keterangan: '',
    jumlah: '',
    tipe: 'Masuk'
  });

  useEffect(() => {
    const q = query(collection(db, 'kas_inventaris'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (s) => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const qCash = query(collection(db, 'kas_transaksi'), orderBy('createdAt', 'desc'));
    const unsubCash = onSnapshot(qCash, (s) => setCashData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => {
      unsub();
      unsubCash();
    };
  }, []);

  const totalSaldo = cashData.reduce((acc, curr) => {
    const amt = Number(curr.jumlah) || 0;
    return curr.tipe === 'Masuk' ? acc + amt : acc - amt;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'kas_inventaris'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({ namaBarang: '', kondisi: 'Baik' });
    } catch (error) {
      console.error('Error adding inventory:', error);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'kas_transaksi'), {
        ...cashFormData,
        jumlah: Number(cashFormData.jumlah),
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsCashModalOpen(false);
      setCashFormData({ keterangan: '', jumlah: '', tipe: 'Masuk' });
    } catch (error) {
      console.error('Error adding cash transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data inventaris ini?')) {
      try {
        await deleteDoc(doc(db, 'kas_inventaris', id));
      } catch (error) {
        console.error('Error deleting inventory:', error);
      }
    }
  };

  const handleDeleteCash = async (id: string) => {
    if (window.confirm('Hapus transaksi kas ini?')) {
      try {
        await deleteDoc(doc(db, 'kas_transaksi', id));
      } catch (error) {
        console.error('Error deleting cash transaction:', error);
      }
    }
  };

  const kasTemplates = [
    { keterangan: 'Iuran Bulanan Anggota', jumlah: 50000, tipe: 'Masuk' },
    { keterangan: 'Donasi Donatur', jumlah: 100000, tipe: 'Masuk' },
    { keterangan: 'Konsumsi Rapat', jumlah: 150000, tipe: 'Keluar' },
    { keterangan: 'Transportasi Koordinasi', jumlah: 50000, tipe: 'Keluar' },
    { keterangan: 'Biaya Operasional Kantor', jumlah: 200000, tipe: 'Keluar' },
  ];

  const useTemplate = (template: any, type: 'kas' | 'inventaris') => {
    if (type === 'kas') {
      setCashFormData({
        keterangan: template.keterangan,
        jumlah: template.jumlah.toString(),
        tipe: template.tipe
      });
    } else {
      setFormData({
        namaBarang: template.namaBarang,
        kondisi: template.kondisi
      });
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Kas & Inventaris</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Manajemen Aset & Keuangan</p>
        </div>
        {(role === 'admin' || role === 'pimpinan') && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsCashModalOpen(true)}
              className="w-12 h-12 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center"
            >
              <Wallet size={24} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-amber-600 rounded-2xl shadow-lg shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center"
            >
              <Box size={24} />
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[40px] shadow-2xl mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-all" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp size={16} />
          </div>
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Saldo Kas Utama</h2>
        </div>
        <p className="text-5xl font-black text-white tracking-tighter mb-8">
          <span className="text-emerald-500 text-2xl mr-2">Rp</span>
          {totalSaldo.toLocaleString('id-ID')}
        </p>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500/50 transition-all">Laporan Kas</button>
          <button className="px-6 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500/50 transition-all">Mutasi</button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Template Section */}
        {(role === 'admin' || role === 'pimpinan') && (
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="font-black text-xs text-zinc-500 uppercase tracking-[0.2em]">Template Cepat</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {kasTemplates.map((t, i) => (
                <button 
                  key={i}
                  onClick={() => { setIsCashModalOpen(true); useTemplate(t, 'kas'); }}
                  className="shrink-0 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all uppercase tracking-widest"
                >
                  {t.keterangan}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="font-black text-xs text-zinc-500 uppercase tracking-[0.2em]">Transaksi Terakhir</h2>
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{cashData.length} Data</span>
          </div>
          <div className="space-y-4">
            {cashData.map(item => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className="bg-zinc-900/20 p-6 rounded-[32px] border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    item.tipe === 'Masuk' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {item.tipe === 'Masuk' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight text-white">{item.keterangan}</h3>
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className={`font-black text-lg tracking-tighter ${item.tipe === 'Masuk' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.tipe === 'Masuk' ? '+' : '-'} {Number(item.jumlah).toLocaleString('id-ID')}
                  </p>
                  {(role === 'admin' || role === 'pimpinan') && (
                    <button
                      onClick={() => handleDeleteCash(item.id)}
                      className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-700 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {cashData.length === 0 && (
              <div className="text-center py-16 bg-zinc-900/10 rounded-[40px] border border-dashed border-zinc-800">
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="font-black text-xs text-zinc-500 uppercase tracking-[0.2em]">Daftar Inventaris</h2>
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{data.length} Barang</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map(item => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id} 
                className="bg-zinc-900/20 p-6 rounded-[32px] border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                    <Box size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight text-white">{item.namaBarang}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        item.kondisi === 'Baik' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {item.kondisi || 'Baik'}
                      </span>
                    </div>
                  </div>
                </div>
                {(role === 'admin' || role === 'pimpinan') && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-700 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          {data.length === 0 && (
            <div className="text-center py-16 bg-zinc-900/10 rounded-[40px] border border-dashed border-zinc-800">
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">Belum ada data inventaris</p>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-zinc-950 rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-zinc-900 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Tambah Inventaris</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama Barang</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Laptop, Printer..."
                      value={formData.namaBarang}
                      onChange={(e) => setFormData({...formData, namaBarang: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kondisi</label>
                    <select
                      required
                      value={formData.kondisi}
                      onChange={(e) => setFormData({...formData, kondisi: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                      <option value="Hilang">Hilang</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-black text-zinc-500 hover:bg-zinc-900 transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN BARANG
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isCashModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCashModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-zinc-950 rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-zinc-900 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Catat Transaksi</h2>
                <button onClick={() => setIsCashModalOpen(false)} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCashSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setCashFormData({...cashFormData, tipe: 'Masuk'})}
                      className={`py-4 rounded-2xl text-[10px] font-black border transition-all tracking-widest ${cashFormData.tipe === 'Masuk' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                    >
                      UANG MASUK
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCashFormData({...cashFormData, tipe: 'Keluar'})}
                      className={`py-4 rounded-2xl text-[10px] font-black border transition-all tracking-widest ${cashFormData.tipe === 'Keluar' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                    >
                      UANG KELUAR
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Keterangan</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Iuran Bulanan..."
                      value={cashFormData.keterangan}
                      onChange={(e) => setCashFormData({...cashFormData, keterangan: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Jumlah (Rp)</label>
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={cashFormData.jumlah}
                      onChange={(e) => setCashFormData({...cashFormData, jumlah: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCashModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-black text-zinc-500 hover:bg-zinc-900 transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN TRANSAKSI
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KasInventaris;
