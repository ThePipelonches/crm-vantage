import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

interface Lead {
  id: string;
  created_at: string;
  called_at?: string | null;
  closing_status?: 'won' | 'lost' | null;
  deal_value?: number | null;
  cash_collected?: number | null;
}

interface Stats {
  totalLeads: number;
  calledLeads: number;
  closedWon: number;
  closedLost: number;
  totalRevenue: number;
  totalCash: number;

  leadsToday: number;
  calledToday: number;
  salesToday: number;
  cashToday: number;
}

//////////////////////////////////////////////////
// COMPONENT
//////////////////////////////////////////////////

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    calledLeads: 0,
    closedWon: 0,
    closedLost: 0,
    totalRevenue: 0,
    totalCash: 0,

    leadsToday: 0,
    calledToday: 0,
    salesToday: 0,
    cashToday: 0,
  });

  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////
  // EFFECT
  //////////////////////////////////////////////////

  useEffect(() => {
    fetchStats();
  }, []);

  //////////////////////////////////////////////////
  // FETCH
  //////////////////////////////////////////////////

  const fetchStats = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('leads')
      .select('*');

    if (error) {
      console.error('Error cargando stats:', error);
      setLoading(false);
      return;
    }

    const leads: Lead[] = data || [];

    //////////////////////////////////////////////////
    // GENERALES
    //////////////////////////////////////////////////

    const totalLeads = leads.length;

    const calledLeads = leads.filter((l) => l.called_at).length;

    const closedWonLeads = leads.filter(
      (l) => l.closing_status === 'won'
    );

    const closedLostLeads = leads.filter(
      (l) => l.closing_status === 'lost'
    );

    const totalRevenue = closedWonLeads.reduce(
      (acc, l) => acc + (l.deal_value || 0),
      0
    );

    const totalCash = closedWonLeads.reduce(
      (acc, l) => acc + (l.cash_collected || 0),
      0
    );

    //////////////////////////////////////////////////
    // HOY
    //////////////////////////////////////////////////

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leadsToday = leads.filter(
      (l) => new Date(l.created_at) >= today
    );

    const calledToday = leads.filter(
      (l) =>
        l.called_at &&
        new Date(l.called_at) >= today
    );

    const salesToday = leads.filter(
      (l) =>
        l.closing_status === 'won' &&
        new Date(l.created_at) >= today
    );

    const cashToday = salesToday.reduce(
      (acc, l) => acc + (l.cash_collected || 0),
      0
    );

    //////////////////////////////////////////////////
    // ALERTAS
    //////////////////////////////////////////////////

    const newAlerts: string[] = [];

    if (leadsToday.length > 0 && calledToday.length === 0) {
      newAlerts.push('🚨 Ningún lead ha sido llamado hoy');
    }

    if (leadsToday.length > 0 && salesToday.length === 0) {
      newAlerts.push('❌ Hoy no hay ventas registradas');
    }

    const conversion =
      calledLeads > 0
        ? closedWonLeads.length / calledLeads
        : 0;

    if (conversion < 0.2 && calledLeads > 5) {
      newAlerts.push('⚠️ Conversión baja (menos del 20%)');
    }

    //////////////////////////////////////////////////
    // SET STATE
    //////////////////////////////////////////////////

    setAlerts(newAlerts);

    setStats({
      totalLeads,
      calledLeads,
      closedWon: closedWonLeads.length,
      closedLost: closedLostLeads.length,
      totalRevenue,
      totalCash,

      leadsToday: leadsToday.length,
      calledToday: calledToday.length,
      salesToday: salesToday.length,
      cashToday,
    });

    setLoading(false);
  };

  //////////////////////////////////////////////////
  // DERIVED
  //////////////////////////////////////////////////

  const conversionRate =
    stats.calledLeads > 0
      ? ((stats.closedWon / stats.calledLeads) * 100).toFixed(1)
      : '0';

  //////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">
        Dashboard Admin
      </h1>

      {/* ALERTAS */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="p-3 rounded-md bg-red-500/10 border border-red-500 text-red-400 text-sm"
            >
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* HOY */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Leads Hoy" value={stats.leadsToday} />
        <StatCard title="Llamados Hoy" value={stats.calledToday} />
        <StatCard title="Ventas Hoy" value={stats.salesToday} />
        <StatCard
          title="Cash Hoy"
          value={`$${stats.cashToday.toLocaleString()}`}
        />
      </div>

      {/* GENERALES */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <StatCard
          title="Cash Total"
          value={`$${stats.totalCash.toLocaleString()}`}
        />
        <StatCard
          title="Total Vendido"
          value={`$${stats.totalRevenue.toLocaleString()}`}
        />
        <StatCard title="Ganados" value={stats.closedWon} />
        <StatCard title="Perdidos" value={stats.closedLost} />
        <StatCard title="Conversión" value={`${conversionRate}%`} />
      </div>
    </div>
  );
};

//////////////////////////////////////////////////
// REUSABLE CARD
//////////////////////////////////////////////////

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

export default DashboardAdmin;