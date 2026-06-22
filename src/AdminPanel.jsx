import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('add'); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '', brand: '', description: '', price: '', oldPrice: '', category: 'Luxury', tag: ''
  });
  const [files, setFiles] = useState([]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchInventory();
    }
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const finalCategory = isNewCategory ? customCategory.trim() : formData.category;
    if (!finalCategory) {
      setMessage('Please specify a valid category.');
      return;
    }

    setLoading(true);
    try {
      let imageUrls = [];
      
      if (files.length > 0) {
        setMessage(`Uploading ${files.length} images...`);
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      const updatePayload = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        price: parseFloat(formData.price),
        old_price: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        category: finalCategory,
        tag: formData.tag.trim().toUpperCase() || null // NEW: Save clean uppercase tags
      };

      if (imageUrls.length > 0) {
        updatePayload.image_url = imageUrls[0];
        updatePayload.images = imageUrls;
      }

      if (editingProduct) {
        setMessage('Updating ledger entry values...');
        const { error } = await supabase.from('products').update([updatePayload]).eq('id', editingProduct.id);
        if (error) throw error;
        setMessage('Ledger updated successfully!');
        setEditingProduct(null);
      } else {
        if (imageUrls.length === 0) throw new Error('At least one catalog photo is required.');
        setMessage('Saving values...');
        const { error } = await supabase.from('products').insert([updatePayload]);
        if (error) throw error;
        setMessage('Item saved successfully!');
      }

      setFormData({ name: '', brand: '', description: '', price: '', oldPrice: '', category: 'Luxury', tag: '' });
      setCustomCategory('');
      setIsNewCategory(false);
      setFiles([]);
      fetchInventory();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price,
      oldPrice: product.old_price || '',
      category: product.category || 'Luxury',
      tag: product.tag || ''
    });
    setActiveTab('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this product?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setMessage('Product removed from ledger.');
      fetchInventory();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '650px', padding: '30px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <h3 className="serif" style={{ cursor: 'pointer', color: activeTab === 'add' ? 'var(--gold)' : 'var(--muted)' }} onClick={() => setActiveTab('add')}>
              {editingProduct ? '✏ Edit Item' : '✦ Add Item'}
            </h3>
            <h3 className="serif" style={{ cursor: 'pointer', color: activeTab === 'manage' ? 'var(--gold)' : 'var(--muted)' }} onClick={() => { setActiveTab('manage'); setEditingProduct(null); }}>
              📦 Inventory Management
            </h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'add' ? (
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Product Name" className="newsletter-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input type="text" placeholder="Brand" className="newsletter-input" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
              <textarea placeholder="Description Details" className="newsletter-input" rows="3" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="Current Price ($)" className="newsletter-input" style={{ flex: 1 }} required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                <input type="number" placeholder="Original Retail Price ($)" className="newsletter-input" style={{ flex: 1 }} value={formData.oldPrice} onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} />
              </div>

              {/* NEW: Field to customize the item badge notification */}
              <input type="text" placeholder="Special Item Tag (e.g. NEW ARRIVAL, BEST SELLER)" className="newsletter-input" value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} />

              <div style={{ background: 'var(--surface)', padding: '14px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input type="checkbox" id="newCatCheckbox" checked={isNewCategory} onChange={(e) => setIsNewCategory(e.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--gold)' }} />
                  <label htmlFor="newCatCheckbox" style={{ fontSize: '12px', color: 'var(--warm-white)', cursor: 'pointer' }}>Create a brand-new category</label>
                </div>
                {isNewCategory ? (
                  <input type="text" placeholder="Type Category" className="newsletter-input" required value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                ) : (
                  <select className="newsletter-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option>Luxury</option><option>Electronics</option><option>Fashion</option><option>Home</option><option>Beauty</option>
                  </select>
                )}
              </div>

              <div style={{ border: '1px dashed var(--border)', padding: '15px', borderRadius: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  {editingProduct ? 'Select replacement images (Leave blank to keep current)' : 'Select Product Photos'}
                </label>
                <input type="file" accept="image/*" multiple required={!editingProduct} style={{ color: 'var(--warm-white)' }} onChange={e => setFiles(Array.from(e.target.files))} />
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Processing System Execution...' : editingProduct ? 'Save Ledger Overwrite' : 'Publish to Storefront'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inventory.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', padding: '40px' }}>No items inside cloud database storage ledger.</div>
              ) : (
                inventory.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: 'var(--void)' }}>
                      {item.image_url && <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gold)' }}>${item.price.toLocaleString()} · <span style={{ color: 'var(--muted)' }}>{item.tag || 'NO TAG'}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(item)} style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {message && <div style={{ fontSize: '13px', textAlign: 'center', color: 'var(--gold)', marginTop: '15px', background: 'var(--void)', padding: '10px', borderRadius: '4px' }}>{message}</div>}
      </div>
    </div>
  );
}