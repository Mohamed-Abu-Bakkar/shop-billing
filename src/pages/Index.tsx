import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { store } from '@/lib/store';
import type { Customer, Invoice, Item, Payment } from '@/types';
import Dashboard from '@/components/Dashboard';
import BillingScreen from '@/components/BillingScreen';
import InventoryPage from '@/components/InventoryPage';
import CustomersPage from '@/components/CustomersPage';
import ReportsPage from '@/components/ReportsPage';
import PaymentsPage from '@/components/PaymentsPage';
// import InvoicesPage from '@/components/InvoicesPage';
import { Badge } from '@/components/ui/badge';

type Page = 'dashboard' | 'billing' | 'inventory' | 'customers' | 'reports' | 'payments' | 'invoices';

const Index = () => {
  const [page, setPage] = useState<Page>('dashboard');

  // Fetch all data once to avoid refetching on navigation
  const invoices = useQuery(api.shop.listInvoices, {}) as Invoice[] | undefined;
  const customers = useQuery(api.shop.listCustomers, {}) as Customer[] | undefined;
  const items = useQuery(api.shop.listItems, {}) as Item[] | undefined;
  const payments = useQuery(api.shop.listPayments, {}) as Payment[] | undefined;

  const customerCount = customers?.length ?? 0;
  const itemCount = items?.length ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const targetTag = document.activeElement?.tagName;
      const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isTyping) return;

      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setPage('dashboard');
        return;
      }

      if (e.key === 'n' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setPage('billing');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goHome = () => setPage('dashboard');

  const commonProps = { invoices, customers, items, payments };

  if (page === 'billing') return <BillingScreen {...commonProps} onBack={goHome} />;
  if (page === 'inventory') return <InventoryPage {...commonProps} onBack={goHome} />;
  if (page === 'customers') return <CustomersPage {...commonProps} onBack={goHome} />;
  if (page === 'reports') return <ReportsPage {...commonProps} onBack={goHome} />;
  if (page === 'payments') return <PaymentsPage {...commonProps} onBack={goHome} />;
  // if (page === 'invoices') return <InvoicesPage {...commonProps} onBack={goHome} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="heading text-lg tracking-tight">{store.name}</h1>
          <p className="text-xs text-muted-foreground">{store.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]">
            by {store.partnerName}
          </Badge>
        </div>
      </header>
      <Dashboard invoices={invoices} items={items} customerCount={customerCount} itemCount={itemCount} onNavigate={(p) => setPage(p as Page)} />
    </div>
  );
};

export default Index;
