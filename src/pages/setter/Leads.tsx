import { useEffect, useState } from 'react';
import { getLeads, updateLeadStatus } from '@/services/leads';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////
  // LOAD LEADS FROM SUPABASE
  //////////////////////////////////////////////////

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setLoading(false);
  };

  //////////////////////////////////////////////////
  // MARK AS WON (SIMULACIÓN)
  //////////////////////////////////////////////////

  const handleWin = async (id: string) => {
    await updateLeadStatus(id, 'won');
    loadLeads(); // refresh
  };

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <div className="p-6 space-y-4">

      <h1 className="text-xl font-semibold">
        Leads (Supabase)
      </h1>

      {loading && (
        <p className="text-muted-foreground">Cargando...</p>
      )}

      {!loading && leads.length === 0 && (
        <p className="text-muted-foreground">
          No hay leads aún
        </p>
      )}

      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 border border-white/10 rounded-lg"
          >
            <p className="font-medium">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.phone}</p>
            <p className="text-xs">{lead.status}</p>

            <button
              onClick={() => handleWin(lead.id)}
              className="mt-2 px-3 py-1 bg-green-500 text-black rounded"
            >
              GANADO
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}