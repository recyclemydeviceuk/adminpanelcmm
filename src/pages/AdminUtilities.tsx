import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import type { UtilityItem } from '../types';

type CRUDOps = {
  add: (name: string, extra?: { value?: string; color?: string }) => Promise<void>;
  update: (id: string, updates: Partial<UtilityItem>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (items: UtilityItem[]) => void;
};

const STATUS_COLORS = [
  { label: 'Gray',    value: 'bg-gray-100 text-gray-700' },
  { label: 'Blue',    value: 'bg-blue-100 text-blue-700' },
  { label: 'Purple',  value: 'bg-purple-100 text-purple-700' },
  { label: 'Indigo',  value: 'bg-indigo-100 text-indigo-700' },
  { label: 'Green',   value: 'bg-green-100 text-green-700' },
  { label: 'Emerald', value: 'bg-emerald-100 text-emerald-700' },
  { label: 'Teal',    value: 'bg-teal-100 text-teal-700' },
  { label: 'Amber',   value: 'bg-amber-100 text-amber-700' },
  { label: 'Orange',  value: 'bg-orange-100 text-orange-700' },
  { label: 'Red',     value: 'bg-red-100 text-red-700' },
  { label: 'Yellow',  value: 'bg-yellow-100 text-yellow-700' },
  { label: 'Pink',    value: 'bg-pink-100 text-pink-700' },
];

function UtilityTable({
  title,
  items,
  crud,
  showColor = false,
  showValue = false,
  icon,
}: {
  title: string;
  items: UtilityItem[];
  crud: CRUDOps;
  showColor?: boolean;
  showValue?: boolean;
  icon?: React.ReactNode;
}) {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newColor, setNewColor] = useState(STATUS_COLORS[0].value);
  const [adding, setAdding] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await crud.add(newName.trim(), {
        value: showValue ? (newValue.trim() || newName.trim().toUpperCase().replace(/\s+/g, '_')) : undefined,
        color: showColor ? newColor : undefined,
      });
      setNewName(''); setNewValue(''); setNewColor(STATUS_COLORS[0].value);
      setShowAddRow(false);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: UtilityItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditValue(item.value || '');
    setEditColor(item.color || STATUS_COLORS[0].value);
  };

  const cancelEdit = () => { setEditId(null); };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await crud.update(id, {
        name: editName.trim(),
        ...(showValue ? { value: editValue.trim() || editName.trim().toUpperCase().replace(/\s+/g, '_') } : {}),
        ...(showColor ? { color: editColor } : {}),
      });
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setDeletingId(id);
    try { await crud.remove(id); } finally { setDeletingId(null); }
  };

  const handleToggle = async (item: UtilityItem) => {
    await crud.update(item.id, { isActive: !item.isActive });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setCollapsed(v => !v)}>
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="font-bold text-gray-900 text-sm uppercase tracking-wider">{title}</span>
          <span className="ml-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600">{items.length}</span>
          {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />}
        </button>
        <button
          onClick={() => { setShowAddRow(v => !v); setCollapsed(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                {showValue && <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>}
                {showColor && <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Colour</th>}
                <th className="text-center px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Add row */}
              {showAddRow && (
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <td className="px-5 py-3 text-xs text-gray-400 font-bold">NEW</td>
                  <td className="px-5 py-3">
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      placeholder="Enter name..."
                      className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                  </td>
                  {showValue && (
                    <td className="px-5 py-3">
                      <input
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        placeholder="Auto-generated"
                        className="w-full px-3 py-1.5 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                  )}
                  {showColor && (
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full border flex-shrink-0 ${newColor.split(' ')[0]}`} />
                        <select
                          value={newColor}
                          onChange={e => setNewColor(e.target.value)}
                          className="px-2 py-1.5 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
                        >
                          {STATUS_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    </td>
                  )}
                  <td className="px-5 py-3 text-center">
                    <span className="text-xs text-gray-400">—</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleAdd}
                        disabled={adding || !newName.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-all"
                      >
                        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save
                      </button>
                      <button onClick={() => { setShowAddRow(false); setNewName(''); setNewValue(''); }} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {items.length === 0 && !showAddRow && (
                <tr>
                  <td colSpan={3 + (showValue ? 1 : 0) + (showColor ? 1 : 0)} className="px-5 py-10 text-center text-sm text-gray-400">
                    No items yet. Click <strong>Add New</strong> to create one.
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3 text-xs text-gray-400 font-semibold">{idx + 1}</td>

                  {/* Name cell */}
                  <td className="px-5 py-3">
                    {editId === item.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(item.id); if (e.key === 'Escape') cancelEdit(); }}
                        className="w-full px-3 py-1.5 text-sm border border-blue-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{item.name}</span>
                    )}
                  </td>

                  {/* Value cell */}
                  {showValue && (
                    <td className="px-5 py-3">
                      {editId === item.id ? (
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Auto"
                          className="w-full px-3 py-1.5 text-sm border border-blue-400 rounded-lg bg-white focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.value || '—'}</span>
                      )}
                    </td>
                  )}

                  {/* Color cell */}
                  {showColor && (
                    <td className="px-5 py-3">
                      {editId === item.id ? (
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full border flex-shrink-0 ${editColor.split(' ')[0]}`} />
                          <select
                            value={editColor}
                            onChange={e => setEditColor(e.target.value)}
                            className="px-2 py-1.5 text-sm border border-blue-400 rounded-lg bg-white focus:outline-none"
                          >
                            {STATUS_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${item.color || 'bg-gray-100 text-gray-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.color?.split(' ')[0] || 'bg-gray-400'}`} />
                          {STATUS_COLORS.find(c => c.value === item.color)?.label || 'Gray'}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Status cell */}
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Actions cell */}
                  <td className="px-5 py-3 text-right">
                    {editId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminUtilities() {
  const {
    storageOptions, storageOptionsCRUD,
    conditions, conditionsCRUD,
    networks, networksCRUD,
    brands, brandsCRUD,
    categories, categoriesCRUD,
    orderStatuses, orderStatusesCRUD,
    paymentStatuses, paymentStatusesCRUD,
    loadingUtilities,
  } = useAdmin();

  if (loadingUtilities) {
    return (
      <AdminLayout title="Utilities" subtitle="Manage dropdown options and system configuration">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 mx-auto text-red-500 animate-spin mb-3" />
            <p className="text-gray-600 font-medium">Loading utilities...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Utilities" subtitle="Manage dropdown options and system configuration">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UtilityTable title="Storage Options" items={storageOptions} crud={storageOptionsCRUD as any} />
          <UtilityTable title="Device Conditions" items={conditions} crud={conditionsCRUD as any} />
          <UtilityTable title="Networks" items={networks} crud={networksCRUD as any} />
          <UtilityTable title="Brands" items={brands} crud={brandsCRUD as any} />
          <UtilityTable title="Categories" items={categories} crud={categoriesCRUD as any} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UtilityTable title="Order Statuses" items={orderStatuses} crud={orderStatusesCRUD as any} showColor showValue />
          <UtilityTable title="Payment Statuses" items={paymentStatuses} crud={paymentStatusesCRUD as any} showColor showValue />
        </div>
      </div>
    </AdminLayout>
  );
}
