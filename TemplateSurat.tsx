import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { FileText, Download, Search, Plus, Trash2, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TemplateSurat: React.FC = () => {
  const { user, role } = useFirebase();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaTemplate: '',
    fileUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (s) => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'templates'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({ namaTemplate: '', fileUrl: '' });
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus template surat ini?')) {
      try {
        await deleteDoc(doc(db, 'templates', id));
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-neutral-950 text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Surat</h1>
          <p className="text-neutral-400 text-sm">Download template administrasi</p>
        </div>
        {(role === 'admin' || role === 'pimpinan') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-purple-500 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {data.map(item => (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            key={item.id} 
            className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-sm">{item.namaTemplate}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-neutral-800 rounded-xl text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Download size={18} />
              </button>
              {(role === 'admin' || role === 'pimpinan') && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-700">
              <Search size={32} />
            </div>
            <p className="text-neutral-500">Belum ada template surat tersedia.</p>
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
                <h2 className="text-2xl font-bold">Tambah Template</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="w-full h-32 border-2 border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-purple-500 transition-colors cursor-pointer">
                    <Upload size={32} />
                    <span className="text-sm">Upload File Template</span>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Nama Template (Contoh: Surat Undangan)"
                    value={formData.namaTemplate}
                    onChange={(e) => setFormData({...formData, namaTemplate: e.target.value})}
                    className="w-full bg-neutral-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-purple-500/20 active:scale-95 transition-transform"
                >
                  Simpan Template
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateSurat;
