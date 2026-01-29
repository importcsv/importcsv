import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages();

  return pages.map((page) => ({
    url: `https://docs.importcsv.com${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.url === '/' ? 1 : 0.8,
  }));
}
