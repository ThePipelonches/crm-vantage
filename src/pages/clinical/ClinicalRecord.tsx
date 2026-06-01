import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth'; // Asegúrate de que esta ruta sea correcta
import { ArrowLeft, User, Mail, Activity, FileText, Save, TrendingUp, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Usamos useAuth explícitamente
  
  // Estados Principales
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  const [innerTab, setInnerTab] = useState<'protocol' | 'sessions'>('protocol');

  // Estados Gestión Estado
  const [currentStatus, setCurrentStatus] = useState('active');
  const [statusDate, setStatusDate] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Estados ROL
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [newRisk, setNewRisk] = useState('low');
  const [sessionNum, setSessionNum] = useState(1);
  const [rolComment, setRolComment] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // Estados Protocolo
  const [protoAffiliation, setProtoAffiliation] = useState('');
  const [protoMentalCapital, setProtoMentalCapital] = useState('');
  const [protoDiagnosis, setProtoDiagnosis] = useState('');
  const [protoAxes, setProtoAxes] = useState('');
  const [protoPlan, setProtoPlan] = useState('');
  const [savingProto, setSavingProto] = useState(false);

  // Estados Sesiones
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Carga Inicial Blindada
  useEffect(() => {
    if (!patientId || !user) {
      if (!user) console.log("Esperando autenticación...");
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Cargar Paciente
        const { data: pData, error: pErr } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (pErr) throw new Error("No se pudo cargar el paciente: " + pErr.message);
        setPatient(pData);
        setCurrentStatus(pData.status || 'active');

        // 2. Cargar ROL
        const { data: rData, error: rErr } = await supabase
          .from('patient_rol_logs')
          .select('*')
          .eq('patient_id', patientId)
          .order('session_number', { ascending: true });
        
        if (!rErr && rData) {
          setRolLogs(rData);
          const processed = rData.map((log: any, i: number) => {
            const session = log.session_number || i + 1;
            let riskVal = log.risk_numeric;
            if (riskVal === null || riskVal === undefined) {
              riskVal = log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1;
            }
            return {
              session,
              risk: riskVal,
              riskLabel: riskVal === 1 ? 'Bajo' : riskVal === 2 ? 'Medio' : 'Alto',
              riskColor: riskVal === 1 ? '#4ade80' : riskVal === 2 ? '#facc15' : '#f87171'
            };
          });
          setChartData(processed);
        }

        // 3. Cargar Protocolo
        const { data: prData, error: prErr } = await supabase
          .from('clinical_protocols')
          .select('*')
          .eq('patient_id', patientId)
          .single();
        
        if (!prErr && prData) {
          setProtoAffiliation(prData.affiliation_data || '');
          setProtoMentalCapital(prData.mental_capital_eval || '');
          setProtoDiagnosis(prData.functional_diagnosis || '');
          setProtoAxes(prData.axes_analysis || '');
          setProtoPlan(prData.treatment_plan || '');
        }

        // 4. Cargar Sesiones
        const { data: sData, error: sErr } = await supabase
          .from('patient_sessions')
          .select('*')
          .eq('patient_id', patientId)
          .order('session_number', { ascending: true });
        
        if (!sErr && sData) setSessionHistory(sData);

      } catch (err: any) {
        console.error("Error crítico cargando datos:", err);
        setError(err.message || "Error desconocido al cargar");
        // NO hacemos logout aquí, solo mostramos error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, user]);

  // Funciones de Guardado Blindadas
  const handleSaveStatus = async () => {
    if (!patientId) return;
    setSavingStatus(true);
    try {
      const updateData: any = { 
        status: currentStatus, 
        status_changed_at: new Date().toISOString(), 
        status_comment: statusComment 
      };
      
      if (currentStatus === 'deserter') { 
        updateData.deserter_date = statusDate || new Date().toISOString().split('T')[0]; 
        updateData.deserter_reason = statusComment; 
        // Limpiar campos de inactivo
        updateData.expected_return = null;
        updateData.inactive_reason = null;
      } else if (currentStatus === 'inactive') { 
        updateData.inactive_date = statusDate || new Date().toISOString().split('T')[0]; 
        updateData.inactive_reason = statusComment; 
        updateData.expected_return = expectedReturn || null;
        // Limpiar campos de desertor
        updateData.deserter_date = null;
        updateData.deserter_reason = null;
      } else {
        // Si es activo, limpiar todo
        updateData.deserter_date = null;
        updateData.deserter_reason = null;
        updateData.inactive_date = null;
        updateData.inactive_reason = null;
        updateData.expected_return = null;
      }
      
      const { error } = await supabase.from('patients').update(updateData).eq('id', patientId);
      if (error) throw error;
      
      alert("✅ Estado actualizado correctamente");
      // Actualizar estado local inmediatamente para evitar recargas bruscas
      setPatient({ ...patient, ...updateData });
    } catch (err: any) {
      console.error("Error guardando estado:", err);
      alert("❌ Error al actualizar estado: " + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveRol = async () => {
    if (!patientId) return;
    setSavingRol(true);
    try {
      const { error } = await supabase.from('patient_rol_logs').insert([{
        patient_id: patientId, 
        session_number: parseInt(sessionNum.toString()),
        risk_level: newRisk, 
        risk_numeric: newRisk === 'high' ? 3 : newRisk === 'medium' ? 2 : 1,
        comments: rolComment, 
        action_plan: rolPlan
      }]);
      if (error) throw error;
      alert("✅ ROL guardado");
      setRolComment(''); setRolPlan('');
      // Recargar solo ROL
      const { data } = await supabase.from('patient_rol_logs').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if(data) {
        setRolLogs(data);
        const processed = data.map((log: any, i: number) => ({
            session: log.session_number || i + 1,
            risk: log.risk_numeric || (log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1),
            riskLabel: (log.risk_numeric || (log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1)) === 1 ? 'Bajo' : '...',
            riskColor: '#' // Simplificado para recarga
        }));
        setChartData(processed);
      }
    } catch (err: any) {
      alert("❌ Error ROL: " + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  const handleSaveProtocol = async () => {
    if (!patientId) return;
    setSavingProto(true);
    try {
      const payload = {
        patient_id: patientId,
        affiliation_data: protoAffiliation,
        mental_capital_eval: protoMentalCapital,
        functional_diagnosis: protoDiagnosis,
        axes_analysis: protoAxes,
        treatment_plan: protoPlan,
        updated_at: new Date().toISOString()
      };
      
      const { error: upErr } = await supabase.from('clinical_protocols').update(payload).eq('patient_id', patientId);
      if (upErr) {
        const { error: insErr } = await supabase.from('clinical_protocols').insert([payload]);
        if (insErr) throw insErr;
      }
      alert("✅ Historia Clínica guardada");
    } catch (err: any) {
      alert("❌ Error Protocolo: " + err.message);
    } finally {
      setSavingProto(false);
    }
  };

  const handleSaveSession = async () => {
    if (!patientId) return;
    const numEl = document.getElementById('sessNum') as HTMLInputElement;
    const topicEl = document.getElementById('sessTopic') as HTMLInputElement;
    const obsEl = document.getElementById('sessObs') as HTMLTextAreaElement;
    const commEl = document.getElementById('sessComm') as HTMLTextAreaElement;
    const scoreEl = document.getElementById('sessScore') as HTMLInputElement;

    if (!numEl || !topicEl || !numEl.value || !topicEl.value) { alert("⚠️ Completa Sesión y Tema"); return; }

    try {
      const payload = {
        patient_id: patientId,
        session_number: parseInt(numEl.value),
        module_topic: topicEl.value,
        clinical_observations: obsEl?.value || '',
        patient_commitments: commEl?.value || '',
        patient_status_score: scoreEl?.value ? parseInt(scoreEl.value) : null
      };

      if (editingSessionId) {
        const { error } = await supabase.from('patient_sessions').update(payload).eq('id', editingSessionId);
        if (error) throw error;
        alert("✅ Sesión actualizada");
        setEditingSessionId(null);
      } else {
        const { error } = await supabase.from('patient_sessions').insert([payload]);
        if (error) throw error;
        alert("✅ Sesión guardada");
      }
      
      if(numEl) numEl.value = ''; if(topicEl) topicEl.value = '';
      if(obsEl) obsEl.value = ''; if(commEl) commEl.value = ''; if(scoreEl) scoreEl.value = '';
      
      const { data } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if(data) setSessionHistory(data);
    } catch (e: any) { 
      alert("❌ Error Sesión: " + e.message); 
    }
  };

  const handleEditSession = (session: any) => {
    setEditingSessionId(session.id);
    const numEl = document.getElementById('sessNum') as HTMLInputElement;
    const topicEl = document.getElementById('sessTopic') as HTMLInputElement;
    const obsEl = document.getElementById('sessObs') as HTMLTextAreaElement;
    const commEl = document.getElementById('sessComm') as HTMLTextAreaElement;
    const scoreEl = document.getElementById('sessScore') as HTMLInputElement;

    if(numEl) numEl.value = session.session_number;
    if(topicEl) topicEl.value = session.module_topic || '';
    if(obsEl) obsEl.value = session.clinical_observations || '';
    if(commEl) commEl.value = session.patient_commitments || '';
    if(scoreEl) scoreEl.value = session.patient_status_score || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = async (id: string) => {
    if(!confirm("¿Estás seguro de borrar esta sesión?")) return;
    try {
      const { error } = await supabase.from('patient_sessions').delete().eq('id', id);
      if (error) throw error;
      alert("✅ Sesión eliminada");
      const { data } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if(data) setSessionHistory(data);
    } catch (e: any) { alert("❌ Error: " + e.message); }
  };

  // Renderizado Condicional Estricto
  if (!user) {
    // Si no hay usuario, no renderizamos nada, pero tampoco forzamos logout manualmente
    // El ProtectedRoute en App.tsx se encargará de redirigir si es necesario
    return null; 
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-zinc-400">Cargando historia clínica...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle /> Error al cargar datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 mb-4">{error}</p>
            <Button onClick={() => navigate('/patients')} variant="outline" className="border-red-800 text-red-300 hover:bg-red-900">
              Volver a Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>Paciente no encontrado.</p>
        <Button onClick={() => navigate('/patients')} variant="link" className="text-white">Volver</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2"/> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500"/> {patient.full_name}
          </h1>
          <div className="flex gap-4 mt-1 text-sm text-zinc-400">
            <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
            <Badge className={currentStatus === 'active' ? 'bg-green-900 text-green-400' : currentStatus === 'inactive' ? 'bg-orange-900 text-orange-400' : 'bg-red-900 text-red-400'}>
              {currentStatus === 'active' ? 'Activo' : currentStatus === 'inactive' ? 'Inactivo' : 'Desertor'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => {setActiveTab('data'); setInnerTab('protocol')}} className={`pb-2 px-4 ${activeTab==='data'&&innerTab==='protocol'?'text-white border-b-2 border-blue-500':'text-zinc-500'}`}>Datos Clínicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 ${activeTab==='rol'?'text-white border-b-2 border-blue-500':'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 ${activeTab==='eval'?'text-white border-b-2 border-blue-500':'text-zinc-500'}`}>Evaluaciones</button>
      </div>

      {/* CONTENIDO */}
      {activeTab === 'eval' ? (
        <PsychometricEval patientId={patientId} />
      ) : activeTab === 'rol' ? (
        <div className="space-y-6 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Registro ROL</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={sessionNum} onChange={e=>setSessionNum(parseInt(e.target.value))} placeholder="N° Sesión" className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>
                <select value={newRisk} onChange={e=>setNewRisk(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white">
                  <option value="low">Bajo (Verde)</option><option value="medium">Medio (Amarillo)</option><option value="high">Alto (Rojo)</option>
                </select>
              </div>
              {(newRisk==='medium'||newRisk==='high') && (
                <>
                  <input placeholder="Comentario" value={rolComment} onChange={e=>setRolComment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>
                  <textarea placeholder="Plan de Acción" value={rolPlan} onChange={e=>setRolPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"/>
                </>
              )}
              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600">{savingRol?'Guardando...':'Guardar ROL'}</Button>
            </CardContent>
          </Card>
          
          {/* GRÁFICA DE COLORES */}
          <Card className="bg-zinc-900 border-zinc-800 h-72">
            <CardContent className="h-full pt-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="session" stroke="#999" label={{ value: 'Sesión', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#999" ticks={[1, 2, 3]} tickFormatter={(val) => val === 1 ? 'Bajo' : val === 2 ? 'Medio' : 'Alto'} width={60} />
                    <Tooltip 
                      contentStyle={{backgroundColor:'#18181b', borderColor:'#333', color:'#fff'}}
                      formatter={(value: number, name: string, props: any) => [
                        <span style={{color: props.payload.riskColor}}>{props.payload.riskLabel}</span>, 
                        'Nivel de Riesgo'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="#8884d8" 
                      strokeWidth={2} 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle cx={cx} cy={cy} r={6} fill={payload.riskColor} stroke="#fff" strokeWidth={2} />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-zinc-500 text-center">Sin datos registrados aún.</p>}
            </CardContent>
          </Card>

          <div className="space-y-4">
             <h3 className="text-white font-bold">Historial Detallado</h3>
             {rolLogs.map((l:any) => (
               <Card key={l.id} className="bg-zinc-900 border-zinc-800">
                 <CardContent className="pt-4">
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                       <span className="text-white font-bold">Sesión {l.session_number}</span>
                       <Badge className={l.risk_level === 'high' ? 'bg-red-900 text-red-300' : l.risk_level === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}>
                         {l.risk_level === 'high' ? 'ALTO' : l.risk_level === 'medium' ? 'MEDIO' : 'BAJO'}
                       </Badge>
                     </div>
                     <span className="text-xs text-zinc-500">{new Date(l.created_at).toLocaleDateString()}</span>
                   </div>
                   {l.comments && <p className="text-sm text-zinc-300 mb-1"><span className="text-zinc-500">Comentario:</span> {l.comments}</p>}
                   {l.action_plan && <p className="text-sm text-zinc-300"><span className="text-zinc-500">Plan de Acción:</span> {l.action_plan}</p>}
                 </CardContent>
               </Card>
             ))}
          </div>
        </div>
      ) : (
        /* --- DATOS CLÍNICOS --- */
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-Tabs Internas */}
          <div className="flex gap-2 mb-4 pl-4 border-l-2 border-blue-500">
            <button onClick={()=>setInnerTab('protocol')} className={`text-sm px-3 py-1 rounded ${innerTab==='protocol'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Protocolo Neuro-Apogeo</button>
            <button onClick={()=>setInnerTab('sessions')} className={`text-sm px-3 py-1 rounded ${innerTab==='sessions'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Historial de Sesiones</button>
          </div>

          {innerTab === 'protocol' ? (
            <div className="space-y-6">
              {/* Datos Sociodemográficos Editables */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-sm">Datos Sociodemográficos</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div><label className="text-xs text-zinc-400">Teléfono</label><input value={patient.phone||''} onChange={async (e)=>{
                     const {error} = await supabase.from('patients').update({phone:e.target.value}).eq('id', patientId);
                     if(!error) alert("✅ Actualizado");
                   }} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                   <div><label className="text-xs text-zinc-400">Ocupación</label><input value={patient.occupation||''} onChange={async (e)=>{
                     const {error} = await supabase.from('patients').update({occupation:e.target.value}).eq('id', patientId);
                     if(!error) alert("✅ Actualizado");
                   }} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                   <div><label className="text-xs text-zinc-400">Fecha Nacimiento</label><input type="date" value={patient.birth_date||''} onChange={async (e)=>{
                     const {error} = await supabase.from('patients').update({birth_date:e.target.value}).eq('id', patientId);
                     if(!error) alert("✅ Actualizado");
                   }} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                   <div><label className="text-xs text-zinc-400">Estado Civil</label><input value={patient.marital_status||''} onChange={async (e)=>{
                     const {error} = await supabase.from('patients').update({marital_status:e.target.value}).eq('id', patientId);
                     if(!error) alert("✅ Actualizado");
                   }} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                </CardContent>
              </Card>

              {/* Gestión de Estado */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-sm">Gestión Rápida de Estado</CardTitle></CardHeader>
                <CardContent className="flex gap-4 items-end">
                  <div className="flex-1"><label className="text-xs text-zinc-400">Estado</label><select value={currentStatus} onChange={e=>setCurrentStatus(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="deserter">Desertor</option></select></div>
                  {(currentStatus === 'inactive' || currentStatus === 'deserter') && (
                     <div className="flex-1"><label className="text-xs text-zinc-400">Fecha</label><input type="date" value={statusDate} onChange={e=>setStatusDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  )}
                  {currentStatus === 'inactive' && (
                     <div className="flex-1"><label className="text-xs text-zinc-400">Retorno</label><input type="date" value={expectedReturn} onChange={e=>setExpectedReturn(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  )}
                  <Button onClick={handleSaveStatus} disabled={savingStatus} className="bg-blue-600">{savingStatus?'...':'Actualizar'}</Button>
                </CardContent>
                {(currentStatus === 'inactive' || currentStatus === 'deserter') && (
                  <div className="px-6 pb-4">
                    <label className="text-xs text-zinc-400 block mb-1">Comentario / Justificación</label>
                    <textarea value={statusComment} onChange={e=>setStatusComment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20" placeholder="Motivo..."/>
                  </div>
                )}
              </Card>

              {/* Formulario Protocolo Editable */}
              <div className="space-y-4">
                <div><label className="text-xs text-blue-400 font-bold block mb-1">I. DATOS DE FILIACIÓN</label><textarea value={protoAffiliation} onChange={e=>setProtoAffiliation(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-32"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">II. EVALUACIÓN CAPITAL MENTAL</label><textarea value={protoMentalCapital} onChange={e=>setProtoMentalCapital(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">III. DIAGNÓSTICO FUNCIONAL</label><textarea value={protoDiagnosis} onChange={e=>setProtoDiagnosis(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">IV. ANÁLISIS POR EJES</label><textarea value={protoAxes} onChange={e=>setProtoAxes(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-64"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">V. PLAN DE TRATAMIENTO</label><textarea value={protoPlan} onChange={e=>setProtoPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                
                <Button onClick={handleSaveProtocol} disabled={savingProto} className="w-full bg-green-700 hover:bg-green-600 text-white py-4 text-lg font-bold">
                  {savingProto ? 'Guardando...' : '💾 GUARDAR HISTORIA CLÍNICA COMPLETA'}
                </Button>
              </div>
            </div>
          ) : (
            /* --- HISTORIAL DE SESIONES --- */
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
                <CardHeader><CardTitle className="text-white">{editingSessionId ? '✏️ Editando Sesión' : 'Registrar Nueva Sesión'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-xs text-zinc-400">N° Sesión</label><input type="number" id="sessNum" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div className="col-span-2"><label className="text-xs text-zinc-400">Módulo/Tema</label><input type="text" id="sessTopic" placeholder="Ej: Módulo 2" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div><label className="text-xs text-zinc-400">Estado (0-10)</label><input type="number" min="0" max="10" id="sessScore" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  </div>
                  <div><label className="text-xs text-zinc-400">Observaciones</label><textarea id="sessObs" rows={3} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <div><label className="text-xs text-zinc-400">Compromisos</label><textarea id="sessComm" rows={2} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSession} className="flex-1 bg-blue-600">{editingSessionId ? 'Actualizar Sesión' : 'Guardar Sesión'}</Button>
                    {editingSessionId && <Button onClick={() => {setEditingSessionId(null); const { data } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', { ascending: true }); if(data) setSessionHistory(data);}} variant="outline" className="border-zinc-600 text-zinc-300">Cancelar</Button>}
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h3 className="text-white font-bold">Historial</h3>
                {sessionHistory.length===0 ? <p className="text-zinc-500">Sin sesiones.</p> : sessionHistory.map((s:any)=>(
                  <Card key={s.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Sesión {s.session_number}: {s.module_topic}</span>
                        <div className="flex gap-2 items-center">
                          <Badge className={s.patient_status_score>=7?'bg-green-900':s.patient_status_score>=4?'bg-yellow-900':'bg-red-900'}>{s.patient_status_score}/10</Badge>
                          <button onClick={() => handleEditSession(s)} className="text-blue-400 hover:text-blue-300"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteSession(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-zinc-300 space-y-1">
                      <p><span className="text-zinc-500">Obs:</span> {s.clinical_observations}</p>
                      <p><span className="text-zinc-500">Comp:</span> {s.patient_commitments||'-'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}