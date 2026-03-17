import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FirebaseProvider } from './components/FirebaseProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/Toast';
import AppLayout from './components/Layout/AppLayout';
import Beranda from './pages/Beranda';
import Login from './pages/Login';
import DataMasterPK from './pages/DataMasterPK';
import DataVisitasi from './pages/DataVisitasi';
import DataAnggota from './pages/DataAnggota';
import SuratMasuk from './pages/SuratMasuk';
import SuratKeluar from './pages/SuratKeluar';
import DatabasePimpinan from './pages/DatabasePimpinan';
import Pelaporan from './pages/Pelaporan';
import Agenda from './pages/Agenda';
import PengaturanUser from './pages/PengaturanUser';
import AlQuran from './pages/AlQuran';
import PerpustakaanAI from './pages/PerpustakaanAI';
import ChatE2EE from './pages/ChatE2EE';
import PengembanganKader from './pages/PengembanganKader';
import Beasiswa from './pages/Beasiswa';
import TemplateSurat from './pages/TemplateSurat';
import KasInventaris from './pages/KasInventaris';
import KasInventarisTemplate from './pages/KasInventarisTemplate';
import KunjunganAnggota from './pages/KunjunganAnggota';
import AdminUserManagement from './pages/AdminUserManagement';

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Beranda />} />
                <Route path="chat" element={<ChatE2EE />} />
                <Route path="anggota" element={<DataAnggota />} />
                <Route path="visitasi" element={<DataVisitasi />} />
                <Route path="surat-masuk" element={<SuratMasuk />} />
                <Route path="surat-keluar" element={<SuratKeluar />} />
                <Route path="kas" element={<KasInventaris />} />
                <Route path="kas-template" element={<KasInventarisTemplate />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="laporan" element={<Pelaporan />} />
                <Route path="beasiswa" element={<Beasiswa />} />
                <Route path="perpustakaan" element={<PerpustakaanAI />} />
                <Route path="kaderisasi" element={<PengembanganKader />} />
                <Route path="templates" element={<TemplateSurat />} />
                <Route path="admin/users" element={<AdminUserManagement />} />
                <Route path="admin/pk" element={<DataMasterPK />} />
                <Route path="kunjungan" element={<KunjunganAnggota />} />
                
                {/* Legacy/Other routes */}
                <Route path="database-pimpinan" element={<DatabasePimpinan />} />
                <Route path="pengaturan" element={<PengaturanUser />} />
                <Route path="alquran" element={<AlQuran />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
