import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import { productAPI, categoryAPI } from '../services/api';
import { Product, Category } from '../types';
import { GridSkeleton } from '../components/Skeleton';

const BANNERS = [
  {
    title: 'Discover Amazing Deals',
    subtitle: 'Up to 70% off on top brands. Free delivery on orders over $50.',
    cta: 'Shop Now',
    gradient: 'linear-gradient(135deg, var(--primary) 0%, #1a3650 50%, var(--tertiary) 100%)',
    icon: '\u{1F4B0}',
    link: '/products',
  },
  {
    title: 'New Electronics Arrived',
    subtitle: 'Latest gadgets, laptops, and accessories at unbeatable prices.',
    cta: 'Explore Tech',
    gradient: 'linear-gradient(135deg, #0d2137 0%, #1a3a4a 50%, #0d2b3a 100%)',
    icon: '\u{1F4F1}',
    link: '/products?category=electronics',
  },
  {
    title: 'Season Fashion Sale',
    subtitle: 'Refresh your wardrobe with trending styles. Extra 20% off on your first order.',
    cta: 'Shop Fashion',
    gradient: 'linear-gradient(135deg, #2d1b3a 0%, #4a2a4a 50%, #2d1b3a 100%)',
    icon: '\u{1F455}',
    link: '/products?category=fashion',
  },
];

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverCity, setDeliverCity] = useState('New York');
  const [bannerIdx, setBannerIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCity = localStorage.getItem('deliverCity');
    if (savedCity) setDeliverCity(savedCity);
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecent(stored.slice(0, 8));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, allRes] = await Promise.all([
          productAPI.getFeatured(),
          categoryAPI.getAll(),
          productAPI.getAll({ limit: 30, sort: '-created_at' }),
        ]);
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data);
        setAllProducts(allRes.data.data || []);
        const allProducts = allRes.data.data || [];
        const filtered = allProducts.filter(
          (p: Product) => p.comparePrice && p.comparePrice > p.price
        ).sort((a: Product, b: Product) => {
          const aDisc = ((a.comparePrice! - a.price) / a.comparePrice!) * 100;
          const bDisc = ((b.comparePrice! - b.price) / b.comparePrice!) * 100;
          return bDisc - aDisc;
        }).slice(0, 8);
        setDeals(filtered);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderStars = (rating: number) => {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) stars.push(i <= Math.floor(rating) ? '\u2605' : '\u2606');
    return stars.join(' ');
  };

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
    <div>
      <section className="hero" style={{ background: banner.gradient }}>
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />
        </div>
        <div className="hero-content hero-animate">
          <p className="hero-tagline">
            {deliverCity ? `Delivering to ${deliverCity}` : 'Nationwide Delivery'}
          </p>
          <div className="hero-icon">{banner.icon}</div>
          <h1>{banner.title}</h1>
          <p>{banner.subtitle}</p>
          <button className="hero-cta" onClick={() => navigate(banner.link)}>
            {banner.cta}
          </button>
        </div>
        <div className="hero-dots">
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

      {recent.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div className="section-title-highlight">
              <span className="icon">{'\u{1F440}'}</span>
              <span className="text">Recently viewed</span>
            </div>
          </div>
          <div className="deals-carousel">
            <div className="deals-scroll">
              {recent.map((p) => {
                const d = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
                return (
                  <div key={p._id} className="mini-product-card" onClick={() => navigate(`/products/${p._id}`)}>
                    <img src={p.images[0]} alt={p.name} />
                    <div className="mini-product-name">{p.name}</div>
                    <div className="stars" style={{ fontSize: 12 }}>{renderStars(p.rating)}</div>
                    <div className="mini-product-price">
                      ${p.price.toFixed(2)}
                      {p.comparePrice && <span className="mini-compare">${p.comparePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {deals.length >= 3 && (
        <section className="section">
          <div className="section-header">
            <div className="section-title-highlight">
              <span className="icon">{'\u26A1'}</span>
              <span className="text">Flash Deals</span>
            </div>
            <span className="section-link" onClick={() => navigate('/products?sort=-discount')}>
              See all {'\u2192'}
            </span>
          </div>
          <div className="deals-carousel">
            <div className="deals-scroll">
              {deals.map((product) => {
                const discount = Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100);
                return (
                  <div key={product._id} className="deal-card" onClick={() => navigate(`/products/${product._id}`)}>
                    <div className="deal-badge">-{discount}%</div>
                    <div className="deal-countdown" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                      <CountdownTimer endDate={new Date(Date.now() + (3 + Math.random() * 5) * 3600000)} size="small" />
                    </div>
                    <img src={product.images[0]} alt={product.name} />
                    <div className="deal-info">
                      <div className="deal-name">{product.name}</div>
                      <div className="deal-pricing">
                        <span className="deal-price">${product.price.toFixed(2)}</span>
                        <span className="deal-compare">${product.comparePrice!.toFixed(2)}</span>
                      </div>
                      <div className="deal-ship">{'\u2713'} FREE delivery</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <div className="section-title-highlight">
            <span className="icon">{'\u{1F4AB}'}</span>
            <span className="text">Shop by Category</span>
          </div>
          <span className="section-link" onClick={() => navigate('/products')}>
            Explore all {'\u2192'}
          </span>
        </div>
        <div className="category-grid">
          {categories.slice(0, 8).map((cat) => (
            <div key={cat._id} className="category-card" onClick={() => navigate(`/products?category=${cat.slug}`)}>
              <img src={cat.image || 'https://via.placeholder.com/400?text=' + cat.name} alt={cat.name} />
              <h3>{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div className="section-title-highlight">
              <span className="icon">{'\u{1F525}'}</span>
              <span className="text">Trending Products</span>
            </div>
            <span className="section-link" onClick={() => navigate('/products')}>
              See all {'\u2192'}
            </span>
          </div>
          <div className="product-grid">
            {featured.slice(0, 8).map((product, idx) => (
              <ProductCard
                key={product._id}
                product={product}
                badge={idx === 0 ? 'bestseller' : idx === 1 ? 'amazons_choice' : null}
              />
            ))}
          </div>
        </section>
      )}

      {topDeal && (
        <section className="section" style={{
          background: 'linear-gradient(135deg, #1a3650 0%, #131921 100%)',
          borderRadius: 16,
          padding: '48px 36px !important',
          margin: '24px !important',
          maxWidth: '1392px !important',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ display: 'inline-block', background: '#ff9900', color: '#131921', padding: '4px 12px', borderRadius: 4, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
                {'\u{1F3C6}'} DEAL OF THE DAY
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{topDeal.name}</h2>
              <p style={{ color: '#aab7c4', marginBottom: 16, fontSize: 15 }}>{topDeal.description?.slice(0, 120)}...</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#ff9900' }}>${topDeal.price.toFixed(2)}</span>
                {topDeal.comparePrice && (
                  <>
                    <span style={{ fontSize: 16, textDecoration: 'line-through', color: '#8899aa' }}>${topDeal.comparePrice.toFixed(2)}</span>
                    <span style={{ background: '#b12704', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12 }}>
                      -{Math.round(((topDeal.comparePrice - topDeal.price) / topDeal.comparePrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <button className="hero-cta" onClick={() => navigate(`/products/${topDeal._id}`)}>
                Grab the Deal {'\u2192'}
              </button>
            </div>
            <div style={{ flex: 0, width: 280 }}>
              <img
                src={topDeal.images[0]}
                alt={topDeal.name}
                style={{ width: '100%', height: 280, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
          </div>
        </section>
      )}

      {allProducts.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div className="section-title-highlight">
              <span className="icon">{'\u{1F4CA}'}</span>
              <span className="text">New Arrivals</span>
            </div>
            <span className="section-link" onClick={() => navigate('/products?sort=-created_at')}>
              See all {'\u2192'}
            </span>
          </div>
          <div className="product-grid">
            {allProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="section sell-banner">
          <div className="sell-banner-content">
            <div>
              <h2>{'\u{1F4BC}'} Start Selling Today</h2>
              <p>Reach millions of customers with your products on ShopSmart.</p>
              <button className="hero-cta" onClick={() => navigate('/sell')}>
                Become a Seller
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
