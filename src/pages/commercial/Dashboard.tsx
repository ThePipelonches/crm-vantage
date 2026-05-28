import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

export default function CommercialDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Comercial</h1>
        <p className="text-zinc-400">Métricas de ventas y rendimiento del equipo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">$0</div><p className="text-xs text-zinc-500">Este mes</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Leads Nuevos</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-zinc-500">Últimos 7 días</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Tasa de Cierre</CardTitle>
            <Target className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0%</div><p className="text-xs text-zinc-500">Objetivo: 20%</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">0%</div><p className="text-xs text-zinc-500">Vs mes anterior</p></CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
          <h3 className="text-lg font-semibold mb-4">Rendimiento del Equipo</h3>
          <p className="text-zinc-500 text-sm">Las métricas individuales de los closers aparecerán aquí.</p>
        </Card>
      </div>
    </div>
  );
}