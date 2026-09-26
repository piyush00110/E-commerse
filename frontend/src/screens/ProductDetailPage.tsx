'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="#e5e7eb"><rect width="400" height="400"/><text x="200" y="208" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>');

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
  const [prevSelectedImage, setPrevSelectedImage] = useState(0);
  const [imageFade, setImageFade] = useState(true);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [sortReviews, setSortReviews] = useState<SortMode>('newest');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [colorAnimating, setColorAnimating] = useState<string>('');
  const [sizeAnimating, setSizeAnimating] = useState<string>('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const lightningDealEnd = useMemo(() => new Date(Date.now() + 4 * 3600000 + 30 * 60000), []);

  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [breadcrumbVisible, setBreadcrumbVisible] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const reviewCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainButtonsRef = useRef<HTMLDivElement>(null);

  const checkWishlistedCb = useCallback(async () => {
    try {
      const res = await wishlistAPI.get();
      const ids = (res.data.data.products || []).map((p: Product) => p._id);
      setWishlisted(id ? ids.includes(id) : false);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (!id) { router.push('/products'); return; }
    let cancelled = false;
    const fetchProduct = async () => {
      try {
        const res = await productAPI.getById(id);
        if (cancelled) return;
        const prod = res.data.data;
        setProduct(prod);
        setSelectedImage(0);
        setPrevSelectedImage(0);
        trackRecentlyViewed(prod);
        if (prod.category) {
          const catId = typeof prod.category === 'object' ? (prod.category as { _id: string })._id : prod.category;
          const [relatedRes, allRes] = await Promise.all([
            productAPI.getAll({ category: catId, limit: 8 }),
            productAPI.getAll({ limit: 20, sort: '-num_reviews' }),
          ]);
          if (cancelled) return;
          setRelated(relatedRes.data.data.filter((p: Product) => p._id !== prod._id).slice(0, 4));
          setAlsoViewed(allRes.data.data.filter((p: Product) => p._id !== prod._id).slice(0, 4));
        }
      } catch {
        if (!cancelled) showToast('Failed to load product', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    checkWishlistedCb();
    return () => { cancelled = true; };
  }, [id, router, showToast, checkWishlistedCb]);

  useEffect(() => {
    const timer = setTimeout(() => setBreadcrumbVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setReviewsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = document.getElementById('reviews-section');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainButtonsRef.current) {
        const rect = mainButtonsRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageSwitch = useCallback((idx: number) => {
    if (idx === selectedImage) return;
    setImageFade(false);
    setTimeout(() => {
      setPrevSelectedImage(idx);
      setSelectedImage(idx);
      setImageFade(true);
    }, 200);
  }, [selectedImage]);

  // (uses checkWishlistedCb defined above)
  const checkWishlisted = checkWishlistedCb;

  const trackRecentlyViewed = (prod: Product) => {
    try {
      if (typeof window === 'undefined') return;
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
        style={{ cursor: 'pointer', fontSize: 24, color: s <= current ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s', transform: s <= current ? 'scale(1.1)' : 'scale(1)', display: 'inline-block' }}>
        {'\u2605'}
      </span>
    ));
  };

  const handleAddToCart = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
      await cartAPI.add(product?._id ?? '', quantity);
      setCartBounce(true);
      setCartSuccess(true);
      setShowCartToast(true);
      showToast(`${product?.name} added to cart!`, 'success');
      setTimeout(() => setCartBounce(false), 600);
      setTimeout(() => setCartSuccess(false), 2000);
      setTimeout(() => setShowCartToast(false), 2500);
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
      setWishlistAnimating(true);
      setTimeout(() => setWishlistAnimating(false), 800);
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

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    setColorAnimating(colorName);
    setTimeout(() => setColorAnimating(''), 400);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeAnimating(size);
    setTimeout(() => setSizeAnimating(''), 400);
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
      if (reviewImages.length > 0 && typeof window !== 'undefined') {
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

  const sortedReviews = useMemo(() => {
    if (!product?.reviews) return [];
    const reviews = [...product.reviews];
    switch (sortReviews) {
      case 'highest': return reviews.sort((a, b) => b.rating - a.rating);
      case 'lowest': return reviews.sort((a, b) => a.rating - b.rating);
      default: return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [product, sortReviews]);

  const [reviewImagesMap, setReviewImagesMap] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setReviewImagesMap(JSON.parse(localStorage.getItem('reviewImages') || '{}'));
      }
    } catch { /* ignore */ }
  }, []);

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
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Product not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The product you&apos;re looking for doesn&apos;t exist.</p>
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

  const toggleAccordion = (key: string) => {
    setActiveAccordion(prev => prev === key ? null : key);
  };

  const primaryColor = '#6366f1';
  const bgColor = 'var(--bg-container)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif", paddingBottom: product.countInStock > 0 ? 80 : 0 }}>
      <style jsx global>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cartBounce {
          0% { transform: scale(1); }
          20% { transform: scale(0.9); }
          40% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.3); }
          28% { transform: scale(1); }
          42% { transform: scale(1.3); }
          70% { transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(100%); }
        }
        @keyframes stickyBarSlideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .image-crossfade {
          transition: opacity 0.25s ease-in-out;
        }
        .cart-bounce {
          animation: cartBounce 0.5s ease-in-out;
        }
        .wishlist-heart {
          animation: heartBeat 0.8s ease-in-out;
        }
        .review-card-animate {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .toast-enter {
          animation: toastSlideIn 0.3s ease-out forwards;
        }
        .toast-exit {
          animation: toastSlideOut 0.3s ease-in forwards;
        }
        .sticky-bar-animate {
          animation: stickyBarSlideIn 0.3s ease-out forwards;
        }
        .thumbnail-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .thumbnail-scroll::-webkit-scrollbar {
          display: none;
        }
        .pulse-gallery {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        .pulse-gallery-main {
          width: 100%;
          aspect-ratio: 1/1;
          background: var(--bg-container-low);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 0;
          position: relative;
        }
        .pulse-thumbnails {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          background: var(--bg-card);
        }
        .pulse-thumbnails::-webkit-scrollbar {
          display: none;
        }
        .pulse-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid var(--border);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          background: var(--bg-container);
        }
        .pulse-thumb.active {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
        }
        .pulse-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }
        .pulse-info {
          padding: 16px;
        }
        .pulse-rating-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-container);
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .pulse-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pulse-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }
        .pulse-badge-success {
          background: #dcfce7;
          color: #10b981;
        }
        .pulse-badge-error {
          background: #fef2f2;
          color: #ef4444;
        }
        .pulse-color-swatch {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .pulse-color-swatch.active {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .pulse-size-chip {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .pulse-size-chip.active {
          background: ${primaryColor};
          border-color: ${primaryColor};
          color: #fff;
        }
        .pulse-qty-btn {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          fontSize: 18px;
          fontWeight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: 'var(--text-secondary)',
          transition: 'background 0.15s',
        }
        .pulse-qty-btn:hover {
          background: var(--bg-container);
        }
        .pulse-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pulse-action-row {
          display: flex;
          gap: 10px;
          padding: 0 16px 16px;
        }
        .pulse-bento-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 16px;
        }
        .pulse-bento-card {
          background: var(--bg-container);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          border: 1px solid var(--border-light);
        }
        .pulse-bento-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: ${primaryColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
        }
        .pulse-accordion {
          border-top: 1px solid var(--border-light);
        }
        .pulse-accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }
        .pulse-accordion-body {
          padding: 0 16px 16px;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          animation: fadeInUp 0.25s ease-out;
        }
        .pulse-related-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 0 16px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pulse-related-scroll::-webkit-scrollbar {
          display: none;
        }
        .pulse-related-card {
          flex-shrink: 0;
          width: 150px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          text-decoration: none;
          transition: transform 0.2s;
        }
        .pulse-related-card:hover {
          transform: translateY(-2px);
        }
        .pulse-related-img {
          width: 100%;
          aspect-ratio: 1/1;
          object-fit: cover;
          background: var(--bg-container);
        }
        .pulse-sticky-bar {
          position: fixed;
          bottom: calc(var(--bottom-nav-height, 68px) + 20px + env(safe-area-inset-bottom, 0px));
          left: 0;
          right: 0;
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          padding: 12px 16px;
          z-index: 100;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
          transform: translateY(100%);
          transition: transform 0.3s ease-out;
        }
        .pulse-sticky-bar.visible {
          transform: translateY(0);
        }
        @media (min-width: 768px) {
          .pulse-gallery {
            grid-template-columns: 1fr 1fr;
          }
          .pulse-gallery-main {
            border-radius: 16px;
            margin: 16px 0 0 16px;
          }
          .pulse-thumbnails {
            position: absolute;
            left: 16px;
            bottom: 16px;
            padding: 8px;
            background: var(--bg-glass-thick);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            width: auto;
            max-width: 320px;
          }
          .pulse-info {
            padding: 24px 32px 24px 40px;
          }
          .pulse-action-row {
            padding: 0 32px 24px 40px;
          }
          .pulse-bento-grid {
            padding: 24px 32px;
          }
          .pulse-related-scroll {
            padding: 0 32px 24px;
          }
          .pulse-sticky-bar {
            display: none;
          }
        }
      `}</style>

      <div className="pulse-gallery">
        {/* Main Image */}
        <div className="pulse-gallery-main">
          <img
            src={(product.images?.[selectedImage] || product.images?.[0] || PLACEHOLDER_IMG)}
            alt={product.name}
            className="image-crossfade"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: imageFade ? 1 : 0 }}
          />
        </div>
        {/* Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="pulse-thumbnails thumbnail-scroll" style={{ position: 'relative' }}>
            {product.images.map((img, idx) => (
              <button key={idx} onClick={() => handleImageSwitch(idx)}
                className={`pulse-thumb ${idx === selectedImage ? 'active' : ''}`}>
                <img src={img} alt="" style={{ opacity: idx === selectedImage ? 1 : 0.6 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pulse-info">
        {/* Breadcrumb */}
        <nav className="breadcrumb" style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap',
          opacity: breadcrumbVisible ? 1 : 0,
          transform: breadcrumbVisible ? 'translateX(0)' : 'translateX(-16px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        }}>
          <Link href="/" style={{ color: primaryColor, textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          {typeof product.category === 'object' && (
            <>
              <Link href={`/products?category=${(product.category as { slug: string }).slug}`} style={{ color: primaryColor, textDecoration: 'none' }}>
                {(product.category as { name: string }).name}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{product.name}</span>
        </nav>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)'  , marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {product.name}
        </h1>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div className="pulse-rating-pill">
            <span style={{ color: '#f59e0b', fontSize: 14 }}>{'\u2605'}</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            ({product.numReviews.toLocaleString()} {product.numReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 14 }}>
          <div className="pulse-price-row">
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)'   }}>
              ${(product.price ?? 0).toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span style={{ fontSize: 16, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                  ${(product.comparePrice ?? 0).toFixed(2)}
                </span>
                <span className="pulse-badge pulse-badge-success">-{discount}%</span>
              </>
            )}
          </div>
        </div>

        {/* Stock Badge */}
        <div style={{ marginBottom: 14 }}>
          {product.countInStock > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="pulse-badge pulse-badge-success">In stock</span>
              {product.countInStock <= 10 && (
                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                  Only {product.countInStock} left!
                </span>
              )}
            </div>
          ) : (
            <span className="pulse-badge pulse-badge-error">Out of stock</span>
          )}
        </div>

        {/* Free Delivery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#065f46' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span><strong>FREE delivery</strong> {primeDelivery}</span>
        </div>
      </div>

      {/* Color Selector */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)'  , marginBottom: 10 }}>
          Color: <span style={{ color: primaryColor, fontWeight: 700 }}>{selectedColor || 'Select'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {colors.map((c) => (
            <button key={c.name} onClick={() => handleColorSelect(c.name)}
              className={`pulse-color-swatch ${selectedColor === c.name ? 'active' : ''}`}
              style={{
                background: c.hex,
                transform: colorAnimating === c.name ? 'scale(1.15)' : 'scale(1)',
              }}
              title={c.name} />
          ))}
        </div>
      </div>

      {/* Size Selector */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)'   }}>
            Size: <span style={{ color: primaryColor, fontWeight: 700 }}>{selectedSize || 'Select'}</span>
          </span>
          <button style={{ fontSize: 13, color: primaryColor, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Size Guide
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {sizes.map((s) => (
            <button key={s} onClick={() => handleSizeSelect(s)}
              className={`pulse-size-chip ${selectedSize === s ? 'active' : ''}`}
              style={{ transform: sizeAnimating === s ? 'scale(1.05)' : 'scale(1)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      {product.countInStock > 0 && (
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)'  , marginBottom: 10 }}>Quantity</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <button className="pulse-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
              style={{ borderRadius: 0, border: 'none' }}>
              {'\u2212'}
            </button>
            <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: 16, color: 'var(--text)'   }}>{quantity}</span>
            <button className="pulse-qty-btn" onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}
              style={{ borderRadius: 0, border: 'none' }}>
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {product.countInStock > 0 && (
        <div ref={mainButtonsRef} className="pulse-action-row">
          <button
            className={`btn btn-primary btn-lg ${cartBounce ? 'cart-bounce' : ''}`}
            onClick={handleAddToCart}
            style={{
              flex: 2, height: 48, fontSize: 15, fontWeight: 700, borderRadius: 12,
              background: cartSuccess ? '#10b981' : primaryColor,
              transition: 'background 0.3s, transform 0.2s',
            }}
          >
            {cartSuccess ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added!
              </span>
            ) : 'Add to Cart'}
          </button>
          <button
            className="btn btn-lg"
            onClick={handleBuyNow}
            style={{
              flex: 1, height: 48, fontSize: 15, fontWeight: 700, borderRadius: 12,
              background: 'var(--bg-card)', border: `2px solid ${primaryColor}`, color: primaryColor,
            }}
          >
            Buy Now
          </button>
        </div>
      )}

      {/* Bento Feature Deck */}
      <div style={{ borderTop: '8px solid var(--bg-container)' }}>
        <div className="pulse-bento-grid">
          {[
            { icon: '\u{1F69A}', label: 'Free Shipping', desc: 'On orders over $50' },
            { icon: '\u{1F512}', label: 'Secure Payment', desc: '100% protected' },
            { icon: '\u{1F504}', label: 'Easy Returns', desc: '30-day policy' },
            { icon: '\u{2753}', label: '24/7 Support', desc: 'We\'re here to help' },
          ].map((f) => (
            <div key={f.label} className="pulse-bento-card">
              <div className="pulse-bento-icon">{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)'   }}>{f.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Accordions */}
      <div style={{ borderTop: '1px solid var(--border-light)' }}>
        {/* Product Details */}
        <div className="pulse-accordion">
          <button className="pulse-accordion-header" onClick={() => toggleAccordion('details')}>
            <span>Product Details</span>
            <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: activeAccordion === 'details' ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
          </button>
          {activeAccordion === 'details' && (
            <div className="pulse-accordion-body">
              {product.description && <p style={{ margin: 0 }}>{product.description}</p>}
              {product.features && product.features.length > 0 && (
                <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                  {product.features.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
                </ul>
              )}
              {!product.description && (!product.features || product.features.length === 0) && (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>No additional details available.</p>
              )}
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="pulse-accordion">
          <button className="pulse-accordion-header" onClick={() => toggleAccordion('specs')}>
            <span>Specifications</span>
            <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: activeAccordion === 'specs' ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
          </button>
          {activeAccordion === 'specs' && (
            <div className="pulse-accordion-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {product.brand && <><div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Brand</div><div style={{ fontWeight: 600 }}>{product.brand}</div></>}
                {typeof product.category === 'object' && <><div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Category</div><div style={{ fontWeight: 600 }}>{(product.category as { name: string }).name}</div></>}
                {typeof product === 'object' && 'sku' in product && (product as any).sku && <><div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>SKU</div><div style={{ fontWeight: 600 }}>{(product as any).sku}</div></>}
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Weight</div>
                <div style={{ fontWeight: 600 }}>{typeof product === 'object' && 'weight' in product && (product as any).weight ? `${(product as any).weight}kg` : 'N/A'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Returns */}
        <div className="pulse-accordion">
          <button className="pulse-accordion-header" onClick={() => toggleAccordion('shipping')}>
            <span>Shipping & Returns</span>
            <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: activeAccordion === 'shipping' ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
          </button>
          {activeAccordion === 'shipping' && (
            <div className="pulse-accordion-body">
              <p style={{ margin: 0, marginBottom: 8 }}><strong>Shipping:</strong> Free standard delivery on orders over $50. Express and overnight options available at checkout.</p>
              <p style={{ margin: 0, marginBottom: 8 }}><strong>Returns:</strong> Hassle-free 30-day return policy. Items must be unused and in original packaging.</p>
              <p style={{ margin: 0 }}><strong>Estimated delivery:</strong> {primeDelivery} - {primeDeliveryMax}</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="pulse-accordion">
          <button className="pulse-accordion-header" onClick={() => toggleAccordion('reviews')}>
            <span>Reviews ({product.numReviews})</span>
            <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: activeAccordion === 'reviews' ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
          </button>
          {activeAccordion === 'reviews' && (
            <div className="pulse-accordion-body" style={{ padding: '0 16px 16px' }}>
              <div id="reviews-section">
                {product.reviews && product.reviews.length > 0 ? (
                  <>
                    {/* Review Summary */}
                    <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 12 }}>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center', minWidth: 80 }}>
                          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)'   }}>{product.rating.toFixed(1)}</div>
                          <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginBottom: 4 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} style={{ fontSize: 14, color: s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                            ))}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{product.numReviews} ratings</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          {getStarDistribution().map(({ star, count, pct }) => (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: '#475569', width: 32 }}>{star} star</span>
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 9999 }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 20, textAlign: 'right' }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sort */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)'   }}>All Reviews</span>
                      <select value={sortReviews} onChange={(e) => setSortReviews(e.target.value as SortMode)}
                        className="form-select" style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12, background: 'var(--bg-card)' }}>
                        <option value="newest">Most recent</option>
                        <option value="highest">Highest rated</option>
                        <option value="lowest">Lowest rated</option>
                      </select>
                    </div>

                    {/* Review Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sortedReviews.map((review, index) => {
                        const imgs = reviewImagesMap[`product_${id}`] || [];
                        return (
                          <div key={review._id} ref={(el) => { reviewCardRefs.current[index] = el; }}
                            className="card review-card-animate"
                            style={{ padding: 14, borderRadius: 12, animationDelay: reviewsVisible ? `${index * 0.1}s` : '0s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 9999, background: primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                {review.name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: 13, color: 'var(--text)'   }}>{review.name}</strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                  <span className="badge badge-success" style={{ fontSize: 9, padding: '1px 5px' }}>{'\u2713'} Verified</span>
                                </div>
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 1, marginBottom: 4 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} style={{ fontSize: 12, color: s <= review.rating ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                              ))}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)'  , marginBottom: 3 }}>{review.title}</div>
                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 6 }}>{review.comment}</div>
                            {imgs.length > 0 && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                {imgs.map((url: string, i: number) => (
                                  <img key={i} src={url} alt="Review" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Write Review */}
                    <div className="card" style={{ padding: 16, marginTop: 16, borderRadius: 12 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)'  , marginBottom: 12 }}>Write a Review</h4>
                      <form onSubmit={handleSubmitReview}>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: 'var(--text)'   }}>Rating</label>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {renderInteractiveStars(reviewRating, setReviewRating)}
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="form-label" style={{ fontSize: 13 }}>Title</label>
                          <input className="form-input" type="text" placeholder="Review title" value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)} style={{ fontSize: 13 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="form-label" style={{ fontSize: 13 }}>Review</label>
                          <textarea className="form-input" placeholder="Your review..." value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)} rows={3} style={{ resize: 'vertical', fontSize: 13 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="form-label" style={{ fontSize: 13 }}>Images (optional)</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input className="form-input" type="text" placeholder="Paste image URL" value={reviewImageUrl}
                              onChange={(e) => setReviewImageUrl(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReviewImage(); } }}
                              style={{ flex: 1, fontSize: 13 }} />
                            <button type="button" className="btn btn-secondary" onClick={handleAddReviewImage}
                              style={{ padding: '8px 12px', fontSize: 13 }}>Add</button>
                          </div>
                          {reviewImages.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                              {reviewImages.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                  <img src={url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                  <button type="button" onClick={() => handleRemoveReviewImage(idx)} style={{
                                    position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9999,
                                    background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>{'\u2717'}</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={submittingReview}
                          style={{ height: 42, fontSize: 14, borderRadius: 10 }}>
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="card" style={{ padding: 32, textAlign: 'center', borderRadius: 12 }}>
                    <p style={{ color: 'var(--text-tertiary)', marginBottom: 12, fontSize: 14 }}>No reviews yet</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Be the first to review this product!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section style={{ marginTop: 8, borderTop: '8px solid var(--bg-container)' }}>
          <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)'  , margin: 0 }}>Related Products</h2>
            <Link href="/products" style={{ fontSize: 13, color: primaryColor, textDecoration: 'none', fontWeight: 600 }}>See all</Link>
          </div>
          <div className="carousel-scroll pulse-related-scroll">
            {related.map((p) => (
              <Link key={p._id} href={`/products/${p._id}`} className="product-card pulse-related-card">
                <img className="pulse-related-img" src={(p.images?.[0] || PLACEHOLDER_IMG)} alt={p.name} />
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)'  , marginBottom: 3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', gap: 1, marginBottom: 3 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ fontSize: 10, color: s <= Math.round(p.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)'   }}>${(p.price ?? 0).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Also Viewed */}
      {alsoViewed.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border-light)' }}>
          <div style={{ padding: '16px 16px 12px' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)'  , margin: 0 }}>You May Also Like</h2>
          </div>
          <div className="carousel-scroll pulse-related-scroll">
            {alsoViewed.map((p) => (
              <Link key={p._id} href={`/products/${p._id}`} className="product-card pulse-related-card">
                <img className="pulse-related-img" src={(p.images?.[0] || PLACEHOLDER_IMG)} alt={p.name} />
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)'  , marginBottom: 3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)'   }}>${(p.price ?? 0).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cart Toast */}
      {showCartToast && (
        <div
          className="toast-enter"
          style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', padding: '12px 24px', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            fontWeight: 600, fontSize: 14, zIndex: 200,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Added to cart!
        </div>
      )}

      {/* Sticky Bottom Bar (mobile) */}
      {product.countInStock > 0 && (
        <div className={`pulse-sticky-bar ${showStickyBar ? 'visible' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)'   }}>${(product.price ?? 0).toFixed(2)}</div>
              {product.comparePrice && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${(product.comparePrice ?? 0).toFixed(2)}</div>
              )}
            </div>
            <button
              className={`btn btn-primary ${cartBounce ? 'cart-bounce' : ''}`}
              onClick={handleAddToCart}
              style={{
                flex: 1, height: 44, fontSize: 14, fontWeight: 700, borderRadius: 10,
                background: cartSuccess ? '#10b981' : primaryColor,
              }}
            >
              {cartSuccess ? '\u2713 Added' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
