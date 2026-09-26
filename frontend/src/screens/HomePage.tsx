'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import { productAPI, categoryAPI } from '../services/api';
import { Product, Category } from '../types';
import { GridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

const BANNERS = [
  {
    title: 'BIG FASHION FESTIVAL',
    subtitle: 'Up to 70% off on top brands. Free delivery on orders over $50.',
    cta: 'Shop Now',
    gradient: 'linear-gradient(135deg, #ff3f6c 0%, #ff7a97 45%, #ffc48f 100%)',
    accent: '#ffffff',
    icon: '💰',
    link: '/products',
  },
  {
    title: 'TOP TECH BRANDS',
    subtitle: 'Latest gadgets, laptops, and accessories at unbeatable prices.',
    cta: 'Explore Tech',
    gradient: 'linear-gradient(135deg, #14958f 0%, #4fc3bd 50%, #b8ece9 100%)',
    accent: '#ffffff',
    icon: '📱',
    link: '/products?category=electronics',
  },
  {
    title: 'SEASON STYLE SALE',
    subtitle: 'Refresh your wardrobe with trending styles. Extra 20% off on your first order.',
    cta: 'Shop Fashion',
    gradient: 'linear-gradient(135deg, #ff905a 0%, #ffb37e 50%, #ffe3c2 100%)',
    accent: '#ffffff',
    icon: '👗',
    link: '/products?category=fashion',
  },
];

const TRUST_ITEMS = [
  { icon: '📦', title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: '🔒', title: 'Secure Payment', desc: '256-bit SSL encryption' },
  { icon: '🔄', title: 'Easy Returns', desc: '30-day return policy' },
  { icon: '📞', title: '24/7 Support', desc: 'Dedicated help center' },
];

const BRANDS = [
  { name: 'Nike', logo: 'https://cdn.worldvectorlogo.com/logos/nike-4.svg' },
  { name: 'Samsung', logo: 'https://cdn.worldvectorlogo.com/logos/samsung-2.svg' },
  { name: 'Apple', logo: 'https://cdn.worldvectorlogo.com/logos/apple-14.svg' },
  { name: 'Adidas', logo: 'https://cdn.worldvectorlogo.com/logos/adidas-6.svg' },
  { name: 'Sony', logo: 'https://cdn.worldvectorlogo.com/logos/sony-1.svg' },
  { name: 'Puma', logo: 'https://cdn.worldvectorlogo.com/logos/puma.svg' },
  { name: 'LG', logo: 'https://cdn.worldvectorlogo.com/logos/lg-2.svg' },
  { name: 'HP', logo: 'https://cdn.worldvectorlogo.com/logos/hp-2.svg' },
  { name: 'Canon', logo: 'https://cdn.worldvectorlogo.com/logos/canon-1.svg' },
  { name: 'Dell', logo: 'https://cdn.worldvectorlogo.com/logos/dell-1.svg' },
  { name: 'Lenovo', logo: 'https://cdn.worldvectorlogo.com/logos/lenovo-2.svg' },
  { name: 'OnePlus', logo: 'https://cdn.worldvectorlogo.com/logos/oneplus-3.svg' },
];

// Story circles mirror the REAL store categories — every tap lands on products.
const STORY_REELS = [
  { label: 'Fashion', emoji: '👗', slug: 'fashion' },
  { label: 'Electronics', emoji: '💻', slug: 'electronics' },
  { label: 'Home', emoji: '🏠', slug: 'home-kitchen' },
  { label: 'Sports', emoji: '⚽', slug: 'sports-outdoors' },
  { label: 'Beauty', emoji: '💄', slug: 'beauty' },
  { label: 'Books', emoji: '📚', slug: 'books' },
  { label: 'Toys', emoji: '🧸', slug: 'toys-games' },
  { label: 'Automotive', emoji: '🚗', slug: 'automotive' },
];

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  electronics: '📱', fashion: '👗', clothing: '👗', apparel: '👗',
  home: '🏠', kitchen: '🏠', 'home-kitchen': '🏠', furniture: '🏠',
  beauty: '💄', health: '💄', personal: '💄',
  sports: '⚽', outdoors: '⚽', fitness: '⚽',
  books: '📚', education: '📚',
  toys: '🧸', games: '🧸', 'toys-games': '🧸',
  grocery: '🛒', food: '🛒', supermarket: '🛒',
  automotive: '🚗', car: '🚗',
  pets: '🐾', animal: '🐾',
  baby: '👶', kids: '👶',
  jewelry: '💎', accessories: '💎',
};
const getCategoryEmoji = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '📦';
};

// Isolated 1s ticker: only the countdown digits re-render, not the whole page.
const LiveDropTimer: React.FC = React.memo(() => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {['DD', 'HH', 'MM', 'SS'].map((unit, i) => {
        const secs = [86400, 3600, 60, 1][i];
        const mods = [365, 24, 60, 60][i];
        const val = Math.floor((now / 1000 / secs) % mods);
        return (
          <div key={unit} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', minWidth: 48 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {String(val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 2 }}>
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
});
LiveDropTimer.displayName = 'LiveDropTimer';

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dealEndDates, setDealEndDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverCity, setDeliverCity] = useState('New York');
  const [bannerIdx, setBannerIdx] = useState(0);
  const heroShapesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const containerRef = useScrollReveal({ stagger: 80 });

  useEffect(() => {
    const savedCity = localStorage.getItem('deliverCity');
    if (savedCity) setDeliverCity(savedCity);
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecent(stored.slice(0, 8));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Parallax via direct DOM writes (no React state) so scrolling never
    // re-renders the page — this was the main mobile lag source.
    // Disabled entirely on small screens where the effect is invisible anyway.
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    let ticking = false;
    const factors = [0.07, 0.14, 0.05];
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          // Only animate while the hero is on screen.
          if (y < window.innerHeight) {
            const shapes = heroShapesRef.current?.children;
            if (shapes) {
              for (let i = 0; i < shapes.length && i < factors.length; i++) {
                (shapes[i] as HTMLElement).style.transform = `translate3d(0, ${(y * factors[i]).toFixed(1)}px, 0)`;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, allRes] = await Promise.all([
          productAPI.getFeatured(),
          categoryAPI.getAll(),
          productAPI.getAll({ limit: 50, sort: '-created_at' }),
        ]);
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data);
        setAllProducts(allRes.data.data || []);
        const fetchedProducts = allRes.data.data || [];
        const filtered = fetchedProducts
          .filter(
            (p: Product) =>
              p.comparePrice && p.comparePrice > 0 && p.comparePrice > p.price
          )
          .sort((a: Product, b: Product) => {
            const aComp = a.comparePrice || 0;
            const bComp = b.comparePrice || 0;
            const aDisc = aComp > 0 ? ((aComp - a.price) / aComp) * 100 : 0;
            const bDisc = bComp > 0 ? ((bComp - b.price) / bComp) * 100 : 0;
            return bDisc - aDisc;
          })
          .slice(0, 8);
        setDeals(filtered);
        setDealEndDates(
          filtered.map(() => new Date(Date.now() + (3 + Math.random() * 5) * 3600000))
        );
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px' }}>
        <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 12 }} />
        <div style={{ marginTop: 32 }}>
          <GridSkeleton count={4} />
        </div>
      </div>
    );
  }

  const topDeal = deals[0];
  const banner = BANNERS[bannerIdx];

  return (
    <div ref={containerRef}>
      {/* ═══════════════════════════════════════════════════════════════
          1. STORY REELS — horizontal scroll with animated gradient borders
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="reveal"
        data-reveal-delay="0"
        style={{
          padding: '20px 0 8px',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            padding: '8px 16px 16px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {STORY_REELS.map((reel) => (
            <div
              key={reel.slug}
              role="button"
              tabIndex={0}
              aria-label={`Shop ${reel.label}`}
              onClick={() => router.push(`/products?category=${reel.slug}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/products?category=${reel.slug}`);
                }
              }}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                scrollSnapAlign: 'center',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <div
                className="story-ring"
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, var(--primary), var(--secondary), var(--tertiary), var(--primary))',
                  padding: 3,
                  transition: 'transform 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    border: '2px solid var(--bg)',
                  }}
                >
                  {reel.emoji}
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text)',
                textAlign: 'center',
                maxWidth: 72,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {reel.label}
              </span>
            </div>
          ))}
        </div>
        <style>{`
          .story-ring:hover { transform: scale(1.08); }
          .story-ring:active { transform: scale(0.95); }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. HERO EDITORIAL CAROUSEL — full-width card, gradient left, image right
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="hero"
        style={{
          background: BANNERS[bannerIdx].gradient,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="hero-bg-shapes" ref={heroShapesRef}>
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />
        </div>

        <div
          className="hero-animate"
          key={bannerIdx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 48px)',
            padding: 'clamp(24px, 4vw, 48px)',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap',
          }}
        >
          {/* Left content */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <span
              className="hero-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ff0040',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              LIVE DROP
            </span>

            <LiveDropTimer />

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              margin: '0 0 10px',
              color: '#fff',
            }}>
              {banner.title}
            </h1>
            <p style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 480,
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}>
              {banner.subtitle}
            </p>

            <button
              className="hero-cta-primary"
              onClick={() => router.push(banner.link)}
              style={{
                background: '#fff',
                color: 'var(--primary)',
                fontWeight: 700,
                padding: '12px 28px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Shop the Collection →
            </button>
          </div>

          {/* Right — product image */}
          <div style={{
            flex: '0 0 220px',
            maxWidth: 260,
            position: 'relative',
          }}>
            <div style={{
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
            }}>
              <img
                src={featured[bannerIdx]?.images?.[0] || featured[0]?.images?.[0] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" fill="%23f43f5e"><rect width="400" height="240" rx="0"/><text x="200" y="128" text-anchor="middle" fill="white" font-family="sans-serif" font-size="48">' + banner.icon + '</text></svg>')}
                alt={banner.title}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{
                  width: '100%',
                  height: 240,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 16, position: 'relative', zIndex: 1 }}>
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === bannerIdx ? 'active' : ''}`}
              onClick={() => setBannerIdx(idx)}
              aria-label={`Banner ${idx + 1}`}
              style={{
                width: idx === bannerIdx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: idx === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.7); }
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. SUPERCOIN REWARDS BAR — gradient card with shimmer
          ═══════════════════════════════════════════════════════════════ */}
      <section className="reveal" data-reveal-delay="50" style={{ padding: '16px 16px 0', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary), #f7c948)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Shimmer overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.25) 55%, transparent 60%)',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🪙</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                Earn 500 SuperCoins
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                Complete your first order today
              </div>
            </div>
          </div>
          <button
            onClick={() => showToast('SuperCoins claimed! 🎉', 'success')}
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#fff',
              color: 'var(--primary)',
              fontWeight: 700,
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              whiteSpace: 'nowrap',
              transition: 'transform 0.2s',
            }}
          >
            Claim Now
          </button>
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(50%); }
            }
          `}</style>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. CATEGORY BADGES — horizontal scroll, circular icons + labels
          ═══════════════════════════════════════════════════════════════ */}
      <section className="reveal" data-reveal-delay="100" style={{ padding: '24px 0', background: 'var(--bg)' }}>
        <div className="section-header" style={{ padding: '0 16px 12px' }}>
          <div className="section-title">
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Shop by Category</h2>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            padding: '4px 16px 12px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {categories.slice(0, 12).map((cat) => (
            <div
              key={cat._id}
              onClick={() => router.push(`/products?category=${cat.slug}`)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                scrollSnapAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
              }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = getCategoryEmoji(cat.name); }} />
                ) : (
                  getCategoryEmoji(cat.name)
                )}
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                maxWidth: 70,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BRAND MARQUEE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="brand-marquee">
        <div className="brand-marquee-track">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <div key={i} className="brand-marquee-item">
              <img
                src={brand.logo}
                alt={brand.name}
                style={{ height: 28, width: 'auto', filter: 'brightness(0) invert(0.5)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.textContent = brand.name;
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. LIGHTNING DEALS — horizontal scroll with progress bars
          ═══════════════════════════════════════════════════════════════ */}
      {deals.length >= 3 && (
        <section className="reveal" data-reveal-delay="150" style={{ padding: '32px 0 16px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header" style={{ padding: '0 16px 16px' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Lightning Deals</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CountdownTimer endDate={dealEndDates[0] || new Date()} size="small" />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '4px 16px 8px',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
            }}
          >
            {deals.map((product, idx) => {
              const comp = product.comparePrice || 0;
              const discount = comp > 0 ? Math.round(((comp - product.price) / comp) * 100) : 0;
              const claimed = Math.floor(30 + Math.random() * 60);
              return (
                <div
                  key={product._id}
                  className="card"
                  style={{
                    flexShrink: 0,
                    width: 160,
                    scrollSnapAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  {/* Discount badge */}
                  <span style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    -{discount}%
                  </span>

                  <img
                    src={product.images?.[0] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140" fill="%23e5e7eb"><rect width="400" height="140"/><text x="200" y="76" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>')}
                    alt={product.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140" fill="%23e5e7eb"><rect width="400" height="140"/><text x="200" y="76" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>'); }}
                    style={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: '12px 12px 0 0',
                    }}
                  />

                  <div style={{ padding: 10 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                    }}>
                      {product.name}
                    </div>

                    {/* Claimed progress bar */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        fontWeight: 700,
                        marginBottom: 4,
                      }}>
                        {claimed}% claimed
                      </div>
                      <div style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--border)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${claimed}%`,
                          height: '100%',
                          borderRadius: 3,
                          background: 'repeating-linear-gradient(135deg, var(--primary), var(--primary) 4px, var(--tertiary) 4px, var(--tertiary) 8px)',
                          backgroundSize: '200% 100%',
                          animation: 'candyStripe 1s linear infinite',
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                        ${(product.price ?? 0).toFixed(2)}
                      </span>
                      {comp > 0 && (
                        <span style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          textDecoration: 'line-through',
                        }}>
                          ${comp.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            @keyframes candyStripe {
              0% { background-position: 0 0; }
              100% { background-position: 28px 0; }
            }
          `}</style>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. TRENDING PRODUCTS — 2-column grid with ProductCard
          ═══════════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="reveal" data-reveal-delay="200" style={{ padding: '32px 16px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <span style={{ fontSize: 22 }}>🔥</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Trending Products</h2>
            </div>
            <Link href="/products" className="section-link">
              See all →
            </Link>
          </div>
          <div className="product-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {featured.slice(0, 8).map((product, idx) => (
              <div key={product._id} className={`reveal reveal-delay-${idx * 60}`}>
                <ProductCard
                  product={product}
                  badge={idx === 0 ? 'bestseller' : idx === 1 ? 'amazons_choice' : null}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          7. SHOP BY CATEGORY — 3-column grid of category cards
          ═══════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="reveal" data-reveal-delay="250" style={{ padding: '32px 16px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <span style={{ fontSize: 22 }}>✨</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Explore Categories</h2>
            </div>
            <Link href="/products" className="section-link">
              View all →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}>
            {categories.slice(0, 9).map((cat) => (
              <div
                key={cat._id}
                className="card"
                onClick={() => router.push(`/products?category=${cat.slug}`)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '16px 8px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  margin: '0 auto 10px',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  border: '2px solid var(--border)',
                }}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    cat.name.charAt(0)
                  )}
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {cat.name}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          8. VIP DEALS — exclusive section
          ═══════════════════════════════════════════════════════════════ */}
      {topDeal && (
        <section className="reveal" data-reveal-delay="300" style={{ padding: '32px 16px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: 16,
            padding: 'clamp(24px, 4vw, 40px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* VIP shimmer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(105deg, transparent 40%, rgba(247,201,72,0.08) 45%, rgba(247,201,72,0.08) 55%, transparent 60%)',
              animation: 'shimmer 4s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #f7c948, #f5a623)',
                color: '#1a1a2e',
                fontSize: 11,
                fontWeight: 800,
                padding: '5px 12px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                👑 VIP EXCLUSIVE
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
              }}>
                Members Only
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(16px, 3vw, 32px)',
              position: 'relative',
              zIndex: 1,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 240px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: '#fff',
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                }}>
                  {topDeal.name}
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  margin: '0 0 16px',
                  lineHeight: 1.5,
                }}>
                  {topDeal.description?.slice(0, 100)}...
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                    fontWeight: 800,
                    color: '#f7c948',
                  }}>
                    ${(topDeal.price ?? 0).toFixed(2)}
                  </span>
                  {topDeal.comparePrice && (
                    <>
                      <span style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'line-through',
                      }}>
                        ${(topDeal.comparePrice ?? 0).toFixed(2)}
                      </span>
                      <span style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}>
                        -{Math.round(((topDeal.comparePrice - topDeal.price) / topDeal.comparePrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/products/${topDeal._id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #f7c948, #f5a623)',
                    color: '#1a1a2e',
                    fontWeight: 700,
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'transform 0.2s',
                  }}
                >
                  Unlock Deal →
                </button>
              </div>
              <div style={{
                flex: '0 0 180px',
                position: 'relative',
              }}>
                <div style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                }}>
                  <img
                    src={topDeal.images?.[0] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e5e7eb"><rect width="400" height="400"/><text x="200" y="208" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>')}
                    alt={topDeal.name}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          RECENTLY VIEWED
          ═══════════════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section className="reveal" data-reveal-delay="350" style={{ padding: '32px 0 16px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header" style={{ padding: '0 16px 12px' }}>
            <div className="section-title">
              <span style={{ fontSize: 22 }}>👀</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recently Viewed</h2>
            </div>
          </div>
          <div className="carousel-scroll" style={{ padding: '4px 16px' }}>
            {recent.map((p) => (
              <div
                key={p._id}
                className="card"
                style={{
                  minWidth: 180,
                  flexShrink: 0,
                  cursor: 'pointer',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
                onClick={() => router.push(`/products/${p._id}`)}
              >
                <img
                  src={p.images?.[0] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e5e7eb"><rect width="400" height="400"/><text x="200" y="208" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>')}
                  alt={p.name}
                  style={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                  }}
                />
                <div style={{ padding: 10 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text)',
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                    ${(p.price ?? 0).toFixed(2)}
                    {p.comparePrice && (
                      <span style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        textDecoration: 'line-through',
                        marginLeft: 6,
                      }}>
                        ${(p.comparePrice ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          9. TRUST BADGES — bottom row
          ═══════════════════════════════════════════════════════════════ */}
      <section className="trust-bar" style={{ marginTop: 32 }}>
        {TRUST_ITEMS.map((item, i) => (
          <div key={i} className="trust-item">
            <span className="trust-icon">{item.icon}</span>
            <div className="trust-text">
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
