import React from 'react';
import { 
  X, 
  Tag,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, Product, Category } from '../../types';

interface CampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  activeCampaignIds: number[];
  products: Product[];
  categories: Category[];
}

export const CampaignsModal = ({ isOpen, onClose, campaigns, activeCampaignIds, products, categories }: CampaignsModalProps) => {
  const getCampaignCondition = (c: Campaign) => {
    let details = '';
    if (c.type === 'product' && c.targetValue) {
      const p = products.find(prod => String(prod.id) === String(c.targetValue));
      details = `Sadece "${p?.name || c.targetValue}" ürününde geçerlidir. `;
    } else if (c.type === 'category' && c.targetValue) {
      const cat = categories.find(ct => ct.name === c.targetValue || String(ct.id) === String(c.targetValue));
      details = `"${cat?.name || c.targetValue}" kategorisindeki ürünlerde geçerlidir. `;
    }

    const minDetails = [];
    if (c.minQuantity) minDetails.push(`Min. ${c.minQuantity} adet`);
    if (c.minAmount) minDetails.push(`Min. ₺${c.minAmount.toLocaleString()}`);

    const result = `${details}${minDetails.length > 0 ? `(${minDetails.join(', ')})` : ''}`.trim();
    return result || 'Bu kampanya tüm ürünlerde ve alt limit olmaksızın geçerlidir.';
  };

  const getCampaignBenefit = (c: Campaign) => {
    if (c.description) return c.description;
    
    if (c.discountType === 'percentage') {
      return `%${c.discountValue} oranında anında indirim kazanırsınız.`;
    } else if (c.discountType === 'fixed') {
      return `₺${c.discountValue.toLocaleString()} tutarında indirim kazanırsınız.`;
    }
    return 'Belirtilmedi';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-surface-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-surface-100 dark:border-surface-900"
          >
            <div className="p-6 sm:p-8 border-b border-surface-100 dark:border-surface-900 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight flex items-center gap-3">
                  <Tag className="text-brand-500" /> Aktif Kampanyalar
                </h3>
                <p className="text-xs text-surface-500 mt-1 uppercase font-bold tracking-widest">Fırsatları Kaçırmayın</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-2xl transition-all text-surface-400">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-surface-50/50 dark:bg-surface-900/10">
              {campaigns.length === 0 ? (
                <div className="py-12 text-center text-surface-500">Şu an aktif kampanya bulunmamaktadır.</div>
              ) : (
                campaigns.map((c) => {
                  const isActive = activeCampaignIds.includes(c.id);
                  return (
                    <motion.div 
                      key={c.id}
                      className={`p-6 rounded-2xl border-2 transition-all group ${isActive ? 'bg-brand-500/10 border-brand-500/20 shadow-lg shadow-brand-500/5' : 'bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${isActive ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>
                            {isActive ? <ShoppingCart size={24} /> : <Tag size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-surface-900 dark:text-white text-sm sm:text-base uppercase tracking-tight">{c.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               {isActive && <span className="text-[10px] font-black bg-brand-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Uygulandı</span>}
                               {!isActive && <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Beklemede</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg sm:text-xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">İNDİRİM</div>
                           <div className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">FIRSATI</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
                              <span className="text-[9px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest block mb-2">Kampanya Koşulu</span>
                              <p className="text-xs font-bold text-surface-600 dark:text-surface-300 leading-relaxed">{getCampaignCondition(c)}</p>
                           </div>
                           <div className="p-4 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl border border-brand-500/10">
                              <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-2">Kampanya Avantajı</span>
                              <p className="text-xs font-black text-brand-700 dark:text-brand-400 leading-relaxed">{getCampaignBenefit(c)}</p>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
            
            <div className="p-6 sm:p-8 bg-surface-50 dark:bg-surface-900/30 border-t border-surface-100 dark:border-surface-900 border-dashed">
               <button 
                 onClick={onClose}
                 className="w-full py-4 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl"
               >
                 ALIŞVERİŞE DEVAM ET <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
