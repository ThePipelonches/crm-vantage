import { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

const mockLeads: Lead[] = [
  { id: 1, name: 'Carlos Gómez', email: 'carlos@email.com', phone: '3001234567', status: 'new' },
  { id: 2, name: 'Ana López', email: 'ana@email.com', phone: '3009876543', status: 'contacted' },
  { id: 3, name: 'Luis Martínez', email: 'luis@email.com', phone: '3014567890', status: 'no_answer' },
];

export default function Leads() {
  const [leads] = useState<Lead[]>(mockLeads);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl font-semibold">Leads</h1>

        <button className="btn-primary">
          Nuevo Lead
        </button>
      </div>

      {/* MOBILE VIEW */}
      <div className="grid gap-4 lg:hidden">
        {leads.map((lead) => (
          <div key={lead.id} className="card p-4 space-y-3">

            <div className="flex justify-between items-center">
              <h2 className="font-medium">{lead.name}</h2>
              <StatusBadge status={lead.status} type="lead" />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>{lead.email}</p>
              <p>{lead.phone}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="btn-secondary text-xs">Ver</button>
              <button className="btn-secondary text-xs">Editar</button>
            </div>

          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-sm">

          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} type="lead" />
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="btn-secondary text-xs">Ver</button>
                  <button className="btn-secondary text-xs">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}