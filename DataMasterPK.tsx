import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseUtils';
import { auth, db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Trash2, Database, MapPin, Layers, User, Activity, Users, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IPNU_ZONES, IPPNU_ZONES } from '../constants/zones';

import { cn } from '../lib/utils';

interface MasterPK {
  id: string;
  pkId: string; // namaPK_noUrut_zona
  namaPK: string;
  alamat: string;
  zona: string;
  koorzon: string;
  status: 'Aktif' | 'Non Aktif' | 'Vakum';
  organisasi: 'IPNU' | 'IPPNU';
  kecamatan: string;
  namaKetua: string;
  noHp: string;
  statusVisitasi: 'Visitasi' | 'Unvisited';
}

const STATUS_OPTIONS = ['Aktif', 'Non Aktif', 'Vakum'];
const ORGANISASI_OPTIONS = ['IPNU', 'IPPNU'];

const DataMasterPK: React.FC = () => {
  const { user, role } = useFirebase();
  const { showToast } = useToast();
  const [pks, setPks] = useState<MasterPK[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [orgFilter, setOrgFilter] = useState<string>('Semua');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    namaPK: '',
    alamat: '',
    zona: '',
    koorzon: '',
    status: 'Aktif' as const,
    logoUrl: '',
    organisasi: 'IPNU' as 'IPNU' | 'IPPNU',
    kecamatan: '',
    namaKetua: '',
    noHp: '',
    statusVisitasi: 'Unvisited' as const
  });

  useEffect(() => {
    const q = query(collection(db, 'pks'), orderBy('pkId', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MasterPK[];
      setPks(data);
    });
    return () => unsubscribe();
  }, []);

  const handleKecamatanChange = (kecamatan: string, organisasi: 'IPNU' | 'IPPNU') => {
    const zones = organisasi === 'IPNU' ? IPNU_ZONES : IPPNU_ZONES;
    const foundZone = zones.find(z => z.kecamatan.includes(kecamatan));
    
    if (foundZone) {
      setFormData({ 
        ...formData, 
        kecamatan, 
        organisasi,
        zona: foundZone.zona, 
        koorzon: foundZone.koorzon 
      });
    } else {
      setFormData({ 
        ...formData, 
        kecamatan, 
        organisasi,
        zona: '', 
        koorzon: '' 
      });
    }
  };

  const getAllKecamatan = (organisasi: 'IPNU' | 'IPPNU') => {
    const zones = organisasi === 'IPNU' ? IPNU_ZONES : IPPNU_ZONES;
    const allKec = zones.flatMap(z => z.kecamatan);
    return Array.from(new Set(allKec)).sort();
  };

  const generatePkId = async (namaPK: string, zona: string) => {
    const snapshot = await getDocs(collection(db, 'pks'));
    const count = snapshot.size + 1;
    const cleanNama = namaPK.replace(/\s+/g, '').toUpperCase();
    const cleanZona = zona.replace(/\s+/g, '').toLowerCase();
    return `${cleanNama}_${count}_${cleanZona}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.namaPK.trim()) {
      showToast('Nama PK harus diisi', 'error');
      return;
    }
    if (!formData.kecamatan) {
      showToast('Kecamatan harus diisi', 'error');
      return;
    }
    if (!formData.namaKetua.trim()) {
      showToast('Nama Ketua harus diisi', 'error');
      return;
    }

    try {
      const pkId = await generatePkId(formData.namaPK, formData.zona);
      await addDoc(collection(db, 'pks'), {
        ...formData,
        pkId,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      showToast('Data Master PK berhasil disimpan', 'success');
      setIsModalOpen(false);
      setFormData({
        namaPK: '',
        alamat: '',
        zona: '',
        koorzon: '',
        status: 'Aktif',
        logoUrl: '',
        organisasi: 'IPNU',
        kecamatan: '',
        namaKetua: '',
        noHp: '',
        statusVisitasi: 'Unvisited'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pks', auth);
      showToast('Gagal menyimpan data Master PK', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteDoc(doc(db, 'pks', deleteConfirm.id));
      showToast('Data Master PK berhasil dihapus', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pks/${deleteConfirm.id}`, auth);
      showToast('Gagal menghapus data Master PK', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const filtered = pks.filter(p => {
    const matchesSearch = p.namaPK.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kecamatan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || p.status === statusFilter;
    const matchesOrg = orgFilter === 'Semua' || p.organisasi === orgFilter;
    
    return matchesSearch && matchesStatus && matchesOrg;
  });

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">MASTER PK</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Database Pimpinan Komisariat</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input
              type="text"
              placeholder="Cari ID, Nama, atau Kecamatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all",
              showFilters ? "bg-emerald-600 border-emerald-500 text-white" : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
            )}
          >
            <Filter size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Semua">Semua Status</option>
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Organisasi</label>
                  <select
                    value={orgFilter}
                    onChange={(e) => setOrgFilter(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Semua">Semua Organisasi</option>
                    {ORGANISASI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={p.id}
            className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-xs border border-emerald-500/20">
                  {p.pkId}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{p.namaPK}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {p.alamat}
                  </p>
                </div>
              </div>
              {(role === 'admin' || role === 'pimpinan') && (
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: p.id })}
                  className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-950 rounded-2xl p-3 text-center border border-zinc-900">
                <Users size={14} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Organisasi</p>
                <p className="text-[10px] font-black">{p.organisasi}</p>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-3 text-center border border-zinc-900">
                <MapPin size={14} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Kecamatan</p>
                <p className="text-[10px] font-black">{p.kecamatan}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950 rounded-2xl p-3 text-center border border-zinc-900">
                <Layers size={14} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Zona</p>
                <p className="text-[10px] font-black">{p.zona}</p>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-3 text-center border border-zinc-900">
                <User size={14} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Ketua</p>
                <p className="text-[10px] font-black">{p.namaKetua || '-'}</p>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-3 text-center border border-zinc-900">
                <Activity size={14} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Visitasi</p>
                <p className={`text-[10px] font-black ${p.statusVisitasi === 'Visitasi' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                  {p.statusVisitasi}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${p.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{p.status}</span>
              </div>
              <span className="text-[10px] font-black text-zinc-600">{p.noHp}</span>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-zinc-700">
            <Database size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Data tidak ditemukan</p>
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
              className="relative w-full max-w-lg bg-zinc-950 rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-zinc-900 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-black mb-8">Tambah Master PK</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama PK</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: PK Caruban"
                      value={formData.namaPK}
                      onChange={(e) => setFormData({...formData, namaPK: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Alamat</label>
                    <textarea
                      required
                      placeholder="Alamat lengkap..."
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all min-h-[100px] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Organisasi</label>
                      <select
                        required
                        value={formData.organisasi}
                        onChange={(e) => {
                          const org = e.target.value as 'IPNU' | 'IPPNU';
                          setFormData({ ...formData, organisasi: org, kecamatan: '', zona: '', koorzon: '' });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none"
                      >
                        {ORGANISASI_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kecamatan</label>
                      <select
                        required
                        value={formData.kecamatan}
                        onChange={(e) => handleKecamatanChange(e.target.value, formData.organisasi)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none"
                      >
                        <option value="" disabled>Pilih Kecamatan</option>
                        {getAllKecamatan(formData.organisasi).map(kec => (
                          <option key={kec} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Zona</label>
                      <input
                        readOnly
                        type="text"
                        value={formData.zona}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-500"
                        placeholder="Otomatis..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Koorzon</label>
                      <textarea
                        readOnly
                        value={formData.koorzon}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-[10px] text-zinc-500 resize-none min-h-[60px]"
                        placeholder="Otomatis..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama Ketua</label>
                      <input
                        required
                        type="text"
                        placeholder="Nama Ketua..."
                        value={formData.namaKetua}
                        onChange={(e) => setFormData({...formData, namaKetua: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">No HP</label>
                      <input
                        required
                        type="tel"
                        placeholder="08..."
                        value={formData.noHp}
                        onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
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
                    className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN MASTER PK
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Hapus Master PK"
        message="Apakah Anda yakin ingin menghapus data Master PK ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default DataMasterPK;
