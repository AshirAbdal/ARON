'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', description: '', image_url: '' });

  const toPreviewUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `https://aronbd.net${url}`;
    return url;
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
        return;
      }

      const result = await res.json();
      setFormData((prev) => ({ ...prev, image_url: result.url || '' }));
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ name: '', description: '', image_url: '' });
      setAdding(false);
      fetchCategories();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleEdit = async (id: number) => {
    await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setEditId(null);
    setFormData({ name: '', description: '', image_url: '' });
    fetchCategories();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category will be uncategorized.`)) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => {
            setAdding(true);
            setFormData({ name: '', description: '', image_url: '' });
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors rounded"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Add form */}
        {adding && (
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-sm font-medium mb-3">New Category</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Category name *"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="Logo URL (optional)"
                value={formData.image_url}
                onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                className="md:col-span-2 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
              />
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="px-3 py-2 text-sm border border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {formData.image_url && (
                  <img
                    src={toPreviewUrl(formData.image_url)}
                    alt="Category logo preview"
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                onClick={handleAdd}
                aria-label="Save category"
                className="p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setFormData({ name: '', description: '', image_url: '' });
                }}
                aria-label="Cancel"
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No categories yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Logo</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                  {editId === cat.id ? (
                    <>
                      <td className="px-5 py-3" colSpan={4}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, name: e.target.value }))
                            }
                            aria-label="Category name"
                            placeholder="Category name"
                            className="flex-1 border border-gray-300 px-2 py-1 text-sm rounded focus:outline-none focus:border-black"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, description: e.target.value }))
                            }
                            placeholder="Description"
                            className="flex-1 border border-gray-300 px-2 py-1 text-sm rounded focus:outline-none focus:border-black"
                          />
                          <input
                            type="text"
                            value={formData.image_url}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, image_url: e.target.value }))
                            }
                            placeholder="Logo URL"
                            className="md:col-span-2 border border-gray-300 px-2 py-1 text-sm rounded focus:outline-none focus:border-black"
                          />
                          <div className="md:col-span-2 flex items-center gap-3">
                            <label className="px-3 py-1.5 text-xs border border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                              {uploading ? 'Uploading...' : 'Upload Logo'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                            {formData.image_url && (
                              <img
                                src={toPreviewUrl(formData.image_url)}
                                alt="Category logo preview"
                                className="w-7 h-7 object-cover rounded"
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cat.id)}
                            aria-label="Save changes"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditId(null);
                              setFormData({ name: '', description: '', image_url: '' });
                            }}
                            aria-label="Cancel edit"
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{cat.name}</td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                      <td className="px-5 py-3 text-gray-500">{cat.description || '—'}</td>
                      <td className="px-5 py-3">
                        {cat.image_url ? (
                          <img
                            src={toPreviewUrl(cat.image_url)}
                            alt={`${cat.name} logo`}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditId(cat.id);
                              setFormData({
                                name: cat.name,
                                description: cat.description || '',
                                image_url: cat.image_url || '',
                              });
                            }}
                            aria-label="Edit category"
                            className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            aria-label="Delete category"
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
