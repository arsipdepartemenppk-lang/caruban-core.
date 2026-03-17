import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '../components/FirebaseProvider';
import { Plus, Search, Trash2, FileOutput, Calendar, Send, CheckCircle2, Clock, Upload, Loader2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuratKeluar {
  id: string;
  noSurat: string;
  tglSurat: string;
  tglDikirim: string;
  tujuanSurat: string;
  perihal: string;
  status: 'Terkirim' | 'Tertunda';
  fileUrl?: string;
}

const SuratKeluar: React.FC = () => {
  const { user, role } = useFirebase();
  const [suratList, setSuratList] = useState<SuratKeluar[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    noSurat: '',
    tglSurat: '',
    tglDikirim: '',
    tujuanSurat: '',
    perihal: '',
    status: 'Tertunda' as const,
    fileUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'suratKeluar'), orderBy('tglDikirim', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SuratKeluar[];
      setSuratList(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tglSurat || !formData.tglDikirim) {
      alert('Tanggal surat dan tanggal dikirim harus diisi!');
      return;
    }
    try {
      await addDoc(collection(db, 'suratKeluar'), {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setFormData({
        noSurat: '',
        tglSurat: '',
        tglDikirim: '',
        tujuanSurat: '',
        perihal: '',
        status: 'Tertunda',
        fileUrl: ''
      });
    } catch (error) {
      console.error('Error adding surat keluar:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'suratKeluar', id), {
        status: currentStatus === 'Terkirim' ? 'Tertunda' : 'Terkirim'
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data surat ini?')) {
      try {
        await deleteDoc(doc(db, 'suratKeluar', id));
      } catch (error) {
        console.error('Error deleting surat:', error);
      }
    }
  };

  const filtered = suratList.filter(s => 
    s.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tujuanSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.perihal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-center mb-8 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Surat Keluar</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Arsip Surat Keluar</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-rose-600 rounded-2xl shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
        <input
          type="text"
          placeholder="Cari nomor, tujuan, atau perihal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-rose-500 transition-all text-sm"
        />
      </div>

      <div className="space-y-6">
        {filtered.map((s) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={s.id}
            className={`bg-zinc-900/30 border rounded-[32px] p-8 transition-all hover:border-rose-500/50 ${
              s.status === 'Tertunda' ? 'border-rose-500/30' : 'border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  s.status === 'Tertunda' 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                    : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                }`}>
                  <FileOutput size={28} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{s.noSurat}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{s.tujuanSurat}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(s.id, s.status)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                    s.status === 'Terkirim' 
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-zinc-600 bg-zinc-950 border-zinc-800'
                  }`}
                >
                  {s.status === 'Terkirim' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </button>
                {(role === 'admin' || role === 'pimpinan') && (
                  <button
                    onClick={() => handleDelete(s.id)}
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
                  <Calendar size={12} className="text-rose-500" /> {s.tglSurat}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <Send size={12} className="text-rose-500" /> {s.status}
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
              <h2 className="text-2xl font-black mb-8">Input Surat Keluar</h2>
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
                            
                            const storageRef = ref(storage, `suratKeluar/${Date.now()}_${file.name}`);
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
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-rose-600 file:text-white hover:file:bg-rose-700"
                        />
                        {uploadProgress !== null && uploadStatus === 'uploading' && (
                          <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                            <div className="bg-rose-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
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
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all"
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
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tgl Dikirim</label>
                      <input
                        required
                        type="date"
                        value={formData.tglDikirim}
                        onChange={(e) => setFormData({...formData, tglDikirim: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tujuan Surat</label>
                    <input
                      required
                      type="text"
                      placeholder="Instansi / Lembaga tujuan..."
                      value={formData.tujuanSurat}
                      onChange={(e) => setFormData({...formData, tujuanSurat: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Perihal</label>
                    <textarea
                      required
                      placeholder="Isi ringkas perihal surat..."
                      value={formData.perihal}
                      onChange={(e) => setFormData({...formData, perihal: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-rose-500 transition-all appearance-none text-zinc-400"
                    >
                      <option value="Tertunda">Tertunda</option>
                      <option value="Terkirim">Terkirim</option>
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
                    className="flex-1 bg-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-900/20 active:scale-95 transition-all"
                  >
                    SIMPAN SURAT
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

export default SuratKeluar;
