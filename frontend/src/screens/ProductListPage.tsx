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
  { value: '-numReviews', label: 'Most Reviewed' },
  { value: '-discount', label: 'Biggest Discount' },
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

  return (
    <div ref={revealContainerRef} style={{ maxWidth: 1440, margin: '0 auto', padding: '24px' }}>
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

        .mobile-sticky-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-sticky-bar {
            display: block;
            position: sticky;
            top: 0;
            z-index: 20;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            padding: 10px 0;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }
      `}</style>

      {/* Category Chips Bar - Reveal Section */}
      <div className="reveal" data-reveal>
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: 'none',
              background: !category ? 'var(--primary)' : 'var(--bg-card)',
              color: !category ? '#fff' : 'var(--text)',
              fontWeight: !category ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: !category ? 'var(--shadow-sm)' : 'none',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => router.push(`/products?category=${cat.slug}`)}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: 'none',
                background: category === cat.slug ? 'var(--primary)' : 'var(--bg-card)',
                color: category === cat.slug ? '#fff' : 'var(--text)',
                fontWeight: category === cat.slug ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: category === cat.slug ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Sticky Filter/Sort Bar */}
      <div className="mobile-sticky-bar">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn filter-toggle-mobile"
            style={{
              padding: '10px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              position: 'relative',
              flex: 1,
            }}
          >
            ☰ Filters
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="form-select sort-glow"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              flex: 1,
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div
            className="mobile-filter-overlay"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Filter Sidebar */}
        <aside className={`filter-sidebar ${showFilters ? 'open' : ''}`}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: 'var(--text)',
            }}>
              Filters
            </h3>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="btn"
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Category
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => router.push('/products')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: !category ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                  fontWeight: !category ? 600 : 400,
                  color: !category ? 'var(--primary)' : 'var(--text)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => router.push(`/products?category=${cat.slug}`)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: category === cat.slug ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                    fontWeight: category === cat.slug ? 600 : 400,
                    color: category === cat.slug ? 'var(--primary)' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Price
            </h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                className="form-input"
                style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
                onChange={(e) => {
                  setPriceMin(e.target.value);
                  setPage(1);
                  debouncedSetPrice(e.target.value, priceMax);
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                className="form-input"
                style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
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
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Min. Rating
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[4, 3, 2, 1].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    background: ratingFilter === String(r) ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === String(r)}
                    onChange={() => {
                      setRatingFilter(String(r));
                      setPage(1);
                    }}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{
                    color: '#f59e0b',
                    letterSpacing: 2,
                  }}>
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
                  onClick={() => {
                    setRatingFilter('');
                    setPage(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--primary)',
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Clear rating
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Search/Results Header */}
          <div className="section-header reveal" data-reveal style={{ marginBottom: 24 }}>
            <div className="section-title">
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                fontWeight: 800,
                margin: 0,
              }}>
                {title}
              </h2>
              <span
                ref={resultsCountRef}
                style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                  display: 'inline-block',
                  transition: 'opacity 0.3s ease',
                  opacity: loading ? 0.5 : 1,
                }}
                className={!loading ? 'results-count-animate' : ''}
              >
                {total} products found
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn"
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                }}
              >
                <span className="filter-toggle-mobile">☰ Filters</span>
                {activeFilterCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                ref={sortSelectRef}
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="form-select sort-glow"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  minWidth: 180,
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasFilters && (
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}>
              {priceMin && (
                <span
                  className="badge filter-chip-enter"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'var(--primary-light, rgba(99,102,241,0.1))',
                    color: 'var(--primary)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Min: ${priceMin}
                  <button
                    onClick={() => {
                      setPriceMin('');
                      debouncedSetPrice('', priceMax);
                      setPage(1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                    }}
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
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'var(--primary-light, rgba(99,102,241,0.1))',
                    color: 'var(--primary)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Max: ${priceMax}
                  <button
                    onClick={() => {
                      setPriceMax('');
                      debouncedSetPrice(priceMin, '');
                      setPage(1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                    }}
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
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'var(--primary-light, rgba(99,102,241,0.1))',
                    color: 'var(--primary)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {'★'.repeat(Number(ratingFilter))} & up
                  <button
                    onClick={() => {
                      setRatingFilter('');
                      setPage(1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Products */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 24,
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    height: 360,
                    borderRadius: 12,
                  }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              animation: 'fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
            }}>
              <div className="empty-state">
                <div className="empty-icon-float" style={{ fontSize: 64, marginBottom: 16, display: 'inline-block' }}>
                  🔍
                </div>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: 'var(--text)',
                }}>
                  No products found
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  marginBottom: 24,
                  fontSize: 16,
                }}>
                  Try adjusting your filters or search.
                </p>
                {hasFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="btn"
                    style={{
                      padding: '12px 24px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div
                ref={gridRef}
                className={`product-grid grid-loading-overlay ${loading ? 'is-loading' : ''}`}
                style={{
                  transition: 'opacity 0.3s ease',
                }}
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

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination reveal" data-reveal style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 40,
                  flexWrap: 'wrap',
                }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="page-btn"
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: `1px solid ${p === page ? 'var(--primary)' : 'var(--border)'}`,
                        background: p === page ? 'var(--primary)' : 'var(--bg-card)',
                        color: p === page ? '#fff' : 'var(--text)',
                        fontWeight: p === page ? 700 : 500,
                        cursor: 'pointer',
                        minWidth: 44,
                        fontSize: 14,
                        transition: 'all 0.2s',
                        boxShadow: p === page ? 'var(--shadow-sm)' : 'none',
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
