import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { UserPlus, CheckCircle, Clock, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  status: string;
  psychologist_id?: string;
  created_at: string;
  notes?: string;
}

interface Psychologist {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState<string>('');
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (user?.role === 'psychologist') {
      query = query.eq('psychologist_id', user.id);
    }
    const { data: pData, error: pErr } = await query;
    if (!pErr && pData) setPatients(pData);

    if (user?.role === 'admin') {
      const { data: uData, error: uErr } = await supabase.auth.admin.listUsers();
      if (!uErr && uData?.users) {
        // Filtrado manual con verificación de tipos
        const psychs = uData.users.filter((u: any) => 
          (u.role === 'psychologist' || u.user_metadata?.role === 'psychologist') && u.email
        ).map((u: any) => ({
          id: u.id,
          email: u.email,
          raw_user_meta_data: u.user_metadata || {}
        }));
        setPsychologists(psychs);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async () => {
    if (!assigningPatientId || !selectedPsychologist) return;
    
    const { error } = await supabase.from('patients').update({
      psychologist_id: selectedPsychologist,
      status: 'active'
    }).eq('id', assigningPatientId);

    if (!error) {
      alert('Paciente asignado correctamente.');
      setAssigningPatientId(null);
      setSelectedPsychologist('');
      loadData();
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-900/20 rounded-full border border-blue-800">
          <UserPlus className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Pacientes Nuevos</h1>
          <p className="text-zinc-400">Gestiona la asignaciÃ³n de psicÃ³logos.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Cargando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white">{patient.full_name}</CardTitle>
                  {patient.status === 'pending_assignment' ? 
                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">Pendiente</span> : 
                    <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">Asignado</span>
                  }
                </div>
                <p className="text-sm text-zinc-400">{patient.email}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.notes && (
                  <div className="text-xs text-zinc-500 bg-zinc-950 p-2 rounded border border-zinc-800">
                    <p className="font-semibold text-zinc-300 mb-1">Notas:</p>
                    {patient.notes}
                  </div>
                )}

                {user?.role === 'admin' && patient.status === 'pending_assignment' && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <label className="text-xs text-zinc-400">Asignar PsicÃ³logo:</label>
                    <Select value={assigningPatientId === patient.id ? selectedPsychologist : ''} onValueChange={(val) => { setSelectedPsychologist(val); setAssigningPatientId(patient.id); }}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {psychologists.map(psych => (
                          <SelectItem key={psych.id} value={psych.id}>
                            {psych.user_metadata?.full_name || psych.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {assigningPatientId === patient.id && (
                      <Button onClick={handleAssign} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm">
                        Confirmar
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {patients.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
              No hay pacientes pendientes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}