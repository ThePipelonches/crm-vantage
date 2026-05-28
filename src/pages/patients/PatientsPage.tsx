import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {  
  UserPlus, Clock, CheckCircle, Stethoscope, ArrowLeft, RefreshCw, 
  Calendar, DollarSign 
import { UserPlus, Clock, CheckCircle, Stethoscope, AlertCircle, Search, Filter, Calendar, DollarSign, Users } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

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
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPsychId, setSelectedPsychId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      
      // Si es psicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo, solo ve los suyos (independientemente de la pestaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a)
      if (user?.role === 'psychologist') {
        query = query.eq('psychologist_id', user.id);
      }
      
      const { data: pData, error: pErr } = await query;
      
      if (pErr) throw pErr;
      setPatients(pData || []);
      
      // Cargar psicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logos solo si es admin
      if (user?.role === 'admin') {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'psychologist');
        
        if (!profErr && profiles) setPsychologists(profiles);
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
    // Sin setInterval para evitar parpadeos. Solo carga inicial y tras acciones.
  }, [user?.role]);

  const handleAssignPsychologist = async () => {
    if (!selectedPatientId || !selectedPsychId) {
      alert("Selecciona un psicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo");
      return;
    }
    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ psychologist_id: selectedPsychId, status: 'active' })
        .eq('id', selectedPatientId);

      if (error) throw error;

      alert('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Paciente asignado correctamente.');
      setSelectedPatientId(null);
      setSelectedPsychId('');
      fetchData(); // Recargar manualmente tras ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©xito
    } catch (err: any) {
      alert('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const pendingPatients = patients.filter(p => p.status === 'pending_assignment');
  const activePatients = patients.filter(p => p.status === 'active');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header con NavegaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">GestiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Pacientes</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Administra asignaciones y seguimientos clÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­nicos.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </Button>
        </div>
      </div>

      {loading && patients.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-zinc-500">
          <Clock className="w-8 h-8 animate-spin mr-2" /> Cargando...
        </div>
      ) : (
        <>
          {/* PestaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as de NavegaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-900/20 data-[state=active]:text-yellow-500">
                <Clock className="w-4 h-4 mr-2" /> Pendientes ({pendingPatients.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-500">
                <CheckCircle className="w-4 h-4 mr-2" /> Activos ({activePatients.length})
              </TabsTrigger>
            </TabsList>

            {/* Contenido Pendientes */}
            <TabsContent value="pending" className="mt-6">
              {user?.role === 'admin' && pendingPatients.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <UserPlus className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300">No hay pacientes pendientes</h3>
                  <p className="text-zinc-500">Los leads cerrados aparecerÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡n aquÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ para asignar psicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo.</p>
                </div>
              ) : pendingPatients.length === 0 && user?.role !== 'admin' ? (
                 <div className="text-center py-20 text-zinc-500">No tienes pacientes pendientes.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingPatients.map((patient) => (
                    <Card key={patient.id} className="bg-zinc-900 border-zinc-800 border-l-4 border-l-yellow-500 hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                            <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                          </div>
                          <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700">Pendiente</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                          <div className="flex justify-between"><span>Valor Plan:</span><span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span></div>
                          <div className="flex justify-between"><span>Pago Inicial:</span><span className="text-green-400 font-mono">${patient.cash_collected?.toLocaleString() || '0'}</span></div>
                        </div>
                        {user?.role === 'admin' && (
                          <Button onClick={() => { setSelectedPatientId(patient.id); setSelectedPsychId(''); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                            <Stethoscope className="w-4 h-4 mr-2" /> Asignar PsicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contenido Activos */}
            <TabsContent value="active" className="mt-6">
              {activePatients.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">No hay pacientes activos aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºn.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePatients.map((patient) => (
                    <Card key={patient.id} className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500 hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{patient.full_name}</CardTitle>
                            <CardDescription className="text-zinc-400">{patient.email}</CardDescription>
                          </div>
                          <Badge className="bg-green-900/50 text-green-400 border-green-700">Activo</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                         <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/10 p-2 rounded border border-green-900/30">
                            <Stethoscope className="w-4 h-4" />
                            <span>PsicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo Asignado</span>
                         </div>
                         <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1">
                            <div className="flex justify-between"><span>Valor Plan:</span><span className="text-white font-mono">${patient.sale_total?.toLocaleString() || '0'}</span></div>
                            {patient.installments_count > 0 && (
                              <div className="flex justify-between pt-1 border-t border-zinc-800"><span>Cuotas:</span><span className="text-zinc-300">{patient.installments_count} x ${patient.installment_value?.toLocaleString()}</span></div>
                            )}
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal de AsignaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n */}
      <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Asignar PsicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-400">Selecciona un profesional para este paciente.</p>
            <div className="space-y-2">
              <Label htmlFor="psych-select">Profesional</Label>
              <Select value={selectedPsychId} onValueChange={setSelectedPsychId}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {psychologists.length > 0 ? (
                    psychologists.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-zinc-500">No hay psicÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³logos registrados</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="border-zinc-700 text-zinc-300">Cancelar</Button>
            <Button onClick={handleAssignPsychologist} disabled={!selectedPsychId || isAssigning} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isAssigning ? 'Asignando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}