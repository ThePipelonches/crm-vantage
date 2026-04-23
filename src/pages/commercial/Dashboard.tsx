import { useState, useMemo } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { getSales, getClosers } from '@/services/storage';
import { DollarSign, Package, PhoneCall, TrendingUp, UserX, BarChart3, ExternalLink, Calendar, Filter } from 'lucide-react';
import { PACKAGE_TYPE_LABELS } from '@/types';

export function CommercialDashboard() {
  const [selectedCloser, setSelectedCloser] = useState<string>('all');
  const sales = getSales();
  const closers = getClosers();

  const filteredSales = useMemo(() => {
    return selectedCloser === 'all' ? sales : sales.filter((s) => s.closerId === selectedCloser);
  }, [sales, selectedCloser]);

  const stats = useMemo(() => {
    const totalCalls = filteredSales.length;
    const noShows = filteredSales.filter((s) => s.noShow).length;
    const completedCalls = totalCalls - noShows;
    const cashCollected = filteredSales.filter((s) => !s.noShow).reduce((acc, s) => acc + s.upfrontValue, 0);
    const packagesSold = completedCalls;
    const conversionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
    const aov = completedCalls > 0 ? Math.round(cashCollected / completedCalls) : 0;

    const byPackage: Record<string, number> = {};
    filteredSales.filter((s) => !s.noShow).forEach((s) => {
      byPackage[s.packageType] = (byPackage[s.packageType] || 0) + 1;
    });

    return { totalCalls, noShows, completedCalls, cashCollected, packagesSold, conversionRate, aov, byPackage };
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Dashboard Comercial</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Métricas de ventas y rendimiento del equipo</p>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={selectedCloser} onChange={(e) => setSelectedCloser(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:border-cyan-400/50 cursor-pointer">
            <option value="all">Todos los closers</option>
            {closers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Cash Collected" value={`$${stats.cashCollected.toLocaleString()}`} subtitle="Ingresos upfront" icon={DollarSign} accent="emerald" />
        <KpiCard title="Paquetes vendidos" value={stats.packagesSold} subtitle="Ventas completadas" icon={Package} accent="cyan" />
        <KpiCard title="Llamadas realizadas" value={stats.totalCalls} subtitle="Total de llamadas" icon={PhoneCall} accent="blue" />
        <KpiCard title="Tasa de conversión" value={`${stats.conversionRate}%`} subtitle={`${stats.completedCalls} de ${stats.totalCalls}`} icon={TrendingUp} accent="emerald" />
        <KpiCard title="No Shows" value={stats.noShows} subtitle="Llamadas perdidas" icon={UserX} accent="red" />
        <KpiCard title="AOV Upfront" value={`$${stats.aov.toLocaleString()}`} subtitle="Valor promedio" icon={BarChart3} accent="amber" />
      </div>

      {/* Package breakdown */}
      <div className="card-surface rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Paquetes vendidos por tipo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(stats.byPackage).map(([pkg, count]) => (
            <div key={pkg} className="text-center p-4 rounded-lg bg-white/5">
              <p className="text-xl font-mono-tech text-cyan-400">{count}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{PACKAGE_TYPE_LABELS[pkg as keyof typeof PACKAGE_TYPE_LABELS]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sales calls with Fathom */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-medium">Detalle de llamadas de venta</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Cliente</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Paquete</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Valor upfront</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Fecha</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Estado</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Grabación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><p className="text-sm font-medium">{sale.clientName}</p></td>
                  <td className="px-4 py-3"><span className="text-xs">{PACKAGE_TYPE_LABELS[sale.packageType]}</span></td>
                  <td className="px-4 py-3"><span className="text-sm font-mono-tech">${sale.upfrontValue.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{sale.callDate}</span></td>
                  <td className="px-4 py-3">
                    {sale.noShow ? (
                      <span className="inline-flex items-center rounded-full border text-[10px] px-2 py-0.5 font-medium bg-red-400/10 text-red-400 border-red-400/20">No Show</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border text-[10px] px-2 py-0.5 font-medium bg-emerald-400/10 text-emerald-400 border-emerald-400/20">Completada</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sale.fathomLink ? (
                      <a href={sale.fathomLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />Fathom
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Agenda - Calendly + Google Calendar */}
      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium">Agenda Ejecutiva</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium group-hover:text-cyan-400 transition-colors">Calendly</h4>
              <p className="text-xs text-muted-foreground">Ver agenda de bookings entrantes</p>
            </div>
          </a>
          <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium group-hover:text-cyan-400 transition-colors">Google Calendar</h4>
              <p className="text-xs text-muted-foreground">Ver calendario de sesiones</p>
            </div>
          </a>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-400/5 border border-amber-400/10">
          <p className="text-xs text-amber-400/80">
            <strong>Integración Webhook Calendly:</strong> Para conectar automáticamente los nuevos bookings de Calendly como leads en esta plataforma, necesitamos configurar un webhook de Calendly que envíe los datos a un endpoint. Los datos requeridos del evento Calendly incluyen: nombre del invitado, email, teléfono (custom question), event_type (tipo de sesión), y scheduled_time. Hablame cuando quieras que configuremos el endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}
