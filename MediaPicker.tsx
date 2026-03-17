import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Video, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaPickerProps {
  onSelect: (file: File, type: 'image' | 'video') => void;
  onClose: () => void;
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setSelectedFile(file);
      setMediaType(type);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect(selectedFile, mediaType);
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-900">
        <button onClick={onClose} className="p-2 text-white hover:bg-zinc-900 rounded-full transition">
          <X size={24} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">Kirim Media</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          mediaType === 'image' ? (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={previewUrl} controls className="max-w-full max-h-full" />
          )
        ) : (
          <div className="flex flex-col items-center gap-4 text-zinc-700">
            <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center">
              <Camera size={48} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Pilih dari Galeri atau Kamera</p>
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="p-6 bg-zinc-950 border-t border-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-zinc-500 hover:text-emerald-500 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <ImageIcon size={24} />
            </div>
            <span className="text-[10px] font-black uppercase">Galeri</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-zinc-500 hover:text-emerald-500 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <Camera size={24} />
            </div>
            <span className="text-[10px] font-black uppercase">Kamera</span>
          </button>

          <button 
            onClick={handleConfirm}
            disabled={!selectedFile}
            className="w-16 h-16 bg-emerald-600 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
          >
            <Check size={32} strokeWidth={3} />
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />
      </div>
    </motion.div>
  );
}
