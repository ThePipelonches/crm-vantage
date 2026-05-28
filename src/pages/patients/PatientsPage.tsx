import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, 
  Search, Filter, Calendar, DollarSign, Users, RefreshCw, 
  FileText, Phone, Mail
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
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  
  // Estado para el modal de asignación
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
  }, [user?.role]);

  const handleAssignPsychologist = async () => {
    if (!selectedPatientId || !selectedPsychId) return;
    setIsAssigning(true);

    try {
      const { error: updateErr } = await supabase
        .from('patients')
        .update({ 
          psychologist_id: selectedPsychId, 
          status: 'active' 
        })
        .eq('id', selectedPatientId);

      if (updateErr) throw updateErr;

      alert('✅ Paciente asignado correctamente.');
      setSelectedPatientId(null);
      setSelectedPsychId('');
      fetchData();
    } catch (err: any) {
      alert('❌ Error al asignar: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (patientId: string, newStatus: string) => {
    try {
      await supabase.from('patients').update({ status: newStatus }).eq('id', patientId);
      fetchData();
    } catch (err) {
      alert("Error al cambiar estado");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_assignment': return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700"><Clock className="w-3 h-3 mr-1"/> Pendiente</Badge>;
      case 'active': return <Badge className="bg-green-900/50 text-green-400 border-green-700"><CheckCircle className="w-3 h-3 mr-1"/> Activo</Badge>;
      case 'inactive': return <Badge className="bg-orange-900/50 text-orange-400 border-orange-700"><AlertCircle className="w-3 h-3 mr-1"/> Inactivo</Badge>;
      case 'deserter': return <Badge className="bg-red-900/50 text-red-400 border-red-700"><Users className="w-3 h-3 mr-1"/> Desertor</Badge>;
      default: return <Badge>Variante</Badge>;
    }
  };

  const filteredPatients = patients.filter(p => {
    if (filter === 'pending') return p.status === 'pending_assignment';
    if (filter === 'active') return p.status !== 'pending_assignment';
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header con Filtros y Refresco */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-white" />
            Gestión de Pacientes
          </h1>
          <p className="text-zinc-400 mt-2">Administra asignaciones y seguimientos clínicos.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-md transition-all ${filter === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>Todos</button>
            <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 text-sm rounded-md transition-all ${filter === 'pending' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>Pendientes</button>
            <button onClick={() => setFilter('active')} className={`px-3 py-1.5 text-sm rounded-md transition-all ${filter === 'active' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>En Seguimiento</button>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-zinc-500">Cargando...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No hay pacientes</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                      {getStatusBadge(patient.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 flex-1">
                {/* Info Venta Resumida */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Valor Plan:</span>
                    <span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Pago Inicial:</span>
                    <span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                {/* Acciones para Admin en Pendientes */}
                {user?.role === 'admin' && patient.status === 'pending_assignment' && (
                  <Button 
                    onClick={() => { setSelectedPatientId(patient.id); setSelectedPsychId(''); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Asignar Psicólogo
                  </Button>
                )}

                {/* Acciones para Pacientes en Seguimiento */}
                {(patient.status === 'active' || patient.status === 'inactive' || patient.status === 'deserter') && (
                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                     <Button 
                      variant="outline" 
                      className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs h-9"
                      onClick={() => navigate(`/patients/${patient.id}/clinical`)}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      Ver Historia
                    </Button>
                    
                    {user?.role === 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="border-zinc-700 text-zinc-400 hover:text-white h-9 w-9">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                          <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'active')} className="hover:bg-zinc-800 focus:text-green-400">Activo</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'inactive')} className="hover:bg-zinc-800 focus:text-orange-400">Inactivo</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'deserter')} className="hover:bg-zinc-800 focus:text-red-400">Desertor</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-zinc-600 flex items-center gap-1 pt-2">
                  <Calendar className="w-3 h-3" />
                  Creado: {new Date(patient.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Asignación */}
      <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-white" />
              Asignar Psicólogo
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-400">Selecciona un profesional para este paciente.</p>
            
            <div className="space-y-2">
              <Label htmlFor="psych-select">Profesional</Label>
              <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                <SelectTrigger id="psych-select" className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar psicólogo..." />
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
            <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="border-zinc-700 text-zinc-300">Cancelar</Button>
            <Button onClick={handleAssignPsychologist} disabled={!selectedPsychId || isAssigning} className="bg-white text-black hover:bg-zinc-200">
              {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}