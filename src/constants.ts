import { Product } from './types';

// Seed data — used only by Admin panel's "seedProducts" function
// to bulk-insert demo products into the database.
export const PRODUCTS: Product[] = [
  {
    id: 'nctf-5x3',
    name: 'Nctf 135 HA (5x3 ml)',
    brand: 'Filorga',
    category: 'Mezoterapi Kokteylleri',
    problem: ['anti-aging', 'nemlendirme', 'aydınlatma'],
    basePrice: 6000,
    image: 'https://picsum.photos/seed/nctf/600/600',
    description: 'Cilt kalitesini artıran, 59 aktif bileşen içeren efsanevi mezoterapi kokteyli.',
    ingredients: 'Hyaluronik Asit + 12 Vitamin + 24 Amino Asit + 6 Koenzim + 5 Nükleik Asit + 6 Mineral.',
    indications: 'İnce çizgiler, nemsizlik, mat cilt görünümü.',
    applicationArea: 'Yüz, boyun, dekolte, eller.',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'tiziano-2x10',
    name: 'Tiziano (2x10 ml)',
    brand: 'Tiziano',
    category: 'Mezoterapi Kokteylleri',
    problem: ['anti-aging', 'sarkma'],
    basePrice: 11000,
    image: 'https://picsum.photos/seed/tiziano/600/600',
    description: 'Cilt sıkılaştırma ve lifting etkili güçlü mezoterapi solüsyonu.',
    ingredients: 'DMAE, Organik Silisyum, Amino Asitler.',
    indications: 'Cilt sarkması, elastikiyet kaybı.',
    applicationArea: 'Yüz ovali, boyun.',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'jalupro-hydro',
    name: 'Jalupro Süper Hydro (1x2.5 ml)',
    brand: 'Jalupro',
    category: 'Mezoterapi Kokteylleri',
    problem: ['anti-aging', 'nemlendirme', 'sarkma'],
    basePrice: 6000,
    image: 'https://picsum.photos/seed/jalupro/600/600',
    description: 'Ligament bağlarını güçlendiren ve derin nemlendirme sağlayan biyorevitalizan.',
    ingredients: '7 Amino Asit + 3 Peptit + Yüksek Moleküler Ağırlıklı HA.',
    indications: 'Yüz bağlarının gevşemesi, şiddetli nemsizlik.',
    applicationArea: 'Yüz (6 nokta tekniği).',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'yellow-bottle',
    name: 'Yellow Bottle (10x5 ml)',
    brand: 'Yellow Bottle',
    category: 'Mezoterapi Kokteylleri',
    problem: ['leke', 'aydınlatma'],
    basePrice: 5000,
    image: 'https://picsum.photos/seed/yellow/600/600',
    description: 'Cilt tonu eşitleyici ve aydınlatıcı etkili özel formül.',
    ingredients: 'C Vitamini, Glutatyon, Traneksamik Asit.',
    indications: 'Leke tedavisi, donuk cilt.',
    applicationArea: 'Tüm yüz.',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'haircare-10x5',
    name: 'Haircare (10x5 ml)',
    brand: 'Revitacare',
    category: 'Mezoterapi Kokteylleri',
    problem: ['saç dökülmesi'],
    basePrice: 7000,
    image: 'https://picsum.photos/seed/haircare/600/600',
    description: 'Saç dökülmesini durduran ve saç kalitesini artıran kompleks.',
    ingredients: 'Amino Asitler, Vitaminler, Çinko.',
    indications: 'Saç dökülmesi, cansız saçlar.',
    applicationArea: 'Saçlı deri.',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'cytocare-10x5',
    name: 'Cytocare 532 (10x5 ml)',
    brand: 'Revitacare',
    category: 'Mezoterapi Kokteylleri',
    problem: ['anti-aging', 'nemlendirme'],
    basePrice: 10000,
    image: 'https://picsum.photos/seed/cytocare/600/600',
    description: 'Yoğun anti-aging ve nemlendirme sağlayan mezoterapi kokteyli.',
    ingredients: '32 mg Hyaluronik Asit + CT50 Kompleksi.',
    indications: 'Derin kırışıklıklar, yoğun nemsizlik.',
    applicationArea: 'Yüz, boyun.',
    warnings: 'Profesyonel kullanım içindir.'
  },
  {
    id: 'whitenova-plla',
    name: 'WhiteNova 420 mg PLLA (8cc)',
    brand: 'WhiteNova',
    category: 'Saf Asitler',
    problem: ['sarkma', 'anti-aging'],
    basePrice: 6000,
    image: 'https://picsum.photos/seed/whitenova/600/600',
    description: 'Kolajen üretimini tetikleyen sıvı PLLA (Poli-L-Laktik Asit).',
    ingredients: '420 mg PLLA.',
    indications: 'Hacim kaybı, derin sarkmalar.',
    applicationArea: 'Yüz, vücut.',
    warnings: '8cc sulandırma ile uygulanmalıdır. Profesyonel kullanım içindir.'
  }
];
