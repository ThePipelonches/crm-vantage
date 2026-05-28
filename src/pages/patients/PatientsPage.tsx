import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Search, Filter, Calendar, DollarSign, Users, MoreHorizontal, Activity
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

  const handleStatusChange = async (patientId: string, newStatus: Patient['status']) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', patientId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const pendingPatients = patients.filter(p => p.status === 'pending_assignment');
  const activePatients = patients.filter(p => ['active', 'inactive', 'deserter'].includes(p.status));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-900/20 text-emerald-400 border-emerald-800';
      case 'inactive': return 'bg-orange-900/20 text-orange-400 border-orange-800';
      case 'deserter': return 'bg-red-900/20 text-red-400 border-red-800';
      default: return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'deserter': return 'Desertor';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-white" />
            Gestión de Pacientes
          </h1>
          <p className="text-zinc-400 mt-2">
            Administra la asignación y el estado clínico de tus pacientes.
          </p>
        </div>
        
        {user?.role === 'admin' && (
          <div className="flex gap-3">
             <Badge className={`${pendingPatients.length > 0 ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-zinc-800'} text-black border-none px-4 py-2 font-bold`}>
                <Clock className="w-4 h-4 mr-2" />
                Pendientes: {pendingPatients.length}
             </Badge>
             <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 px-4 py-2">
                <Activity className="w-4 h-4 mr-2" />
                Activos/Gestión: {activePatients.length}
             </Badge>
          </div>
        )}
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
                <Clock className="w-5 h-5 text-yellow-500" />
                Pendientes de Asignación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPatients.map((patient) => (
                  <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition-all shadow-lg shadow-yellow-900/10">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                          <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                        </div>
                        <Badge className="bg-yellow-500 text-black hover:bg-yellow-600 border-none font-medium">
                          Nuevo
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-black/30 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Valor Plan:</span>
                          <span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Pago Inicial:</span>
                          <span className="text-emerald-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      
                      {user?.role === 'admin' && (
                        <Button 
                          onClick={() => { setSelectedPatientId(patient.id); setSelectedPsychId(''); }}
                          className="w-full bg-white text-black hover:bg-zinc-200 font-medium"
                        >
                          <Stethoscope className="w-4 h-4 mr-2" />
                          Asignar Psicólogo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: PACIENTES ACTIVOS / EN GESTIÓN */}
          {activePatients.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-zinc-800">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Pacientes en Seguimiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePatients.map((patient) => (
                  <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                          <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                        </div>
                        
                        {/* Dropdown de Estado */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-zinc-800">
                              <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'active')} className="hover:bg-zinc-800 focus:text-emerald-400">
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Activo
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
                      <div className="mt-2">
                         <Badge className={`${getStatusColor(patient.status)} border font-medium`}>
                            {getStatusLabel(patient.status)}
                         </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-black/30 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Psicólogo:</span>
                          <span className="text-zinc-200 truncate max-w-[150px]">{patient.psychologist_id ? 'Asignado' : 'Sin asignar'}</span>
                        </div>
                      </div>
                      {patient.status === 'active' && (
                         <div className="pt-2">
                            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" size="sm">
                                Ver Historia Clínica
                            </Button>
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
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300">No hay pacientes</h3>
                <p className="text-zinc-500">Los pacientes aparecerán aquí al cerrar ventas en el pipeline.</p>
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
            <p className="text-sm text-zinc-400">
              Selecciona un profesional para este paciente.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="psych-select" className="text-zinc-300">Profesional</Label>
              <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                <SelectTrigger id="psych-select" className="bg-zinc-900 border-zinc-800 text-white focus:ring-zinc-700">
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
            <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignPsychologist} 
              disabled={!selectedPsychId || isAssigning}
              className="bg-white text-black hover:bg-zinc-200 font-medium"
            >
              {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}