import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import BillingScreen from '@/components/BillingScreen';
import InventoryPage from '@/components/InventoryPage';
import CustomersPage from '@/components/CustomersPage';
import ReportsPage from '@/components/ReportsPage';
import PaymentsPage from '@/components/PaymentsPage';

type Page = 'dashboard' | 'billing' | 'inventory' | 'customers' | 'reports' | 'payments';

const Index = () => {
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setPage('billing');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goHome = () => setPage('dashboard');

  if (page === 'billing') return <BillingScreen onBack={goHome} />;
  if (page === 'inventory') return <InventoryPage onBack={goHome} />;
  if (page === 'customers') return <CustomersPage onBack={goHome} />;
  if (page === 'reports') return <ReportsPage onBack={goHome} />;
  if (page === 'payments') return <PaymentsPage onBack={goHome} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="heading text-lg tracking-tight">VoltLedger</h1>
        <span className="text-xs text-muted-foreground">Electrical Shop Billing</span>
      </header>
      <Dashboard onNavigate={(p) => setPage(p as Page)} />
    </div>
  );
};

export default Index;
