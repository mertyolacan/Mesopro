import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Tag, BookOpen } from 'lucide-react';
import { getBlogPosts } from '../api';
import { BlogPost } from '../types';
import { SEOHead } from '../components/SEOHead';

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getBlogPosts().then(data => { setPosts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  const filtered = activeTag ? posts.filter(p => (p.tags || []).includes(activeTag)) : posts;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-24 pb-16">
      <SEOHead seoData={null} overrides={{ title: 'Blog — MesoPro', description: 'Mezoterapi, cilt bakımı ve sağlık hakkında uzman içerikler.' }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-3">Blog</h1>
          <p className="text-surface-500">Mezoterapi ve cilt bakımı hakkında uzman içerikler</p>
        </motion.div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            <button onClick={() => setActiveTag('')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!activeTag ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white dark:bg-surface-900 text-surface-500 border border-surface-200 dark:border-surface-800'}`}>
              Tümü
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${activeTag === tag ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white dark:bg-surface-900 text-surface-500 border border-surface-200 dark:border-surface-800'}`}>
                <Tag size={11} /> {tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-surface-400">Henüz yayımlanmış yazı yok.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-surface-200/50 dark:hover:shadow-black/50 transition-all cursor-pointer group"
              >
                {post.cover_image ? (
                  <div className="aspect-[16/9] overflow-hidden bg-surface-100 dark:bg-surface-800">
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center">
                    <BookOpen size={40} className="text-brand-400" />
                  </div>
                )}
                <div className="p-6">
                  {(post.tags || []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg">{tag}</span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-black text-surface-900 dark:text-white text-base leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-surface-500 line-clamp-2 mb-4">{post.excerpt}</p>}
                  <div className="flex items-center gap-2 text-xs text-surface-400">
                    <Calendar size={12} />
                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                    <span className="ml-auto font-semibold">{post.author_name}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
