import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Calendar, MoreVertical, RefreshCw, Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  
  // Estados para modales y acciones
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPsychId, setSelectedPsychId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

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
      alert("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const handleAssignPsychologist = async () => {
    if (!selectedPatientId || !selectedPsychId) return;
    setIsAssigning(true);

    try {
      const { error } = await supabase.from('patients').update({ 
        psychologist_id: selectedPsychId, 
        status: 'active' 
      }).eq('id', selectedPatientId);

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
    setStatusUpdating(patientId);
    try {
      const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', patientId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Error actualizando estado: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  };

  // Filtrar pacientes según la pestaña activa
  const filteredPatients = patients.filter(p => {
    if (activeTab === 'pending') return p.status === 'pending_assignment';
    return p.status !== 'pending_assignment'; // Activos, Inactivos, Desertores
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-900/20 text-green-400 border-green-800';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header con Tabs y Botón Refrescar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-white" />
            Gestión de Pacientes
          </h1>
          <p className="text-zinc-400 mt-2">Administra asignaciones y seguimientos clínicos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs de Filtro */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'pending' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pendientes ({patients.filter(p => p.status === 'pending_assignment').length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'active' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              En Seguimiento ({patients.filter(p => p.status !== 'pending_assignment').length})
            </button>
          </div>

          {/* Botón Refrescar Manual */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchData} 
            disabled={loading}
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && patients.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-zinc-500">
          <Clock className="w-8 h-8 animate-spin mr-2" /> Cargando...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">
            No hay pacientes {activeTab === 'pending' ? 'pendientes' : 'en seguimiento'}
          </h3>
          <p className="text-zinc-500 text-sm mt-1">
            {activeTab === 'pending' 
              ? '¡Genial! Todos los pacientes han sido asignados.' 
              : 'Los pacientes aparecerán aquí una vez asignados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all flex flex-col">
              <CardHeader className="pb-3 relative">
                {/* Badge de Estado Integrado */}
                <div className="absolute top-4 right-4">
                  <Badge className={`${getStatusColor(patient.status)} border text-xs font-medium`}>
                    {getStatusLabel(patient.status)}
                  </Badge>
                </div>

                <div className="pr-20">
                  <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                  <CardDescription className="text-zinc-400 truncate">{patient.email}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Info Venta */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>Valor Plan:</span>
                    <span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Pago Inicial:</span>
                    <span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span>
                  </div>
                  {patient.installments_count && patient.installments_count > 0 && (
                     <div className="flex justify-between text-zinc-400 pt-1.5 border-t border-zinc-800">
                        <span>Cuotas:</span>
                        <span className="text-zinc-300">{patient.installments_count} x ${patient.installment_value?.toLocaleString()}</span>
                     </div>
                  )}
                </div>

                {patient.notes && (
                  <div className="text-xs text-zinc-500 italic line-clamp-2 bg-zinc-900/50 p-2 rounded">
                    "{patient.notes}"
                  </div>
                )}

                {/* ACCIONES: Asignar Psicólogo (Solo Pendientes) */}
                {patient.status === 'pending_assignment' && user?.role === 'admin' && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setSelectedPsychId('');
                      }}
                      className="w-full bg-white text-black hover:bg-zinc-200 font-medium"
                      size="sm"
                    >
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Asignar Psicólogo
                    </Button>
                  </div>
                )}

                {/* ACCIONES: Menú Tres Puntos (Solo Activos/Seguimiento) */}
                {patient.status !== 'pending_assignment' && (
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-40">
                        <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase">Cambiar Estado</div>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(patient.id, 'active')}
                          className="text-green-400 focus:bg-zinc-800 focus:text-green-400 cursor-pointer"
                          disabled={statusUpdating === patient.id}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" /> Activo
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(patient.id, 'inactive')}
                          className="text-orange-400 focus:bg-zinc-800 focus:text-orange-400 cursor-pointer"
                          disabled={statusUpdating === patient.id}
                        >
                          <Clock className="w-3 h-3 mr-2" /> Inactivo
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(patient.id, 'deserter')}
                          className="text-red-400 focus:bg-zinc-800 focus:text-red-400 cursor-pointer"
                          disabled={statusUpdating === patient.id}
                        >
                          <AlertCircle className="w-3 h-3 mr-2" /> Desertor
                        </DropdownMenuItem>
                        
                        {user?.role === 'admin' && (
                          <>
                            <div className="h-px bg-zinc-800 my-1"></div>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(patient.id, 'pending_assignment')}
                              className="text-zinc-400 focus:bg-zinc-800 focus:text-zinc-400 cursor-pointer text-xs"
                            >
                              ↩ Volver a Pendientes
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                {/* Info Psicólogo Asignado */}
                {patient.psychologist_id && (
                   <div className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                     <Activity className="w-3 h-3" />
                     ID Psicólogo: {patient.psychologist_id.slice(0,8)}...
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Asignación */}
      <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
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
                <SelectTrigger id="psych-select" className="bg-zinc-950 border-zinc-800 text-white h-10">
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
              className="bg-white text-black hover:bg-zinc-200"
            >
              {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}