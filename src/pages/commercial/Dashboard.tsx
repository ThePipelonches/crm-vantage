import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardMetrics } from '../../services/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, PhoneCall, Calendar, TrendingUp } from 'lucide-react';

export default function CommercialDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="text-white">Cargando...</div>;
  if (!metrics) return <div>Error</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Comercial</h1>
        <p className="text-zinc-400">Rendimiento de Ventas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Mis Leads Totales</CardTitle>
            <PhoneCall className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalLeads}</div></CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Tasa Cierre</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.conversionRate}%</div></CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.appointmentsToday}</div></CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ventas Cerradas</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalSales}</div></CardContent>
        </Card>
      </div>
      
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-zinc-500">
        <p>Aquí irá la gráfica de rendimiento mensual (próximamente).</p>
      </div>
    </div>
  );
}