import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { shopApi } from '@/lib/convex';
import Dashboard from '@/components/Dashboard';
import BillingScreen from '@/components/BillingScreen';
import InventoryPage from '@/components/InventoryPage';
import CustomersPage from '@/components/CustomersPage';
import ReportsPage from '@/components/ReportsPage';
import PaymentsPage from '@/components/PaymentsPage';

type Page = 'dashboard' | 'billing' | 'inventory' | 'customers' | 'reports' | 'payments';

const Index = () => {
  const [page, setPage] = useState<Page>('dashboard');

  // Fetch all data once to avoid refetching on navigation
  const invoices = useQuery(shopApi.listInvoices, {});
  const customers = useQuery(shopApi.listCustomers, {});
  const items = useQuery(shopApi.listItems, {});
  const payments = useQuery(shopApi.listPayments, {});

  const customerCount = customers?.length ?? 0;
  const itemCount = items?.length ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="heading text-lg tracking-tight">Sri Mahalingam Electricals</h1>
        <span className="text-xs text-muted-foreground">Electrical & Plumbing Store</span>
      </header>
      <Dashboard invoices={invoices} customerCount={customerCount} itemCount={itemCount} onNavigate={(p) => setPage(p as Page)} />
    </div>
  );
};

export default Index;
