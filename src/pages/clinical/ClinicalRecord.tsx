import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, Save, TrendingUp, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  
  // Sub-tabs para Datos Clínicos
  const [innerTab, setInnerTab] = useState<'protocol' | 'sessions'>('protocol');

  // --- ESTADO GESTIÓN PACIENTE ---
  const [currentStatus, setCurrentStatus] = useState('active');
  const [statusDate, setStatusDate] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusEvidence, setStatusEvidence] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // --- ESTADO ROL ---
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [newRisk, setNewRisk] = useState('low');
  const [sessionNum, setSessionNum] = useState(1);
  const [rolComment, setRolComment] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // --- ESTADO PROTOCOLO (EDITABLE) ---
  const [protocol, setProtocol] = useState({
    assessment_capital: '',
    diagnosis_functional: '',
    analysis_axes: '',
    treatment_plan: ''
  });
  const [savingProtocol, setSavingProtocol] = useState(false);

  // --- ESTADO SESIONES ---
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  // Carga Inicial
  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
    fetchRolLogs();
    fetchProtocol();
    fetchSessionHistory();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (error) throw error;
      setPatient(data);
      setCurrentStatus(data.status || 'active');
    } catch (err) { console.error("Error cargando paciente:", err); } 
    finally { setLoading(false); }
  };

  const fetchRolLogs = async () => {
    try {
      const { data, error } = await supabase.from('patient_rol_logs').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if (error) throw error;
      setRolLogs(data || []);
      const processedData = (data || []).map((log: any, index: number) => {
        const session = log.session_number ? parseInt(log.session_number) : index + 1;
        let riskVal = log.risk_numeric;
        if (riskVal === null || riskVal === undefined) {
          if (log.risk_level === 'high') riskVal = 3;
          else if (log.risk_level === 'medium') riskVal = 2;
          else if (log.risk_level === 'low') riskVal = 1;
          else riskVal = 0;
        }
        return { session, risk: riskVal };
      });
      setChartData(processedData);
    } catch (err) { console.error("Error cargando ROL:", err); }
  };

  const fetchProtocol = async () => {
    try {
      const { data, error } = await supabase.from('patient_protocols').select('*').eq('patient_id', patientId).single();
      if (data) {
        setProtocol({
          assessment_capital: data.assessment_capital || '',
          diagnosis_functional: data.diagnosis_functional || '',
          analysis_axes: data.analysis_axes || '',
          treatment_plan: data.treatment_plan || ''
        });
      }
    } catch (err) { console.error("Error cargando protocolo:", err); }
  };

  const fetchSessionHistory = async () => {
     try {
       const { data, error } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
       if (data) setSessionHistory(data);
     } catch (err) { console.error("Error cargando sesiones:", err); }
  };

  // --- HANDLERS ---

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const updateData: any = { status: currentStatus, status_changed_at: new Date().toISOString(), status_comment: statusComment };
      if (currentStatus === 'deserter') { updateData.deserter_date = statusDate; updateData.deserter_reason = statusComment; updateData.deserter_evidence = statusEvidence; }
      else if (currentStatus === 'inactive') { updateData.inactive_date = statusDate; updateData.expected_return = expectedReturn; updateData.inactive_reason = statusComment; }

      const { error } = await supabase.from('patients').update(updateData).eq('id', patientId);
      if (error) throw error;
      alert("✅ Estado actualizado");
      fetchPatientData();
    } catch (err: any) { alert("❌ Error: " + err.message); }
    finally { setSavingStatus(false); }
  };

  const handleSaveRol = async () => {
    setSavingRol(true);
    try {
      const { error } = await supabase.from('patient_rol_logs').insert([{
        patient_id: patientId, session_number: parseInt(sessionNum.toString()), risk_level: newRisk,
        risk_numeric: newRisk === 'high' ? 3 : newRisk === 'medium' ? 2 : 1,
        comments: rolComment, action_plan: rolPlan
      }]);
      if (error) throw error;
      alert("✅ ROL guardado");
      setRolComment(''); setRolPlan('');
      fetchRolLogs();
    } catch (err: any) { alert("❌ Error: " + err.message); }
    finally { setSavingRol(false); }
  };

  const handleSaveProtocol = async () => {
    setSavingProtocol(true);
    try {
      const payload = { patient_id: patientId, ...protocol };
      // Upsert: Update si existe, Insert si no
      const { error } = await supabase.from('patient_protocols').upsert(payload, { onConflict: 'patient_id' });
      if (error) throw error;
      alert("✅ Protocolo Clínico Guardado");
    } catch (err: any) { alert("❌ Error: " + err.message); }
    finally { setSavingProtocol(false); }
  };

  const handleSaveSession = async () => {
    const num = (document.getElementById('sessNum') as HTMLInputElement).value;
    const topic = (document.getElementById('sessTopic') as HTMLInputElement).value;
    const obs = (document.getElementById('sessObs') as HTMLTextAreaElement).value;
    const comm = (document.getElementById('sessComm') as HTMLTextAreaElement).value;
    const score = (document.getElementById('sessScore') as HTMLInputElement).value;

    if(!num || !topic) { alert("Completa Número de Sesión y Tema"); return; }

    try {
      const { error } = await supabase.from('patient_sessions').insert([{
        patient_id: patientId, session_number: parseInt(num), module_topic: topic,
        clinical_observations: obs, patient_commitments: comm, patient_status_score: parseInt(score) || 0
      }]);
      if(error) throw error;
      alert("✅ Sesión guardada");
      // Limpiar
      ['sessNum','sessTopic','sessObs','sessComm','sessScore'].forEach(id => {
        const el = document.getElementById(id); if(el) el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? (el as any).value = '' : null;
      });
      fetchSessionHistory();
    } catch(e: any) { alert("Error: " + e.message); }
  };

  if (loading) return <div className="p-6 text-white">Cargando...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  const getStatusColor = (s: string) => s === 'active' ? 'bg-green-900 text-green-400' : s === 'inactive' ? 'bg-orange-900 text-orange-400' : 'bg-red-900 text-red-400';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2"/> Volver</Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6 text-blue-500"/> {patient.full_name}</h1>
          <div className="flex gap-4 mt-1 text-sm text-zinc-400">
            <span>{patient.email}</span>
            <Badge className={getStatusColor(patient.status)}>{patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}</Badge>
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
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Registro ROL</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Sesión #" value={sessionNum} onChange={e=>setSessionNum(parseInt(e.target.value))} className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>
                <select value={newRisk} onChange={e=>setNewRisk(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white">
                  <option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option>
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
          <Card className="bg-zinc-900 border-zinc-800 h-80"><CardContent className="h-full pt-6">{chartData.length>0?<ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="session" stroke="#999"/><YAxis domain={[0,4]} stroke="#999"/><Tooltip contentStyle={{backgroundColor:'#18181b',borderColor:'#333'}}/><Line type="monotone" dataKey="risk" stroke="#8884d8" strokeWidth={3}/></LineChart></ResponsiveContainer>:<p className="text-zinc-500 text-center">Sin datos</p>}</CardContent></Card>
          <div className="space-y-2">{rolLogs.map((l:any)=>(<div key={l.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between"><span className="text-white font-bold">Sesión {l.session_number}</span><span className="text-xs text-zinc-400">{l.comments}</span></div>))}</div>
        </div>
      ) : (
        /* --- DATOS CLÍNICOS (Con Sub-Tabs) --- */
        <div className="space-y-6">
          {/* Sub-Tabs */}
          <div className="flex gap-2 mb-4 pl-4 border-l-2 border-blue-500">
            <button onClick={()=>setInnerTab('protocol')} className={`text-sm px-3 py-1 rounded ${innerTab==='protocol'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Protocolo Neuro-Apogeo (Editable)</button>
            <button onClick={()=>setInnerTab('sessions')} className={`text-sm px-3 py-1 rounded ${innerTab==='sessions'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Historial de Sesiones</button>
          </div>

          {innerTab === 'protocol' ? (
            /* --- FORMULARIO PROTOCOLO EDITABLE --- */
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 mb-4">
                <h3 className="text-white font-bold mb-2">I. DATOS DE FILIACIÓN</h3>
                <p className="text-zinc-400 text-sm">Paciente: {patient.full_name} | Inicio: {new Date(patient.created_at).toLocaleDateString()}</p>
                <p className="text-zinc-400 text-sm mt-1">Motivo: {patient.notes || 'Sin registro inicial'}</p>
              </div>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">II. EVALUACIÓN DEL CAPITAL MENTAL</CardTitle></CardHeader>
                <CardContent><textarea className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-300 h-40 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Escribe aquí el análisis de Autoeficacia, Esperanza, Optimismo y Resiliencia..." value={protocol.assessment_capital} onChange={e=>setProtocol({...protocol, assessment_capital: e.target.value})}/></CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">III. DIAGNÓSTICO FUNCIONAL Y PSICOMÉTRICO</CardTitle></CardHeader>
                <CardContent><textarea className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-300 h-40 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Integra resultados DASS-21, MBI y nivel de fatiga..." value={protocol.diagnosis_functional} onChange={e=>setProtocol({...protocol, diagnosis_functional: e.target.value})}/></CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">IV. ANÁLISIS POR EJES DE INTERVENCIÓN</CardTitle></CardHeader>
                <CardContent><textarea className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-300 h-48 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Resume hallazgos de Ejes Biológico, Cognitivo, Emocional, Ejecutivo y Relacional..." value={protocol.analysis_axes} onChange={e=>setProtocol({...protocol, analysis_axes: e.target.value})}/></CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">V. PLAN DE TRATAMIENTO PROPUESTO</CardTitle></CardHeader>
                <CardContent><textarea className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-300 h-48 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jerarquiza las intervenciones: Estabilización, Procesamiento e Integración..." value={protocol.treatment_plan} onChange={e=>setProtocol({...protocol, treatment_plan: e.target.value})}/></CardContent>
              </Card>

              <Button onClick={handleSaveProtocol} disabled={savingProtocol} className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
                {savingProtocol ? 'Guardando Protocolo...' : '💾 GUARDAR PROTOCOLO COMPLETO'}
              </Button>
            </div>
          ) : (
            /* --- HISTORIAL DE SESIONES --- */
            <div className="space-y-6 animate-in fade-in">
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
                <CardHeader><CardTitle className="text-white">Registrar Nueva Sesión</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-xs text-zinc-400">N° Sesión</label><input type="number" id="sessNum" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div className="col-span-2"><label className="text-xs text-zinc-400">Módulo/Tema</label><input type="text" id="sessTopic" placeholder="Ej: Módulo 2" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div><label className="text-xs text-zinc-400">Estado (0-10)</label><input type="number" min="0" max="10" id="sessScore" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  </div>
                  <div><label className="text-xs text-zinc-400">Observaciones Clínicas</label><textarea id="sessObs" rows={3} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <div><label className="text-xs text-zinc-400">Compromisos</label><textarea id="sessComm" rows={2} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <Button onClick={handleSaveSession} className="w-full bg-blue-600">Guardar Sesión</Button>
                </CardContent>
              </Card>
              <div className="space-y-4"><h3 className="text-white font-bold">Historial</h3>
                {sessionHistory.length===0?<p className="text-zinc-500">Sin sesiones.</p>:sessionHistory.map((s:any)=>(
                  <Card key={s.id} className="bg-zinc-900 border-zinc-800"><CardHeader className="pb-2"><div className="flex justify-between"><span className="text-white font-bold">Sesión {s.session_number}: {s.module_topic}</span><Badge className={s.patient_status_score>=7?'bg-green-900 text-green-400':s.patient_status_score>=4?'bg-yellow-900 text-yellow-400':'bg-red-900 text-red-400'}>{s.patient_status_score}/10</Badge></div></CardHeader><CardContent className="text-sm text-zinc-300 space-y-1"><p><span className="text-zinc-500">Obs:</span> {s.clinical_observations}</p><p><span className="text-zinc-500">Comp:</span> {s.patient_commitments||'-'}</p></CardContent></Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Gestión de Estado (Siempre visible al final de Datos Clínicos) */}
          <Card className="bg-zinc-900 border-zinc-800 mt-8">
             <CardHeader><CardTitle className="text-white">Gestión de Estado del Paciente</CardTitle></CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <select value={currentStatus} onChange={e=>setCurrentStatus(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white"><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="deserter">Desertor</option></select>
                 {(currentStatus==='inactive'||currentStatus==='deserter')&&<input type="date" value={statusDate} onChange={e=>setStatusDate(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>}
               </div>
               <textarea placeholder="Motivo / Justificación" value={statusComment} onChange={e=>setStatusComment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"/>
               {currentStatus==='deserter'&&<input type="text" placeholder="Pruebas (URL)" value={statusEvidence} onChange={e=>setStatusEvidence(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>}
               {currentStatus==='inactive'&&<input type="date" value={expectedReturn} onChange={e=>setExpectedReturn(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>}
               <Button onClick={handleSaveStatus} disabled={savingStatus} className="w-full bg-blue-600">{savingStatus?'Guardando...':'Actualizar Estado'}</Button>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}