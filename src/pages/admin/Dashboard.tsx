import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardMetrics, getRecentLeads } from '../../services/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, PhoneCall, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, leadsData] = await Promise.all([
          getDashboardMetrics(),
          getRecentLeads(5)
        ]);
        setMetrics(metricsData);
        setRecentLeads(leadsData);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="text-white">Cargando métricas...</div>;
  if (!metrics) return <div className="text-red-400">Error al cargar datos.</div>;

  const kpiCards = [
    { title: "Total Leads", value: metrics.totalLeads, icon: Users, color: "text-blue-400" },
    { title: "Nuevos (Hoy)", value: metrics.newLeads, icon: Clock, color: "text-green-400" },
    { title: "Tasa Conversión", value: `${metrics.conversionRate}%`, icon: TrendingUp, color: "text-purple-400" },
    { title: "Citas Hoy", value: metrics.appointmentsToday, icon: Calendar, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard General</h1>
        <p className="text-zinc-400">Bienvenido, {user?.full_name || user?.email}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Tabla de Leads Recientes */}
        <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-400">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium text-white">{lead.full_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`
                          ${lead.status === 'new' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : ''}
                          ${lead.status === 'closed' ? 'bg-green-900/30 text-green-400 border-green-800' : ''}
                          ${!['new','closed'].includes(lead.status) ? 'bg-zinc-800 text-zinc-300' : ''}
                        `}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-4">Sin leads recientes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Rápido */}
        <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg">
              <span className="text-zinc-400">Leads Contactados</span>
              <span className="font-bold text-white">{metrics.contactedLeads}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg">
              <span className="text-zinc-400">Próximas Citas</span>
              <span className="font-bold text-white">{metrics.appointmentsUpcoming}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg">
              <span className="text-zinc-400">Ventas (Cerrados)</span>
              <span className="font-bold text-green-400">{metrics.totalSales}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}