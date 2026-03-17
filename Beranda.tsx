import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../utils/firebaseUtils';
import { auth, db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { useTheme } from '../components/ThemeProvider';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  limit, updateDoc, doc, arrayUnion, arrayRemove,
  where, Timestamp
} from 'firebase/firestore';
import { 
  Send, Heart, MessageCircle, Share2, MoreHorizontal, 
  Plus, Image as ImageIcon, Video, Music, Smile, Play,
  Users, Compass, FileText, Calendar, BarChart, X,
  Camera, ChevronRight, Layout, Building2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaPicker from '../components/MediaPicker';
import { cn } from '../lib/utils';

export default function Beranda() {
  const { db, user, role } = useFirebase();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const isDark = theme === 'dark';
  const [stories, setStories] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'post' | 'story'>('post');
  const [selectedMedia, setSelectedMedia] = useState<{file: File, type: 'image' | 'video'} | null>(null);

  useEffect(() => {
    if (!db) return;
    
    // Fetch Posts
    const qPosts = query(collection(db, 'internal_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Stories (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const qStories = query(
      collection(db, 'stories'), 
      where('createdAt', '>', new Date()),
      orderBy('createdAt', 'desc')
    );
    const unsubStories = onSnapshot(qStories, (snapshot) => {
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPosts();
      unsubStories();
    };
  }, [db]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedMedia) return;
    setIsUploading(true);
    try {
      // Simulate upload
      const mediaUrl = selectedMedia 
        ? (selectedMedia.type === 'image' ? `https://picsum.photos/seed/${Math.random()}/1080/1080` : 'https://www.w3schools.com/html/mov_bbb.mp4')
        : '';

      await addDoc(collection(db, 'internal_posts'), {
        content: newPost,
        authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonim',
        authorPhoto: user?.photoURL || '',
        authorUid: user?.uid,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        mediaType: selectedMedia?.type || 'text',
        mediaUrl: mediaUrl
      });
      setNewPost('');
      setSelectedMedia(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'internal_posts', auth);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateStory = async (file: File, type: 'image' | 'video') => {
    setIsUploading(true);
    try {
      const mediaUrl = type === 'image' 
        ? `https://picsum.photos/seed/${Math.random()}/1080/1920` 
        : 'https://www.w3schools.com/html/mov_bbb.mp4';

      await addDoc(collection(db, 'stories'), {
        authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonim',
        authorPhoto: user?.photoURL || '',
        authorUid: user?.uid,
        createdAt: new Date().toISOString(),
        mediaType: type,
        mediaUrl: mediaUrl
      });
      setShowMediaPicker(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stories', auth);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!user || !db) return;
    const postRef = doc(db, 'internal_posts', postId);
    try {
      if (currentLikes.includes(user.uid)) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `internal_posts/${postId}`, auth);
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!user || !db || !commentText.trim()) return;
    const postRef = doc(db, 'internal_posts', postId);
    try {
      const newComment = {
        uid: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonim',
        text: commentText,
        createdAt: new Date().toISOString()
      };
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `internal_posts/${postId}`, auth);
    }
  };

  return (
    <div className={cn(
      "flex flex-col lg:flex-row min-h-full transition-colors duration-500",
      isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 lg:border-r transition-colors",
        isDark ? "border-zinc-900" : "border-zinc-200"
      )}>
        {/* Stories Section */}
        <div className={cn(
          "flex gap-4 p-4 overflow-x-auto no-scrollbar border-b transition-colors",
          isDark ? "border-zinc-900 bg-zinc-950/50" : "border-zinc-200 bg-white"
        )}>
          {/* Add Story */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button 
              onClick={() => { setMediaPickerTarget('story'); setShowMediaPicker(true); }}
              className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-blue-500 relative active:scale-95 transition-all"
            >
              <div className={cn(
                "w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden transition-colors",
                isDark ? "bg-zinc-900 border-black" : "bg-white border-zinc-100"
              )}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Plus size={24} className="text-emerald-500" />
                )}
              </div>
              <div className={cn(
                "absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 transition-colors",
                isDark ? "border-black" : "border-white"
              )}>
                <Plus size={10} className="text-white" />
              </div>
            </button>
            <span className="text-[10px] font-bold text-zinc-400">Cerita</span>
          </div>
          
          {/* Active Stories */}
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500">
                <div className={cn(
                  "w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden transition-colors",
                  isDark ? "bg-zinc-900 border-black" : "bg-white border-zinc-100"
                )}>
                  <img src={story.authorPhoto || `https://ui-avatars.com/api/?name=${story.authorName}`} alt={story.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 truncate w-16 text-center">{story.authorName}</span>
            </div>
          ))}
        </div>

        {/* Post Input */}
        <div className={cn(
          "p-4 border-b transition-colors",
          isDark ? "border-zinc-900 bg-zinc-950/30" : "border-zinc-200 bg-white"
        )}>
          <form onSubmit={handlePost} className="space-y-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.email?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <textarea 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Apa yang terjadi di Caruban?" 
                  className={cn(
                    "w-full bg-transparent py-2 text-sm outline-none resize-none min-h-[40px] max-h-[120px] transition-colors",
                    isDark ? "text-white" : "text-zinc-900"
                  )}
                />
                {selectedMedia && (
                  <div className={cn(
                    "relative w-24 h-24 rounded-2xl overflow-hidden border transition-colors",
                    isDark ? "border-zinc-800" : "border-zinc-200"
                  )}>
                    {selectedMedia.type === 'image' ? (
                      <img src={URL.createObjectURL(selectedMedia.file)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={URL.createObjectURL(selectedMedia.file)} className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => setSelectedMedia(null)}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-4 text-zinc-500">
                <button 
                  type="button" 
                  onClick={() => { setMediaPickerTarget('post'); setShowMediaPicker(true); }}
                  className="hover:text-emerald-400 transition"
                >
                  <ImageIcon size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => { setMediaPickerTarget('post'); setShowMediaPicker(true); }}
                  className="hover:text-blue-400 transition"
                >
                  <Video size={20} />
                </button>
                <button type="button" className="hover:text-purple-400 transition"><Music size={20} /></button>
                <button type="button" className="hover:text-amber-400 transition"><Smile size={20} /></button>
              </div>
              <button 
                type="submit" 
                disabled={(!newPost.trim() && !selectedMedia) || isUploading}
                className="bg-emerald-600 disabled:opacity-50 text-white text-xs font-black px-6 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
              >
                {isUploading ? 'MENGIRIM...' : 'POSTING'}
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="flex-1">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={() => handleLike(post.id, post.likes || [])} 
              onComment={(text) => handleComment(post.id, text)}
              currentUser={user}
              isDark={isDark}
            />
          ))}
          
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 text-zinc-600">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors",
                isDark ? "bg-zinc-900" : "bg-zinc-100"
              )}>
                <MessageCircle size={40} />
              </div>
              <p className="font-bold">Belum ada postingan</p>
              <p className="text-xs">Jadilah yang pertama berbagi!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="hidden lg:block w-80 p-6 space-y-8 sticky top-0 h-screen overflow-y-auto no-scrollbar">
        {/* Profile Summary */}
        <div className={cn(
          "border rounded-3xl p-6 transition-all",
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h4 className={cn(
                "font-black text-sm leading-tight transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>{user?.displayName || 'User Caruban'}</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{role}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className={cn(
                "text-lg font-black transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>{posts.filter(p => p.authorUid === user?.uid).length}</p>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Postingan</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-lg font-black transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>{stories.filter(s => s.authorUid === user?.uid).length}</p>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Cerita</p>
            </div>
          </div>
        </div>

        {/* Quick Stats / Info */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Statistik Caruban</h5>
          <div className="space-y-3">
            <div className={cn(
              "border rounded-2xl p-4 flex items-center justify-between transition-all",
              isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-300">Total Anggota</span>
              </div>
              <span className={cn(
                "text-sm font-black transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>1.2k</span>
            </div>
            <div className={cn(
              "border rounded-2xl p-4 flex items-center justify-between transition-all",
              isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Building2 size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-300">Lembaga Aktif</span>
              </div>
              <span className={cn(
                "text-sm font-black transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>42</span>
            </div>
            <div className={cn(
              "border rounded-2xl p-4 flex items-center justify-between transition-all",
              isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-300">Visitasi Bulan Ini</span>
              </div>
              <span className={cn(
                "text-sm font-black transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}>12</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="pt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex flex-wrap gap-x-4 gap-y-2">
          <a href="#" className="hover:text-zinc-400 transition">Tentang</a>
          <a href="#" className="hover:text-zinc-400 transition">Bantuan</a>
          <a href="#" className="hover:text-zinc-400 transition">Privasi</a>
          <a href="#" className="hover:text-zinc-400 transition">Ketentuan</a>
          <p className={cn(
            "w-full mt-4 transition-colors",
            isDark ? "text-zinc-800" : "text-zinc-400"
          )}>© 2026 CARUBAN DIGITAL</p>
        </div>
      </div>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showMediaPicker && (
          <MediaPicker 
            onSelect={(file, type) => {
              if (mediaPickerTarget === 'post') {
                setSelectedMedia({ file, type });
                setShowMediaPicker(false);
              } else {
                handleCreateStory(file, type);
              }
            }}
            onClose={() => setShowMediaPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface PostCardProps {
  post: any;
  onLike: () => void | Promise<void>;
  onComment: (text: string) => void | Promise<void>;
  currentUser: any;
  isDark: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, currentUser, isDark }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const lastTap = useRef(0);

  useEffect(() => {
    setIsLiked(post.likes?.includes(currentUser?.uid));
  }, [post.likes, currentUser]);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTap.current = now;
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onComment(commentText);
    setCommentText('');
  };

  return (
    <div className={cn(
      "border-b last:border-0 transition-colors",
      isDark ? "border-zinc-900 bg-black" : "border-zinc-200 bg-white"
    )}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-full border overflow-hidden transition-colors",
            isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
          )}>
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-500">
                {post.authorName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-sm font-black leading-tight transition-colors",
              isDark ? "text-white" : "text-zinc-900"
            )}>{post.authorName}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
              {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <button className="text-zinc-600 hover:text-white transition">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content / Media */}
      <div 
        className={cn(
          "relative w-full flex items-center justify-center overflow-hidden cursor-pointer transition-colors",
          isDark ? "bg-zinc-900" : "bg-zinc-100"
        )}
        onClick={handleDoubleTap}
      >
        {post.mediaUrl ? (
          post.mediaType === 'video' ? (
            <div className="relative w-full aspect-video">
              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <img src={post.mediaUrl} alt="Post" className="w-full object-cover" referrerPolicy="no-referrer" />
          )
        ) : (
          <div className="p-12 text-center w-full aspect-square flex items-center justify-center">
            <p className={cn(
              "text-xl font-medium leading-relaxed italic transition-colors",
              isDark ? "text-zinc-200" : "text-zinc-700"
            )}>"{post.content}"</p>
          </div>
        )}

        {/* Double Tap Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute pointer-events-none z-10"
            >
              <Heart size={100} fill="#10b981" className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onLike}
              className={cn("transition-all active:scale-125", isLiked ? "text-emerald-500" : (isDark ? "text-white" : "text-zinc-900"))}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={cn("transition-all active:scale-125", showComments ? "text-emerald-500" : (isDark ? "text-white" : "text-zinc-900"))}
            >
              <MessageCircle size={24} strokeWidth={2.5} />
            </button>
            <button className={cn(
              "transition-all active:scale-125",
              isDark ? "text-white hover:text-zinc-400" : "text-zinc-900 hover:text-zinc-600"
            )}>
              <Share2 size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn(
                "w-5 h-5 rounded-full border-2 transition-colors",
                isDark ? "bg-zinc-800 border-black" : "bg-zinc-200 border-white"
              )} />
            ))}
          </div>
        </div>

        {/* Likes & Caption */}
        <div className="space-y-1">
          <p className={cn(
            "text-xs font-black transition-colors",
            isDark ? "text-white" : "text-zinc-900"
          )}>
            {post.likes?.length || 0} Suka
          </p>
          <div className="text-sm leading-snug">
            <span className={cn(
              "font-black mr-2 transition-colors",
              isDark ? "text-white" : "text-zinc-900"
            )}>{post.authorName}</span>
            <span className={cn(
              "transition-colors",
              isDark ? "text-zinc-300" : "text-zinc-600"
            )}>{post.content}</span>
          </div>
          
          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "mt-4 space-y-3 border-t pt-4 transition-colors",
                  isDark ? "border-zinc-900" : "border-zinc-100"
                )}
              >
                {post.comments?.map((comment: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-xs">
                    <span className={cn(
                      "font-black shrink-0 transition-colors",
                      isDark ? "text-white" : "text-zinc-900"
                    )}>{comment.userName}</span>
                    <span className="text-zinc-400">{comment.text}</span>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <p className="text-[10px] text-zinc-600 italic">Belum ada komentar.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showComments && post.comments?.length > 0 && (
            <button 
              onClick={() => setShowComments(true)}
              className="text-xs font-bold text-zinc-600 mt-1"
            >
              Lihat semua {post.comments.length} komentar
            </button>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSendComment} className="flex items-center gap-3 pt-2">
          <div className={cn(
            "w-6 h-6 rounded-full overflow-hidden shrink-0 transition-colors",
            isDark ? "bg-zinc-800" : "bg-zinc-100"
          )}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[8px] text-zinc-500">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tambah komentar..." 
            className={cn(
              "flex-1 bg-transparent text-xs outline-none transition-colors",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          />
          <button 
            type="submit"
            disabled={!commentText.trim()}
            className="text-emerald-500 font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
