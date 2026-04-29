import { useState, useMemo } from 'react';
import { KpiCard } from '../../components/KpiCard';
import { getSales, getClosers } from '../../services/storage';
import {
  DollarSign,
  Package,
  PhoneCall,
  TrendingUp,
  UserX,
  BarChart3,
} from 'lucide-react';

//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

interface Sale {
  id: string;
  closerId: string;
  clientName: string;
  packageType: string;
  upfrontValue: number;
  callDate: string;
  noShow?: boolean;
  fathomLink?: string;
}

//////////////////////////////////////////////////

export function CommercialDashboard() {
  const [selectedCloser, setSelectedCloser] = useState<string>('all');

  const sales: Sale[] = getSales();
  const closers = getClosers();

  //////////////////////////////////////////////////

  const filteredSales = useMemo(() => {
    return selectedCloser === 'all'
      ? sales
      : sales.filter((s) => s.closerId === selectedCloser);
  }, [sales, selectedCloser]);

  //////////////////////////////////////////////////

  const stats = useMemo(() => {
    const totalCalls = filteredSales.length;

    const noShows = filteredSales.filter((s) => s.noShow).length;

    const completedCalls = totalCalls - noShows;

    const cashCollected = filteredSales
      .filter((s) => !s.noShow)
      .reduce((acc, s) => acc + s.upfrontValue, 0);

    const conversionRate =
      totalCalls > 0
        ? Math.round((completedCalls / totalCalls) * 100)
        : 0;

    const aov =
      completedCalls > 0
        ? Math.round(cashCollected / completedCalls)
        : 0;

    return {
      totalCalls,
      noShows,
      completedCalls,
      cashCollected,
      conversionRate,
      aov,
    };
  }, [filteredSales]);

  //////////////////////////////////////////////////

  return (
    <div className="space-y-6">

      <h2 className="text-lg font-medium">
        Dashboard Comercial
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <KpiCard
          title="Cash"
          value={`$${stats.cashCollected}`}
          icon={DollarSign}
          accent="emerald"
        />

        <KpiCard
          title="Calls"
          value={stats.totalCalls}
          icon={PhoneCall}
        />

        <KpiCard
          title="Conversion"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
        />

      </div>

    </div>
  );
}