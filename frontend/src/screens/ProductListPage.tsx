'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { productAPI, categoryAPI } from '../services/api';
import { Product, Category } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: '-rating', label: 'Top Rated' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-num_reviews', label: 'Most Reviewed' },
  { value: '-compare_price', label: 'Biggest Discount' },
];

const ProductListPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [debouncedPriceMin, setDebouncedPriceMin] = useState('');
  const [debouncedPriceMax, setDebouncedPriceMax] = useState('');
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resultsCountRef = useRef<HTMLSpanElement>(null);
  const revealContainerRef = useScrollReveal({ stagger: 80 });

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const debouncedSetPrice = useCallback((min: string, max: string) => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      setDebouncedPriceMin(min);
      setDebouncedPriceMax(max);
    }, 500);
  }, []);

  useEffect(() => {
    categoryAPI
      .getAll()
      .then((res) => setCategories(res.data.data as Category[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20, sort };
        if (category) params.category = category;
        if (search) params.search = search;
        if (debouncedPriceMin) params.minPrice = debouncedPriceMin;
        if (debouncedPriceMax) params.maxPrice = debouncedPriceMax;
        if (ratingFilter) params.rating = ratingFilter;
        const res = await productAPI.getAll(params);
        setProducts(res.data.data);
        setTotal(res.data.pagination?.total || 0);
        setPages(res.data.pagination?.pages || 1);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, sort, category, search, debouncedPriceMin, debouncedPriceMax, ratingFilter]);

  const handleClearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setDebouncedPriceMin('');
    setDebouncedPriceMax('');
    setRatingFilter('');
    setPage(1);
  };

  const hasFilters = priceMin || priceMax || ratingFilter;

  const activeFilterCount = [priceMin, priceMax, ratingFilter].filter(Boolean).length;

  const activeCategory = categories.find((c) => c.slug === category);
  const title = search
    ? `Results for "${search}"`
    : activeCategory
    ? activeCategory.name
    : 'All Products';

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Sort';

  const SORT_CHIPS = [
    { value: '', label: 'All' },
    { value: '-rating', label: 'Top Rated' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-created_at', label: 'Newest' },
    { value: '-num_reviews', label: 'Relevance' },
  ];

  return (
    <div ref={revealContainerRef} style={{ maxWidth: 1440, margin: '0 auto', padding: '12px 16px 40px' }}>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes countPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes revealUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.12); }
        }

        .filter-sidebar {
          animation: slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .product-card-wrapper {
          animation: fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .filter-chip-enter {
          animation: scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .empty-icon-float {
          animation: floatBounce 3s ease-in-out infinite;
        }
        .results-count-animate {
          animation: countPulse 0.4s ease-in-out;
        }
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .sort-glow:focus {
          outline: none;
          animation: glowPulse 2s ease-in-out infinite;
          border-color: var(--primary) !important;
        }
        .grid-loading-overlay {
          transition: opacity 0.3s ease, pointer-events 0.3s ease;
        }
        .grid-loading-overlay.is-loading {
          opacity: 0.5;
          pointer-events: none;
        }

        .pulse-sort-chip {
          padding: 8px 18px;
          border-radius: 24px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .pulse-sort-chip:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .pulse-sort-chip.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .pulse-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .pulse-breadcrumb a,
        .pulse-breadcrumb span {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .pulse-breadcrumb a:hover {
          color: var(--primary);
        }
        .pulse-breadcrumb .breadcrumb-sep {
          color: var(--border);
          font-size: 11px;
        }
        .pulse-breadcrumb .breadcrumb-current {
          color: var(--text);
          font-weight: 600;
        }
        .pulse-breadcrumb .breadcrumb-clear {
          color: var(--primary);
          cursor: pointer;
          font-weight: 500;
          margin-left: 4px;
          background: none;
          border: none;
          padding: 0;
          font-size: 13px;
        }

        .pulse-vip-card {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          border-radius: 16px;
          padding: 20px 24px;
          color: #fff;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }
        .pulse-vip-card::before {
          content: '';
          position: absolute;
          top: -30%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          pointer-events: none;
        }
        .pulse-vip-card::after {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -5%;
          width: 160px;
          height: 160px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          pointer-events: none;
        }

        .pulse-filter-sidebar {
          animation: slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (min-width: 769px) {
          .pulse-mobile-only {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .pulse-desktop-only {
            display: none !important;
          }
        }

        .pulse-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .pulse-product-grid {
            gap: 16px;
          }
        }
        @media (min-width: 769px) {
          .pulse-product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }
        @media (min-width: 1024px) {
          .pulse-product-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .pulse-sort-dropdown {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px !important;
        }
      `}</style>

      {/* ── Query Breadcrumb ── */}
      <nav className="pulse-breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">Explore</Link>
        <span className="breadcrumb-sep">›</span>
        {activeCategory ? (
          <span className="breadcrumb-current">{activeCategory.name}</span>
        ) : search ? (
          <span className="breadcrumb-current">Search: {search}</span>
        ) : (
          <span className="breadcrumb-current">All Products</span>
        )}
        {hasFilters && (
          <button className="breadcrumb-clear" onClick={handleClearFilters}>
            Clear all
          </button>
        )}
      </nav>

      {/* ── Sticky Sort Chips Bar ── */}
      <div
        className="pulse-mobile-only"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
          padding: '8px 0',
          margin: '0 -16px',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: 4,
          }}
        >
          {SORT_CHIPS.map((chip) => (
            <button
              key={chip.value}
              className={`pulse-sort-chip ${sort === chip.value ? 'active' : ''}`}
              onClick={() => {
                setSort(chip.value || '-created_at');
                setPage(1);
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      {hasFilters && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}>
          {priceMin && (
            <span
              className="badge filter-chip-enter"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'var(--primary-light, rgba(99,102,241,0.1))',
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Min: ${priceMin}
              <button
                type="button"
                aria-label="Clear minimum price filter"
                onClick={() => { setPriceMin(''); debouncedSetPrice('', priceMax); setPage(1); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          )}
          {priceMax && (
            <span
              className="badge filter-chip-enter"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'var(--primary-light, rgba(99,102,241,0.1))',
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Max: ${priceMax}
              <button
                type="button"
                aria-label="Clear maximum price filter"
                onClick={() => { setPriceMax(''); debouncedSetPrice(priceMin, ''); setPage(1); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          )}
          {ratingFilter && (
            <span
              className="badge filter-chip-enter"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'var(--primary-light, rgba(99,102,241,0.1))',
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {'★'.repeat(Number(ratingFilter))} & up
              <button
                type="button"
                aria-label="Clear rating filter"
                onClick={() => { setRatingFilter(''); setPage(1); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
        {/* ── Mobile Filter Overlay ── */}
        {showFilters && (
          <div
            className="mobile-filter-overlay"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* ── Filter Sidebar (Desktop) ── */}
        <aside className={`filter-sidebar pulse-filter-sidebar ${showFilters ? 'open' : ''}`}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Filters
            </h3>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{
              fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Category
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                onClick={() => router.push('/products')}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'block', width: '100%',
                  textAlign: 'left',
                  background: !category ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                  fontWeight: !category ? 600 : 400,
                  color: !category ? 'var(--primary)' : 'var(--text)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => router.push(`/products?category=${cat.slug}`)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'block', width: '100%',
                    textAlign: 'left',
                    background: category === cat.slug ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                    fontWeight: category === cat.slug ? 600 : 400,
                    color: category === cat.slug ? 'var(--primary)' : 'var(--text)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{
              fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Price
            </h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                className="form-input"
                style={{ flex: 1, padding: '9px 10px', fontSize: 13 }}
                onChange={(e) => {
                  setPriceMin(e.target.value);
                  setPage(1);
                  debouncedSetPrice(e.target.value, priceMax);
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                className="form-input"
                style={{ flex: 1, padding: '9px 10px', fontSize: 13 }}
                onChange={(e) => {
                  setPriceMax(e.target.value);
                  setPage(1);
                  debouncedSetPrice(priceMin, e.target.value);
                }}
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h4 style={{
              fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Min. Rating
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[4, 3, 2, 1].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                    borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    background: ratingFilter === String(r) ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === String(r)}
                    onChange={() => { setRatingFilter(String(r)); setPage(1); }}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ color: '#f59e0b', letterSpacing: 1, fontSize: 14 }}>
                    {'★'.repeat(r)}{'☆'.repeat(5 - r)}
                  </span>
                  <span style={{
                    color: ratingFilter === String(r) ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: ratingFilter === String(r) ? 600 : 400,
                  }}>
                    & up
                  </span>
                </label>
              ))}
              {ratingFilter && (
                <button
                  onClick={() => { setRatingFilter(''); setPage(1); }}
                  style={{
                    padding: '6px 12px', border: 'none', background: 'none',
                    color: 'var(--primary)', fontSize: 12, textAlign: 'left', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Clear rating
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Header Row: Title + Desktop Sort + Results Count */}
          <div className="section-header reveal" data-reveal style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: 12, marginBottom: 16,
          }}>
            <div className="section-title">
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.15rem, 2.5vw, 1.6rem)',
                fontWeight: 800, margin: 0,
              }}>
                {title}
              </h2>
              <span
                ref={resultsCountRef}
                style={{
                  fontSize: 13, color: 'var(--text-secondary)', marginTop: 2,
                  display: 'inline-block', opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s',
                }}
                className={!loading ? 'results-count-animate' : ''}
              >
                {total} products found
              </span>
            </div>

            {/* Desktop sort + filter toggle */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn pulse-mobile-only"
                style={{
                  padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
                }}
              >
                ☰ Filters
                {activeFilterCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5, background: 'var(--primary)',
                    color: '#fff', borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                ref={sortSelectRef}
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="form-select sort-glow pulse-sort-dropdown"
                style={{
                  padding: '9px 32px 9px 12px', borderRadius: 8, fontSize: 13,
                  cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)',
                  minWidth: 160, transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── VIP Perks Card ── */}
          <div className="pulse-vip-card reveal" data-reveal>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>
                Exclusive
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.3 }}>
                Unlock VIP Perks
              </h3>
              <p style={{ fontSize: 13, margin: '0 0 14px', opacity: 0.85, lineHeight: 1.5 }}>
                Free shipping, early access to sales, and 10% off every order.
              </p>
              <button
                className="btn btn-sm"
                style={{
                  padding: '8px 20px', borderRadius: 20, border: '2px solid rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s',
                }}
              >
                Upgrade to VIP
              </button>
            </div>
          </div>

          {/* ── Products ── */}
          {loading ? (
            <div className="pulse-product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state" style={{
              textAlign: 'center', padding: '64px 24px', background: 'var(--bg-card)',
              borderRadius: 16, border: '1px solid var(--border)',
              animation: 'fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
            }}>
              <div className="empty-icon-float" style={{ fontSize: 56, marginBottom: 12, display: 'inline-block' }}>
                🔍
              </div>
              <h2 className="empty-state-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                No products found
              </h2>
              <p className="empty-state-text" style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                Try adjusting your filters or search.
              </p>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px', borderRadius: 8, fontWeight: 600,
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                ref={gridRef}
                className={`pulse-product-grid product-grid grid-loading-overlay ${loading ? 'is-loading' : ''}`}
                style={{ transition: 'opacity 0.3s ease' }}
              >
                {products.map((product, idx) => (
                  <div
                    key={product._id}
                    className={`product-card-wrapper animate-in-delay-${Math.min(idx, 7)}`}
                    style={{
                      animation: `fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(idx, 7) * 0.06}s both`,
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* ── Pagination ── */}
              {pages > 1 && (
                <div className="pagination reveal" data-reveal style={{
                  display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap',
                }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="page-btn"
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        border: `1px solid ${p === page ? 'var(--primary)' : 'var(--border)'}`,
                        background: p === page ? 'var(--primary)' : 'var(--bg-card)',
                        color: p === page ? '#fff' : 'var(--text)',
                        fontWeight: p === page ? 700 : 500,
                        cursor: 'pointer', minWidth: 38, fontSize: 13,
                        transition: 'all 0.2s',
                        boxShadow: p === page ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;
