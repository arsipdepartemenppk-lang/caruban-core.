import React, { useState, useEffect, useRef } from 'react';
import { Search, Book, ArrowLeft, Play, Pause, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: {
    [key: string]: string;
  };
}

const AlQuran: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<any | null>(null);
  const [ayats, setAyats] = useState<Ayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('https://equran.id/api/v2/surat')
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const fetchAyats = async (nomor: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
      const data = await res.json();
      setAyats(data.data.ayat);
      setSelectedSurah(data.data);
    } catch (error) {
      console.error('Error fetching ayats:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (url: string, id: number) => {
    if (playingAudio === id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(id);
      }
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nomor.toString().includes(searchTerm)
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      
      {!selectedSurah ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">Al-Qur'an</h1>
            <p className="text-zinc-500 text-sm">Baca dan pelajari kitab suci setiap hari</p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input
              type="text"
              placeholder="Cari Surah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Memuat Surah...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSurahs.map((surah) => (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  key={surah.nomor}
                  onClick={() => fetchAyats(surah.nomor)}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:bg-zinc-900 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-500 font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {surah.nomor}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">{surah.namaLatin}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{surah.arti} • {surah.jumlahAyat} Ayat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-arabic text-emerald-500">{surah.nama}</p>
                    <ChevronRight size={16} className="text-zinc-700 ml-auto mt-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setSelectedSurah(null)} className="p-2 bg-zinc-900 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black">{selectedSurah.namaLatin}</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{selectedSurah.arti} • {selectedSurah.jumlahAyat} Ayat</p>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-10 text-center mb-10 relative overflow-hidden">
            <Book className="absolute -right-8 -bottom-8 text-emerald-500/5 w-48 h-48" />
            <h2 className="text-4xl font-black mb-2">{selectedSurah.namaLatin}</h2>
            <p className="text-emerald-500 font-bold mb-6 uppercase tracking-[0.2em] text-xs">{selectedSurah.arti}</p>
            <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className="bg-zinc-900 px-4 py-2 rounded-full">{selectedSurah.tempatTurun}</span>
              <span className="bg-zinc-900 px-4 py-2 rounded-full">{selectedSurah.jumlahAyat} Ayat</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Memuat Ayat...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {ayats.map((ayat) => (
                <div key={ayat.nomorAyat} className="space-y-6 border-b border-zinc-900 pb-12 last:border-0">
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-xs font-black text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      {ayat.nomorAyat}
                    </div>
                    <button
                      onClick={() => playAudio(Object.values(ayat.audio)[0] as string, ayat.nomorAyat)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        playingAudio === ayat.nomorAyat ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}
                    >
                      {playingAudio === ayat.nomorAyat ? <Pause size={18} fill="white" /> : <Volume2 size={18} />}
                    </button>
                  </div>
                  <p className="text-4xl text-right font-arabic leading-[2] mb-6 text-zinc-100" dir="rtl">
                    {ayat.teksArab}
                  </p>
                  <div className="space-y-3">
                    <p className="text-xs text-emerald-500/80 font-bold italic tracking-wide leading-relaxed">{ayat.teksLatin}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">{ayat.teksIndonesia}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AlQuran;
