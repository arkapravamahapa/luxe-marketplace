import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function Checkout({ cart, cartTotal, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', city: '', zip: '',
    cardNumber: '', expiry: '', cvc: ''
  });

  const [reviewData, setReviewData] = useState(
    cart.reduce((acc, item) => {
      acc[item.id] = { rating: 5, comment: '' };
      return acc;
    }, {})
  );

  // --- NEW: CONFETTI CANVAS INTERFACE ENGINE REFERENCES ---
  const canvasRef = useRef(null);

  useEffect(() => {
    if (step === 3) {
      runConfettiBurst();
    }
  }, [step]);

  const runConfettiBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth || 500;
    canvas.height = canvas.parentElement.clientHeight || 600;

    let particles = [];
    const colors = ['#C9A96E', '#E8D3A7', '#F5E6CC', '#AA8643', '#FFFFFF'];

    // Spawn 120 metallic luxury particles
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 10,
        speedY: (Math.random() - 0.7) * 12 - 3,
        gravity: 0.3,
        opacity: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.opacity > 0) {
          alive = true;
          p.x += p.speedX;
          p.y += p.speedY;
          p.speedY += p.gravity;
          p.opacity -= p.decay;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      }
    }
    animate();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReviewChange = (productId, field, value) => {
    setReviewData({
      ...reviewData,
      [productId]: { ...reviewData[productId], [field]: value }
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const formatINR = (amount) => {
    return Number(amount).toLocaleString('en-IN');
  };

  const processOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.zip}`;
      const orderItems = cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty }));

      const { error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: formData.name,
            customer_email: formData.email,
            shipping_address: fullAddress,
            total_amount: cartTotal,
            items: orderItems,
            status: 'Paid & Processing'
          }
        ]);

      if (error) throw error;
      setStep(3);
    } catch (error) {
      console.error(error);
      alert('Checkout failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReviews = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reviewRows = cart.map(item => ({
        product_id: item.id,
        customer_name: formData.name || 'Anonymous Connoisseur',
        rating: parseInt(reviewData[item.id].rating),
        comment: reviewData[item.id].comment.trim()
      })).filter(r => r.comment !== ''); 

      if (reviewRows.length > 0) {
        const { error } = await supabase.from('reviews').insert(reviewRows);
        if (error) throw error;
      }

      setReviewSubmitted(true);
      onSuccess(); 
    } catch (error) {
      console.error(error);
      alert('Failed to submit reviews: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999 }}>
      <div className="modal" style={{ width: '1000px', height: '620px', display: 'flex', flexDirection: 'row', padding: 0 }}>
        
        {/* LEFT PANEL: SUMMARY */}
        <div style={{ flex: '1', background: 'var(--surface)', padding: '40px', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
          <h2 className="serif" style={{ marginBottom: '24px' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', background: 'var(--void)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty: {item.qty}</div>
                </div>
                <div style={{ fontWeight: '600' }}>₹{formatINR(item.price * item.qty)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--muted)', fontSize: '14px' }}>
              <span>Subtotal</span><span>₹{formatINR(cartTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--muted)', fontSize: '14px' }}>
              <span>Shipping</span><span>Complimentary</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '20px', fontWeight: '700', color: 'var(--gold)' }}>
              <span>Total</span><span>₹{formatINR(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ACTIONS */}
        <div style={{ flex: '1.2', padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {step !== 3 && <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>}

          {step === 1 && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Step 1 of 2</div>
              <h2 className="serif" style={{ marginBottom: '32px' }}>Shipping Details</h2>
              <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="email" name="email" placeholder="Email Address" required className="newsletter-input" value={formData.email} onChange={handleInputChange} />
                <input type="text" name="name" placeholder="Full Name" required className="newsletter-input" value={formData.name} onChange={handleInputChange} />
                <input type="text" name="address" placeholder="Street Address" required className="newsletter-input" value={formData.address} onChange={handleInputChange} />
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input type="text" name="city" placeholder="City" required className="newsletter-input" style={{ flex: 1 }} value={formData.city} onChange={handleInputChange} />
                  <input type="text" name="zip" placeholder="Zip Code" required className="newsletter-input" style={{ width: '140px' }} value={formData.zip} onChange={handleInputChange} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '24px' }}>Continue to Payment →</button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '13px' }}>← Back to Shipping</button>
              <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Step 2 of 2</div>
              <h2 className="serif" style={{ marginBottom: '32px' }}>Secure Payment</h2>
              
              <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--card), var(--void))', border: '1px solid var(--gold)', borderRadius: '12px', padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(ellipse at 100% 0%, rgba(201,169,110,0.1), transparent 70%)' }}></div>
                <div style={{ fontSize: '20px', letterSpacing: '4px', marginTop: '20px', fontFamily: 'monospace' }}>
                  {formData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <span>{formData.name || 'CARDHOLDER NAME'}</span>
                  <span>{formData.expiry || 'MM/YY'}</span>
                </div>
              </div>

              <form onSubmit={processOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="text" name="cardNumber" placeholder="Card Number" required maxLength="19" className="newsletter-input" value={formData.cardNumber} onChange={handleInputChange} />
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input type="text" name="expiry" placeholder="MM/YY" required maxLength="5" className="newsletter-input" style={{ flex: 1 }} value={formData.expiry} onChange={handleInputChange} />
                  <input type="text" name="cvc" placeholder="CVC" required maxLength="4" className="newsletter-input" style={{ flex: 1 }} value={formData.cvc} onChange={handleInputChange} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
                  {loading ? 'Processing Securely...' : `Pay ₹${formatINR(cartTotal)}`}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              {/* NEW OVERLAY CONFLICT FREE CANVAS INJECTOR */}
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />

              {!reviewSubmitted ? (
                <div style={{ width: '100%', zIndex: 5 }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '12px' }}>✓</div>
                    <h2 className="serif">Share Your Experience</h2>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>Every item detail is chosen with intention. Tell us your thoughts.</p>
                  </div>

                  <form onSubmit={submitReviews} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '340px', overflowY: 'auto', paddingRight: '6px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</span>
                          <select 
                            value={reviewData[item.id].rating} 
                            onChange={(e) => handleReviewChange(item.id, 'rating', e.target.value)}
                            style={{ background: 'var(--card)', color: 'var(--gold)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                          >
                            <option value="5">⭐⭐⭐⭐⭐ ★ 5</option>
                            <option value="4">⭐⭐⭐⭐ ★ 4</option>
                            <option value="3">⭐⭐⭐ ★ 3</option>
                            <option value="2">⭐⭐ ★ 2</option>
                            <option value="1">⭐ ★ 1</option>
                          </select>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Review comments..." 
                          required
                          className="newsletter-input" 
                          style={{ padding: '10px 14px', fontSize: '13px' }}
                          value={reviewData[item.id].comment}
                          onChange={(e) => handleReviewChange(item.id, 'comment', e.target.value)}
                        />
                      </div>
                    ))}
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', position: 'sticky', bottom: 0 }}>
                      {loading ? 'Submitting...' : 'Submit Collection Reviews'}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', zIndex: 5 }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>✦</div>
                  <h2 className="serif" style={{ marginBottom: '16px' }}>Order Completed Successfully</h2>
                  <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '32px', fontSize: '14px' }}>
                    Thank you, {formData.name || 'Guest'}. Your order is now registered in our ecosystem. Your premium reviews have been saved live to the data ledger.
                  </p>
                  <button className="btn-ghost" onClick={() => { onClose(); }}>Return to Storefront</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}