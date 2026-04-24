import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando leads:', error);
    } else {
      setLeads(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="p-6 text-white">Cargando leads...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">Leads</h1>

      {leads.length === 0 ? (
        <p className="text-muted-foreground">No hay leads aún</p>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="card p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </div>

              <StatusBadge status={lead.status} type="lead" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}