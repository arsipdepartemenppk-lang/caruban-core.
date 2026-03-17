import React, { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Search, Filter, MoreVertical, Trash2, Edit2, 
  Wallet, Box, FileText, Download, ChevronRight,
  TrendingUp, TrendingDown, PieChart, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KasInventarisTemplate() {
  const { db, role } = useFirebase();
  const [templates, setTemplates] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'kas' | 'inventaris'>('kas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'kas',
    description: '',
    defaultAmount: 0,
    type: 'pemasukan', // for kas
    unit: 'pcs' // for inventaris
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [db]);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'templates'), {
        ...formData,
        category: activeTab,
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ name: '', category: activeTab, description: '', defaultAmount: 0, type: 'pemasukan', unit: 'pcs' });
    } catch (error) {
      console.error("Error adding template:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus template ini?')) {
      await deleteDoc(doc(db, 'templates', id));
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.category === activeTab && 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      {/* Header */}
      <div className="mb-8 pt-12">
        <h1 className="text-3xl font-black tracking-tighter mb-2">TEMPLATE MASTER</h1>
        <p className="text-zinc-500 text-sm font-bold">Kelola template transaksi dan inventaris organisasi.</p>
      </div>

      {/* Stats / Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
            <Wallet size={20} />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Template Kas</p>
          <p className="text-2xl font-black">{templates.filter(t => t.category === 'kas').length}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
            <Box size={20} />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Template Inventaris</p>
          <p className="text-2xl font-black">{templates.filter(t => t.category === 'inventaris').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-6">
        <button 
          onClick={() => setActiveTab('kas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'kas' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500'}`}
        >
          <Wallet size={16} /> BUKU KAS
        </button>
        <button 
          onClick={() => setActiveTab('inventaris')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'inventaris' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500'}`}
        >
          <Box size={16} /> INVENTARIS
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            type="text" 
            placeholder="Cari template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <motion.div 
            layout
            key={template.id}
            className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between group hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                template.category === 'kas' 
                  ? (template.type === 'pemasukan' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')
                  : 'bg-blue-500/10 text-blue-500'
              }`}>
                {template.category === 'kas' ? <Wallet size={24} /> : <Box size={24} />}
              </div>
              <div>
                <h4 className="font-black text-sm">{template.name}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {template.category === 'kas' ? template.type : template.unit} • {template.description || 'Tanpa deskripsi'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDelete(template.id)}
                className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
              <ChevronRight size={18} className="text-zinc-800" />
            </div>
          </motion.div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20 text-zinc-600">
            <Layout size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Belum ada template</p>
            <p className="text-xs">Klik tombol + untuk membuat baru</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-black mb-6">Tambah Template {activeTab === 'kas' ? 'Kas' : 'Inventaris'}</h2>
              
              <form onSubmit={handleAddTemplate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama Template</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Iuran Bulanan"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {activeTab === 'kas' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'pemasukan'})}
                      className={`py-4 rounded-2xl text-xs font-black border transition-all ${formData.type === 'pemasukan' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      PEMASUKAN
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'pengeluaran'})}
                      className={`py-4 rounded-2xl text-xs font-black border transition-all ${formData.type === 'pengeluaran' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      PENGELUARAN
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Satuan</label>
                    <input 
                      type="text" 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="Contoh: pcs, unit, box"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Deskripsi (Opsional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Keterangan tambahan..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-emerald-500 transition-all h-24 resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-black text-zinc-500 hover:bg-zinc-900 transition-all"
                  >
                    BATAL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 py-4 rounded-2xl text-xs font-black text-white shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN TEMPLATE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
