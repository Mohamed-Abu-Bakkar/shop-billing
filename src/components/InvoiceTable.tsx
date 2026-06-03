import { useState, useMemo } from 'react';
import { Invoice } from '@/types';

type SortKey = 'invoiceNo' | 'createdAt' | 'customerName' | 'type' | 'status' | 'totalAmount';
type SortDir = 'asc' | 'desc';

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelect: (inv: Invoice) => void;
}

const PAGE_SIZE = 10;

export default function InvoiceTable({ invoices, onSelect }: InvoiceTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(inv =>
      inv.invoiceNo.toLowerCase().includes(q) ||
      (inv.customerName?.toLowerCase() ?? '').includes(q)
    );
  }, [invoices, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'invoiceNo': cmp = a.invoiceNo.localeCompare(b.invoiceNo); break;
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case 'customerName': cmp = (a.customerName ?? '').localeCompare(b.customerName ?? ''); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'totalAmount': cmp = a.totalAmount - b.totalAmount; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const Th = ({ column, label, className }: { column: SortKey; label: string; className?: string }) => (
    <th className={className}>
      <button onClick={() => toggleSort(column)}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        {label}<SortIcon column={column} />
      </button>
    </th>
  );

  return (
    <div className="card-surface rounded-xl">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <h2 className="heading text-sm">All Invoices</h2>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by invoice no or customer..."
          className="ml-auto px-3 py-1.5 text-xs rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary w-64"
        />
      </div>
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          {search ? 'No invoices match your search' : 'No invoices yet'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th column="invoiceNo" label="Invoice No" className="px-4 py-3 text-left" />
                  <Th column="createdAt" label="Date" className="px-4 py-3 text-left" />
                  <Th column="customerName" label="Customer" className="px-4 py-3 text-left" />
                  <Th column="type" label="Type" className="px-4 py-3 text-left" />
                  <Th column="status" label="Status" className="px-4 py-3 text-left" />
                  <Th column="totalAmount" label="Amount" className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(inv => (
                  <tr key={inv.id} onClick={() => onSelect(inv)}
                    className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 mono-num text-xs text-muted-foreground">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {inv.customerName || 'Walk-in'}
                      {inv.buyingForClient && <span className="text-xs text-muted-foreground ml-1">• {inv.buyingForClient}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${inv.type === 'Retail' ? 'bg-muted text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        inv.status === 'Paid' ? 'bg-success/10 text-success' :
                        inv.status === 'Partial' ? 'bg-warning/10 text-warning' :
                        'bg-danger/10 text-danger'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 mono-num font-semibold text-right whitespace-nowrap">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                      {inv.status !== 'Paid' && (
                        <div className="text-xs text-warning font-medium">
                          Due: ₹{(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(0)} disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">«</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`px-2 py-1 rounded text-xs font-medium ${i === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">›</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">»</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
