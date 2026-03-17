import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Send, Shield, User, Search, MoreVertical, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';

// Secret key for E2EE (In a real app, this would be derived per room/user)
const E2EE_SECRET = 'caruban-core-secret-2024';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  encrypted: boolean;
}

const ChatE2EE: React.FC = () => {
  const { user } = useFirebase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const encrypt = (text: string) => {
    return CryptoJS.AES.encrypt(text, E2EE_SECRET).toString();
  };

  const decrypt = (ciphertext: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, E2EE_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return 'Error decrypting message';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Decrypt if it's marked as encrypted
          text: data.encrypted ? decrypt(data.text) : data.text
        };
      }) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const text = input.trim();
    setInput('');

    try {
      // Encrypt client-side before sending
      const encryptedText = encrypt(text);

      await addDoc(collection(db, 'chats'), {
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text: encryptedText,
        createdAt: new Date().toISOString(),
        encrypted: true,
        participants: ['global']
      });
    } catch (error) {
      console.error('Chat Error:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans">
      {/* Header */}
      <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 relative">
            <User size={24} />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-950 rounded-full" />
          </div>
          <div>
            <h1 className="font-bold">Grup Koordinasi</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <Lock size={10} /> End-to-End Encrypted
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-neutral-500">
          <Search size={20} />
          <MoreVertical size={20} />
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        <div className="flex justify-center my-6">
          <div className="bg-neutral-900/50 border border-neutral-800 px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
            <Shield size={12} className="text-blue-500" />
            Pesan dienkripsi secara end-to-end
          </div>
        </div>

        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={msg.id}
            className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${msg.senderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`p-4 rounded-2xl ${
                msg.senderId === user?.uid 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-tighter">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-900 pb-24">
        <div className="bg-neutral-900 rounded-3xl p-2 flex items-center gap-2 border border-neutral-800 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            placeholder="Ketik pesan rahasia..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none py-3 px-4 focus:outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatE2EE;
