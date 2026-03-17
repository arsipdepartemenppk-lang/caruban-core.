import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Trash2, UserPlus, MapPin, Phone, GraduationCap, Award, Heart, Upload, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Member {
  id: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  noHp: string;
  namaSekolah: string;
  alamatSekolah: string;
  kelasTingkat: string;
  domisili: string;
  makestaTahun: string;
  makestaPenyelenggara: string;
  lakmudTahun: string;
  lakmudPenyelenggara: string;
  lakutTahun: string;
  lakutPenyelenggara: string;
  minatBakat: string;
  fotoUrl: string;
}

const MINAT_BAKAT_OPTIONS = [
  'Seni Musik', 'Seni Tari', 'Seni Lukis', 'Olahraga', 'Teknologi', 
  'Literasi', 'Public Speaking', 'Organisasi', 'Keagamaan', 'Lainnya'
];

const DataAnggota: React.FC = () => {
  const { user, role } = useFirebase();
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minatFilter, setMinatFilter] = useState<string>('Semua');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    noHp: '',
    namaSekolah: '',
    alamatSekolah: '',
    kelasTingkat: '',
    domisili: '',
    makestaTahun: '',
    makestaPenyelenggara: '',
    lakmudTahun: '',
    lakmudPenyelenggara: '',
    lakutTahun: '',
    lakutPenyelenggara: '',
    minatBakat: '',
    fotoUrl: ''
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `members/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setFormData(prev => ({ ...prev, fotoUrl: url }));
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('namaLengkap', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(membersData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.namaLengkap.trim()) {
      showToast('Nama Lengkap harus diisi', 'error');
      return;
    }
    if (!formData.noHp.trim()) {
      showToast('Nomor HP harus diisi', 'error');
      return;
    }
    if (!formData.namaSekolah.trim()) {
      showToast('Nama Sekolah harus diisi', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'members'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      showToast('Data anggota berhasil disimpan', 'success');
      setIsModalOpen(false);
      setFormData({
        namaLengkap: '',
        tempatLahir: '',
        tanggalLahir: '',
        noHp: '',
        namaSekolah: '',
        alamatSekolah: '',
        kelasTingkat: '',
        domisili: '',
        makestaTahun: '',
        makestaPenyelenggara: '',
        lakmudTahun: '',
        lakmudPenyelenggara: '',
        lakutTahun: '',
        lakutPenyelenggara: '',
        minatBakat: '',
        fotoUrl: ''
      });
    } catch (error) {
      console.error('Error adding member:', error);
      showToast('Gagal menyimpan data anggota', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteDoc(doc(db, 'members', deleteConfirm.id));
      showToast('Data anggota berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting member:', error);
      showToast('Gagal menghapus data anggota', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaSekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.domisili.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMinat = minatFilter === 'Semua' || m.minatBakat === minatFilter;
    
    return matchesSearch && matchesMinat;
  });

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Anggota</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Database Kader Caruban Core</p>
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
              placeholder="Cari nama, sekolah, atau domisili..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm placeholder:text-zinc-700"
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
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Minat & Bakat</label>
                  <select
                    value={minatFilter}
                    onChange={(e) => setMinatFilter(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Semua">Semua Minat & Bakat</option>
                    {MINAT_BAKAT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 relative overflow-hidden group hover:border-emerald-500/50 hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-emerald-500/30 transition-colors">
                  {member.fotoUrl ? (
                    <img src={member.fotoUrl} alt={member.namaLengkap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-500/50">
                      <UserPlus size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight group-hover:text-emerald-400 transition-colors">{member.namaLengkap}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                    <GraduationCap size={10} /> {member.namaSekolah} ({member.kelasTingkat})
                  </p>
                </div>
              </div>
              {(role === 'admin' || role === 'pimpinan') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ isOpen: true, id: member.id });
                  }}
                  className="p-2 text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="flex items-center gap-2 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-900 group-hover:border-emerald-500/20 transition-colors">
                <Phone size={12} className="text-emerald-500" /> {member.noHp}
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-900 group-hover:border-emerald-500/20 transition-colors">
                <MapPin size={12} className="text-emerald-500" /> {member.domisili}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {member.makestaTahun && (
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                  MAKESTA {member.makestaTahun}
                </span>
              )}
              {member.lakmudTahun && (
                <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                  LAKMUD {member.lakmudTahun}
                </span>
              )}
              {member.lakutTahun && (
                <span className="px-4 py-1.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                  LAKUT {member.lakutTahun}
                </span>
              )}
              <span className="px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                {member.minatBakat}
              </span>
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
              <h2 className="text-2xl font-black mb-8">Tambah Anggota</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Foto Profil</h3>
                    <label className="flex-1 cursor-pointer bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-400 hover:border-emerald-500 transition-all flex items-center gap-3">
                      <Upload size={20} />
                      {uploading ? 'Mengunggah...' : 'Pilih Foto'}
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Data Pribadi</h3>
                    <input
                      required
                      type="text"
                      placeholder="Nama Lengkap"
                      value={formData.namaLengkap}
                      onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        required
                        type="text"
                        placeholder="Tempat Lahir"
                        value={formData.tempatLahir}
                        onChange={(e) => setFormData({...formData, tempatLahir: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                      <input
                        required
                        type="date"
                        value={formData.tanggalLahir}
                        onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all text-zinc-400"
                      />
                    </div>
                    <input
                      required
                      type="tel"
                      placeholder="No. HP (WhatsApp)"
                      value={formData.noHp}
                      onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Domisili"
                      value={formData.domisili}
                      onChange={(e) => setFormData({...formData, domisili: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Pendidikan</h3>
                    <input
                      required
                      type="text"
                      placeholder="Nama Sekolah"
                      value={formData.namaSekolah}
                      onChange={(e) => setFormData({...formData, namaSekolah: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Alamat Sekolah"
                      value={formData.alamatSekolah}
                      onChange={(e) => setFormData({...formData, alamatSekolah: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Kelas/Tingkat"
                      value={formData.kelasTingkat}
                      onChange={(e) => setFormData({...formData, kelasTingkat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Kaderisasi</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Tahun MAKESTA"
                        value={formData.makestaTahun}
                        onChange={(e) => setFormData({...formData, makestaTahun: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Penyelenggara"
                        value={formData.makestaPenyelenggara}
                        onChange={(e) => setFormData({...formData, makestaPenyelenggara: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Tahun LAKMUD"
                        value={formData.lakmudTahun}
                        onChange={(e) => setFormData({...formData, lakmudTahun: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Penyelenggara"
                        value={formData.lakmudPenyelenggara}
                        onChange={(e) => setFormData({...formData, lakmudPenyelenggara: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Tahun LAKUT"
                        value={formData.lakutTahun}
                        onChange={(e) => setFormData({...formData, lakutTahun: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Penyelenggara"
                        value={formData.lakutPenyelenggara}
                        onChange={(e) => setFormData({...formData, lakutPenyelenggara: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Minat & Bakat</h3>
                    <select
                      required
                      value={formData.minatBakat}
                      onChange={(e) => setFormData({...formData, minatBakat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="" disabled>Pilih Minat & Bakat</option>
                      {MINAT_BAKAT_OPTIONS.map(opt => (
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
                    SIMPAN ANGGOTA
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-zinc-950 rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-zinc-900 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-black mb-8">Detail Anggota</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                    {selectedMember.fotoUrl ? (
                      <img src={selectedMember.fotoUrl} alt={selectedMember.namaLengkap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-500/50">
                        <UserPlus size={40} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{selectedMember.namaLengkap}</h3>
                    <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest">{selectedMember.namaSekolah}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Tempat/Tgl Lahir</p>
                    <p className="text-sm font-bold mt-1">{selectedMember.tempatLahir}, {selectedMember.tanggalLahir}</p>
                  </div>
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">No. HP</p>
                    <p className="text-sm font-bold mt-1">{selectedMember.noHp}</p>
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Domisili</p>
                  <p className="text-sm font-bold mt-1">{selectedMember.domisili}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Kaderisasi</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 font-black uppercase">MAKESTA</p>
                      <p className="text-xs font-bold mt-1">{selectedMember.makestaTahun || '-'}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 font-black uppercase">LAKMUD</p>
                      <p className="text-xs font-bold mt-1">{selectedMember.lakmudTahun || '-'}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 font-black uppercase">LAKUT</p>
                      <p className="text-xs font-bold mt-1">{selectedMember.lakutTahun || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Hapus Anggota"
        message="Apakah Anda yakin ingin menghapus data anggota ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default DataAnggota;
