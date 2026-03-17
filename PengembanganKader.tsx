import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Award, BookOpen, Users, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PengembanganKader: React.FC = () => {
  const { user, role } = useFirebase();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaProgram: '',
    deskripsi: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'kaderisasi'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (s) => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'kaderisasi'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({ namaProgram: '', deskripsi: '' });
    } catch (error) {
      console.error('Error adding program:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus program ini?')) {
      try {
        await deleteDoc(doc(db, 'kaderisasi', id));
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-neutral-950 text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengembangan Kader</h1>
          <p className="text-neutral-400 text-sm">Program peningkatan kapasitas kader</p>
        </div>
        {(role === 'admin' || role === 'pimpinan') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {data.map(item => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={item.id} 
            className="bg-neutral-900/50 p-6 rounded-[32px] border border-neutral-800 relative group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Award size={24} />
                </div>
                <h3 className="font-bold text-lg">{item.namaProgram}</h3>
              </div>
              {(role === 'admin' || role === 'pimpinan') && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">{item.deskripsi}</p>
          </motion.div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-700">
              <Users size={32} />
            </div>
            <p className="text-neutral-500">Belum ada data pengembangan kader.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
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
              className="relative w-full max-w-lg bg-neutral-900 rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border-t border-neutral-800 sm:border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Tambah Program</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <input
                    required
                    type="text"
                    placeholder="Nama Program"
                    value={formData.namaProgram}
                    onChange={(e) => setFormData({...formData, namaProgram: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    required
                    placeholder="Deskripsi Program"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  Simpan Program
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PengembanganKader;
