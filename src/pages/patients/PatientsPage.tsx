import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Search, Filter, Calendar, DollarSign, Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from '../../components/ui/label';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'pending_assignment' | 'active' | 'completed';
  psychologist_id?: string;
  sale_total?: number;
  cash_collected?: number;
  installments_count?: number;
  installment_value?: number;
  notes?: string;
  created_at: string;
}

interface Psychologist {
  id: string;
  full_name: string;
  email: string;
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPsychId, setSelectedPsychId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (user?.role === 'psychologist') {
        query = query.eq('psychologist_id', user.id);
      }
      const { data: pData, error: pErr } = await query;
      if (pErr) console.error("Error pacientes:", pErr);
      else setPatients(pData || []);

      if (user?.role === 'admin') {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'psychologist');
        if (!profErr && profiles) setPsychologists(profiles);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.role]);

  const handleAssign = async () => {
    if (!selectedPatientId || !selectedPsychId) return;
    setIsAssigning(true);
    try {
      const { error } = await supabase.from('patients').update({ 
        psychologist_id: selectedPsychId, status: 'active' 
      }).eq('id', selectedPatientId);
      if (error) throw error;
      alert('✅ Paciente asignado correctamente.');
      setSelectedPatientId(null);
      setSelectedPsychId('');
      fetchData();
    } catch (err: any) { alert('❌ Error: ' + err.message); }
    finally { setIsAssigning(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-blue-500" /> Gestión de Pacientes
          </h1>
          <p className="text-zinc-400 mt-2">
            {user?.role === 'admin' ? "Asigna psicólogos a nuevos pacientes." : "Tus pacientes asignados."}
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            <Badge className="bg-yellow-900/20 text-yellow-500 border-yellow-800 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" /> Pendientes: {patients.filter(p => p.status === 'pending_assignment').length}
            </Badge>
            <Badge className="bg-green-900/20 text-green-500 border-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" /> Activos: {patients.filter(p => p.status === 'active').length}
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-zinc-500">
          <Clock className="w-8 h-8 animate-spin mr-2" /> Cargando...
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No hay pacientes</h3>
          <p className="text-zinc-500">Los pacientes aparecerán aquí al cerrar ventas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <Card key={patient.id} className={`bg-zinc-900 border-zinc-800 transition-all hover:shadow-lg ${patient.status === 'pending_assignment' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                    <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                  </div>
                  {patient.status === 'pending_assignment' ? (
                    <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
                  ) : (
                    <Badge className="bg-green-900/50 text-green-400 border-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Activo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-zinc-400">Valor Plan:</span><span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Pago Inicial:</span><span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span></div>
                  {patient.installments_count && patient.installments_count > 0 && (
                    <div className="flex justify-between pt-1 border-t border-zinc-800"><span className="text-zinc-400">Cuotas:</span><span className="text-zinc-300">{patient.installments_count} x ${patient.installment_value?.toLocaleString()}</span></div>
                  )}
                </div>
                {patient.notes && <div className="text-xs text-zinc-500 italic">"{patient.notes}"</div>}
                
                {user?.role === 'admin' && patient.status === 'pending_assignment' && (
                  <Button onClick={() => { setSelectedPatientId(patient.id); setSelectedPsychId(''); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    <Stethoscope className="w-4 h-4 mr-2" /> Asignar Psicólogo
                  </Button>
                )}
                {patient.status === 'active' && (
                  <div className="pt-2 flex items-center gap-2 text-sm text-green-400 bg-green-900/10 p-2 rounded border border-green-900/30">
                    <Stethoscope className="w-4 h-4" /> Psicólogo Asignado
                  </div>
                )}
                <div className="text-xs text-zinc-600 flex items-center gap-1 pt-2 border-t border-zinc-800">
                  <Calendar className="w-3 h-3" /> Creado: {new Date(patient.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-500" /> Asignar Psicólogo</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-400">Selecciona un profesional para este paciente.</p>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {psychologists.length > 0 ? psychologists.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                  )) : <div className="p-2 text-xs text-zinc-500">No hay psicólogos</div>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="border-zinc-700 text-zinc-300">Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedPsychId || isAssigning} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isAssigning ? 'Asignando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}