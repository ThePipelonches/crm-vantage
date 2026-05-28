import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Search, Filter, Calendar, DollarSign, Users, RefreshCw, Phone, Mail
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
  status: 'pending_assignment' | 'active' | 'inactive' | 'deserter';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPsychId, setSelectedPsychId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (user?.role === 'psychologist') {
        query = query.eq('psychologist_id', user.id);
      }
      
      const { data: pData, error: pErr } = await query;
      if (pErr) throw pErr;
      setPatients(pData || []);

      if (user?.role === 'admin') {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'psychologist');
        if (profiles) setPsychologists(profiles);
      }
    } catch (err: any) {
      console.error("Error cargando pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const handleAssignPsychologist = async () => {
    if (!selectedPatientId || !selectedPsychId) return alert("Selecciona un psicólogo");
    setIsAssigning(true);
    try {
      const { error } = await supabase.from('patients').update({ 
        psychologist_id: selectedPsychId, 
        status: 'active' 
      }).eq('id', selectedPatientId);
      if (error) throw error;
      alert('✅ Paciente asignado correctamente.');
      setIsDialogOpen(false);
      setSelectedPatientId(null);
      setSelectedPsychId('');
      fetchData();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const openAssignModal = (id: string) => {
    setSelectedPatientId(id);
    setSelectedPsychId('');
    setIsDialogOpen(true);
  };

  const filteredPatients = patients.filter(p => {
    if (filter === 'pending') return p.status === 'pending_assignment';
    if (filter === 'active') return ['active', 'inactive', 'deserter'].includes(p.status);
    return true;
  });

  const pendingList = filteredPatients.filter(p => p.status === 'pending_assignment');
  const activeList = filteredPatients.filter(p => ['active', 'inactive', 'deserter'].includes(p.status));

  const renderPatientCard = (patient: Patient) => (
    <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-white truncate">{patient.full_name}</span>
              {patient.status === 'pending_assignment' ? (
                <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700 text-xs shrink-0">
                  <Clock className="w-3 h-3 mr-1" /> Pendiente
                </Badge>
              ) : (
                <Badge className={`${
                  patient.status === 'active' ? 'bg-green-900/50 text-green-400 border-green-700' :
                  patient.status === 'inactive' ? 'bg-orange-900/50 text-orange-400 border-orange-700' :
                  'bg-red-900/50 text-red-400 border-red-700'
                } text-xs shrink-0`}>
                  {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3"/> {patient.email}</span>
              {patient.phone && <span className="flex items-center gap-1 truncate"><Phone className="w-3 h-3"/> {patient.phone}</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-zinc-500">Plan:</span><span className="text-white font-mono">${patient.sale_total?.toLocaleString()||0}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Inicial:</span><span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString()||0}</span></div>
        </div>

        {patient.status === 'pending_assignment' ? (
          <Button onClick={() => openAssignModal(patient.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm">
            <Stethoscope className="w-4 h-4 mr-2" /> Asignar Psicólogo
          </Button>
        ) : (
          <Button onClick={() => window.location.href = `/clinical-record/${patient.id}`} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9 text-sm">
            Ver Historia Clínica
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-white" /> Gestión de Pacientes
          </h1>
          <p className="text-zinc-400 mt-1">Administra asignaciones y seguimientos clínicos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-zinc-700 text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm rounded-t-md transition-colors ${filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Todos</button>
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 text-sm rounded-t-md transition-colors ${filter === 'pending' ? 'bg-yellow-900/20 text-yellow-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Pendientes ({patients.filter(p=>p.status==='pending_assignment').length})</button>
        <button onClick={() => setFilter('active')} className={`px-4 py-2 text-sm rounded-t-md transition-colors ${filter === 'active' ? 'bg-green-900/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}>En Seguimiento</button>
      </div>

      {loading ? <div className="text-center py-10 text-zinc-500">Cargando...</div> : (
        <div className="space-y-8">
          {(filter === 'all' || filter === 'pending') && pendingList.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-yellow-500 mb-4 flex items-center gap-2"><Clock className="w-5 h-5"/> Pendientes de Asignación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pendingList.map(renderPatientCard)}</div>
            </section>
          )}
          {(filter === 'all' || filter === 'active') && activeList.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-green-500 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> En Seguimiento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{activeList.map(renderPatientCard)}</div>
            </section>
          )}
          {filteredPatients.length === 0 && <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">No hay pacientes en esta categoría.</div>}
        </div>
      )}

      {/* Modal Asignación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader><DialogTitle>Asignar Psicólogo</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Label>Profesional</Label>
            <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {psychologists.map(psych => (<SelectItem key={psych.id} value={psych.id}>{psych.full_name || psych.email}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">Cancelar</Button>
            <Button onClick={handleAssignPsychologist} disabled={!selectedPsychId || isAssigning} className="bg-blue-600 hover:bg-blue-700">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}