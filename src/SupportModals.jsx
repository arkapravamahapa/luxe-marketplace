import { useState } from 'react';

export default function SupportModals({ type, onClose }) {
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketData, setTicketData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px', padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
          <h2 className="serif" style={{ textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)' }}>
            {type === 'help' && 'Premium Help Center'}
            {type === 'returns' && 'Connoisseur Return Portal'}
            {type === 'contact' && 'Concierge Helpdesk'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {type === 'help' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--cream)' }}>
            <div>
              <h4 style={{ color: 'var(--warm-white)', marginBottom: '4px' }}>✦ How long does global transit take?</h4>
              <p style={{ color: 'var(--muted)' }}>All items are dispatched inside premium secured packaging via express freight. Delivery takes 3–5 structural business days worldwide.</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--warm-white)', marginBottom: '4px' }}>✦ How is product authenticity verified?</h4>
              <p style={{ color: 'var(--muted)' }}>Every piece goes through strict multi-point physical inspections by internal horologists and luxury appraisers before entry verification.</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--warm-white)', marginBottom: '4px' }}>✦ Secure payment options available?</h4>
              <p style={{ color: 'var(--muted)' }}>Transactions are protected with 256-bit SSL network layer keys and tokenized gateway authentications.</p>
            </div>
          </div>
        )}

        {type === 'returns' && (
          <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--muted)' }}>
            <p style={{ marginBottom: '16px' }}>We maintain a complimentary 30-day return policy on all orders across the globe. Items must be returned unworn, un-adjusted, and inside original protective packaging matrices.</p>
            <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '6px', background: 'var(--surface)', color: 'var(--gold)', textAlign: 'center', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              To print your prepaid global shipping label, please initiate a request below or reach out to our concierge desk directly.
            </div>
          </div>
        )}

        {(type === 'contact' || type === 'returns') && (
          <div style={{ marginTop: '20px' }}>
            {!ticketSubmitted ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Your Name" required className="newsletter-input" style={{ flex: 1 }} value={ticketData.name} onChange={e => setTicketData({ ...ticketData, name: e.target.value })} />
                  <input type="email" placeholder="Your Email" required className="newsletter-input" style={{ flex: 1 }} value={ticketData.email} onChange={e => setTicketData({ ...ticketData, email: e.target.value })} />
                </div>
                <input type="text" placeholder={type === 'returns' ? "Order Identification Token" : "Subject Ticket Line"} required className="newsletter-input" value={ticketData.subject} onChange={e => setTicketData({ ...ticketData, subject: e.target.value })} />
                <textarea placeholder="Message details..." required className="newsletter-input" rows="4" value={ticketData.message} onChange={e => setTicketData({ ...ticketData, message: e.target.value })} />
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  {type === 'returns' ? 'Initiate Return Pipeline' : 'Transmit Ticket Message'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gold)', fontSize: '14px' }}>
                ✓ Transmission successful. Our concierge desk will open a dynamic pipeline review within 2 hours.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
