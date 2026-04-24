'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check, Power, Megaphone } from 'lucide-react';

interface Announcement {
  id: number;
  message: string;
  is_active: number;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const emptyForm = {
  message: '',
  sort_order: '0',
  starts_at: '',
  ends_at: '',
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    setItems(data.announcements || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    if (!form.message.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: form.message,
        sort_order: Number(form.sort_order) || 0,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm(emptyForm);
      setAdding(false);
      fetchItems();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to create announcement');
    }
  };

  const handleToggle = async (a: Announcement) => {
    await fetch(`/api/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: a.is_active ? 0 : 1 }),
    });
    fetchItems();
  };

  const handleDelete = async (a: Announcement) => {
    if (!confirm(`Delete this announcement?\n\n"${a.message}"`)) return;
    await fetch(`/api/announcements/${a.id}`, { method: 'DELETE' });
    fetchItems();
  };

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  const isPending = (a: Announcement) =>
    !!a.starts_at && new Date(a.starts_at.replace(' ', 'T') + 'Z').getTime() > Date.now();

  const isExpired = (a: Announcement) =>
    !!a.ends_at && new Date(a.ends_at.replace(' ', 'T') + 'Z').getTime() < Date.now();

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button
          onClick={() => {
            setAdding(true);
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors rounded"
        >
          <Plus className="w-4 h-4" />
          Add Announcement
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        These messages scroll in the top bar of the storefront alongside active coupons.
      </p>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {adding && (
          <div className="p-5 bg-gray-50 border-b">
            <p className="text-sm font-medium mb-4">New Announcement</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Message *</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="🚚 Free delivery all over Sherpur"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {form.message.length}/200 — emojis welcome
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sort order</label>
                <input
                  type="number"
                  step="1"
                  aria-label="Sort order"
                  placeholder="0"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
                <p className="text-[11px] text-gray-400 mt-1">Lower = appears first.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Starts at (optional)</label>
                <input
                  type="datetime-local"
                  aria-label="Start date"
                  value={form.starts_at}
                  onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ends at (optional)</label>
                <input
                  type="datetime-local"
                  aria-label="End date"
                  value={form.ends_at}
                  onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
              </div>
            </div>
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
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No announcements yet. Add one to broadcast in the top bar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Message</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Sort</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Starts</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Ends</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const expired = isExpired(a);
                const pending = isPending(a);
                const live = !!a.is_active && !expired && !pending;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <Megaphone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-800">{a.message}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{a.sort_order}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(a.starts_at)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(a.ends_at)}</td>
                    <td className="px-5 py-3">
                      {live ? (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                          Live
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">
                          {expired ? 'Expired' : pending ? 'Scheduled' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(a)}
                          aria-label={a.is_active ? 'Disable' : 'Enable'}
                          title={a.is_active ? 'Disable' : 'Enable'}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
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
