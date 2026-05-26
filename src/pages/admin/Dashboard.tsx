import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardMetrics, getRecentLeads } from '../../services/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, PhoneCall, Calendar, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, leadsData] = await Promise.all([getDashboardMetrics(), getRecentLeads(5)]);
        setMetrics(metricsData);
        setRecentLeads(leadsData);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  if (loading) return <div className="text-white p-10">Cargando m étricas globales...</div>;
  if (!metrics) return <div className="text-red-400 p-10">Error al cargar datos.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Visión Global</h1>
        <p className="text-zinc-400">Panel de control general de la organización.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Leads (Todos)</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalLeads}</div></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Tasa Conversión Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.conversionRate}%</div></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Citas Hoy (Todas)</CardTitle>
            <Calendar className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.appointmentsToday}</div></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ingresos Estimados</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${(metrics.totalSales * 150).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-white col-span-2">
          <CardHeader><CardTitle>Actividad Reciente en la Organización</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">{lead.full_name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-white">{lead.full_name}</p>
                      <p className="text-xs text-zinc-500">{lead.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${lead.status === 'new' ? 'border-blue-500 text-blue-400' : 'border-zinc-600 text-zinc-400'}`}>
                    {lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}