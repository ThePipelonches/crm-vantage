import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, AlertTriangle, Save, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para ROL
  const [rolRisk, setRolRisk] = useState('green');
  const [justification, setJustification] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);
  const [rolHistory, setRolHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
    fetchRolHistory();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (error) throw error;
      setPatient(data);
    } catch (err) {
      console.error("Error cargando paciente:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolHistory = async () => {
    if (!patientId) return;
    const { data } = await supabase.from('patient_rol_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (data) setRolHistory(data);
  };

  const handleSaveRol = async () => {
    if (!patientId) return;
    setSavingRol(true);
    
    const { error } = await supabase.from('patient_rol_logs').insert({
      patient_id: patientId,
      risk_level: rolRisk,
      justification: rolRisk === 'green' ? '' : justification,
      action_plan: rolRisk === 'green' ? '' : actionPlan
    });

    if (error) {
      alert("Error al guardar ROL: " + error.message);
    } else {
      alert("✅ ROL guardado correctamente");
      setJustification('');
      setActionPlan('');
      setRolRisk('green');
      fetchRolHistory();
    }
    setSavingRol(false);
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-900 text-green-400 border-green-800';
      case 'inactive': return 'bg-orange-900 text-orange-400 border-orange-800';
      case 'deserter': return 'bg-red-900 text-red-400 border-red-800';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Historia Clínica: {patient.full_name}
          </h1>
          <div className="flex gap-3 mt-1 text-sm text-zinc-400">
             <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {patient.email}</span>
             <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {patient.phone || 'N/A'}</span>
             <Badge className={`${getStatusColor(patient.status)} border text-xs`}>
                {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}
             </Badge>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('data')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'data' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Datos Clínicos
          {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('rol')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'rol' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          ROL Semanal
          {activeTab === 'rol' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('eval')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'eval' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Evaluaciones
          {activeTab === 'eval' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
      </div>

      {/* Contenido Dinámico según Tab */}
      <div className="mt-6 min-h-[500px]">
        
        {/* --- TAB: DATOS CLÍNICOS --- */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500"/> Información Financiera & Notas</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-4">
                   <div>
                    <p className="text-xs text-zinc-500 uppercase">Valor Plan</p>
                    <p className="text-lg font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase">Pago Inicial</p>
                    <p className="text-lg font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
                  </div>
                  {patient.installments_count > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase">Cuotas Restantes</p>
                      <p className="text-white">{patient.installments_count} x ${patient.installment_value?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase mb-2">Notas Generales</p>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{patient.notes || "Sin notas registradas."}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- TAB: ROL SEMANAL --- */}
        {activeTab === 'rol' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario ROL */}
              <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 h-fit">
                <CardHeader><CardTitle className="text-white text-base">Registrar ROL Semanal</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Nivel de Riesgo</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setRolRisk('green')} className={`p-2 rounded text-sm font-medium border ${rolRisk === 'green' ? 'bg-green-900 border-green-500 text-white' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}>Verde</button>
                      <button onClick={() => setRolRisk('yellow')} className={`p-2 rounded text-sm font-medium border ${rolRisk === 'yellow' ? 'bg-yellow-900 border-yellow-500 text-white' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}>Amarillo</button>
                      <button onClick={() => setRolRisk('red')} className={`p-2 rounded text-sm font-medium border ${rolRisk === 'red' ? 'bg-red-900 border-red-500 text-white' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}>Rojo</button>
                    </div>
                  </div>
                  
                  {(rolRisk === 'yellow' || rolRisk === 'red') && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Justificación del Riesgo</Label>
                        <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white" placeholder="¿Por qué existe este riesgo?" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Plan de Acción</Label>
                        <Textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white" placeholder="Acciones concretas para esta semana" />
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                    {savingRol ? 'Guardando...' : 'Guardar Registro'}
                  </Button>
                </CardContent>
              </Card>

              {/* Historial ROL */}
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-base">Historial de Registros</CardTitle></CardHeader>
                <CardContent>
                  {rolHistory.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No hay registros ROL anteriores.</p>
                  ) : (
                    <div className="space-y-3">
                      {rolHistory.map((log) => (
                        <div key={log.id} className="p-3 rounded border border-zinc-800 bg-zinc-950/50 flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={
                                log.risk_level === 'green' ? 'bg-green-900 text-green-400' : 
                                log.risk_level === 'yellow' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'
                              }>{log.risk_level === 'green' ? 'Riesgo Bajo' : log.risk_level === 'yellow' ? 'Riesgo Medio' : 'Riesgo Alto'}</Badge>
                              <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                            {log.justification && <p className="text-sm text-zinc-300 mt-1"><span className="text-zinc-500 font-bold">Justificación:</span> {log.justification}</p>}
                            {log.action_plan && <p className="text-sm text-zinc-300 mt-1"><span className="text-zinc-500 font-bold">Plan:</span> {log.action_plan}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* --- TAB: EVALUACIONES --- */}
        {activeTab === 'eval' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <PsychometricEval patientId={patientId} />
          </div>
        )}
      </div>
    </div>
  );
}