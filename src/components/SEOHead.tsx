import { useEffect } from 'react';
import { SEOPage } from '../types';

interface SEOHeadProps {
  page?: string;
  seoData?: SEOPage | null;
  overrides?: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    keywords?: string;
  };
  structuredData?: object | object[];
}

function setMeta(name: string, content: string, isProperty = false) {
  if (!content) return;
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setStructuredData(data: object | object[]) {
  const existing = document.querySelector('script[data-seo-ld]');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo-ld', '1');
  script.textContent = JSON.stringify(Array.isArray(data) ? data : data);
  document.head.appendChild(script);
}

export function SEOHead({ page: _page, seoData, overrides, structuredData }: SEOHeadProps) {
  useEffect(() => {
    const title = overrides?.title || seoData?.title;
    const description = overrides?.description || seoData?.description;
    const ogTitle = overrides?.ogTitle || seoData?.og_title || title;
    const ogDescription = overrides?.ogDescription || seoData?.og_description || description;
    const ogImage = overrides?.ogImage || seoData?.og_image;
    const ogType = overrides?.ogType || 'website';
    const ogUrl = window.location.href;

    const keywords = overrides?.keywords || seoData?.meta_keywords;

    if (title) document.title = title;
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);

    // Open Graph
    if (ogTitle) setMeta('og:title', ogTitle, true);
    if (ogDescription) setMeta('og:description', ogDescription, true);
    if (ogImage) setMeta('og:image', ogImage, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', ogUrl, true);

    // Twitter Cards
    const twitterCard = seoData?.twitter_card || 'summary_large_image';
    const twitterTitle = seoData?.twitter_title || ogTitle || '';
    const twitterDescription = seoData?.twitter_description || ogDescription || '';
    setMeta('twitter:card', twitterCard);
    if (twitterTitle) setMeta('twitter:title', twitterTitle);
    if (twitterDescription) setMeta('twitter:description', twitterDescription);
    if (ogImage) setMeta('twitter:image', ogImage);

    if (seoData?.robots) setMeta('robots', seoData.robots);
    if (seoData?.canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = seoData.canonical;
    }
  }, [seoData, overrides]);

  useEffect(() => {
    if (structuredData) {
      setStructuredData(structuredData);
    }
    return () => {
      document.querySelector('script[data-seo-ld]')?.remove();
    };
  }, [structuredData]);

  return null;
}
