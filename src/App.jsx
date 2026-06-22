import Checkout from './Checkout';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import AdminPanel from './AdminPanel';
import SupportModals from './SupportModals'; 
import './index.css';

export default function App() {
  // --- REVIEWS DATA STATE ---
  const [allReviews, setAllReviews] = useState([]);

  // --- STATE FOR CAROUSEL & MAGNIFIER ---
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [zoomStyle, setZoomStyle] = useState({ transform: 'scale(1)' });

  const handleMouseMoveMagnifier = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(2.2)' });
  };

  // --- MAIN STATE MANAGEMENT ---
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // --- FILTERING, SORTING, & DISCOVERY STATE ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All'); 
  const [showOnlySales, setShowOnlySales] = useState(false);  
  const [searchQuery, setSearchQuery] = useState('');        
  const [sortOption, setSortOption] = useState('Newest');

  // --- NEWSLETTER & SUPPORT OVERLAY STATES ---
  const [newsletterEmail, setNewsletterEmail] = useState(''); 
  const [heroNewsletterEmail, setHeroNewsletterEmail] = useState(''); 
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [supportType, setSupportType] = useState(null); 

  const [isPrototypeModalOpen, setIsPrototypeModalOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);

  // --- LUXURY CUSTOM CURSOR TRACKING STATE ---
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [isHoveredLink, setIsHoveredLink] = useState(false);

  // Initialize Cart & Wishlist from Browser LocalStorage
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('luxe_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlisted, setWishlisted] = useState(() => {
    const savedWishlist = localStorage.getItem('luxe_wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // --- FIXED SCHEMA SCOPING: CALCULATE DERIVED VALUES EARLY ---
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [activeSize, setActiveSize] = useState('S');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('luxe_wishlist', JSON.stringify(wishlisted));
  }, [wishlisted]);

  // Synchronize cursor positioning mechanics natively
  useEffect(() => {
    const handleMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Soft elastic delay logic loop for the secondary trailing ring
  useEffect(() => {
    let animationFrameId;
    const updateTrailing = () => {
      setTrailingPos((prev) => {
        const dx = cursorPos.x - prev.x;
        const dy = cursorPos.y - prev.y;
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15
        };
      });
      animationFrameId = requestAnimationFrame(updateTrailing);
    };
    animationFrameId = requestAnimationFrame(updateTrailing);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cursorPos]);

  // Event dynamic hook to detect clickable objects for expansion transforms
  useEffect(() => {
    const handleMouseOver = (e) => {
      const target = e.target;
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'SELECT' || 
        target.closest('.product-card') || 
        target.closest('.cat-card') ||
        window.getComputedStyle(target).cursor === 'pointer';
        
      setIsHoveredLink(!!isClickable);
    };
    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

  // --- INITIAL DATA ORCHESTRATION ---
  useEffect(() => {
    fetchInitialCatalog();
  }, []); 

  const fetchInitialCatalog = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchReviews()]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setAllReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const getProductRatingMetrics = (productId) => {
    const productReviews = allReviews.filter(r => r.product_id === productId);
    if (productReviews.length === 0) return { avgRating: '4.9', count: 0, reviewsList: [] };
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = (total / productReviews.length).toFixed(1);
    return { avgRating: avg, count: productReviews.length, reviewsList: productReviews };
  };

  const calculateDiscountBadge = (price, oldPrice) => {
    if (!oldPrice || oldPrice <= price) return null;
    return `-${Math.round(((oldPrice - price) / oldPrice) * 100)}%`;
  };

  // --- INR CURRENCY LOCALESTRING HELPER ---
  const formatINR = (amount) => {
    return Number(amount).toLocaleString('en-IN');
  };

  // --- DYNAMIC HERO FLOATING IMAGES PIPELINE ---
  const getHeroProduct = (keyword, fallbackImgUrl, fallbackName, fallbackBrand, fallbackPrice) => {
    const item = products.find(p => p.name?.toLowerCase().includes(keyword) || p.brand?.toLowerCase().includes(keyword) || p.category?.toLowerCase().includes(keyword));
    if (item) {
      return { src: item.image_url, name: item.name, brand: item.brand, price: item.price, tag: item.tag };
    }
    return { src: fallbackImgUrl, name: fallbackName, brand: fallbackBrand, price: fallbackPrice, tag: 'Boilerplate' };
  };

  const heroWatch = getHeroProduct('watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80', 'Apex Chrono', 'APEX', 345000);
  const heroTote = getHeroProduct('tote', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80', 'Heritage Tote', 'MAISON LUXE', 154000);
  const heroAudio = getHeroProduct('audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80', 'Pro Wireless', 'SONIQ', 72000);

  const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))]; 

  const getCategoryEmoji = (category) => {
    const icons = { all: '🌐', electronics: '💻', fashion: '👗', luxury: '💎', home: '🛋', beauty: '✨', automotive: '🏎' };
    return icons[category.toLowerCase()] || '✦';
  };

  const filteredAndSortedProducts = products
    .filter(p => {
      if (selectedCategory !== 'All' && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedBrand !== 'All' && p.brand?.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      if (showOnlySales && !p.old_price) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!p.name?.toLowerCase().includes(query) && !p.brand?.toLowerCase().includes(query) && !p.description?.toLowerCase().includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'PriceLow') return a.price - b.price;
      if (sortOption === 'PriceHigh') return b.price - a.price;
      return 0; 
    });

  const executeSubscription = async (targetEmail, clearInputCallback) => {
    if (!targetEmail.trim()) return;
    setSubmittingEmail(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: targetEmail.trim().toLowerCase() }]);

      if (error) {
        if (error.code === '23505') {
          showToast('This email is already on the early access list.');
        } else {
          throw error;
        }
      } else {
        showToast('✦ Welcome to LUXE! Check your email for first access.');
        clearInputCallback('');
      }
    } catch (err) {
      console.error(err);
      showToast('Subscription processing error.');
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleHeroSubscribe = (e) => {
    e.preventDefault();
    executeSubscription(heroNewsletterEmail, setHeroNewsletterEmail);
  };

  const handleFooterSubscribe = (e) => {
    e.preventDefault();
    executeSubscription(newsletterEmail, setNewsletterEmail);
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  };

  const toggleWish = (id, e) => {
    if (e) e.stopPropagation();
    if (wishlisted.includes(id)) {
      setWishlisted(wishlisted.filter(itemId => itemId !== id));
      showToast('Removed from wishlist');
    } else {
      setWishlisted([...wishlisted, id]);
      showToast('✦ Added to wishlist');
    }
  };

  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    const existing = cart.find(x => x.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 600);
    showToast(`✦ ${product.name} added to cart`);
  };

  const changeQty = (id, delta) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0)); 
  };

  const openProductModal = (product) => {
    setCurrentProduct(product);
    setActiveSize('S'); 
    const productImages = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
    setActiveModalImage(productImages[0] || null);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setShowOnlySales(false);
    setSearchQuery('');
  };

  // --- INLINE LINEAR LUXURY DISPLAY CABINET ILLUSTRATION NO CONFLICT COMPONENT ---
  const RenderEmptyStateArtwork = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', width: '100%' }}>
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '24px', opacity: 0.85 }}>
        <path d="M20 35H80V85H20V35Z" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 35L50 15L80 35" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50 35V85" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3"/>
        <circle cx="50" cy="55" r="4" fill="var(--gold)"/>
        <path d="M46 65H54" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      <h3 className="serif" style={{ color: 'var(--warm-white)', fontSize: '18px', marginBottom: '8px', letterSpacing: '0.5px' }}>The Vault is Empty</h3>
      <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '380px', lineHeight: '1.6' }}>
        No exquisite items match your active selection filters right now. Try expanding your parameters or resetting views.
      </p>
      <button onClick={resetAllFilters} style={{ marginTop: '20px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '8px 20px', borderRadius: '4px', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
        Reset View Matrices
      </button>
    </div>
  );

  return (
    <>
      {/* LUXURY CUSTOM TRAILING CURSOR PAIR */}
      <div className="luxe-cursor-dot" style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }} />
      <div className={`luxe-cursor-ring ${isHoveredLink ? 'expanded' : ''}`} style={{ left: `${trailingPos.x}px`, top: `${trailingPos.y}px` }} />

      {/* TOAST */}
      <div className={`toast ${toast.show ? 'show' : ''}`} id="toast">
        <span className="toast-icon">✦</span>
        <span className="toast-text">{toast.msg}</span>
      </div>

      {/* SEARCH OVERLAY */}
      <div className={`search-overlay ${!isSearchOpen ? 'hidden' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false) }}>
        <div className="search-box">
          <div className="search-input-wrap">
            <input className="search-input" type="text" placeholder="Search for luxury items, brands..." autoFocus value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.trim() !== '') scrollTo('products'); }} />
            <button className="search-submit" onClick={() => setIsSearchOpen(false)}>✕</button>
          </div>
          <div className="search-hints">
            {['Titanium', 'Audio', 'Tote', 'Lamp', 'Leather'].map(hint => (
              <span key={hint} className="search-hint" onClick={() => { setSearchQuery(hint); setIsSearchOpen(false); scrollTo('products'); showToast(`Query: "${hint}"`); }}>{hint}</span>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      <div className={`modal-overlay ${!currentProduct ? 'hidden' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setCurrentProduct(null) }}>
        {currentProduct && (() => {
          const { avgRating, count, reviewsList } = getProductRatingMetrics(currentProduct.id);
          return (
            <div className="modal" style={{ height: 'auto', maxHeight: '90vh' }}>
              <div className="modal-header">
                <span className="modal-title">{currentProduct.name}</span>
                <button className="modal-close" onClick={() => setCurrentProduct(null)}>✕</button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="modal-gallery">
                  <div className="gallery-main" style={{ overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }} onMouseMove={handleMouseMoveMagnifier} onMouseLeave={() => setZoomStyle({ transform: 'scale(1)' })}>
                    {activeModalImage ? <img src={activeModalImage} alt={currentProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.15s ease-out', ...zoomStyle }} /> : <span>📦</span>}
                  </div>
                  <div className="gallery-thumbs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {(() => {
                      const productImages = currentProduct.images?.length > 0 ? currentProduct.images : (currentProduct.image_url ? [currentProduct.image_url] : []);
                      return productImages.map((imgUrl, idx) => (
                        <div key={idx} className={`thumb ${activeModalImage === imgUrl ? 'active' : ''}`} onClick={() => setActiveModalImage(imgUrl)} style={{ overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                          <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="modal-info">
                  <div className="modal-brand">{currentProduct.brand}</div>
                  <div className="modal-product-name">{currentProduct.name}</div>
                  <div className="modal-rating">⭐⭐⭐⭐⭐ <span>{avgRating}</span> · <span style={{color: 'var(--gold)'}}>{count} ledger reviews</span></div>
                  
                  <div className="modal-price">
                    ₹{formatINR(currentProduct.price)}
                    {currentProduct.old_price && <span className="modal-old">₹{formatINR(currentProduct.old_price)}</span>}
                  </div>
                  
                  <div className="modal-desc">{currentProduct.description}</div>
                  
                  <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '15px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Buyer Journal ({count})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                      {reviewsList.length === 0 ? <div style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>No verified entries recorded yet.</div> : reviewsList.map(r => (
                        <div key={r.id} style={{ background: 'var(--surface)', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                            <span style={{ color: 'var(--gold)', fontWeight: '600' }}>{r.customer_name}</span>
                            <span>{'★'.repeat(r.rating)}</span>
                          </div>
                          <div style={{ color: 'var(--cream)', fontStyle: 'italic' }}>"{r.comment}"</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <div style={{fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px'}}>Select Size</div>
                    <div className="size-select">
                      {['S', 'M', 'L', 'XL'].map(size => <button key={size} className={`size-btn ${activeSize === size ? 'active' : ''}`} onClick={() => setActiveSize(size)}>{size}</button>)}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="modal-add" onClick={() => { addToCart(currentProduct); setCurrentProduct(null); }}>Add to Cart</button>
                    <button className="modal-wish" onClick={() => toggleWish(currentProduct.id)}>
                      {wishlisted.includes(currentProduct.id) ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CART DRAWER */}
      <div className={`cart-overlay ${!isCartOpen ? 'hidden' : ''}`} onClick={() => setIsCartOpen(false)} style={{ display: isCartOpen ? 'block' : 'none' }}></div>
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="modal-close" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? <div className="empty-cart"><div className="empty-icon">🛍</div><p>Your cart is empty</p></div> : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="cart-item-img" style={{ overflow: 'hidden' }}>{item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}</div>
              <div className="cart-item-info">
                <div className="cart-item-brand">{item.brand}</div>
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-footer">
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                  </div>
                  <div className="cart-item-price">₹{formatINR(item.price * item.qty)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row cart-grand"><span>Total</span><span>₹{formatINR(cartTotal)}</span></div>
            <button className="checkout-btn" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>Secure Checkout →</button>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav>
        <div className="nav-logo" onClick={() => setIsAdminOpen(true)}>LUXE<span>市</span></div>
        <ul className="nav-links">
          <li><a onClick={() => scrollTo('categories')}>Collections</a></li>
          <li><a onClick={() => { setSelectedBrand('All'); setShowOnlySales(false); scrollTo('products'); }}>New Arrivals</a></li>
          <li style={{ position: 'relative' }}>
            <select value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setShowOnlySales(false); scrollTo('products'); showToast(`Brand: ${e.target.value}`); }} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <option value="All" style={{ background: 'var(--deep)' }}>Brands (All)</option>
              {uniqueBrands.map(b => <option key={b} value={b} style={{ background: 'var(--deep)' }}>{b}</option>)}
            </select>
          </li>
          <li><a onClick={() => { setShowOnlySales(!showOnlySales); setSelectedBrand('All'); scrollTo('products'); showToast(showOnlySales ? 'Showing all inventory' : 'Filtered to items on Sale'); }} style={showOnlySales ? { color: 'var(--gold)' } : {}}>{showOnlySales ? 'Sale ✓' : 'Sale'}</a></li>
        </ul>
        
        <div className="nav-right">
          <div className="nav-icon" onClick={() => setIsSearchOpen(true)} style={searchQuery ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}>{searchQuery ? '✓' : '🔍'}</div>
          <div className={`nav-icon cart-badge ${animateCart ? 'luxe-badge-bounce' : ''}`} onClick={() => setIsCartOpen(true)}>
            🛍<span className="badge">{cartCount}</span>
          </div>
          <button className="btn-nav" onClick={() => setIsPrototypeModalOpen(true)}>Sign In</button>
        </div>
      </nav>

      {/* HERO HERO SECTION */}
      <section className="hero" id="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-eyebrow">✦ The New Standard in Luxury Commerce</div>
          <h1 className="hero-title">Curated for<br/>those who<br/><em>demand</em> more.</h1>
          <p className="hero-sub">Discover an unparalleled selection of premium products from the world's most distinguished brands. Every item, every detail, chosen with intention.</p>
          
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => scrollTo('products')}>Explore Collections</button>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}>
              ✦ Subscribe On YouTube
            </a>
          </div>
          
          <div className="hero-stats">
            <div><div className="stat-num">{filteredAndSortedProducts.length}</div><div className="stat-label">Matching Items</div></div>
            <div><div className="stat-num">{uniqueBrands.length}</div><div className="stat-label">Live Brands</div></div>
            <div><div className="stat-num">4.9★</div><div className="stat-label">Avg Rating</div></div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="product-showcase">
            <div className="float-card mini-card one" style={{ cursor: 'pointer' }}>
              <div className="mini-img" style={{ background: 'rgba(201,169,110,0.05)', overflow: 'hidden' }}>
                <img src={heroWatch.src} alt={heroWatch.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="mini-info">
                <div className="name">{heroWatch.name}</div>
                <div className="price">₹{formatINR(heroWatch.price)}</div>
                <div className="rating"><span className="rating-stars">★★★★★</span> 4.9</div>
              </div>
            </div>
            
            <div className="float-card main-product-card" style={{ cursor: 'pointer' }}>
              <div className="float-tag price-tag">{heroTote.tag || 'NEW ARRIVAL'}</div>
              <div className="product-img-placeholder" style={{ overflow: 'hidden', width: '180px', height: '190px', background: 'none', borderRadius: '8px', marginBottom: '14px' }}>
                <img src={heroTote.src} alt={heroTote.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '6px' }}>{heroTote.brand}</div>
                <div style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>{heroTote.name}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px', color: 'var(--warm-white)' }}>₹{formatINR(heroTote.price)}</div>
              </div>
            </div>
            
            <div className="float-card mini-card two" style={{ cursor: 'pointer' }}>
              <div className="mini-img" style={{ background: 'rgba(201,169,110,0.05)', overflow: 'hidden' }}>
                <img src={heroAudio.src} alt={heroAudio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="mini-info">
                <div className="name">{heroAudio.name}</div>
                <div className="price">₹{formatINR(heroAudio.price)}</div>
                <div className="rating"><span className="rating-stars">★★★★★</span> 4.8</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '60px' }}>
              <span className="marquee-item"><span className="marquee-dot"></span> Free Shipping Over ₹15,000</span>
              <span className="marquee-item"><span className="marquee-dot"></span> Authenticity Guaranteed</span>
              <span className="marquee-item"><span className="marquee-dot"></span> 30-Day Returns</span>
              <span className="marquee-item"><span className="marquee-dot"></span> Secured by SSL</span>
              <span className="marquee-item"><span className="marquee-dot"></span> Premium Packaging</span>
              <span className="marquee-item"><span className="marquee-dot"></span> Verified Sellers Only</span>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="section" id="categories">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">✦ Browse By World</div>
            <h2 className="section-title serif">Every Category,<br/>Curated.</h2>
          </div>
          <a className="link-arrow" onClick={() => { resetAllFilters(); scrollTo('products'); }}>Clear All View Filters →</a>
        </div>
        <div className="categories-grid">
          <div className="cat-card" onClick={() => { setSelectedCategory('All'); scrollTo('products'); showToast('Showing all items'); }} style={selectedCategory === 'All' ? { borderColor: 'var(--gold)' } : {}}>
            <div className="cat-icon">🌐</div>
            <div className="cat-name">All Worlds</div>
            <div className="cat-count">{products.length} items</div>
          </div>
          {uniqueCategories.filter(c => c !== 'All').map(catName => {
            const matches = products.filter(p => p.category && p.category.toLowerCase() === catName.toLowerCase());
            return (
              <div className="cat-card" key={catName} onClick={() => { setSelectedCategory(catName); scrollTo('products'); showToast(`Filtered by ${catName}`); }} style={selectedCategory === catName ? { borderColor: 'var(--gold)' } : {}}>
                <div className="cat-icon">{getCategoryEmoji(catName)}</div>
                <div className="cat-name">{catName}</div>
                <div className="cat-count">{matches.length} items</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED BANNER */}
      <div className="featured-banner">
        <div className="banner-bg"></div>
        <div className="banner-content">
          <div className="banner-eyebrow">✦ Editor's Choice — Summer 2026</div>
          <h2 className="banner-title serif">The New Season<br/>Has Arrived.</h2>
          <p className="banner-sub">Discover this season's most coveted pieces, curated by our team of style experts. New arrivals weekly.</p>
          <button className="btn-primary" onClick={() => scrollTo('products')}>Explore the Edit</button>
        </div>
        <div className="banner-visual">🌿</div>
      </div>

      {/* PRODUCTS DYNAMIC GRID */}
      <section className="section" id="products">
        <div className="section-header" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="section-eyebrow">✦ {selectedCategory !== 'All' ? `${selectedCategory} ` : ''}{selectedBrand !== 'All' ? `${selectedBrand} ` : ''}{showOnlySales ? 'Limited Sales ' : ''}{searchQuery ? `Search: "${searchQuery}" ` : 'Catalog'}</div>
            <h2 className="section-title serif">The Collection</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {(selectedCategory !== 'All' || selectedBrand !== 'All' || showOnlySales || searchQuery) && (
              <button onClick={() => resetAllFilters()} style={{ background: 'transparent', border: '1px solid var(--gold-dim)', color: 'var(--gold)', padding: '10px 14px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Clear Filters ✕</button>
            )}
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ background: 'var(--surface)', color: 'var(--warm-white)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '4px', fontSize: '12px', fontFamily: "'Inter', sans-serif", outline: 'none', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
              <option value="Newest">Newest Arrivals</option>
              <option value="PriceLow">Price: Low to High</option>
              <option value="PriceHigh">Price: High to Low</option>
            </select>
            <a className="link-arrow" onClick={() => { fetchInitialCatalog(); showToast('Refreshing catalog matrix...'); }}>Refresh ↺</a>
          </div>
        </div>
        
        {loading ? (
          <div className="products-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="product-card skeleton-card" style={{ pointerEvents: 'none' }}>
                <div className="skeleton-line shimmer" style={{ width: '100%', height: '240px', borderRadius: '4px', marginBottom: '15px' }}></div>
                <div className="skeleton-line shimmer" style={{ width: '40%', height: '12px', marginBottom: '8px' }}></div>
                <div className="skeleton-line shimmer" style={{ width: '80%', height: '16px', marginBottom: '12px' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton-line shimmer" style={{ width: '30%', height: '14px' }}></div>
                  <div className="skeleton-line shimmer" style={{ width: '20%', height: '14px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <RenderEmptyStateArtwork />
        ) : (
          <div className="products-grid">
            {filteredAndSortedProducts.map(p => {
              const { avgRating, count } = getProductRatingMetrics(p.id);
              const salePercentage = calculateDiscountBadge(p.price, p.old_price);
              return (
                <div className="product-card" key={p.id} onClick={() => openProductModal(p)}>
                  {p.tag && <div className="discount-badge" style={{ background: 'var(--gold)', color: 'var(--void)' }}>{p.tag}</div>}
                  {salePercentage && !p.tag && <div className="discount-badge">{salePercentage}</div>}
                  
                  <div className={`wishlist-btn ${wishlisted.includes(p.id) ? 'active' : ''}`} onClick={(e) => toggleWish(p.id, e)} style={{ zIndex: 10 }}>{wishlisted.includes(p.id) ? '♥' : '♡'}</div>
                  <div className="product-card-img" style={{ overflow: 'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📦</span>}
                    <div className="product-card-overlay">
                      <button className="overlay-btn" onClick={(e) => addToCart(p, e)}>Add to Cart</button>
                      <button className="overlay-btn" onClick={(e) => { e.stopPropagation(); openProductModal(p); }}>Quick View</button>
                    </div>
                  </div>
                  <div className="product-card-info">
                    <div className="product-brand">{p.brand}</div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
                    <div className="product-footer">
                      <div className="product-price">
                        ₹{formatINR(p.price)}
                        {p.old_price && <span className="old">₹{formatINR(p.old_price)}</span>}
                      </div>
                      <div className="product-rating">⭐ {avgRating} ({count})</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TRUST */}
      <div className="trust-section">
        <div className="trust-grid">
          <div className="trust-item"><div className="trust-icon">🚚</div><div className="trust-title">Free Shipping India & Global</div><div className="trust-desc">Complimentary premium expedited cargo transit on all custom selection orders over ₹15,000.</div></div>
          <div className="trust-item"><div className="trust-icon">🔒</div><div className="trust-title">Secure Payments</div><div className="trust-desc">SSL encryption and fraud protection on every transaction. Your data is safe with us.</div></div>
          <div className="trust-item"><div className="trust-icon">↩️</div><div className="trust-title">Easy Returns</div><div className="trust-desc">30-day hassle-free returns. If it's not perfect, we'll make it right—no questions asked.</div></div>
          <div className="trust-item"><div className="trust-icon">✅</div><div className="trust-title">Authenticity Verified</div><div className="trust-desc">Every product verified by our expert team. 100% authentic or your money back.</div></div>
        </div>
      </div>

      {/* SUBSCRIBE */}
      <section className="newsletter">
        <div className="newsletter-bg"></div>
        <div className="section-eyebrow" style={{textAlign: 'center'}}>✦ Stay in the Loop</div>
        <h2 className="newsletter-title serif">First Access.<br/><em>Always.</em></h2>
        <p className="newsletter-sub">Join 240,000+ connoisseurs who receive early access to new arrivals, exclusive drops, and private sale events.</p>
        <form onSubmit={handleHeroSubscribe} className="newsletter-form">
          <input className="newsletter-input" type="email" placeholder="your@email.com" required value={heroNewsletterEmail} onChange={(e) => setHeroNewsletterEmail(e.target.value)} disabled={submittingEmail} />
          <button type="submit" className="newsletter-btn" disabled={submittingEmail}>
            {submittingEmail ? 'Signing Up...' : 'Subscribe'}
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <span className="footer-logo">LUXE<span>市</span></span>
            <p className="footer-desc">The world's most curated marketplace for those who demand more. Premium products, verified sellers, exceptional service.</p>
            <div style={{fontSize: '12px', color: 'var(--muted)'}}>✦ Authenticity Guaranteed on Every Order</div>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a onClick={() => { resetAllFilters(); scrollTo('products'); }}>New Arrivals</a></li>
              <li><a onClick={() => { setSortOption('PriceHigh'); scrollTo('products'); showToast('Showing top-tier assets'); }}>Best Sellers</a></li>
              <li><a onClick={() => { setShowOnlySales(true); setSelectedBrand('All'); scrollTo('products'); }}>Sale</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a onClick={() => setSupportType('help')}>Help Center</a></li>
              <li><a onClick={() => setSupportType('returns')}>Returns</a></li>
              <li><a onClick={() => setSupportType('contact')}>Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 LUXE Marketplace. All rights reserved.</div>
          
          <div className="footer-social">
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn">yt</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn">in</a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn">ig</a>
            <a href="https://www.threads.net" target="_blank" rel="noopener noreferrer" className="social-btn">th</a>
          </div>
        </div>
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => { setIsAdminOpen(false); fetchInitialCatalog(); }} />}
      {isCheckoutOpen && <Checkout cart={cart} cartTotal={cartTotal} onClose={() => setIsCheckoutOpen(false)} onSuccess={() => { fetchInitialCatalog(); }} />}
      {supportType && <SupportModals type={supportType} onClose={() => setSupportType(null)} />}
      
      {/* PROTOTYPE NOTICE MODAL MESSAGE */}
      {isPrototypeModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && setIsPrototypeModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-20px', marginRight: '-20px' }}>
              <button className="modal-close" onClick={() => setIsPrototypeModalOpen(false)}>✕</button>
            </div>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '24px' }}>✦</div>
            <h2 className="serif" style={{ color: 'var(--warm-white)', marginBottom: '16px', letterSpacing: '1px' }}>Ecosystem Status</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '14px', marginBottom: '24px' }}>
              This portal is currently running inside an elite **design prototype sandbox**. Secure user accounts and authentication profiles are arriving in a future iteration drop.
            </p>
            <p style={{ color: 'var(--gold)', fontStyle: 'italic', fontSize: '13px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', letterSpacing: '0.5px' }}>
              "For now, explore freely, customize your cart, and enjoy the curation."
            </p>
          </div>
        </div>
      )}
    </>
  );
}