import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Plus, Compass, Calendar, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Kunjungan {
  id: string;
  namaAnggota: string;
  tujuan: string;
  tanggal: string;
  lokasi: string;
  keterangan: string;
}

const KunjunganAnggota: React.FC = () => {
  const { user } = useFirebase();
  const [kunjunganList, setKunjunganList] = useState<Kunjungan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaAnggota: '',
    tujuan: '',
    tanggal: '',
    lokasi: '',
    keterangan: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'visitasis'), orderBy('tanggal', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKunjunganList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kunjungan)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'visitasis'), { ...formData, createdAt: new Date().toISOString(), createdBy: user?.uid });
    setIsModalOpen(false);
    setFormData({ namaAnggota: '', tujuan: '', tanggal: '', lokasi: '', keterangan: '' });
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Kunjungan</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Pencatatan Kunjungan Anggota</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-amber-600 rounded-2xl shadow-lg shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="space-y-4">
        {kunjunganList.map((k) => (
          <motion.div key={k.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Compass size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg">{k.namaAnggota}</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{k.tujuan}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-400">
              <div className="flex items-center gap-2"><Calendar size={14} /> {k.tanggal}</div>
              <div className="flex items-center gap-2"><MapPin size={14} /> {k.lokasi}</div>
            </div>
          </motion.div>
        ))}
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
              <h2 className="text-2xl font-black mb-8">Tambah Kunjungan</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required type="text" placeholder="Nama Anggota" value={formData.namaAnggota} onChange={(e) => setFormData({...formData, namaAnggota: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm" />
                <input required type="text" placeholder="Tujuan" value={formData.tujuan} onChange={(e) => setFormData({...formData, tujuan: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm" />
                <input required type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm" />
                <input required type="text" placeholder="Lokasi" value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm" />
                <textarea required placeholder="Keterangan" value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm min-h-[100px]" />
                <button type="submit" className="w-full bg-amber-600 text-white font-black py-4 rounded-2xl">SIMPAN KUNJUNGAN</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KunjunganAnggota;
