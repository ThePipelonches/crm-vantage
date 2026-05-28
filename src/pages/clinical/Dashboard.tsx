import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Calendar, Clock, Activity } from 'lucide-react';

export default function ClinicalDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Clínico</h1>
        <p className="text-zinc-400">Gestión de pacientes y sesiones terapéuticas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Pacientes Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-zinc-500">En tratamiento</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-zinc-500">Programadas</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Sesiones Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-zinc-500">Por agendar</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">-</div><p className="text-xs text-zinc-500">Esta semana</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
          <h3 className="text-lg font-semibold mb-4">Próximas Sesiones</h3>
          <p className="text-zinc-500 text-sm">No hay sesiones programadas para hoy.</p>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
          <h3 className="text-lg font-semibold mb-4">Pacientes Recientes</h3>
          <p className="text-zinc-500 text-sm">Los nuevos pacientes asignados aparecerán aquí.</p>
        </Card>
      </div>
    </div>
  );
}