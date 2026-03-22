import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { getFAQs, getSEOPage } from '../api';
import { FAQ, SEOPage } from '../types';
import { SEOHead } from '../components/SEOHead';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Genel',
  order: 'Sipariş & Teslimat',
  product: 'Ürünler',
  technical: 'Teknik',
};

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [seoData, setSeoData] = useState<SEOPage | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFAQs(),
      getSEOPage('sss'),
    ]).then(([faqData, seo]) => {
      setFaqs(faqData);
      setSeoData(seo && Object.keys(seo).length ? seo : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categorySet = new Set<string>(faqs.map((f: FAQ) => f.category));
  const categories: string[] = ['all', ...Array.from(categorySet)];

  const filtered = faqs.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const faqStructuredData = useMemo(() => {
    if (!faqs.length) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
  }, [faqs]);

  const seoFallback = { title: 'Sıkça Sorulan Sorular — MesoPro', description: 'MesoPro hakkında merak ettiğiniz soruların cevaplarını burada bulabilirsiniz.' };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-24 pb-16">
      <SEOHead
        seoData={seoData}
        overrides={seoData ? undefined : seoFallback}
        structuredData={faqStructuredData}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={32} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-3">Sıkça Sorulan Sorular</h1>
          <p className="text-surface-500">Aradığınız cevabı bulamazsanız <a href="/destek" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">destek ekibimizle</a> iletişime geçin.</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Soru veya cevap ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
          />
        </motion.div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white dark:bg-surface-900 text-surface-500 border border-surface-200 dark:border-surface-800 hover:border-brand-300'}`}
              >
                {cat === 'all' ? 'Tümü' : (CATEGORY_LABELS[cat] || cat)}
              </button>
            ))}
          </div>
        )}

        {/* FAQ List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-surface-400 text-lg">Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-bold text-surface-900 dark:text-white text-sm leading-relaxed">{faq.question}</span>
                  <motion.div animate={{ rotate: openId === faq.id ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-surface-400">
                    <ChevronDown size={18} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <div className="h-px bg-surface-100 dark:bg-surface-800 mb-4" />
                        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
