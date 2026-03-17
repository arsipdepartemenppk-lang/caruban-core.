import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '../components/FirebaseProvider';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Trash2, FileText, Calendar, Send, CheckCircle2, Clock, Upload, X, Loader2, AlertCircle, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface SuratMasuk {
  id: string;
  noSurat: string;
  tglSurat: string;
  tglDiterima: string;
  asalSurat: string;
  perihal: string;
  disposisi: string;
  status: 'Sudah Dibaca' | 'Belum Dibaca';
  fileUrl?: string;
}

const DISPOSISI_OPTIONS = ['Ketua', 'Sekretaris', 'Bendahara', 'Wakil Ketua I', 'Wakil Ketua II', 'Lainnya'];

const SuratMasuk: React.FC = () => {
  const { user, role } = useFirebase();
  const { showToast } = useToast();
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Sudah Dibaca' | 'Belum Dibaca'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    noSurat: '',
    tglSurat: '',
    tglDiterima: '',
    asalSurat: '',
    perihal: '',
    disposisi: '',
    status: 'Belum Dibaca' as const,
    fileUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'suratMasuk'), orderBy('tglDiterima', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SuratMasuk[];
      setSuratList(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noSurat.trim()) {
      showToast('Nomor surat harus diisi', 'error');
      return;
    }
    if (!formData.tglSurat || !formData.tglDiterima) {
      showToast('Tanggal surat dan tanggal diterima harus diisi!', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'suratMasuk'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      showToast('Surat masuk berhasil disimpan', 'success');
      setIsModalOpen(false);
      setFormData({
        noSurat: '',
        tglSurat: '',
        tglDiterima: '',
        asalSurat: '',
        perihal: '',
        disposisi: '',
        status: 'Belum Dibaca',
        fileUrl: ''
      });
    } catch (error) {
      console.error('Error adding surat masuk:', error);
      showToast('Gagal menyimpan surat masuk', 'error');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'suratMasuk', id), {
        status: currentStatus === 'Sudah Dibaca' ? 'Belum Dibaca' : 'Sudah Dibaca'
      });
      showToast('Status surat berhasil diperbarui', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Gagal memperbarui status surat', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteDoc(doc(db, 'suratMasuk', deleteConfirm.id));
      showToast('Surat masuk berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting surat:', error);
      showToast('Gagal menghapus surat masuk', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const filtered = suratList.filter(s => {
    const matchesSearch = s.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.asalSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || s.status === statusFilter;
    const matchesDate = (!startDate || s.tglDiterima >= startDate) && (!endDate || s.tglDiterima <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Surat Masuk</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Arsip Surat Masuk</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-purple-600 rounded-2xl shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center"
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
              placeholder="Cari nomor, asal, atau perihal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all",
              showFilters ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
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
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Sudah Dibaca">Sudah Dibaca</option>
                    <option value="Belum Dibaca">Belum Dibaca</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Dari Tanggal</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-purple-500 text-zinc-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-purple-500 text-zinc-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        {filtered.map((s) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={s.id}
            className={`bg-zinc-900/30 border rounded-[32px] p-8 transition-all hover:border-purple-500/50 ${
              s.status === 'Belum Dibaca' ? 'border-purple-500/30' : 'border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  s.status === 'Belum Dibaca' 
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                    : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                }`}>
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{s.noSurat}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{s.asalSurat}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(s.id, s.status)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                    s.status === 'Sudah Dibaca' 
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-zinc-600 bg-zinc-950 border-zinc-800'
                  }`}
                >
                  {s.status === 'Sudah Dibaca' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </button>
                {(role === 'admin' || role === 'pimpinan') && (
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: s.id })}
                    className="w-10 h-10 text-zinc-600 hover:text-rose-500 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-900">
                <p className="text-sm text-zinc-300 font-medium leading-relaxed">{s.perihal}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <Calendar size={12} className="text-purple-500" /> {s.tglSurat}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <Send size={12} className="text-purple-500" /> {s.disposisi}
                </div>
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
              <h2 className="text-2xl font-black mb-8">Input Surat Masuk</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">File Surat</label>
                    <div className="flex items-center gap-4">
                      <div className="w-full">
                        <input
                          type="file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setUploadStatus('uploading');
                            setUploadProgress(0);
                            
                            const storageRef = ref(storage, `suratMasuk/${Date.now()}_${file.name}`);
                            const uploadTask = uploadBytesResumable(storageRef, file);
                            
                            uploadTask.on('state_changed', 
                              (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress);
                              }, 
                              (error) => {
                                console.error('Upload error:', error);
                                setUploadStatus('error');
                              }, 
                              async () => {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                setFormData({...formData, fileUrl: url});
                                setUploadStatus('success');
                              }
                            );
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                        />
                        {uploadProgress !== null && uploadStatus === 'uploading' && (
                          <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                        {uploadStatus === 'success' && (
                          <p className="mt-2 text-xs text-emerald-500 flex items-center gap-2"><CheckCircle2 size={12} /> Berhasil diunggah</p>
                        )}
                        {uploadStatus === 'error' && (
                          <p className="mt-2 text-xs text-rose-500 flex items-center gap-2"><AlertCircle size={12} /> Gagal diunggah</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nomor Surat</label>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nomor surat..."
                      value={formData.noSurat}
                      onChange={(e) => setFormData({...formData, noSurat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tgl Surat</label>
                      <input
                        required
                        type="date"
                        value={formData.tglSurat}
                        onChange={(e) => setFormData({...formData, tglSurat: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tgl Terima</label>
                      <input
                        required
                        type="date"
                        value={formData.tglDiterima}
                        onChange={(e) => setFormData({...formData, tglDiterima: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Asal Surat</label>
                    <input
                      required
                      type="text"
                      placeholder="Instansi / Lembaga pengirim..."
                      value={formData.asalSurat}
                      onChange={(e) => setFormData({...formData, asalSurat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Perihal</label>
                    <textarea
                      required
                      placeholder="Isi ringkas perihal surat..."
                      value={formData.perihal}
                      onChange={(e) => setFormData({...formData, perihal: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Disposisi</label>
                    <select
                      required
                      value={formData.disposisi}
                      onChange={(e) => setFormData({...formData, disposisi: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="" disabled>Pilih Disposisi</option>
                      {DISPOSISI_OPTIONS.map(opt => (
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
                    className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN SURAT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Hapus Surat Masuk"
        message="Apakah Anda yakin ingin menghapus data surat masuk ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default SuratMasuk;
