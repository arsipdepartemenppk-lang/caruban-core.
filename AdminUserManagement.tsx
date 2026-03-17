import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseUtils';
import { auth, db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Users, Shield, User as UserIcon, Search, Database, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUserManagement: React.FC = () => {
  const { user, role } = useFirebase();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`, auth);
    }
  };

  const seedDummyData = async () => {
    if (!window.confirm('Hasilkan data dummy untuk semua modul? Ini akan menambah banyak data baru.')) return;
    setIsSeeding(true);
    setSeedStatus('Memulai seeding...');

    try {
      // 1. Members
      setSeedStatus('Seeding Data Anggota...');
      const members = [
        { namaLengkap: '', tempatLahir: '', tanggalLahir: '--', noHp: '', namaSekolah: ' ', alamatSekolah: '', kelasTingkat: '', domisili: ' ', makestaTahun: '', makestaPenyelenggara: '', minatBakat: '' },
        { namaLengkap: '', tempatLahir: '', tanggalLahir: '', noHp: '', namaSekolah: '', alamatSekolah: '', kelasTingkat: '', domisili: '', makestaTahun: '', makestaPenyelenggara: '', minatBakat: ' ' }
      ];
      for (const m of members) await addDoc(collection(db, 'members'), { ...m, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 2. Pimpinan
      setSeedStatus('Seeding Data Pimpinan...');
      const pimpinan = [
        { namapimpinan: '', namaKetua: '', noHp: '', alamatDomisili: '', masaKhidmat: '', statusPimpinan: '' },
        { namapimpinan: '', namaKetua: '', noHp: '', alamatDomisili: '', masaKhidmat: '', statusPimpinan: '' }
      ];
      for (const p of pimpinan) await addDoc(collection(db, 'pimpinan'), { ...p, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 3. Master PK
      setSeedStatus('Seeding Master PK...');
      const pks = [
        { pkId: 'PK.001', namaPK: 'PK SMA N 1 Cirebon', alamat: 'Jl. Kartini No. 1', zona: 'Zona 1', koorzon: 'Koorzon 1', status: 'Aktif' },
        { pkId: 'PK.002', namaPK: 'PK MA N 2 Cirebon', alamat: 'Jl. Pilang Raya', zona: 'Zona 2', koorzon: 'Koorzon 2', status: 'Aktif' }
      ];
      for (const pk of pks) await addDoc(collection(db, 'pks'), { ...pk, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 4. Surat Masuk
      setSeedStatus('Seeding Surat Masuk...');
      const surat = [
        { noSurat: '001/PC/A/III/2024', tglSurat: '2024-03-10', tglDiterima: '2024-03-12', asalSurat: 'PC IPNU Cirebon', perihal: 'Undangan Rapat Pleno', disposisi: 'Ketua', status: 'Belum Dibaca' }
      ];
      for (const s of surat) await addDoc(collection(db, 'suratMasuk'), { ...s, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 5. Kaderisasi
      setSeedStatus('Seeding Pengembangan Kader...');
      const kader = [
        { namaProgram: 'Pelatihan Jurnalistik', deskripsi: 'Pelatihan dasar kepenulisan dan pengelolaan media sosial organisasi.' },
        { namaProgram: 'Latihan Instruktur', deskripsi: 'Pencetakan instruktur handal untuk mengawal kaderisasi formal.' }
      ];
      for (const k of kader) await addDoc(collection(db, 'kaderisasi'), { ...k, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 6. Beasiswa
      setSeedStatus('Seeding Info Beasiswa...');
      const beasiswa = [
        { judul: 'Beasiswa Santri Berprestasi', deskripsi: 'Bantuan biaya pendidikan untuk kader yang sedang menempuh pendidikan di pesantren.', link: 'https://google.com' }
      ];
      for (const b of beasiswa) await addDoc(collection(db, 'beasiswa'), { ...b, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 7. Inventaris
      setSeedStatus('Seeding Inventaris...');
      const inventaris = [
        { namaBarang: 'Laptop Kantor', kondisi: 'Baik' },
        { namaBarang: 'Printer Epson', kondisi: 'Rusak Ringan' }
      ];
      for (const i of inventaris) await addDoc(collection(db, 'kas_inventaris'), { ...i, createdAt: new Date().toISOString(), createdBy: user?.uid });

      // 8. Kas Transaksi
      setSeedStatus('Seeding Kas Transaksi...');
      const transactions = [
        { deskripsi: 'Saldo Awal Kas', jumlah: 1000000, tipe: 'Masuk' },
        { deskripsi: 'Pembelian ATK', jumlah: 150000, tipe: 'Keluar' },
        { deskripsi: 'Iuran Anggota', jumlah: 500000, tipe: 'Masuk' }
      ];
      for (const t of transactions) await addDoc(collection(db, 'kas_transaksi'), { ...t, createdAt: new Date().toISOString(), createdBy: user?.uid });

      setSeedStatus('Seeding Selesai!');
      setTimeout(() => {
        setIsSeeding(false);
        setSeedStatus('');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_data', auth);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-black">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[32px] flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
          <Shield size={48} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-4">AKSES DITOLAK</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Halaman ini hanya untuk Administrator</p>
      </div>
    );
  }

  const filtered = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <div className="flex justify-between items-start mb-12 pt-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">USER MANAGEMENT</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Kontrol Akses Pengguna</p>
        </div>
        <button
          onClick={seedDummyData}
          disabled={isSeeding}
          className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
            isSeeding ? 'bg-zinc-900 text-zinc-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20'
          }`}
        >
          <Database size={16} />
          {isSeeding ? 'Seeding...' : 'Seed Data'}
        </button>
      </div>

      <AnimatePresence>
        {seedStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[32px] flex items-center gap-4 text-indigo-400 text-xs font-black uppercase tracking-widest"
          >
            <CheckCircle2 size={20} />
            {seedStatus}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
        <input
          type="text"
          placeholder="Cari email user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-all text-sm"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(u => (
          <motion.div 
            layout
            key={u.id} 
            className="bg-zinc-900/30 p-6 rounded-[32px] border border-zinc-800 flex justify-between items-center group hover:border-indigo-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                u.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                u.role === 'pimpinan' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-950 text-zinc-600 border-zinc-900'
              }`}>
                <UserIcon size={28} />
              </div>
              <div>
                <p className="font-black text-lg leading-tight truncate max-w-[150px]">{u.email?.split('@')[0]}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{u.email}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Shield size={10} className={u.role === 'admin' ? 'text-rose-500' : 'text-zinc-600'} />
                  <p className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.2em]">{u.role || 'anggota'}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <select 
                value={u.role || 'anggota'}
                onChange={(e) => updateRole(u.id, e.target.value)}
                className="bg-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl p-4 border border-zinc-900 focus:border-indigo-500 outline-none appearance-none pr-10"
              >
                <option value="admin">Admin</option>
                <option value="pimpinan">Pimpinan</option>
                <option value="anggota">Anggota</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700">
                <Shield size={12} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminUserManagement;
