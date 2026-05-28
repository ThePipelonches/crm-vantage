import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Calendar, DollarSign, Users, MoreVertical, Activity
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

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
      if (pErr) throw pErr;
      setPatients(pData || []);

      if (user?.role === 'admin') {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'psychologist');
        if (!profErr && profiles) setPsychologists(profiles);
      }
    } catch (err: any) {
      console.error("Error cargando pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling cada 10s
    return () => clearInterval(interval);
  }, [user?.role]);

  const handleAssignPsychologist = async () => {
    if (!selectedPatientId || !selectedPsychId) return;
    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ psychologist_id: selectedPsychId, status: 'active' })
        .eq('id', selectedPatientId);
      if (error) throw error;
      alert('✅ Paciente asignado correctamente.');
      setSelectedPatientId(null);
      setSelectedPsychId('');
      fetchData();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (patientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', patientId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const pendingPatients = patients.filter(p => p.status === 'pending_assignment');
  const activePatients = patients.filter(p => p.status !== 'pending_assignment');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Pacientes</h1>
          <p className="text-zinc-400 mt-1">Administra asignaciones y seguimientos clínicos.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-950 text-yellow-500 border-yellow-900 px-4 py-2">
            <Clock className="w-4 h-4 mr-2" /> Pendientes: {pendingPatients.length}
          </Badge>
          <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 px-4 py-2">
            <Users className="w-4 h-4 mr-2" /> En Seguimiento: {activePatients.length}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-zinc-500">
          <Clock className="w-8 h-8 animate-spin mr-2" /> Cargando...
        </div>
      ) : (
        <>
          {/* SECCIÓN 1: PENDIENTES DE ASIGNACIÓN */}
          {pendingPatients.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Pendientes de Asignación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPatients.map((patient) => (
                  <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition-colors border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                          <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                        </div>
                        <Badge className="bg-yellow-950 text-yellow-500 border-yellow-900">
                          <Clock className="w-3 h-3 mr-1" /> Pendiente
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-black/30 p-3 rounded border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Valor Plan:</span>
                          <span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Pago Inicial:</span>
                          <span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => { setSelectedPatientId(patient.id); setSelectedPsychId(''); }}
                        className="w-full bg-white text-black hover:bg-zinc-200 font-medium"
                      >
                        <Stethoscope className="w-4 h-4 mr-2" /> Asignar Psicólogo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: PACIENTES EN SEGUIMIENTO (ACTIVOS/INACTIVOS/DESERTORES) */}
          {activePatients.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-zinc-800">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-zinc-400" />
                Pacientes en Seguimiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePatients.map((patient) => (
                  <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                          <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                        </div>
                        {/* Dropdown de Estados */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-zinc-800">
                              <MoreVertical className="w-4 h-4 text-zinc-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'active')} className="hover:bg-zinc-800 focus:text-green-400">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Activo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'inactive')} className="hover:bg-zinc-800 focus:text-orange-400">
                              <Clock className="w-4 h-4 mr-2 text-orange-500" /> Inactivo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'deserter')} className="hover:bg-zinc-800 focus:text-red-400">
                              <AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Desertor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Badge de Estado Actual */}
                      <div className="mt-2">
                        {patient.status === 'active' && (
                          <Badge className="bg-green-950 text-green-500 border-green-900"><CheckCircle className="w-3 h-3 mr-1"/> Activo</Badge>
                        )}
                        {patient.status === 'inactive' && (
                          <Badge className="bg-orange-950 text-orange-500 border-orange-900"><Clock className="w-3 h-3 mr-1"/> Inactivo</Badge>
                        )}
                        {patient.status === 'deserter' && (
                          <Badge className="bg-red-950 text-red-500 border-red-900"><AlertCircle className="w-3 h-3 mr-1"/> Desertor</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="bg-black/30 p-3 rounded border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Valor Plan:</span>
                          <span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      {patient.psychologist_id && (
                         <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950 p-2 rounded border border-zinc-800">
                           <Stethoscope className="w-3 h-3" />
                           <span>Psicólogo asignado</span>
                         </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {patients.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
              <UserPlus className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300">No hay pacientes</h3>
              <p className="text-zinc-500">Los pacientes aparecerán aquí cuando un lead sea cerrado.</p>
            </div>
          )}
        </>
      )}

      {/* Modal de Asignación */}
      <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-white" />
              Asignar Psicólogo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-400">Selecciona un profesional para este paciente.</p>
            <div className="space-y-2">
              <Label htmlFor="psych-select" className="text-zinc-300">Profesional</Label>
              <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                <SelectTrigger id="psych-select" className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {psychologists.length > 0 ? (
                    psychologists.map((psych) => (
                      <SelectItem key={psych.id} value={psych.id}>
                        {psych.full_name || psych.email}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-zinc-500">No hay psicólogos registrados</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={handleAssignPsychologist} disabled={!selectedPsychId || isAssigning} className="bg-white text-black hover:bg-zinc-200">
              {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}