import React, { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { useTheme } from '../components/ThemeProvider';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Calendar, Plus, Trash2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface AgendaItem {
  id: string;
  title: string;
  date: string;
  description: string;
}

const Agenda: React.FC = () => {
  const { db, role, user } = useFirebase();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: ''
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'agendas'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AgendaItem[];
      setAgendas(data);
    });
    return () => unsubscribe();
  }, [db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await addDoc(collection(db, 'agendas'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({ title: '', date: '', description: '' });
    } catch (error) {
      console.error('Error adding agenda:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (window.confirm('Hapus agenda ini?')) {
      try {
        await deleteDoc(doc(db, 'agendas', id));
      } catch (error) {
        console.error('Error deleting agenda:', error);
      }
    }
  };

  return (
    <div className={cn(
      "p-4 pb-24 min-h-screen font-sans transition-colors duration-500",
      isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">AGENDA</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Jadwal Kegiatan Mendatang</p>
        </div>
        {(role === 'admin' || role === 'pimpinan') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-orange-600 rounded-2xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center text-white"
          >
            <Plus size={28} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {agendas.map((item) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={item.id}
            className={cn(
              "border rounded-[32px] p-6 relative overflow-hidden group hover:border-orange-500/50 transition-all",
              isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex flex-col items-center justify-center text-orange-500 border border-orange-500/20">
                  <span className="text-[10px] font-black uppercase leading-none">{new Date(item.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className="text-lg font-black leading-none">{new Date(item.date).getDate()}</span>
                </div>
                <div>
                  <h3 className={cn(
                    "font-black text-lg leading-tight transition-colors",
                    isDark ? "text-white" : "text-zinc-900"
                  )}>{item.title}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    <Calendar size={10} /> {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {(role === 'admin' || role === 'pimpinan') && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            <p className={cn(
              "text-sm leading-relaxed transition-colors",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}>
              {item.description}
            </p>
          </motion.div>
        ))}

        {agendas.length === 0 && (
          <div className="text-center py-20 text-zinc-700">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Belum ada agenda kegiatan</p>
          </div>
        )}
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
              className={cn(
                "relative w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border shadow-2xl transition-colors",
                isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"
              )}
            >
              <div className={cn(
                "w-12 h-1.5 rounded-full mx-auto mb-8 sm:hidden transition-colors",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />
              <h2 className={cn(
                "text-2xl font-black mb-8 transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>Tambah Agenda</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Judul Kegiatan</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Rapat Koordinasi"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className={cn(
                        "w-full border rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all",
                        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tanggal</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className={cn(
                        "w-full border rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all",
                        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Deskripsi</label>
                    <textarea
                      required
                      placeholder="Detail kegiatan..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className={cn(
                        "w-full border rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all min-h-[120px] resize-none",
                        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl text-xs font-black transition-all",
                      isDark ? "text-zinc-500 hover:bg-zinc-900" : "text-zinc-400 hover:bg-zinc-100"
                    )}
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN AGENDA
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

export default Agenda;
