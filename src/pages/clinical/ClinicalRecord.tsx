import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, AlertCircle, Save, TrendingUp } from 'lucide-react';
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
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  const [user, setUser] = useState<any>(null);

  // Estados ROL
  const [rolLevel, setRolLevel] = useState('low');
  const [rolJustification, setRolJustification] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // Estados Evaluación (Solo puntajes)
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evalType, setEvalType] = useState('pcq');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!patientId) return;
      const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (error) console.error(error);
      else setPatient(data);
      setLoading(false);
    };
    fetchData();
  }, [patientId]);

  if (loading) return <div className="p-6 text-white">Cargando...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado</div>;

  // --- Lógica ROL ---
  const handleSaveRol = async () => {
    if (!user) return alert("Usuario no identificado");
    setSavingRol(true);
    
    // Mapeo correcto de colores a valores de BD
    let dbLevel = rolLevel; 
    // Si el select devuelve 'green'/'yellow'/'red', lo mapeamos aquí si es necesario. 
    // Asumiremos que el select ya devuelve 'low'/'medium'/'high' directamente para evitar errores.

    try {
      const { error } = await supabase.from('patient_rol_logs').insert({
        patient_id: patientId,
        risk_level: dbLevel, // Debe ser 'low', 'medium', 'high'
        justification: rolLevel === 'low' ? null : rolJustification,
        action_plan: rolLevel === 'low' ? null : rolPlan,
        created_by: user.id
      });
      if (error) throw error;
      alert("✅ ROL guardado correctamente");
      setRolJustification('');
      setRolPlan('');
    } catch (e: any) {
      alert(`❌ Error: ${e.message}`);
    } finally {
      setSavingRol(false);
    }
  };

  // --- Lógica Evaluaciones (Cálculos automáticos según puntaje ingresado) ---
  const getInterpretation = (type: string, score: number) => {
    if (!score && score !== 0) return { label: '-', color: 'bg-zinc-800' };
    
    if (type === 'pcq') {
      if (score >= 6) return { label: 'Alto', color: 'bg-green-900 text-green-400' };
      if (score >= 4.5) return { label: 'Medio', color: 'bg-yellow-900 text-yellow-400' };
      return { label: 'Bajo', color: 'bg-red-900 text-red-400' };
    }
    if (type === 'mbi_exh' || type === 'mbi_dep') {
      if (score > 20) return { label: 'Alto Riesgo', color: 'bg-red-900 text-red-400' };
      if (score > 10) return { label: 'Medio', color: 'bg-yellow-900 text-yellow-400' };
      return { label: 'Bajo', color: 'bg-green-900 text-green-400' };
    }
    if (type === 'mbi_pers') {
      if (score < 30) return { label: 'Riesgo', color: 'bg-red-900 text-red-400' };
      return { label: 'Saludable', color: 'bg-green-900 text-green-400' };
    }
    if (type.startsWith('dass')) {
      const max = type.includes('dep') ? 9 : type.includes('anx') ? 7 : 14;
      if (score > max * 2) return { label: 'Severo', color: 'bg-red-900 text-red-400' };
      if (score > max) return { label: 'Moderado', color: 'bg-yellow-900 text-yellow-400' };
      return { label: 'Normal', color: 'bg-green-900 text-green-400' };
    }
    return { label: '', color: '' };
  };

  const handleSaveEval = async () => {
    if (!user) return;
    const payload: any = {
      patient_id: patientId,
      eval_type: evalType,
      created_by: user.id
    };

    // Mapear scores al formato de BD
    if (evalType === 'pcq') {
      payload.pcq_self_efficacy = scores['pcq_se'] || 0;
      payload.pcq_hope = scores['pcq_h'] || 0;
      payload.pcq_resilience = scores['pcq_r'] || 0;
      payload.pcq_optimism = scores['pcq_o'] || 0;
    } else if (evalType === 'mbi') {
      payload.mbi_exhaustion = scores['mbi_exh'] || 0;
      payload.mbi_depersonalization = scores['mbi_dep'] || 0;
      payload.mbi_personal_accomplishment = scores['mbi_per'] || 0;
    } else if (evalType === 'dass') {
      payload.dass_depression = scores['dass_d'] || 0;
      payload.dass_anxiety = scores['dass_a'] || 0;
      payload.dass_stress = scores['dass_s'] || 0;
    }

    const { error } = await supabase.from('psychometric_results').insert(payload);
    if (error) alert("Error al guardar: " + error.message);
    else {
      alert("✅ Evaluación guardada");
      setScores({});
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica: {patient.full_name}</h1>
      </div>

      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Datos Clínicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Evaluaciones</button>
      </div>

      {/* CONTENIDO: DATOS */}
      {activeTab === 'data' && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white">Información General</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <p><Mail className="inline w-4 h-4 mr-2"/> {patient.email}</p>
            <p><Phone className="inline w-4 h-4 mr-2"/> {patient.phone || 'N/A'}</p>
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">Valor Plan: <span className="text-white">${patient.sale_total}</span></p>
              <p className="text-sm text-zinc-500">Pagado: <span className="text-green-400">${patient.cash_collected}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CONTENIDO: ROL */}
      {activeTab === 'rol' && (
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5"/> Registro ROL Semanal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nivel de Riesgo</Label>
                  <Select value={rolLevel} onValueChange={setRolLevel}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="low">🟢 Bajo (Verde)</SelectItem>
                      <SelectItem value="medium">🟡 Medio (Amarillo)</SelectItem>
                      <SelectItem value="high">🔴 Alto (Rojo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(rolLevel === 'medium' || rolLevel === 'high') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <Label className="text-yellow-500">Justificación del Riesgo</Label>
                    <Textarea 
                      value={rolJustification} 
                      onChange={(e) => setRolJustification(e.target.value)}
                      className="bg-zinc-950 border-zinc-700 text-white"
                      placeholder="Explique por qué se clasifica como riesgo medio/alto..."
                    />
                  </div>
                  <div>
                    <Label className="text-blue-400">Plan de Acción</Label>
                    <Textarea 
                      value={rolPlan} 
                      onChange={(e) => setRolPlan(e.target.value)}
                      className="bg-zinc-950 border-zinc-700 text-white"
                      placeholder="Describa las acciones a tomar esta semana..."
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingRol ? 'Guardando...' : 'Guardar Registro ROL'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENIDO: EVALUACIONES (SIMPLIFICADO) */}
      {activeTab === 'eval' && (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
             <Button variant={evalType === 'pcq' ? 'default' : 'outline'} onClick={() => setEvalType('pcq')} className={evalType==='pcq'?'bg-white text-black':'border-zinc-700 text-zinc-400'}>PCQ-24</Button>
             <Button variant={evalType === 'mbi' ? 'default' : 'outline'} onClick={() => setEvalType('mbi')} className={evalType==='mbi'?'bg-white text-black':'border-zinc-700 text-zinc-400'}>MBI</Button>
             <Button variant={evalType === 'dass' ? 'default' : 'outline'} onClick={() => setEvalType('dass')} className={evalType==='dass'?'bg-white text-black':'border-zinc-700 text-zinc-400'}>DASS-21</Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Ingreso de Puntajes Directos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              {/* PCQ INPUTS */}
              {evalType === 'pcq' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {id:'pcq_se', label:'Autoeficacia'}, {id:'pcq_h', label:'Esperanza'}, 
                    {id:'pcq_r', label:'Resiliencia'}, {id:'pcq_o', label:'Optimismo'}
                  ].map((item) => (
                    <div key={item.id} className="space-y-2">
                      <Label>{item.label}</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" step="0.1" max="7"
                          value={scores[item.id] || ''}
                          onChange={(e) => setScores({...scores, [item.id]: parseFloat(e.target.value)})}
                          className="bg-zinc-950 border-zinc-700 text-white"
                          placeholder="0.0 - 7.0"
                        />
                        <Badge className={getInterpretation('pcq', scores[item.id]).color}>
                          {getInterpretation('pcq', scores[item.id]).label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MBI INPUTS */}
              {evalType === 'mbi' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Agotamiento Emocional (Suma)</Label>
                    <Input type="number" value={scores['mbi_exh']||''} onChange={(e)=>setScores({...scores, 'mbi_exh':parseFloat(e.target.value)})} className="bg-zinc-950 border-zinc-700 text-white" />
                    <Badge className={getInterpretation('mbi_exh', scores['mbi_exh']).color}>{getInterpretation('mbi_exh', scores['mbi_exh']).label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Despersonalización (Suma)</Label>
                    <Input type="number" value={scores['mbi_dep']||''} onChange={(e)=>setScores({...scores, 'mbi_dep':parseFloat(e.target.value)})} className="bg-zinc-950 border-zinc-700 text-white" />
                    <Badge className={getInterpretation('mbi_dep', scores['mbi_dep']).color}>{getInterpretation('mbi_dep', scores['mbi_dep']).label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Realización Personal (Suma)</Label>
                    <Input type="number" value={scores['mbi_per']||''} onChange={(e)=>setScores({...scores, 'mbi_per':parseFloat(e.target.value)})} className="bg-zinc-950 border-zinc-700 text-white" />
                    <Badge className={getInterpretation('mbi_pers', scores['mbi_per']).color}>{getInterpretation('mbi_pers', scores['mbi_per']).label}</Badge>
                  </div>
                </div>
              )}

              {/* DASS INPUTS */}
              {evalType === 'dass' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['dass_d','dass_a','dass_s'].map((k) => (
                     <div key={k} className="space-y-2">
                       <Label>{k==='dass_d'?'Depresión':k==='dass_a'?'Ansiedad':'Estrés'} (Suma x2)</Label>
                       <Input type="number" value={scores[k]||''} onChange={(e)=>setScores({...scores, [k]:parseFloat(e.target.value)})} className="bg-zinc-950 border-zinc-700 text-white" />
                       <Badge className={getInterpretation(k, scores[k]).color}>{getInterpretation(k, scores[k]).label}</Badge>
                     </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSaveEval} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Save className="w-4 h-4 mr-2"/> Guardar Resultados
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}