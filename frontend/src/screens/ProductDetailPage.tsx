import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI, cartAPI, wishlistAPI } from '../services/api';
import { Product, Review } from '../types';
import { useToast } from '../context/ToastContext';
import { ProductDetailSkeleton } from '../components/Skeleton';
import FrequentlyBought from '../components/FrequentlyBought';
import CouponClip, { getAppliedCoupons } from '../components/CouponClip';
import CountdownTimer from '../components/CountdownTimer';

type SortMode = 'newest' | 'highest' | 'lowest';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const lightningDealEnd = new Date(Date.now() + 4 * 3600000 + 30 * 60000);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productAPI.getById(id!);
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
      setWishlisted(ids.includes(id));
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
        style={{ cursor: 'pointer', fontSize: 24, color: s <= current ? 'var(--rating-star)' : '#ddd', transition: 'color 0.15s' }}>
        {'\u2605'}
      </span>
    ));
  };

  const handleAddToCart = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { navigate('/login'); return; }
      await cartAPI.add(product!._id, quantity);
      showToast(`${product!.name} added to cart!`, 'success');
      navigate('/cart');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { navigate('/login'); return; }
      await cartAPI.add(product!._id, quantity);
      navigate('/checkout');
    } catch {
      showToast('Failed to process', 'error');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { navigate('/login'); return; }
      if (wishlisted) {
        await wishlistAPI.remove(product!._id);
        setWishlisted(false);
        showToast('Removed from wishlist', 'info');
      } else {
        await wishlistAPI.add(product!._id);
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
      const reviewData: any = { rating: reviewRating, title: reviewTitle, comment: reviewComment };
      if (reviewImages.length > 0) {
        const existing = JSON.parse(localStorage.getItem('reviewImages') || '{}');
        const key = `product_${id}`;
        existing[key] = [...(existing[key] || []), ...reviewImages];
        localStorage.setItem('reviewImages', JSON.stringify(existing));
      }
      await productAPI.createReview(id!, reviewData);
      showToast('Review submitted!', 'success');
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewImages([]);
      const res = await productAPI.getById(id!);
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
      <div className="empty-state">
        <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u{1F50D}'}</div>
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <Link to="/products" className="hero-cta" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
          Browse Products
        </Link>
      </div>
    );
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const isLightningDeal = discount >= 25 && product.countInStock > 0;

  const primeDelivery = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const primeDeliveryMax = new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const colors = ['Black', 'White', 'Blue', 'Red', 'Silver'];
  const sizes = ['Small', 'Medium', 'Large', 'XL'];

  return (
    <div className="product-detail">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        {typeof product.category === 'object' && (
          <><Link to={`/products?category=${(product.category as { slug: string }).slug}`}>
            {(product.category as { name: string }).name}
          </Link></>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-detail-main">
        <div className="product-gallery">
          <div className="product-thumbnails">
            {product.images.map((img, idx) => (
              <img key={idx} src={img} alt=""
                className={idx === selectedImage ? 'active' : ''}
                onClick={() => setSelectedImage(idx)} />
            ))}
          </div>
          <div className="product-main-image">
            <img src={product.images[selectedImage]} alt={product.name} />
          </div>
        </div>

        <div className="product-info">
          {product.isFeatured && <div className="amazon-choice-badge">ShopSmart's Choice</div>}
          <h1>{product.name}</h1>
          <div className="product-info-rating">
            <span className="stars">{renderStars(product.rating)}</span>
            <span className="rating-link">{product.numReviews.toLocaleString()} {product.numReviews === 1 ? 'rating' : 'ratings'}</span>
            <span className="rating-sep">|</span>
            <span className="rating-sold">{product.numReviews > 0 ? `${(product.numReviews * 37).toLocaleString()}+ bought in past month` : ''}</span>
          </div>

          <div className="price-box">
            <div className="price-box-row">
              <span className="current-price">${product.price.toFixed(2)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="compare-price">${product.comparePrice.toFixed(2)}</span>
                  <span className="discount-badge">-{discount}%</span>
                </>
              )}
            </div>
            {product.comparePrice && (
              <div style={{ fontSize: 13, color: '#565959', marginTop: 2 }}>
                No Import Fees & Free Shipping Included
              </div>
            )}
          </div>

          {discount >= 20 && (
            <div className="coupon-clip">
              <span className="coupon-icon">{'\u2702'}</span>
              <span>Save {discount}% with coupon (some exceptions)</span>
            </div>
          )}

          <div className="delivery-estimate">
            <div className="delivery-row">
              <span className="delivery-label">Delivery</span>
              <span><strong>{primeDelivery} - {primeDeliveryMax}</strong></span>
            </div>
            <div className="delivery-row">
              <span className="delivery-label">Or fastest</span>
              <span style={{ color: '#007185' }}>Tomorrow, {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="stock-info">
            {product.countInStock > 0 ? (
              <>
                <span className="in-stock">{'\u2713'} In Stock</span>
                {product.countInStock <= 10 && (
                  <span className="low-stock">Only {product.countInStock} left in stock - order soon.</span>
                )}
              </>
            ) : (
              <span className="out-of-stock">Currently unavailable</span>
            )}
          </div>

          <div className="variant-section">
            <div className="variant-label">Color: <strong>{selectedColor || 'Select'}</strong></div>
            <div className="variant-options">
              {colors.map((c) => (
                <button key={c} className={`variant-btn ${selectedColor === c ? 'active' : ''}`}
                  onClick={() => setSelectedColor(c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="variant-section">
            <div className="variant-label">Size: <strong>{selectedSize || 'Select'}</strong></div>
            <div className="variant-options">
              {sizes.map((s) => (
                <button key={s} className={`variant-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}>{s}</button>
              ))}
            </div>
          </div>

          {product.features && product.features.length > 0 && (
            <div className="feature-bullets">
              <h4>About this item</h4>
              <ul>
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {product.countInStock > 0 && (
            <div className="qty-add-section">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>{'\u2212'}</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}>+</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <button className="btn-primary" onClick={handleAddToCart} disabled={product.countInStock === 0}>
                  Add to Cart
                </button>
                <button className="btn-secondary" onClick={handleBuyNow} disabled={product.countInStock === 0}>
                  Buy Now
                </button>
              </div>
            </div>
          )}

            <button className={`wishlist-toggle ${wishlisted ? 'active' : ''}`} onClick={handleToggleWishlist}>
            {wishlisted ? '\u2665' : '\u2661'} {wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
          </button>

          <CouponClip productPrice={product.price} productName={product.name} />
        </div>

        <div className="buy-box" style={{ position: 'sticky', top: 80 }}>
          {isLightningDeal && (
            <div className="lightning-deal-badge">
              <span className="lightning-icon">{'\u26A1'}</span>
              <div>
                <strong>Lightning Deal</strong>
                <CountdownTimer endDate={lightningDealEnd} size="small" />
              </div>
            </div>
          )}
          <div className="buy-box-price">${product.price.toFixed(2)}</div>
          {product.countInStock > 0 ? (
            <span className="in-stock" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>In Stock</span>
          ) : (
            <span className="out-of-stock" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>Out of Stock</span>
          )}
          <div className="quantity-selector" style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, marginRight: 8, fontWeight: 500 }}>Qty:</label>
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n} disabled={n > product.countInStock}>{n}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={handleAddToCart} disabled={product.countInStock === 0} style={{ marginBottom: 8 }}>
            Add to Cart
          </button>
          <button className="buy-now-amazon" onClick={handleBuyNow} disabled={product.countInStock === 0}>
            Buy Now
          </button>
          <div className="secure-transaction">
            {'\u{1F512}'} Secure transaction
          </div>
          <div className="seller-info">
            <div>Ships from <strong>ShopSmart</strong></div>
            <div>Sold by <strong style={{ color: '#007185' }}>ShopSmart Direct</strong></div>
            {product.countInStock > 0 && (
              <div style={{ marginTop: 6, padding: 8, background: '#f0f8ff', borderRadius: 6, fontSize: 12 }}>
                <strong>Free returns</strong>
                <div style={{ color: '#565959', marginTop: 2 }}>Free 30-day returns. Learn more</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FrequentlyBought product={product} relatedProducts={related} />

      {product.description && (
        <div className="product-description">
          <h2>Product Description</h2>
          <p>{product.description}</p>
        </div>
      )}

      {/* Star rating histogram */}
      <div className="reviews-section">
        <div className="reviews-header-row">
          <h2>Customer Reviews</h2>
          {product.reviews && product.reviews.length > 0 && (
            <select value={sortReviews} onChange={(e) => setSortReviews(e.target.value as SortMode)}
              className="sort-reviews-select">
              <option value="newest">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          )}
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <>
            <div className="review-summary">
              <div className="review-summary-left">
                <div className="review-big-score">{product.rating.toFixed(1)}</div>
                <div className="stars">{renderStars(product.rating)}</div>
                <div style={{ fontSize: 13, color: '#565959' }}>{product.numReviews} total ratings</div>
              </div>
              <div className="review-histogram">
                {getStarDistribution().map(({ star, count, pct }) => (
                  <div key={star} className="histogram-row">
                    <span className="histogram-star">{star} star</span>
                    <div className="histogram-bar-bg">
                      <div className="histogram-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="histogram-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reviews-list">
              {getSortedReviews().map((review) => {
                const stored = JSON.parse(localStorage.getItem('reviewImages') || '{}');
                const key = `product_${id}`;
                const imgs = stored[key] || [];
                return (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">{review.name.charAt(0).toUpperCase()}</div>
                      <strong>{review.name}</strong>
                      <span className="verified-badge">{'\u2713'} Verified Purchase</span>
                    </div>
                    <div className="review-stars">{renderStars(review.rating)}</div>
                    <div className="review-title">{review.title}</div>
                    <div className="review-comment">{review.comment}</div>
                    {imgs.length > 0 && (
                      <div className="review-images">
                        {imgs.map((url: string, i: number) => (
                          <img key={i} src={url} alt="Review" className="review-image" />
                        ))}
                      </div>
                    )}
                    <div className="review-date">
                      Reviewed in the United States on {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: '#565959', marginBottom: 16 }}>No reviews yet. Be the first to review this product!</p>
          </div>
        )}

        <div className="write-review">
          <h3>Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Overall rating</label>
              <div style={{ display: 'flex', gap: 2 }}>
                {renderInteractiveStars(reviewRating, setReviewRating)}
              </div>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" placeholder="What's most important to know?" value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Review</label>
              <textarea placeholder="What did you like or dislike?" value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)} rows={4}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label>Add Images (optional)</label>
              <div className="review-image-upload">
                <input type="text" placeholder="Paste image URL..." value={reviewImageUrl}
                  onChange={(e) => setReviewImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReviewImage(); } }} />
                <button type="button" className="btn-secondary" onClick={handleAddReviewImage}
                  style={{ padding: '10px 16px', flex: 0 }}>Add</button>
              </div>
              {reviewImages.length > 0 && (
                <div className="review-image-previews">
                  {reviewImages.map((url, idx) => (
                    <div key={idx} className="review-image-preview">
                      <img src={url} alt="" />
                      <button type="button" onClick={() => handleRemoveReviewImage(idx)}>{'\u2717'}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="submit-btn" disabled={submittingReview} style={{ maxWidth: 240 }}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {alsoViewed.length > 0 && (
        <section className="section" style={{ padding: '24px 0' }}>
          <div className="section-header">
            <h2 className="section-title">Customers who viewed this also viewed</h2>
          </div>
          <div className="deals-carousel">
            <div className="deals-scroll">
              {alsoViewed.map((p) => {
                const d = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
                return (
                  <div key={p._id} className="mini-product-card" onClick={() => navigate(`/products/${p._id}`)}>
                    <img src={p.images[0]} alt={p.name} />
                    <div className="mini-product-name">{p.name}</div>
                    <div className="stars" style={{ fontSize: 12 }}>{renderStars(p.rating)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                      ${p.price.toFixed(2)}
                      {p.comparePrice && <span style={{ fontSize: 12, color: '#565959', textDecoration: 'line-through', marginLeft: 4 }}>${p.comparePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section" style={{ padding: '24px 0' }}>
          <div className="section-header">
            <h2 className="section-title">Related products</h2>
            <Link to="/products" className="section-link">See all results {'\u2192'}</Link>
          </div>
          <div className="deals-carousel">
            <div className="deals-scroll">
              {related.map((p) => {
                const d = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
                return (
                  <div key={p._id} className="mini-product-card" onClick={() => navigate(`/products/${p._id}`)}>
                    <img src={p.images[0]} alt={p.name} />
                    <div className="mini-product-name">{p.name}</div>
                    <div className="stars" style={{ fontSize: 12 }}>{renderStars(p.rating)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                      ${p.price.toFixed(2)}
                      {p.comparePrice && <span style={{ fontSize: 12, color: '#565959', textDecoration: 'line-through', marginLeft: 4 }}>${p.comparePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Mobile Bottom Bar */}
      {product.countInStock > 0 && (
        <div className="sticky-cart-bar">
          <div className="sticky-cart-bar-inner">
            <div>
              <div className="sticky-cart-price">${product.price.toFixed(2)}</div>
              {product.comparePrice && (
                <div className="sticky-cart-compare">${product.comparePrice.toFixed(2)}</div>
              )}
            </div>
            <div className="sticky-cart-actions">
              <div className="sticky-qty">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>{'\u2212'}</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}>+</button>
              </div>
              <button className="sticky-add-to-cart" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="sticky-buy-now" onClick={handleBuyNow}>
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
