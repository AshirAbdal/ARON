'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check, Power, Layers } from 'lucide-react';

type Scope = 'cart' | 'category' | 'product';
type ApplyTo = 'eligible' | 'cart';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  is_active: number;
  expires_at: string | null;
  scope: Scope;
  apply_to: ApplyTo;
  created_at: string;
  target_count: number;
}

interface Category {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}

const emptyForm = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order: '0',
  max_uses: '',
  expires_at: '',
  scope: 'cart' as Scope,
  apply_to: 'eligible' as ApplyTo,
  target_product_ids: [] as number[],
  target_category_ids: [] as number[],
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchCoupons = async () => {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    setCoupons(data.coupons || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discount_value) return;
    if (form.scope === 'product' && form.target_product_ids.length === 0) {
      alert('Select at least one product for product-scoped coupon.');
      return;
    }
    if (form.scope === 'category' && form.target_category_ids.length === 0) {
      alert('Select at least one category for category-scoped coupon.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        scope: form.scope,
        apply_to: form.apply_to,
        target_product_ids: form.target_product_ids,
        target_category_ids: form.target_category_ids,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm(emptyForm);
      setAdding(false);
      fetchCoupons();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to create coupon');
    }
  };

  const handleToggle = async (c: Coupon) => {
    await fetch(`/api/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
    });
    fetchCoupons();
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    await fetch(`/api/coupons/${c.id}`, { method: 'DELETE' });
    fetchCoupons();
  };

  const formatExpiry = (s: string | null) => {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  const isExpired = (s: string | null) =>
    !!s && new Date(s.replace(' ', 'T') + 'Z').getTime() < Date.now();

  const scopeLabel = (c: Coupon) => {
    if (c.scope === 'cart') return 'Cart-wide';
    if (c.scope === 'product') return `${c.target_count} product${c.target_count === 1 ? '' : 's'}`;
    return `${c.target_count} categor${c.target_count === 1 ? 'y' : 'ies'}`;
  };

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={() => {
            setAdding(true);
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors rounded"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {adding && (
          <div className="p-5 bg-gray-50 border-b">
            <p className="text-sm font-medium mb-4">New Coupon</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Code *</label>
                <input
                  type="text"
                  placeholder="EID20"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black uppercase"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Type *</label>
                <select
                  aria-label="Discount type"
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (৳)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Value * {form.discount_type === 'percentage' ? '(%)' : '(৳)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={form.discount_type === 'percentage' ? '20' : '100'}
                  value={form.discount_value}
                  onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min order (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  aria-label="Minimum order amount"
                  placeholder="0"
                  value={form.min_order}
                  onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max uses (optional)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  value={form.max_uses}
                  onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Expires at (optional)</label>
                <input
                  type="datetime-local"
                  aria-label="Expiration date"
                  value={form.expires_at}
                  onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Applies to *</label>
                <select
                  aria-label="Coupon scope"
                  value={form.scope}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      scope: e.target.value as Scope,
                      target_product_ids: [],
                      target_category_ids: [],
                    }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black bg-white"
                >
                  <option value="cart">Entire cart</option>
                  <option value="category">Specific categories</option>
                  <option value="product">Specific products</option>
                </select>
              </div>
              {form.scope !== 'cart' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Discount applies on</label>
                  <select
                    aria-label="Discount basis"
                    value={form.apply_to}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, apply_to: e.target.value as ApplyTo }))
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black bg-white"
                  >
                    <option value="eligible">Eligible items only</option>
                    <option value="cart">Whole cart (eligibility just unlocks)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Targets pickers */}
            {form.scope === 'category' && (
              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-2">Categories *</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-white">
                  {categories.length === 0 ? (
                    <span className="text-xs text-gray-400">Loading…</span>
                  ) : (
                    categories.map((c) => {
                      const selected = form.target_category_ids.includes(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              target_category_ids: toggleId(p.target_category_ids, c.id),
                            }))
                          }
                          className={`px-3 py-1 text-xs rounded border transition-colors ${
                            selected
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {form.scope === 'product' && (
              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-2">Products *</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded bg-white">
                  {products.length === 0 ? (
                    <span className="text-xs text-gray-400">Loading…</span>
                  ) : (
                    products.map((pr) => {
                      const selected = form.target_product_ids.includes(pr.id);
                      return (
                        <button
                          type="button"
                          key={pr.id}
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              target_product_ids: toggleId(p.target_product_ids, pr.id),
                            }))
                          }
                          className={`px-3 py-1 text-xs rounded border transition-colors ${
                            selected
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {pr.name}
                        </button>
                      );
                    })
                  )}
                </div>
                {form.target_product_ids.length > 0 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {form.target_product_ids.length} selected
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm);
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No coupons yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Discount</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applies to</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Min order</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Uses</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Expires</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = isExpired(c.expires_at);
                const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                const inactive = !c.is_active || expired || exhausted;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-5 py-3">
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}%`
                        : `৳${c.discount_value}`}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        <Layers className="w-3 h-3" />
                        {scopeLabel(c)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">৳{c.min_order}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.used_count}
                      {c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatExpiry(c.expires_at)}</td>
                    <td className="px-5 py-3">
                      {inactive ? (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">
                          {expired ? 'Expired' : exhausted ? 'Exhausted' : 'Disabled'}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(c)}
                          aria-label={c.is_active ? 'Disable' : 'Enable'}
                          title={c.is_active ? 'Disable' : 'Enable'}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          aria-label="Delete"
                          title="Delete"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
