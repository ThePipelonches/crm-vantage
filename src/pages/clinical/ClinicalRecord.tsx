import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, AlertTriangle, Save, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados ROL
  const [rolRisk, setRolRisk] = useState('low');
  const [rolComment, setRolComment] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // Estados Evaluación (Puntajes directos)
  const [evalType, setEvalType] = useState('pcq');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evalNotes, setEvalNotes] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
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

  const handleSaveRol = async () => {
    if (!user) return alert("Debes estar logueado");
    setSavingRol(true);
    try {
      const { error } = await supabase.from('patient_rol_logs').insert([{
        patient_id: patientId,
        created_by: user.id,
        risk_level: rolRisk,
        comments: rolComment,
        action_plan: rolPlan
      }]);
      if (error) throw error;
      alert("✅ ROL guardado correctamente");
      setRolComment('');
      setRolPlan('');
      setRolRisk('low');
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  const handleSaveEval = async () => {
    if (!user) return alert("Debes estar logueado");
    setSavingEval(true);
    try {
      const payload: any = {
        patient_id: patientId,
        created_by: user.id,
        eval_type: evalType,
        notes: evalNotes,
        ...scores // Desglosa los puntajes
      };
      
      const { error } = await supabase.from('psychometric_evaluations').insert([payload]);
      if (error) throw error;
      alert("✅ Evaluación guardada correctamente");
      setScores({});
      setEvalNotes('');
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setSavingEval(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" /> {patient.full_name}
          </h1>
          <p className="text-zinc-400 text-sm">{patient.email} • {patient.phone || 'Sin teléfono'}</p>
        </div>
        <div className="ml-auto">
           <Badge className={patient.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}>
             {patient.status === 'active' ? 'Activo' : 'Pendiente'}
           </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <Button variant={activeTab === 'data' ? 'default' : 'ghost'} onClick={() => setActiveTab('data')} className={activeTab === 'data' ? 'bg-white text-black' : 'text-zinc-400'}>Datos Clínicos</Button>
        <Button variant={activeTab === 'rol' ? 'default' : 'ghost'} onClick={() => setActiveTab('rol')} className={activeTab === 'rol' ? 'bg-white text-black' : 'text-zinc-400'}>ROL Semanal</Button>
        <Button variant={activeTab === 'eval' ? 'default' : 'ghost'} onClick={() => setActiveTab('eval')} className={activeTab === 'eval' ? 'bg-white text-black' : 'text-zinc-400'}>Evaluaciones</Button>
      </div>

      {/* Contenido Pestañas */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5"/> Información Financiera</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-zinc-300">
              <div className="flex justify-between"><span>Valor Plan:</span> <span className="font-mono text-white">${patient.sale_total}</span></div>
              <div className="flex justify-between"><span>Pago Inicial:</span> <span className="font-mono text-green-400">${patient.cash_collected}</span></div>
              {patient.installments_count > 0 && (
                <div className="flex justify-between"><span>Cuotas:</span> <span className="font-mono">{patient.installments_count} x ${patient.installment_value}</span></div>
              )}
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase mb-1">Notas Venta</p>
                <p className="text-sm italic">{patient.notes || "Sin notas"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'rol' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5"/> Registro ROL (Riesgo de Abandono)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nivel de Riesgo</Label>
                <Select value={rolRisk} onValueChange={setRolRisk}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="low">🟢 Bajo (Verde)</SelectItem>
                    <SelectItem value="medium">🟡 Medio (Amarillo)</SelectItem>
                    <SelectItem value="high">🔴 Alto (Rojo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(rolRisk === 'medium' || rolRisk === 'high') && (
                <div className="space-y-4 p-4 bg-zinc-950 rounded border border-zinc-800 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-yellow-500">Justificación del Riesgo</Label>
                    <Textarea 
                      value={rolComment} 
                      onChange={(e) => setRolComment(e.target.value)} 
                      placeholder="¿Por qué existe riesgo de abandono?"
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-400">Plan de Acción</Label>
                    <Textarea 
                      value={rolPlan} 
                      onChange={(e) => setRolPlan(e.target.value)} 
                      placeholder="Acciones concretas para esta semana..."
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingRol ? 'Guardando...' : '💾 Guardar Registro ROL'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'eval' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Plus className="w-5 h-5"/> Nueva Evaluación (Resultados)</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="w-48 space-y-2">
                  <Label className="text-zinc-300">Tipo de Prueba</Label>
                  <Select value={evalType} onValueChange={setEvalType}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="pcq">PCQ-24</SelectItem>
                      <SelectItem value="mbi">MBI</SelectItem>
                      <SelectItem value="dass">DASS-21</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Inputs Dinámicos según prueba */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-zinc-950 rounded border border-zinc-800">
                {evalType === 'pcq' && (
                  <>
                    <InputScore label="Autoeficacia (Promedio)" id="pcq_self_efficacy" scores={scores} setScores={setScores} max={7} />
                    <InputScore label="Esperanza (Promedio)" id="pcq_hope" scores={scores} setScores={setScores} max={7} />
                    <InputScore label="Resiliencia (Promedio)" id="pcq_resilience" scores={scores} setScores={setScores} max={7} />
                    <InputScore label="Optimismo (Promedio)" id="pcq_optimism" scores={scores} setScores={setScores} max={7} />
                  </>
                )}
                {evalType === 'mbi' && (
                  <>
                    <InputScore label="Agotamiento (Suma)" id="mbi_exhaustion" scores={scores} setScores={setScores} max={54} />
                    <InputScore label="Despersonalización (Suma)" id="mbi_depersonalization" scores={scores} setScores={setScores} max={30} />
                    <InputScore label="Realización Personal (Suma)" id="mbi_personal_accomplishment" scores={scores} setScores={setScores} max={48} />
                  </>
                )}
                {evalType === 'dass' && (
                  <>
                    <InputScore label="Depresión (x2)" id="dass_depression" scores={scores} setScores={setScores} max={42} />
                    <InputScore label="Ansiedad (x2)" id="dass_anxiety" scores={scores} setScores={setScores} max={42} />
                    <InputScore label="Estrés (x2)" id="dass_stress" scores={scores} setScores={setScores} max={42} />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Notas Adicionales</Label>
                <Textarea value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white" />
              </div>

              <Button onClick={handleSaveEval} disabled={savingEval} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingEval ? 'Guardando...' : '💾 Guardar Resultados'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para inputs de puntaje
function InputScore({ label, id, scores, setScores, max }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Input 
        type="number" 
        value={scores[id] || ''} 
        onChange={(e) => setScores({...scores, [id]: parseFloat(e.target.value)})}
        className="bg-zinc-900 border-zinc-700 text-white font-mono"
        placeholder="0"
        max={max}
      />
    </div>
  );
}