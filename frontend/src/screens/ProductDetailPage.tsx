'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productAPI, cartAPI, wishlistAPI } from '../services/api';
import { Product, Review } from '../types';
import { useToast } from '../context/ToastContext';
import { ProductDetailSkeleton } from '../components/Skeleton';
import FrequentlyBought from '../components/FrequentlyBought';
import CouponClip from '../components/CouponClip';
import CountdownTimer from '../components/CountdownTimer';

type SortMode = 'newest' | 'highest' | 'lowest';

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);
  const [alsoViewed, setAlsoViewed] = useState<Product[]>([]);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [sortReviews, setSortReviews] = useState<SortMode>('newest');
  const [wishlisted, setWishlisted] = useState(false);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const lightningDealEnd = useMemo(() => new Date(Date.now() + 4 * 3600000 + 30 * 60000), []);

  useEffect(() => {
    if (!id) { router.push('/products'); return; }
    const fetchProduct = async () => {
      try {
        const res = await productAPI.getById(id);
        const prod = res.data.data;
        setProduct(prod);
        setSelectedImage(0);
        trackRecentlyViewed(prod);
        if (prod.category) {
          const catId = typeof prod.category === 'object' ? (prod.category as { _id: string })._id : prod.category;
          const [relatedRes, allRes] = await Promise.all([
            productAPI.getAll({ category: catId, limit: 8 }),
            productAPI.getAll({ limit: 20, sort: '-num_reviews' }),
          ]);
          setRelated(relatedRes.data.data.filter((p: Product) => p._id !== prod._id).slice(0, 4));
          setAlsoViewed(allRes.data.data.filter((p: Product) => p._id !== prod._id).slice(0, 4));
        }
      } catch {
        showToast('Failed to load product', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    checkWishlisted();
  }, [id]);

  const checkWishlisted = async () => {
    try {
      const res = await wishlistAPI.get();
      const ids = (res.data.data.products || []).map((p: Product) => p._id);
      setWishlisted(id ? ids.includes(id) : false);
    } catch { /* ignore */ }
  };

  const trackRecentlyViewed = (prod: Product) => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const filtered = stored.filter((p: Product) => p._id !== prod._id);
      filtered.unshift(prod);
      localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)));
    } catch { /* ignore */ }
  };

  const renderStars = (rating: number) => {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(rating) ? '\u2605' : '\u2606');
    }
    return stars.join(' ');
  };

  const renderInteractiveStars = (current: number, onChange: (v: number) => void) => {
    return [1, 2, 3, 4, 5].map((s) => (
      <span key={s} onClick={() => onChange(s)}
        style={{ cursor: 'pointer', fontSize: 24, color: s <= current ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s' }}>
        {'\u2605'}
      </span>
    ));
  };

  const handleAddToCart = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
      await cartAPI.add(product?._id ?? '', quantity);
      showToast(`${product?.name} added to cart!`, 'success');
      router.push('/cart');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
      await cartAPI.add(product?._id ?? '', quantity);
      router.push('/checkout');
    } catch {
      showToast('Failed to process', 'error');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
      if (wishlisted) {
        await wishlistAPI.remove(product?._id ?? '');
        setWishlisted(false);
        showToast('Removed from wishlist', 'info');
      } else {
        await wishlistAPI.add(product?._id ?? '');
        setWishlisted(true);
        showToast('Saved to wishlist', 'success');
      }
    } catch {
      showToast('Failed to update wishlist', 'error');
    }
  };

  const handleAddReviewImage = () => {
    if (reviewImageUrl.trim()) {
      setReviewImages([...reviewImages, reviewImageUrl.trim()]);
      setReviewImageUrl('');
    }
  };

  const handleRemoveReviewImage = (idx: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewData: { rating: number; title: string; comment: string } = { rating: reviewRating, title: reviewTitle, comment: reviewComment };
      if (reviewImages.length > 0) {
        const existing = JSON.parse(localStorage.getItem('reviewImages') || '{}');
        const key = `product_${id}`;
        existing[key] = [...(existing[key] || []), ...reviewImages];
        localStorage.setItem('reviewImages', JSON.stringify(existing));
      }
      await productAPI.createReview(id ?? '', reviewData);
      showToast('Review submitted!', 'success');
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewImages([]);
      const res = await productAPI.getById(id ?? '');
      setProduct(res.data.data);
    } catch {
      showToast('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getSortedReviews = () => {
    if (!product?.reviews) return [];
    const reviews = [...product.reviews];
    switch (sortReviews) {
      case 'highest': return reviews.sort((a, b) => b.rating - a.rating);
      case 'lowest': return reviews.sort((a, b) => a.rating - b.rating);
      default: return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const sortedReviews = useMemo(() => getSortedReviews(), [product, sortReviews]);

  const reviewImagesMap = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('reviewImages') || '{}') as Record<string, string[]>; }
    catch { return {} as Record<string, string[]>; }
  }, [product]);

  const getStarDistribution = () => {
    if (!product?.reviews || product.reviews.length === 0) return [];
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    product.reviews.forEach((r: Review) => { counts[r.rating]++; });
    const total = product.reviews.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      pct: total > 0 ? (counts[star] / total) * 100 : 0,
    }));
  };

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u{1F50D}'}</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Product not found</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Products</Link>
      </div>
    );
  }

  const discount = product.comparePrice && product.comparePrice > 0
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const isLightningDeal = discount >= 25 && product.countInStock > 0;

  const primeDelivery = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const primeDeliveryMax = new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const colors = [
    { name: 'Black', hex: '#1e293b' },
    { name: 'White', hex: '#f1f5f9' },
    { name: 'Blue', hex: '#6366f1' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Silver', hex: '#94a3b8' },
  ];
  const sizes = ['Small', 'Medium', 'Large', 'XL'];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        <span style={{ color: '#cbd5e1' }}>{'/'}</span>
        {typeof product.category === 'object' && (
          <>
            <Link href={`/products?category=${(product.category as { slug: string }).slug}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
              {(product.category as { name: string }).name}
            </Link>
            <span style={{ color: '#cbd5e1' }}>{'/'}</span>
          </>
        )}
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
        {/* Left: Image Gallery */}
        <div>
          {/* Main Image */}
          <div style={{
            background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            aspectRatio: '1/1', overflow: 'hidden', marginBottom: 12,
          }}>
            <img
              src={(product.images?.[selectedImage] || product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image')}
              alt={product.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
            />
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} style={{
                  width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
                  border: idx === selectedImage ? '2px solid #6366f1' : '2px solid #e2e8f0',
                  padding: 4, cursor: 'pointer', background: '#f8fafc', flexShrink: 0,
                  transition: 'border-color 0.2s',
                }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div>
          {product.isFeatured && (
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
              background: '#6366f1', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 12,
            }}>
              ShopSmart&apos;s Choice
            </span>
          )}

          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ fontSize: 16, color: s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{product.rating.toFixed(1)}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>({product.numReviews.toLocaleString()} {product.numReviews === 1 ? 'rating' : 'ratings'})</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {product.numReviews > 0 ? `${(product.numReviews * 37).toLocaleString()}+ bought in past month` : ''}
            </span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>${(product.price ?? 0).toFixed(2)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span style={{ fontSize: 18, color: '#94a3b8', textDecoration: 'line-through' }}>${(product.comparePrice ?? 0).toFixed(2)}</span>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                    background: '#dcfce7', color: '#10b981',
                  }}>
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
            {product.comparePrice && (
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>No Import Fees & Free Shipping Included</div>
            )}
          </div>

          {/* Lightning Deal */}
          {isLightningDeal && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b', marginBottom: 16,
            }}>
              <span style={{ fontSize: 24 }}>{'\u26A1'}</span>
              <div>
                <strong style={{ fontSize: 14, color: '#92400e' }}>Lightning Deal</strong>
                <CountdownTimer endDate={lightningDealEnd} size="small" />
              </div>
            </div>
          )}

          {/* Delivery Estimate */}
          <div style={{
            padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{'\u{1F69A}'}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#065f46' }}>FREE Delivery</span>
            </div>
            <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>
              <strong>{primeDelivery}</strong> - <strong>{primeDeliveryMax}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#059669' }}>
              Or fastest <strong>Tomorrow</strong>, {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Stock Status */}
          <div style={{ marginBottom: 16 }}>
            {product.countInStock > 0 ? (
              <>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600, background: '#dcfce7', color: '#10b981' }}>
                  {'\u2713'} In Stock
                </span>
                {product.countInStock <= 10 && (
                  <span style={{ fontSize: 13, color: '#ef4444', marginLeft: 8, fontWeight: 500 }}>
                    Only {product.countInStock} left - order soon
                  </span>
                )}
              </>
            ) : (
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600, background: '#fef2f2', color: '#ef4444' }}>
                Currently unavailable
              </span>
            )}
          </div>

          {/* Color Variant */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Color: <span style={{ color: '#6366f1' }}>{selectedColor || 'Select'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {colors.map((c) => (
                <button key={c.name} onClick={() => setSelectedColor(c.name)} style={{
                  width: 40, height: 40, borderRadius: 9999, border: selectedColor === c.name ? '3px solid #6366f1' : '2px solid #e2e8f0',
                  background: c.hex, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: selectedColor === c.name ? '0 0 0 2px #fff, 0 0 0 4px #6366f1' : 'none',
                }} title={c.name} />
              ))}
            </div>
          </div>

          {/* Size Variant */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Size: <span style={{ color: '#6366f1' }}>{selectedSize || 'Select'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)} style={{
                  padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: selectedSize === s ? '2px solid #6366f1' : '2px solid #e2e8f0',
                  background: selectedSize === s ? '#eef2ff' : '#fff',
                  color: selectedSize === s ? '#6366f1' : '#475569',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>About this item</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Quantity + Actions */}
          {product.countInStock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                  style={{ width: 40, height: 40, fontSize: 18, fontWeight: 600, border: 'none', background: '#f8fafc', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', color: '#475569' }}>
                  {'\u2212'}
                </button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}
                  style={{ width: 40, height: 40, fontSize: 18, fontWeight: 600, border: 'none', background: '#f8fafc', cursor: 'pointer', color: '#475569' }}>
                  +
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleAddToCart} disabled={product.countInStock === 0}
                style={{ flex: 1, height: 44, fontSize: 14 }}>
                Add to Cart
              </button>
              <button className="btn btn-secondary" onClick={handleBuyNow} disabled={product.countInStock === 0}
                style={{ flex: 1, height: 44, fontSize: 14 }}>
                Buy Now
              </button>
            </div>
          )}

          {/* Wishlist Toggle */}
          <button onClick={handleToggleWishlist} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            border: wishlisted ? '2px solid #ef4444' : '2px solid #e2e8f0',
            background: wishlisted ? '#fef2f2' : '#fff', color: wishlisted ? '#ef4444' : '#64748b',
            cursor: 'pointer', fontWeight: 600, fontSize: 14, width: '100%', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 18 }}>{wishlisted ? '\u2665' : '\u2661'}</span>
            {wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
          </button>

          <div style={{ marginTop: 16 }}>
            <CouponClip productPrice={product.price} productName={product.name} />
          </div>
        </div>
      </div>

      {/* Frequently Bought */}
      <FrequentlyBought product={product} relatedProducts={related} />

      {/* Product Description */}
      {product.description && (
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <h2 className="section-title">Product Description</h2>
          </div>
          <div className="card" style={{ padding: 24, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
            <p>{product.description}</p>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div style={{ marginBottom: 48 }}>
        <div className="section-header" style={{ marginBottom: 24 }}>
          <h2 className="section-title">Customer Reviews</h2>
          {product.reviews && product.reviews.length > 0 && (
            <select value={sortReviews} onChange={(e) => setSortReviews(e.target.value as SortMode)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#475569', fontWeight: 500 }}>
              <option value="newest">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          )}
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <>
            {/* Review Summary */}
            <div className="card" style={{ padding: 24, display: 'flex', gap: 40, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {product.rating.toFixed(1)}
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: 16, color: s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{product.numReviews} total ratings</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {getStarDistribution().map(({ star, count, pct }) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', width: 40 }}>{star} star</span>
                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 9999, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', width: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedReviews.map((review) => {
                const imgs = reviewImagesMap[`product_${id}`] || [];
                return (
                  <div key={review._id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9999, background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>{review.name}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>{'\u2713'} Verified</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ fontSize: 14, color: s <= review.rating ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                      ))}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{review.title}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>{review.comment}</div>
                    {imgs.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {imgs.map((url: string, i: number) => (
                          <img key={i} src={url} alt="Review" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card empty-state" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: 16 }}>No reviews yet. Be the first to review this product!</p>
          </div>
        )}

        {/* Write Review Form */}
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#0f172a' }}>Overall rating</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {renderInteractiveStars(reviewRating, setReviewRating)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" type="text" placeholder="What's most important to know?" value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Review</label>
              <textarea className="form-input" placeholder="What did you like or dislike?" value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)} rows={4}
                style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Add Images (optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="text" placeholder="Paste image URL..." value={reviewImageUrl}
                  onChange={(e) => setReviewImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReviewImage(); } }}
                  style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={handleAddReviewImage}
                  style={{ padding: '10px 16px', flexShrink: 0 }}>Add</button>
              </div>
              {reviewImages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {reviewImages.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <button type="button" onClick={() => handleRemoveReviewImage(idx)} style={{
                        position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 9999,
                        background: '#ef4444', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{'\u2717'}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingReview}
              style={{ maxWidth: 240, height: 44 }}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Also Viewed */}
      {alsoViewed.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div className="section-header">
            <h2 className="section-title">Customers who viewed this also viewed</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {alsoViewed.map((p) => (
              <Link key={p._id} href={`/products/${p._id}`} className="card" style={{ padding: 12, textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', marginBottom: 8, background: '#f8fafc' }}>
                  <img src={(p.images?.[0] || 'https://via.placeholder.com/400?text=No+Image')} alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 1, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: 11, color: s <= Math.round(p.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>${(p.price ?? 0).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div className="section-header">
            <h2 className="section-title">Related products</h2>
            <Link href="/products" className="section-link" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>See all results {'\u2192'}</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {related.map((p) => (
              <Link key={p._id} href={`/products/${p._id}`} className="card" style={{ padding: 12, textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', marginBottom: 8, background: '#f8fafc' }}>
                  <img src={(p.images?.[0] || 'https://via.placeholder.com/400?text=No+Image')} alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 1, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: 11, color: s <= Math.round(p.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  ${(p.price ?? 0).toFixed(2)}
                  {p.comparePrice && <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 4 }}>${(p.comparePrice ?? 0).toFixed(2)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Bottom Bar */}
      {product.countInStock > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
          borderTop: '1px solid #e2e8f0', padding: '12px 16px', zIndex: 50,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>${(product.price ?? 0).toFixed(2)}</div>
              {product.comparePrice && (
                <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>${(product.comparePrice ?? 0).toFixed(2)}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 16, cursor: quantity <= 1 ? 'not-allowed' : 'pointer' }}>
                {'\u2212'}
              </button>
              <span style={{ width: 32, textAlign: 'center', fontWeight: 700, lineHeight: '36px', fontSize: 14 }}>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 16, cursor: 'pointer' }}>
                +
              </button>
              <button className="btn btn-primary" onClick={handleAddToCart}
                style={{ flex: 1, height: 40, fontSize: 13 }}>
                Add to Cart
              </button>
              <button className="btn btn-ghost" onClick={handleBuyNow}
                style={{ flex: 1, height: 40, fontSize: 13, border: '2px solid #6366f1', color: '#6366f1' }}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
