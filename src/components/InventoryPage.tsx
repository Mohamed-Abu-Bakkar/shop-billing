import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Item, Category, Unit } from '@/types';
import { generateId } from '@/lib/id';
import { shopApi } from '@/lib/convex';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

interface InventoryPageProps {
  onBack: () => void;
}

const CATEGORIES: Category[] = ['Wire', 'Switch', 'Bulb', 'Fan', 'Motor', 'PVC', 'MCB', 'Other'];
const UNITS: Unit[] = ['pc', 'mtr', 'box', 'pkt'];

export default function InventoryPage({ onBack }: InventoryPageProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'dead'>('all');
  const items = (useQuery(shopApi.listItems, {}) ?? []) as Item[];
  const createItem = useMutation(shopApi.createItem);
  const saveItem = useMutation(shopApi.updateItem);
  const removeItem = useMutation(shopApi.deleteItem);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchSearch && i.stock <= i.minStock;
    if (filter === 'dead') {
      const daysSince = i.lastSoldAt ? (Date.now() - new Date(i.lastSoldAt).getTime()) / 86400000 : 999;
      return matchSearch && daysSince > 60;
    }
    return matchSearch;
  });

  const handleSave = async (item: Item) => {
    const { _creationTime, _id, ...itemData } = item;
    if (editItem) {
      await saveItem({ item: itemData });
      toast.success('Item updated');
    } else {
      await createItem({ item: itemData });
      toast.success('Item added');
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    await removeItem({ id });
    toast('Item deleted', { action: { label: 'Undo', onClick: () => { /* simplified */ } } });
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <h1 className="heading text-base">Inventory</h1>
          <span className="mono-num text-xs text-muted-foreground">{items.length} items</span>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
          + Add Item
        </button>
      </div>

      <div className="px-4 py-2 flex gap-2 border-b border-border">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex gap-1">
          {(['all', 'low', 'dead'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {f === 'all' ? 'All' : f === 'low' ? '⚠ Low Stock' : '💀 Dead Stock'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2 text-right">Purchase</th>
              <th className="px-4 py-2 text-right">Retail</th>
              <th className="px-4 py-2 text-right">Wholesale</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(item => (
              <tr key={item.id} className={`hover:bg-muted/30 transition-colors cursor-pointer ${item.stock <= item.minStock ? 'border-l-4 border-l-warning' : ''}`} onClick={() => { setEditItem(item); setShowForm(true); }}>
                <td className="px-4 py-2.5 font-medium">{item.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{item.brand}</td>
                <td className="px-4 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.category}</span></td>
                <td className={`px-4 py-2.5 text-right mono-num ${item.stock <= item.minStock ? 'text-warning font-semibold' : ''}`}>{item.stock} {item.unit}</td>
                <td className="px-4 py-2.5 text-right mono-num">₹{item.purchasePrice}</td>
                <td className="px-4 py-2.5 text-right mono-num">₹{item.retailPrice}</td>
                <td className="px-4 py-2.5 text-right mono-num">₹{item.wholesalePrice}</td>
                <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-accent/10 text-accent mr-1">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-danger/10 text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No items found</div>}
      </div>

      {showForm && <ItemForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}

function ItemForm({ item, onSave, onClose }: { item: Item | null; onSave: (i: Item) => void; onClose: () => void }) {
  const [form, setForm] = useState<Item>(item || {
    id: generateId(), name: '', brand: '', category: 'Other', unit: 'pc',
    purchasePrice: 0, retailPrice: 0, wholesalePrice: 0,
    stock: 0, minStock: 10, warrantyMonths: 0, lastSoldAt: null, alternates: [],
  });

  const set = (k: keyof Item, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-elevated rounded-xl w-full max-w-lg p-5 space-y-4 bg-card" onClick={e => e.stopPropagation()}>
        <h2 className="heading text-base">{item ? 'Edit Item' : 'Add Item'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Item name *" value={form.name} onChange={e => set('name', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <input placeholder="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <select value={form.category} onChange={e => set('category', e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.unit} onChange={e => set('unit', e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input type="number" placeholder="Stock" value={form.stock || ''} onChange={e => set('stock', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <input type="number" placeholder="Purchase ₹" value={form.purchasePrice || ''} onChange={e => set('purchasePrice', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <input type="number" placeholder="Retail ₹" value={form.retailPrice || ''} onChange={e => set('retailPrice', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <input type="number" placeholder="Wholesale ₹" value={form.wholesalePrice || ''} onChange={e => set('wholesalePrice', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <input type="number" placeholder="Min stock alert" value={form.minStock || ''} onChange={e => set('minStock', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <input type="number" placeholder="Warranty (months)" value={form.warrantyMonths || ''} onChange={e => set('warrantyMonths', +e.target.value)} className="px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-secondary">Cancel</button>
          <button onClick={() => { if (!form.name) { toast.error('Name required'); return; } onSave(form); }}
            className="px-4 py-2 rounded-lg text-sm bg-accent text-accent-foreground font-medium hover:opacity-90">
            {item ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
