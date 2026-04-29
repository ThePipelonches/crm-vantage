import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rol?: string;
  last_rol_update?: string;
}

const ClinicalPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando pacientes:', error);
      return;
    }

    setPatients(data || []);
  };

  const updateROL = async (id: string, rol: string) => {
    await supabase
      .from('leads')
      .update({
        rol,
        last_rol_update: new Date().toISOString(),
      })
      .eq('id', id);

    fetchPatients();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Panel Clínico
      </h1>

      {patients.length === 0 && (
        <p className="text-muted-foreground">
          No hay pacientes aún
        </p>
      )}

      <div className="space-y-4">
        {patients.map((p) => {
          const isCritical = p.rol === 'red';

          return (
            <div
              key={p.id}
              className={`card p-4 ${
                isCritical ? 'border-red-500' : ''
              }`}
            >
              <p className="font-semibold text-lg">{p.name}</p>
              <p className="text-muted-foreground text-sm">
                {p.email}
              </p>
              <p className="text-muted-foreground text-sm">
                {p.phone}
              </p>

              {/* ROL */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`badge ${
                    p.rol === 'red'
                      ? 'badge-error'
                      : p.rol === 'yellow'
                      ? 'badge-warning'
                      : p.rol === 'green'
                      ? 'badge-success'
                      : 'badge-default'
                  }`}
                >
                  {p.rol ? p.rol.toUpperCase() : 'SIN ROL'}
                </span>

                {p.last_rol_update && (
                  <span className="text-xs text-muted-foreground">
                    Última revisión:{' '}
                    {new Date(p.last_rol_update).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* BOTONES */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => updateROL(p.id, 'green')}
                  className="btn-secondary"
                >
                  🟢 Verde
                </button>

                <button
                  onClick={() => updateROL(p.id, 'yellow')}
                  className="btn-secondary"
                >
                  🟡 Amarillo
                </button>

                <button
                  onClick={() => updateROL(p.id, 'red')}
                  className="btn-secondary"
                >
                  🔴 Rojo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicalPage;