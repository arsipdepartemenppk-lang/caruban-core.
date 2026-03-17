import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Sparkles, BookOpen, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PerpustakaanAI: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "Anda adalah asisten AI untuk Perpustakaan Digital Caruban Core. Anda ahli dalam pengetahuan Islam (Aswaja An-Nahdliyah), sejarah organisasi IPNU IPPNU, dan administrasi organisasi. Berikan jawaban yang bijak, edukatif, dan inspiratif. \n\nCATATAN PENTING: Saya adalah asisten AI dan tidak dapat menyediakan file PDF dari seluruh buku atau naskah di dunia secara langsung karena batasan hak cipta. Namun, saya dapat membantu Anda mencari informasi tentang buku, menjelaskan isi naskah, atau memberikan panduan untuk mengakses sumber daya perpustakaan digital yang legal dan terbuka.",
        },
      });

      const aiText = response.text || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "Terjadi kesalahan koneksi. Silakan coba lagi nanti." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans">
      {/* Header */}
      <div className="p-6 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Perpustakaan AI</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> Online Knowledge Assistant
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([])}
          className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 bg-neutral-900 rounded-[32px] flex items-center justify-center text-neutral-700 mb-6">
              <BookOpen size={40} />
            </div>
            <h2 className="text-xl font-bold mb-2">Selamat Datang di Perpustakaan AI</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Tanyakan apa saja tentang sejarah organisasi, pengetahuan agama, atau panduan administrasi Caruban Core.
            </p>
            <div className="grid grid-cols-1 gap-3 mt-8 w-full max-w-xs">
              {['Sejarah IPNU IPPNU', 'Apa itu Aswaja?', 'Cara membuat surat'].map(q => (
                <button 
                  key={q}
                  onClick={() => setInput(q)}
                  className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-neutral-400 hover:border-emerald-500 hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-emerald-500 text-white rounded-tr-none' 
                : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl rounded-tl-none flex gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-neutral-950 border-t border-neutral-900 pb-28">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            placeholder="Ketik pertanyaan Anda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerpustakaanAI;
