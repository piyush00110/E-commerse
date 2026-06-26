import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productAPI, categoryAPI } from '../services/api';
import { Product, Category } from '../types';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: '-rating', label: 'Top Rated' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-numReviews', label: 'Most Reviewed' },
  { value: '-discount', label: 'Biggest Discount' },
];

const ProductListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
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

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    categoryAPI.getAll().then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12, sort };
        if (category) params.category = category;
        if (search) params.search = search;
        if (priceMin) params.minPrice = priceMin;
        if (priceMax) params.maxPrice = priceMax;
        if (ratingFilter) params.rating = ratingFilter;
        const res = await productAPI.getAll(params);
        setProducts(res.data.data);
        setTotal(res.data.pagination?.total || 0);
        setPages(res.data.pagination?.pages || 1);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [page, sort, category, search, priceMin, priceMax, ratingFilter]);

  const handleClearFilters = () => {
    setPriceMin(''); setPriceMax(''); setRatingFilter(''); setPage(1);
  };

  const hasFilters = priceMin || priceMax || ratingFilter;

  const activeCategory = categories.find((c) => c.slug === category);
  const title = search
    ? `Results for "${search}"`
    : activeCategory
    ? activeCategory.name
    : 'All Products';

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px' }}>
      {/* Category Chips Bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto',
        paddingBottom: 4, scrollbarWidth: 'none', whiteSpace: 'nowrap',
      }}>
        <button onClick={() => { window.location.href = '/products'; }}
          style={{
            padding: '6px 16px', borderRadius: 20, border: 'none',
            background: !category ? '#131921' : '#f0f2f2',
            color: !category ? 'white' : '#0f1111',
            fontWeight: !category ? 600 : 400, fontSize: 13, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat._id} onClick={() => { window.location.href = `/products?category=${cat.slug}`; }}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none',
              background: category === cat.slug ? '#131921' : '#f0f2f2',
              color: category === cat.slug ? 'white' : '#0f1111',
              fontWeight: category === cat.slug ? 600 : 400, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
        <button onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'none', padding: '8px 16px', background: '#232f3e', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
          className="mobile-filter-btn">
          {showFilters ? 'Hide Filters' : 'Show Filters'} &#9660;
        </button>

        <div style={{
          width: 260, minWidth: 260, background: 'white', borderRadius: 12, padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: 80,
          display: showFilters ? 'block' : 'block',
        }} className="filter-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Filters</h3>
            {hasFilters && (
              <button onClick={handleClearFilters}
                style={{ padding: '4px 10px', border: '1px solid #ddd', borderRadius: 6, background: 'white', fontSize: 12, cursor: 'pointer' }}>
                Clear All
              </button>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#565959', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <a href="/products" style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 14, display: 'block',
                background: !category ? '#f0f2f2' : 'transparent', fontWeight: !category ? 600 : 400,
                color: '#0f1111', textDecoration: 'none',
              }}>All</a>
              {categories.map((cat) => (
                <a key={cat._id} href={`/products?category=${cat.slug}`} style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 14, display: 'block',
                  background: category === cat.slug ? '#f0f2f2' : 'transparent',
                  fontWeight: category === cat.slug ? 600 : 400,
                  color: '#0f1111', textDecoration: 'none',
                }}>
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#565959', textTransform: 'uppercase', letterSpacing: 0.5 }}>Price</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" placeholder="Min" value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
              <span style={{ color: '#999' }}>-</span>
              <input type="number" placeholder="Max" value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#565959', textTransform: 'uppercase', letterSpacing: 0.5 }}>Min. Rating</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[4, 3, 2, 1].map((r) => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 14, cursor: 'pointer' }}>
                  <input type="radio" name="rating" checked={ratingFilter === String(r)}
                    onChange={() => { setRatingFilter(String(r)); setPage(1); }} />
                  <span>{'\u2605'.repeat(r)}{'\u2606'.repeat(5 - r)} & up</span>
                </label>
              ))}
              {ratingFilter && (
                <button onClick={() => { setRatingFilter(''); setPage(1); }}
                  style={{ padding: '4px 10px', border: 'none', background: 'none', color: '#007185', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
                  Clear rating
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h2>
              <span style={{ fontSize: 13, color: '#565959' }}>{total} products found</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowFilters(!showFilters)}
                style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', display: 'none' }}
                className="mobile-filter-btn2">
                &#9776; Filters
              </button>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, background: 'white', cursor: 'pointer' }}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F50D}'}</div>
              <h2 style={{ marginBottom: 8 }}>No products found</h2>
              <p style={{ color: '#565959', marginBottom: 16 }}>Try adjusting your filters or search.</p>
              {hasFilters && <button onClick={handleClearFilters}
                style={{ padding: '10px 24px', background: '#ff9900', color: '#232f3e', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Clear All Filters
              </button>}
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{
                        padding: '8px 16px', border: `1px solid ${p === page ? '#ff9900' : '#ddd'}`,
                        borderRadius: 8, background: p === page ? '#ff9900' : 'white',
                        color: p === page ? '#232f3e' : '#0f1111',
                        fontWeight: p === page ? 600 : 400, cursor: 'pointer',
                        minWidth: 40,
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
