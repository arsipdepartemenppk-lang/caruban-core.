import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { GraduationCap, Search, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Beasiswa: React.FC = () => {
  const { user, role } = useFirebase();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    link: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'beasiswa'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (s) => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'beasiswa'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({ judul: '', deskripsi: '', link: '' });
    } catch (error) {
      console.error('Error adding scholarship:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus info beasiswa ini?')) {
      try {
        await deleteDoc(doc(db, 'beasiswa', id));
      } catch (error) {
        console.error('Error deleting scholarship:', error);
      }
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-neutral-950 text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Info Beasiswa</h1>
          <p className="text-neutral-400 text-sm">Informasi beasiswa untuk kader</p>
        </div>
        {(role === 'admin' || role === 'pimpinan') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {data.map(item => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={item.id} 
            className="bg-neutral-900/50 p-6 rounded-[32px] border border-neutral-800 group relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                  <GraduationCap size={24} />
                </div>
                <h3 className="font-bold text-lg">{item.judul}</h3>
              </div>
              <div className="flex items-center gap-2">
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-500 hover:text-blue-500 transition-colors">
                    <ExternalLink size={18} />
                  </a>
                )}
                {(role === 'admin' || role === 'pimpinan') && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">{item.deskripsi}</p>
          </motion.div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-700">
              <Search size={32} />
            </div>
            <p className="text-neutral-500">Belum ada info beasiswa terbaru.</p>
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
                <h2 className="text-2xl font-bold">Tambah Info Beasiswa</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <input
                    required
                    type="text"
                    placeholder="Judul Beasiswa"
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    required
                    placeholder="Deskripsi Singkat"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  />
                  <input
                    type="url"
                    placeholder="Link Pendaftaran (Opsional)"
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                >
                  Simpan Info Beasiswa
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Beasiswa;
