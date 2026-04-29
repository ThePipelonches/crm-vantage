import { useMemo } from 'react';
import { getLeads } from '../../services/storage';
import type { Lead } from '../../types';

import {
  Users,
  Phone,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export function SetterDashboard() {
  const leads: Lead[] = getLeads();

  const stats = useMemo(() => {
    const now = new Date();

    const totalLeads = leads.length;

    const contacted = leads.filter(
      (l) => l.status === 'contacted'
    ).length;

    const recentLeads = leads.filter((l) => {
      const created = new Date(l.createdAt);
      return now.getTime() - created.getTime() < 5 * 60 * 1000;
    }).length;

    const lateLeads = leads.filter((l) => {
      if (l.contactedAt) return false;
      const created = new Date(l.createdAt);
      return now.getTime() - created.getTime() > 5 * 60 * 1000;
    }).length;

    return {
      totalLeads,
      contacted,
      recentLeads,
      lateLeads,
    };
  }, [leads]);

  return (
    <div className="space-y-6">

      <h2 className="text-lg font-medium">Dashboard Setter</h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="card p-4">
          <Users />
          <p>{stats.totalLeads}</p>
        </div>

        <div className="card p-4">
          <Phone />
          <p>{stats.contacted}</p>
        </div>

        <div className="card p-4">
          <Clock />
          <p>{stats.recentLeads}</p>
        </div>

        <div className="card p-4">
          <AlertTriangle />
          <p>{stats.lateLeads}</p>
        </div>

      </div>

    </div>
  );
}