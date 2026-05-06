import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardMetrics } from '../../services/analytics'; // Reutilizamos, pero podríamos crear uno clínico
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Calendar, Clock, Brain } from 'lucide-react';

export default function ClinicalDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Nota: getDashboardMetrics trae citas generales. 
        // En una versión avanzada, filtraríamos solo citas clínicas por psychologist_id.
        // Por ahora, usamos los datos globales que RLS filtrará por el usuario logueado.
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Clínico</h1>
        <p className="text-zinc-400">Gestión de Pacientes y Sesiones</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Mis Pacientes</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div></CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Sesiones Hoy</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics?.appointmentsToday || 0}</div></CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Próximas Citas</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics?.appointmentsUpcoming || 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400"/> Estado de la Agenda
            </h3>
            <p className="text-zinc-400">No hay sesiones críticas pendientes para hoy.</p>
         </Card>
      </div>
    </div>
  );
}