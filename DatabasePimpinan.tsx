import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Plus, Search, Trash2, Building2, ShieldCheck, Phone, MapPin, Calendar, Activity, Layers, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IPNU_ZONES, IPPNU_ZONES } from '../constants/zones';

interface Pimpinan {
  id: string;
  namaLembaga: string;
  jenis: 'PAC' | 'PR' | 'PK';
  namaKetua: string;
  noHp: string;
  alamatDomisili: string;
  masaKhidmat: string;
  statusPimpinan: 'Aktif' | 'Non Aktif' | 'Vakum';
  logoUrl?: string;
  organisasi: 'IPNU' | 'IPPNU';
  kecamatan: string;
  zona: string;
  koorzon: string;
}

const STATUS_OPTIONS = ['Aktif', 'Non Aktif', 'Vakum'];

const DatabasePimpinan: React.FC = () => {
  const { user, role } = useFirebase();
  const [pimpinan, setPimpinan] = useState<Pimpinan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    namaLembaga: '',
    jenis: 'PAC' as const,
    namaKetua: '',
    noHp: '',
    alamatDomisili: '',
    masaKhidmat: '',
    statusPimpinan: 'Aktif' as const,
    logoUrl: '',
    organisasi: 'IPNU' as 'IPNU' | 'IPPNU',
    kecamatan: '',
    zona: '',
    koorzon: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'pimpinan'), orderBy('namapimpinan', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pimpinan[];
      setPimpinan(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'pimpinan'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({
        namaLembaga: '',
        jenis: 'PAC',
        namaKetua: '',
        noHp: '',
        alamatDomisili: '',
        masaKhidmat: '',
        statusPimpinan: 'Aktif',
        logoUrl: '',
        organisasi: 'IPNU',
        kecamatan: '',
        zona: '',
        koorzon: ''
      });
    } catch (error) {
      console.error('Error adding pimpinan:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data pimpinan ini?')) {
      try {
        await deleteDoc(doc(db, 'pimpinan', id));
      } catch (error) {
        console.error('Error deleting pimpinan:', error);
      }
    }
  };

  const filtered = pimpinan.filter(p => 
    p.namaLembaga.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.namaKetua.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Database Pimpinan</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">PAC, PR, PK</p>
        </div>
        {(role === 'admin') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={28} />
          </button>
        )}
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
        <input
          type="text"
          placeholder="Cari lembaga atau ketua..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={p.id}
            className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-8 relative overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 ${
                    p.statusPimpinan === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    p.statusPimpinan === 'Vakum' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                  }`}>
                    <Building2 size={32} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-xl leading-tight truncate">{p.namaLembaga} <span className="text-emerald-500 text-xs">({p.jenis})</span></h3>
                    <p className="text-zinc-500 text-sm font-medium mt-1 truncate">{p.namaKetua}</p>
                  </div>
                </div>
                {(role === 'admin') && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 hover:text-rose-500 transition-all shrink-0"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
                  <Phone size={14} className="text-emerald-500" /> {p.noHp}
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
                  <Calendar size={14} className="text-emerald-500" /> {p.masaKhidmat}
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
                  <Users size={14} className="text-emerald-500" /> {p.organisasi}
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
                  <Layers size={14} className="text-emerald-500" /> {p.zona}
                </div>
              </div>
              <div className="flex items-start gap-3 text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-6">
                <MapPin size={14} className="text-emerald-500 shrink-0 mt-0.5" /> 
                <span className="line-clamp-2">{p.kecamatan}, {p.alamatDomisili}</span>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 mb-6">
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Koordinator Zona</p>
                <p className="text-[10px] text-zinc-400 font-bold leading-tight">{p.koorzon}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-zinc-600" />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                  p.statusPimpinan === 'Aktif' ? 'text-emerald-500' : 
                  p.statusPimpinan === 'Vakum' ? 'text-rose-500' : 'text-zinc-600'
                }`}>
                  {p.statusPimpinan}
                </span>
              </div>
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
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-black mb-8">Tambah Pimpinan</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
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
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama Lembaga</label>
                    <input
                      required
                      type="text"
                      placeholder="PAC / PK / Ranting..."
                      value={formData.namaLembaga}
                      onChange={(e) => setFormData({...formData, namaLembaga: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
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
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none text-zinc-400"
                      >
                        <option value="IPNU">IPNU</option>
                        <option value="IPPNU">IPPNU</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kecamatan</label>
                      <select
                        required
                        value={formData.kecamatan}
                        onChange={(e) => handleKecamatanChange(e.target.value, formData.organisasi)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none text-zinc-400"
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

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Jenis</label>
                    <select
                      value={formData.jenis}
                      onChange={(e) => setFormData({...formData, jenis: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="PAC">PAC</option>
                      <option value="PR">PR</option>
                      <option value="PK">PK</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nama Ketua</label>
                    <input
                      required
                      type="text"
                      placeholder="Nama lengkap ketua..."
                      value={formData.namaKetua}
                      onChange={(e) => setFormData({...formData, namaKetua: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">No. HP</label>
                      <input
                        required
                        type="tel"
                        placeholder="08..."
                        value={formData.noHp}
                        onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Masa Khidmat</label>
                      <input
                        required
                        type="text"
                        placeholder="2024-2026"
                        value={formData.masaKhidmat}
                        onChange={(e) => setFormData({...formData, masaKhidmat: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Alamat Domisili</label>
                    <textarea
                      required
                      placeholder="Alamat lengkap sekretariat..."
                      value={formData.alamatDomisili}
                      onChange={(e) => setFormData({...formData, alamatDomisili: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Status</label>
                    <select
                      required
                      value={formData.statusPimpinan}
                      onChange={(e) => setFormData({...formData, statusPimpinan: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none text-zinc-400"
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
                    SIMPAN DATA
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

export default DatabasePimpinan;
