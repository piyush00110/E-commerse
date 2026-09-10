'use client';

import React, { useState, useEffect } from 'react';
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
    title: 'Discover Amazing Deals',
    subtitle: 'Up to 70% off on top brands. Free delivery on orders over $50.',
    cta: 'Shop Now',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #6366f1 70%, #06b6d4 100%)',
    accent: '#06b6d4',
    icon: '💰',
    link: '/products',
  },
  {
    title: 'New Electronics Arrived',
    subtitle: 'Latest gadgets, laptops, and accessories at unbeatable prices.',
    cta: 'Explore Tech',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 70%, #3b82f6 100%)',
    accent: '#60a5fa',
    icon: '📱',
    link: '/products?category=electronics',
  },
  {
    title: 'Season Fashion Sale',
    subtitle: 'Refresh your wardrobe with trending styles. Extra 20% off on your first order.',
    cta: 'Shop Fashion',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #3d1566 40%, #6366f1 70%, #a855f7 100%)',
    accent: '#a855f7',
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
  const [parallaxY, setParallaxY] = useState(0);
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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setParallaxY(window.scrollY * 0.35);
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
      {/* Hero Section */}
      <section className="hero" style={{ background: banner.gradient, overflow: 'hidden' }}>
        <div className="hero-bg-shapes">
          <div
            className="hero-shape hero-shape-1"
            style={{ transform: `translateY(${parallaxY * 0.2}px)` }}
          />
          <div
            className="hero-shape hero-shape-2"
            style={{ transform: `translateY(${parallaxY * 0.4}px)` }}
          />
          <div
            className="hero-shape hero-shape-3"
            style={{ transform: `translateY(${parallaxY * 0.15}px)` }}
          />
        </div>
        <div className="hero-content hero-animate" key={bannerIdx}>
          <span className="hero-badge">
            {deliverCity ? `📍 Delivering to ${deliverCity}` : '🌍 Nationwide Delivery'}
          </span>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{banner.icon}</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {banner.title}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 600,
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            {banner.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="hero-cta-primary" onClick={() => router.push(banner.link)}>
              {banner.cta} →
            </button>
            <button className="hero-cta-secondary" onClick={() => router.push('/products')}>
              Explore All
            </button>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 32,
        }}>
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === bannerIdx ? 'active' : ''}`}
              onClick={() => setBannerIdx(idx)}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
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

      {/* Brand Marquee */}
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

      {/* Recently Viewed */}
      {recent.length > 0 && (
        <section className="reveal" data-reveal-delay="0" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-title">
              <span style={{ fontSize: 24 }}>👀</span>
              <h2>Recently Viewed</h2>
            </div>
          </div>
          <div className="carousel-scroll" style={{ padding: '8px 0' }}>
            {recent.map((p) => (
              <div
                key={p._id}
                className="card"
                style={{
                  minWidth: 200,
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => router.push(`/products/${p._id}`)}
              >
                <img
                  src={p.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'}
                  alt={p.name}
                  style={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: '12px 12px 0 0',
                  }}
                />
                <div style={{ padding: 12 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                    ${(p.price ?? 0).toFixed(2)}
                    {p.comparePrice && (
                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        textDecoration: 'line-through',
                        marginLeft: 8,
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

      {/* Flash Deals */}
      {deals.length >= 3 && (
        <section className="reveal" data-reveal-delay="100" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-title">
              <span style={{ fontSize: 24 }}>⚡</span>
              <h2>Flash Deals</h2>
            </div>
            <Link href="/products?sort=-discount" className="section-link">
              See all →
            </Link>
          </div>
          <div className="carousel-scroll" style={{ padding: '8px 0' }}>
            {deals.map((product, idx) => {
              const comp = product.comparePrice || 0;
              const discount =
                comp > 0 ? Math.round(((comp - product.price) / comp) * 100) : 0;
              return (
                <div
                  key={product._id}
                  className="card"
                  style={{
                    minWidth: 260,
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onClick={() => router.push(`/products/${product._id}`)}
                >
                  <span className="badge" style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    zIndex: 2,
                    background: 'var(--error)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 8,
                  }}>
                    -{discount}%
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                  }}>
                    <CountdownTimer endDate={dealEndDates[idx] || new Date()} size="small" />
                  </div>
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: '12px 12px 0 0',
                    }}
                  />
                  <div style={{ padding: 16 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                        ${(product.price ?? 0).toFixed(2)}
                      </span>
                      {comp > 0 && (
                        <span style={{
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                          textDecoration: 'line-through',
                        }}>
                          ${comp.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--success)',
                      fontWeight: 600,
                    }}>
                      ✓ FREE delivery
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Categories - Horizontal Scroll */}
      <section className="reveal" data-reveal-delay="200" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
        <div className="section-header">
          <div className="section-title">
            <span style={{ fontSize: 24 }}>✨</span>
            <h2>Top Categories</h2>
          </div>
          <Link href="/products" className="section-link">
            Explore all →
          </Link>
        </div>
        <div className="category-scroll">
          {categories.slice(0, 12).map((cat) => (
            <div
              key={cat._id}
              className="category-scroll-item"
              onClick={() => router.push(`/products?category=${cat.slug}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="category-scroll-img-wrapper">
                <img
                  src={cat.image || `https://via.placeholder.com/80?text=${cat.name.charAt(0)}`}
                  alt={cat.name}
                  className="category-scroll-img"
                />
              </div>
              <span className="category-scroll-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      {featured.length > 0 && (
        <section className="reveal" data-reveal-delay="300" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-title">
              <span style={{ fontSize: 24 }}>🔥</span>
              <h2>Trending Products</h2>
            </div>
            <Link href="/products" className="section-link">
              See all →
            </Link>
          </div>
          <div className="product-grid">
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

      {/* Deal of the Day */}
      {topDeal && (
        <section className="reveal" data-reveal-delay="400" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            borderRadius: 16,
            padding: 'clamp(24px, 4vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(24px, 4vw, 48px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <span className="badge" style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 8,
                marginBottom: 16,
                display: 'inline-block',
              }}>
                🏆 DEAL OF THE DAY
              </span>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}>
                {topDeal.name}
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 16,
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}>
                {topDeal.description?.slice(0, 120)}...
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <span style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: '#fff',
                }}>
                  ${(topDeal.price ?? 0).toFixed(2)}
                </span>
                {topDeal.comparePrice && (
                  <>
                    <span style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'line-through',
                    }}>
                      ${(topDeal.comparePrice ?? 0).toFixed(2)}
                    </span>
                    <span className="badge" style={{
                      background: 'var(--success)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}>
                      -{Math.round(((topDeal.comparePrice - topDeal.price) / topDeal.comparePrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <button className="hero-cta-primary" onClick={() => router.push(`/products/${topDeal._id}`)}>
                Grab the Deal →
              </button>
            </div>
            <div style={{
              flex: '0 0 300px',
              maxWidth: 300,
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}>
                <img
                  src={topDeal.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'}
                  alt={topDeal.name}
                  style={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {allProducts.length > 0 && (
        <section className="reveal" data-reveal-delay="500" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-title">
              <span style={{ fontSize: 24 }}>📊</span>
              <h2>New Arrivals</h2>
            </div>
            <Link href="/products?sort=-created_at" className="section-link">
              See all →
            </Link>
          </div>
          <div className="product-grid">
            {allProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="reveal" data-reveal-delay="600" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          borderRadius: 16,
          padding: 'clamp(32px, 5vw, 64px)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
          }}>
            📧
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 12px',
          }}>
            Stay in the Loop
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 16,
            margin: '0 auto 32px',
            maxWidth: 500,
          }}>
            Get exclusive deals, new arrivals, and insider-only discounts delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast('Subscribed! Welcome aboard.', 'success');
            }}
            style={{
              display: 'flex',
              gap: 12,
              maxWidth: 480,
              margin: '0 auto',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              required
              className="form-input"
              style={{
                flex: 1,
                minWidth: 250,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              className="hero-cta-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Sell Banner */}
      {categories.length > 0 && (
        <section className="reveal" data-reveal-delay="700" style={{ padding: '48px 24px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 'clamp(32px, 5vw, 64px)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              margin: '0 0 12px',
              color: 'var(--text)',
            }}>
              Start Selling Today
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 16,
              margin: '0 auto 32px',
              maxWidth: 500,
            }}>
              Reach millions of customers with your products on ShopSmart.
            </p>
            <button className="hero-cta-primary" onClick={() => router.push('/sell')}>
              Become a Seller →
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
