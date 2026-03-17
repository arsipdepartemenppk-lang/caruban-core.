import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseUtils';
import { auth, db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Plus, Search, Trash2, Camera, Calendar, MapPin, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Visitasi {
  id: string;
  visitasiId: string;
  namaLembaga: string;
  idPK: string;
  email: string;
  tglVisitasi: string;
  tglVisitasiFull: {
    tanggal: string;
    hari: string;
    bulan: string;
    tahun: string;
    jam: string;
  };
  agenda: string;
  gps: string;
  skor: number;
  jumlahKader: number;
  masalahUtama: string;
  saranAdvokasi: string;
  status: 'Terlaksana' | 'Belum Terlaksana';
  fotoUrl?: string;
  zona?: string;
  koorzon?: string;
  organisasi?: string;
}

interface PK {
  id: string;
  pkId: string;
  namaPK: string;
  zona?: string;
  koorzon?: string;
  organisasi?: string;
}

const DataVisitasi: React.FC = () => {
  const { user, role } = useFirebase();
  const [visitasis, setVisitasis] = useState<Visitasi[]>([]);
  const [pkList, setPkList] = useState<PK[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    namaLembaga: '',
    idPK: '',
    email: '',
    tglVisitasi: '',
    agenda: '',
    gps: '',
    skor: 0,
    jumlahKader: 0,
    masalahUtama: '',
    saranAdvokasi: '',
    status: 'Belum Terlaksana' as const,
    fotoUrl: '',
    zona: '',
    koorzon: '',
    organisasi: ''
  });

  const handlePKChange = (pkId: string) => {
    const selected = pkList.find(p => p.pkId === pkId);
    if (selected) {
      setFormData({
        ...formData,
        idPK: pkId,
        namaLembaga: selected.namaPK,
        zona: selected.zona || '',
        koorzon: selected.koorzon || '',
        organisasi: selected.organisasi || ''
      });
    }
  };

  useEffect(() => {
    // Fetch Visitasis
    const qV = query(collection(db, 'visitasis'), orderBy('tglVisitasi', 'desc'));
    const unsubV = onSnapshot(qV, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitasi[];
      setVisitasis(data);
    });

    // Fetch PKs for dropdown
    const qP = query(collection(db, 'pks'), orderBy('namaPK', 'asc'));
    const unsubP = onSnapshot(qP, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        pkId: doc.data().pkId,
        namaPK: doc.data().namaPK,
        zona: doc.data().zona,
        koorzon: doc.data().koorzon,
        organisasi: doc.data().organisasi
      })) as PK[];
      setPkList(data);
    });

    return () => { unsubV(); unsubP(); };
  }, []);

  const generateVisitasiId = async () => {
    const snapshot = await getDocs(collection(db, 'visitasis'));
    const count = snapshot.size + 1;
    return `VST.${count.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const visitasiId = await generateVisitasiId();
      const date = new Date(formData.tglVisitasi);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const tglVisitasiFull = {
        tanggal: date.getDate().toString(),
        hari: days[date.getDay()],
        bulan: months[date.getMonth()],
        tahun: date.getFullYear().toString(),
        jam: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
      };

      await addDoc(collection(db, 'visitasis'), {
        ...formData,
        visitasiId,
        tglVisitasiFull,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });

      // Update PK statusVisitasi
      const selectedPK = pkList.find(p => p.pkId === formData.idPK);
      if (selectedPK) {
        await updateDoc(doc(db, 'pks', selectedPK.id), {
          statusVisitasi: 'Visitasi'
        });
      }

      setIsModalOpen(false);
      setFormData({
        namaLembaga: '',
        idPK: '',
        email: '',
        tglVisitasi: '',
        agenda: '',
        gps: '',
        skor: 0,
        jumlahKader: 0,
        masalahUtama: '',
        saranAdvokasi: '',
        status: 'Belum Terlaksana',
        fotoUrl: '',
        zona: '',
        koorzon: '',
        organisasi: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'visitasis', auth);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'visitasis', id), {
        status: currentStatus === 'Terlaksana' ? 'Belum Terlaksana' : 'Terlaksana'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visitasis/${id}`, auth);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data visitasi ini?')) {
      try {
        await deleteDoc(doc(db, 'visitasis', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `visitasis/${id}`, auth);
      }
    }
  };

  const filtered = visitasis.filter(v => 
    v.namaLembaga.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.visitasiId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Visitasi</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Monitoring Lembaga</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-amber-600 rounded-2xl shadow-lg shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
        <input
          type="text"
          placeholder="Cari lembaga atau hasil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500 transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((v) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={v.id}
            className="bg-zinc-900/30 border border-zinc-800 rounded-[40px] overflow-hidden hover:border-amber-500/50 transition-all flex flex-col"
          >
            <div className="aspect-video bg-zinc-950 relative group shrink-0">
              {v.fotoUrl ? (
                <img src={v.fotoUrl} alt="Visitasi" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
                  <ImageIcon size={48} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Documentation</span>
                </div>
              )}
              <div className="absolute top-6 left-6">
                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-xl border ${
                  v.status === 'Terlaksana' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {v.status}
                </span>
              </div>
            </div>

            <div className="p-8 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0 flex-1 mr-4">
                  <h3 className="font-black text-2xl mb-2 leading-tight truncate">{v.namaLembaga}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar size={12} className="text-amber-500" /> {v.tglVisitasiFull?.hari}, {v.tglVisitasiFull?.tanggal} {v.tglVisitasiFull?.bulan} {v.tglVisitasiFull?.tahun} - {v.tglVisitasiFull?.jam}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(v.id, v.status)}
                    className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-emerald-500 transition-colors border border-zinc-800"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  {(role === 'admin' || role === 'pimpinan') && (
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-rose-500 transition-colors border border-zinc-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950/50 rounded-3xl p-6 border border-zinc-900 flex-grow mb-4 space-y-4">
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Agenda</p>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {v.agenda}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Skor</p>
                    <p className="text-amber-500 text-lg font-black">{v.skor}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Kader</p>
                    <p className="text-amber-500 text-lg font-black">{v.jumlahKader}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Masalah Utama</p>
                  <p className="text-zinc-500 text-xs italic">{v.masalahUtama}</p>
                </div>
              </div>

              {v.zona && (
                <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-900">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Zona & Organisasi</span>
                    <span className="text-[10px] font-black text-amber-500">{v.zona} ({v.organisasi})</span>
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Koordinator</p>
                  <p className="text-[10px] text-zinc-400 font-bold leading-tight">{v.koorzon}</p>
                </div>
              )}
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
              <h2 className="text-2xl font-black mb-8">Input Visitasi</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tanggal & Waktu</label>
                      <input
                        required
                        type="datetime-local"
                        value={formData.tglVisitasi}
                        onChange={(e) => setFormData({...formData, tglVisitasi: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Email</label>
                      <input
                        required
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Pilih PK (Master PK)</label>
                    <select
                      required
                      value={formData.idPK}
                      onChange={(e) => handlePKChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="" disabled>Pilih PK</option>
                      {pkList.map(p => (
                        <option key={p.id} value={p.pkId}>{p.namaPK} ({p.pkId})</option>
                      ))}
                    </select>
                  </div>

                  {formData.zona && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Zona</p>
                          <p className="text-sm font-black text-amber-500">{formData.zona}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Organisasi</p>
                          <p className="text-sm font-black text-amber-500">{formData.organisasi}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Agenda</label>
                    <textarea
                      required
                      placeholder="Agenda visitasi..."
                      value={formData.agenda}
                      onChange={(e) => setFormData({...formData, agenda: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Coordinate GPS</label>
                      <input
                        type="text"
                        placeholder="Lat, Long"
                        value={formData.gps}
                        onChange={(e) => setFormData({...formData, gps: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Foto Audit (URL)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.fotoUrl}
                        onChange={(e) => setFormData({...formData, fotoUrl: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Skor Penilaian</label>
                      <input
                        required
                        type="number"
                        value={formData.skor}
                        onChange={(e) => setFormData({...formData, skor: parseInt(e.target.value)})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Jumlah Kader</label>
                      <input
                        required
                        type="number"
                        value={formData.jumlahKader}
                        onChange={(e) => setFormData({...formData, jumlahKader: parseInt(e.target.value)})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Masalah Utama</label>
                    <textarea
                      required
                      placeholder="Masalah utama yang ditemukan..."
                      value={formData.masalahUtama}
                      onChange={(e) => setFormData({...formData, masalahUtama: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Saran Advokasi</label>
                    <textarea
                      required
                      placeholder="Saran advokasi..."
                      value={formData.saranAdvokasi}
                      onChange={(e) => setFormData({...formData, saranAdvokasi: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="Belum Terlaksana">Belum Terlaksana</option>
                      <option value="Terlaksana">Terlaksana</option>
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
                    SIMPAN VISITASI
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

export default DataVisitasi;
