import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Users, Plus, Stethoscope, Calendar, DollarSign, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  psychologist_id?: string;
  sale_total?: number;
  cash_collected?: number;
  created_at: string;
}

export default function ClientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    setLoading(true);
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

    // Si es psicólogo, solo ve SUS pacientes asignados
    if (user?.role === 'psychologist') {
      query = query.eq('psychologist_id', user.id);
    }
    // Si es admin, ve todos (incluidos los pendientes de asignación)

    const { data, error } = await query;
    if (error) {
      console.error("Error cargando pacientes:", error);
    } else if (data) {
      setPatients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
    const interval = setInterval(loadPatients, 5000);
    return () => clearInterval(interval);
  }, [user?.role]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Datos de Pacientes</h1>
          <p className="text-zinc-400 text-sm">Gestión clínica y seguimiento de pacientes activos.</p>
        </div>
        {/* Botón dummy por ahora, la creación es automática desde Ventas */}
        <Button className="bg-white text-black hover:bg-zinc-200" disabled title="Los pacientes se crean automáticamente al cerrar una venta">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Paciente (Auto)
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-zinc-500">Cargando pacientes...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No hay pacientes</h3>
          <p className="text-zinc-500">
            {user?.role === 'psychologist' 
              ? "Aún no te han asignado pacientes. El administrador debe asignarte uno." 
              : "Cierra una venta en el Pipeline para crear un paciente automáticamente."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Card key={patient.id} className="bg-zinc-900 border-zinc-800 text-white hover:border-zinc-600 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                      {patient.full_name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                      <CardDescription className="text-zinc-400 flex gap-3 text-xs mt-1">
                        {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {patient.email}</span>}
                        {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {patient.phone}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className={
                    patient.status === 'active' ? 'bg-green-900 text-green-200 border-green-800' : 'bg-yellow-900 text-yellow-200 border-yellow-800'
                  }>
                    {patient.status === 'active' ? 'Activo' : 'Pendiente Asignación'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {/* Info Venta */}
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Valor Plan</p>
                    <p className="font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-green-400 mt-1">Pagado: ${patient.cash_collected?.toLocaleString() || '0'}</p>
                  </div>

                  {/* Estado Psicólogo */}
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col justify-center">
                     {patient.status === 'active' ? (
                       <div className="flex items-center gap-2 text-green-400 text-sm">
                         <Stethoscope className="w-4 h-4" /> Psicólogo Asignado
                       </div>
                     ) : (
                       <div className="text-yellow-400 text-sm">Esperando asignación de Admin</div>
                     )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2">
                    {patient.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white">
                          <Calendar className="w-4 h-4 mr-2" /> Agendar
                        </Button>
                        <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                          Ver Historia
                        </Button>
                      </>
                    )}
                    {patient.status !== 'active' && user?.role === 'admin' && (
                       <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                         <Link to="/patients">Asignar Psicólogo</Link>
                       </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}