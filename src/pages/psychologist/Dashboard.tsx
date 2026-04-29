import { useMemo } from 'react';

import {
  getClients,
  getSessions,
} from '../../services/storage';

import { KpiCard } from '../../components/KpiCard';

import {
  Users,
  Activity,
  TrendingDown,
  Brain,
} from 'lucide-react';

//////////////////////////////////////////////////
// HELPERS (🔥 clave para evitar bugs de fechas)
//////////////////////////////////////////////////

function toDateSafe(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

//////////////////////////////////////////////////

export function PsychologistDashboard() {
  const clients = getClients();
  const sessions = getSessions();

  const stats = useMemo(() => {
    const totalClients = clients.length;

    const now = new Date();

    //////////////////////////////////////////////////
    // 📅 SESIONES ÚLTIMOS 7 DÍAS
    //////////////////////////////////////////////////

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const weekSessions = sessions.filter((s) => {
      const d = toDateSafe(s.date);
      return d && d >= weekAgo;
    }).length;

    //////////////////////////////////////////////////
    // 📉 ABANDONO (14 días sin sesión)
    //////////////////////////////////////////////////

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const abandonedClients = clients.filter((c) => {
      const clientSessions = sessions.filter(
        (s) => s.clientId === c.id
      );

      if (clientSessions.length === 0) return true;

      // 🔥 copiar antes de ordenar (evita mutación global)
      const sorted = [...clientSessions].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const lastSessionDate = toDateSafe(sorted[0].date);

      if (!lastSessionDate) return true;

      return lastSessionDate < twoWeeksAgo;
    });

    const abandonmentRate =
      totalClients > 0
        ? Math.round((abandonedClients.length / totalClients) * 100)
        : 0;

    //////////////////////////////////////////////////
    // 🎯 ROL
    //////////////////////////////////////////////////

    const rolGreen = clients.filter((c) => c.rolRisk === 'green').length;
    const rolYellow = clients.filter((c) => c.rolRisk === 'yellow').length;
    const rolRed = clients.filter((c) => c.rolRisk === 'red').length;

    //////////////////////////////////////////////////

    return {
      totalClients,
      weekSessions,
      abandonmentRate,
      abandonedCount: abandonedClients.length,
      rolGreen,
      rolYellow,
      rolRed,
    };

  }, [clients, sessions]);

  //////////////////////////////////////////////////

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-lg font-medium">Dashboard Clínico</h2>
        <p className="text-sm text-muted-foreground">
          Métricas del sistema clínico
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">

        <KpiCard
          title="Clientes activos"
          value={stats.totalClients}
          subtitle="En tratamiento"
          icon={Users}
        />

        <KpiCard
          title="Sesiones (7 días)"
          value={stats.weekSessions}
          subtitle="Última semana"
          icon={Activity}
        />

        <KpiCard
          title="Abandono"
          value={`${stats.abandonmentRate}%`}
          subtitle={`${stats.abandonedCount} clientes`}
          icon={TrendingDown}
        />

        <KpiCard
          title="Riesgo alto"
          value={stats.rolRed}
          subtitle="Clientes en rojo"
          icon={Brain}
        />

      </div>

      {/* ROL */}
      <div className="card-surface rounded-xl p-5">

        <h3 className="text-sm font-medium mb-4">
          Distribución de riesgo (ROL)
        </h3>

        <div className="grid grid-cols-3 gap-4">

          <div className="text-center p-4 rounded-lg bg-emerald-400/10">
            <p className="text-2xl font-semibold text-emerald-400">
              {stats.rolGreen}
            </p>
            <p className="text-xs text-muted-foreground">
              Verde
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-amber-400/10">
            <p className="text-2xl font-semibold text-amber-400">
              {stats.rolYellow}
            </p>
            <p className="text-xs text-muted-foreground">
              Amarillo
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-red-400/10">
            <p className="text-2xl font-semibold text-red-400">
              {stats.rolRed}
            </p>
            <p className="text-xs text-muted-foreground">
              Rojo
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}