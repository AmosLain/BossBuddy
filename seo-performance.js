// ===================================
// SEO OPTIMIZATION SETUP
// ===================================

// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://bossbuddy.ai',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/admin/*', '/api/*'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://bossbuddy.ai/sitemap-blog.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
  },
  transform: async (config, path) => {
    // Custom priority for important pages
    if (path === '/') return { loc: path, priority: 1.0 };
    if (path === '/pricing') return { loc: path, priority: 0.9 };
    if (path.startsWith('/blog/')) return { loc: path, priority: 0.8 };
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};

// ===================================
// SEO COMPONENTS
// ===================================

// components/SEO.tsx
import Head from 'next/head';

export const SEO = ({ 
  title = 'BossBuddy - Never Stress About Work Emails Again',
  description = 'Transform casual messages into professional communications in seconds. AI-powered email assistant for workplace communication. Only $1.99/month.',
  canonical,
  image = 'https://bossbuddy.ai/og-image.png',
  type = 'website',
  date,
  author = 'BossBuddy',
  keywords = 'professional email, work communication, email templates, message rewriter, AI writing assistant'
}) => {
  const siteName = 'BossBuddy';
  const twitterHandle = '@bossbuddy_ai';
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical || 'https://bossbuddy.ai'} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Article Meta (for blog posts) */}
      {type === 'article' && (
        <>
          <meta property="article:published_time" content={date} />
          <meta property="article:author" content={author} />
        </>
      )}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': type === 'article' ? 'BlogPosting' : 'SoftwareApplication',
            name: 'BossBuddy',
            description,
            url: canonical || 'https://bossbuddy.ai',
            image,
            ...(type === 'article' ? {
              headline: title,
              datePublished: date,
              author: {
                '@type': 'Person',
                name: author,
              },
            } : {
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '1.99',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '2847',
              },
            }),
          }),
        }}
      />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  );
};

// ===================================
// LANDING PAGE SEO CONTENT
// ===================================

// pages/index.tsx - SEO Optimized Landing Page
export const LandingPageSEO = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BossBuddy',
    url: 'https://bossbuddy.ai',
    description: 'AI-powered professional email assistant',
    applicationCategory: 'CommunicationApplication',
    screenshot: 'https://bossbuddy.ai/screenshot.png',
    featureList: [
      'Professional email rewriting',
      '12+ communication tones',
      'Gmail and Outlook integration',
      'Chrome extension',
      'Message history'
    ],
    offers: {
      '@type': 'Offer',
      price: '1.99',
      priceCurrency: 'USD',
      priceValidUntil: '2025-12-31'
    },
    creator: {
      '@type': 'Organization',
      name: 'BossBuddy Inc.',
      url: 'https://bossbuddy.ai'
    }
  };
  
  return (
    <>
      <SEO 
        title="BossBuddy - Professional Email Assistant | Never Stress About Work Messages"
        description="Transform casual messages into professional emails in seconds. AI-powered writing assistant for workplace communication. Free trial, only $1.99/month."
        keywords="professional email writer, work email templates, email to boss, message rewriter, AI email assistant, workplace communication tool, business email generator"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
};

// ===================================
// BLOG POST TEMPLATE FOR SEO
// ===================================

// pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';

export const BlogPost = ({ post }) => {
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://bossbuddy.ai/author/${post.author.slug}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'BossBuddy',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bossbuddy.ai/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://bossbuddy.ai/blog/${post.slug}`
    }
  };
  
  return (
    <>
      <SEO
        title={`${post.title} | BossBuddy Blog`}
        description={post.excerpt}
        canonical={`https://bossbuddy.ai/blog/${post.slug}`}
        type="article"
        date={post.publishedAt}
        author={post.author.name}
        image={post.featuredImage}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <article>
        {/* Blog content */}
      </article>
    </>
  );
};

// ===================================
// PERFORMANCE MONITORING
// ===================================

// lib/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any[]> = new Map();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }
  
  // Track page load performance
  trackPageLoad() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
      
      this.sendMetrics('page_load', metrics);
    });
  }
  
  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined') return;
    
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.sendMetrics('web_vitals', { lcp: lastEntry.startTime });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.sendMetrics('web_vitals', { 
          fid: entry.processingStart - entry.startTime 
        });
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.sendMetrics('web_vitals', { cls: clsValue });
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  // Track API performance
  trackAPI(endpoint: string, duration: number, status: number) {
    this.sendMetrics('api_performance', {
      endpoint,
      duration,
      status,
      timestamp: Date.now()
    });
  }
  
  // Send metrics to analytics
  private sendMetrics(category: string, data: any) {
    // Send to your analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', category, data);
    }
    
    // Store locally for dashboard
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    this.metrics.get(category)?.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Send to monitoring service
    this.sendToMonitoring(category, data);
  }
  
  private async sendToMonitoring(category: string, data: any) {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, data })
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

// ===================================
// PERFORMANCE OPTIMIZATION
// ===================================

// next.config.js
module.exports = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['bossbuddy.ai'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };
    }
    
    return config;
  },
};

// ===================================
// LAZY LOADING COMPONENTS
// ===================================

// components/LazyLoad.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
export const LazyPaymentModal = dynamic(
  () => import('./PaymentModal'),
  {
    loading: () => <div className="animate-pulse">Loading payment options...</div>,
    ssr: false
  }
);

export const LazyAnalytics = dynamic(
  () => import('./AnalyticsDashboard'),
  {
    loading: () => <div className="animate-pulse">Loading analytics...</div>,
    ssr: false
  }
);

// Image lazy loading with blur placeholder
import Image from 'next/image';

export const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
      loading="lazy"
      {...props}
    />
  );
};

// ===================================
// API RESPONSE CACHING
// ===================================

// lib/cache.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export const cachedFetch = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
};

// Usage in API routes
export async function GET(req: Request) {
  const data = await cachedFetch('analytics-dashboard', async () => {
    // Expensive database query
    return await getAnalyticsData();
  });
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59'
    }
  });
}

// ===================================
// DATABASE QUERY OPTIMIZATION
// ===================================

// lib/db-optimization.ts
export const optimizedQueries = {
  // Use indexes effectively
  getUserWithSubscription: async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          where: { status: 'active' }
        }
      }
    });
  },
  
  // Batch operations
  updateMultipleUsers: async (userIds: string[], data: any) => {
    return await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data
    });
  },
  
  // Use raw queries for complex operations
  getAnalyticsData: async (timeframe: string) => {
    return await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as signups,
        COUNT(CASE WHEN plan != 'free' THEN 1 END) as paid_users,
        SUM(CASE WHEN plan = 'pro' THEN 1.99 WHEN plan = 'pro_plus' THEN 4.99 ELSE 0 END) as revenue
      FROM users
      WHERE created_at >= NOW() - INTERVAL ${timeframe}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
  }
};