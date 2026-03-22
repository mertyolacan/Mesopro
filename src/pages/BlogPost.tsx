import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, BookOpen, User } from 'lucide-react';
import { getBlogPost } from '../api';
import { BlogPost } from '../types';
import { SEOHead } from '../components/SEOHead';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getBlogPost(slug)
      .then(data => { setPost(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-surface-400" />
          </div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Yazı Bulunamadı</h1>
          <p className="text-surface-500 mb-6">Aradığınız blog yazısı mevcut değil veya kaldırılmış olabilir.</p>
          <button onClick={() => navigate('/blog')} className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm transition-all">
            Blog'a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-24 pb-16">
      <SEOHead
        seoData={null}
        overrides={{
          title: post.seo_title || post.title,
          description: post.seo_description || post.excerpt || undefined,
          ogTitle: post.seo_title || post.title,
          ogDescription: post.seo_description || post.excerpt || undefined,
          ogImage: post.cover_image || undefined,
        }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Blog'a Dön
        </motion.button>

        {/* Cover */}
        {post.cover_image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-[16/9] rounded-3xl overflow-hidden bg-surface-100 dark:bg-surface-800 mb-8 shadow-lg"
          >
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Article */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Tags */}
          {(post.tags || []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {post.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg">
                  <Tag size={9} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 dark:text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-surface-400 mb-8 pb-8 border-b border-surface-100 dark:border-surface-800">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              <span className="font-semibold text-surface-600 dark:text-surface-300">{post.author_name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
            </span>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed mb-8 font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-surface dark:prose-invert max-w-none
              prose-headings:font-black prose-headings:text-surface-900 dark:prose-headings:text-white
              prose-p:text-surface-600 dark:prose-p:text-surface-300 prose-p:leading-relaxed
              prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl prose-img:shadow-md
              prose-blockquote:border-brand-500 prose-blockquote:bg-brand-50 dark:prose-blockquote:bg-brand-900/10 prose-blockquote:rounded-r-2xl prose-blockquote:py-1
              prose-code:text-brand-600 dark:prose-code:text-brand-400 prose-code:bg-brand-50 dark:prose-code:bg-brand-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.article>
      </div>
    </div>
  );
}
