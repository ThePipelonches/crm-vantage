import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs Principales
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  // Sub-tabs para Datos Clínicos
  const [innerTab, setInnerTab] = useState<'protocol' | 'sessions'>('protocol');

  // --- ESTADO DEL PACIENTE ---
  const [currentStatus, setCurrentStatus] = useState('active');
  const [statusDate, setStatusDate] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusEvidence, setStatusEvidence] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // --- ROL ---
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [newRisk, setNewRisk] = useState('low');
  const [sessionNum, setSessionNum] = useState(1);
  const [rolComment, setRolComment] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // --- SESIONES ---
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
    fetchRolLogs();
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
      const { data, error } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });
      
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

  const fetchSessionHistory = async () => {
     const { data } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', {ascending: true});
     if(data) setSessionHistory(data);
  };

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
        risk_numeric: newRisk === 'high' ? 3 : newRisk === 'medium' ? 2 : 1, comments: rolComment, action_plan: rolPlan
      }]);
      if (error) throw error;
      alert("✅ ROL guardado");
      setRolComment(''); setRolPlan('');
      fetchRolLogs();
    } catch (err: any) { alert("❌ Error: " + err.message); }
    finally { setSavingRol(false); }
  };

  const handleSaveSession = async () => {
    const num = (document.getElementById('sessNum') as HTMLInputElement).value;
    const topic = (document.getElementById('sessTopic') as HTMLInputElement).value;
    const obs = (document.getElementById('sessObs') as HTMLTextAreaElement).value;
    const comm = (document.getElementById('sessComm') as HTMLTextAreaElement).value;
    const score = (document.getElementById('sessScore') as HTMLInputElement).value;

    if(!num || !topic) { alert("Completa Sesión y Tema"); return; }
    try {
      const { error } = await supabase.from('patient_sessions').insert([{
        patient_id: patientId, session_number: parseInt(num), module_topic: topic,
        clinical_observations: obs, patient_commitments: comm, patient_status_score: parseInt(score) || 0
      }]);
      if(error) throw error;
      alert("✅ Sesión guardada");
      // Limpiar
      (document.getElementById('sessNum') as HTMLInputElement).value = '';
      (document.getElementById('sessTopic') as HTMLInputElement).value = '';
      (document.getElementById('sessObs') as HTMLTextAreaElement).value = '';
      (document.getElementById('sessComm') as HTMLTextAreaElement).value = '';
      (document.getElementById('sessScore') as HTMLInputElement).value = '';
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
        <button onClick={() => { setActiveTab('data'); setInnerTab('protocol'); }} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Datos Clínicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Evaluaciones</button>
      </div>

      {/* CONTENIDO */}
      {activeTab === 'eval' ? (
        <PsychometricEval patientId={patientId} />
      ) : activeTab === 'rol' ? (
        <div className="space-y-6 animate-in fade-in">
           <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500"/> Registro ROL</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="text-xs text-zinc-400">Sesión #</label><input type="number" value={sessionNum} onChange={(e) => setSessionNum(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                <div><label className="text-xs text-zinc-400">Riesgo</label><select value={newRisk} onChange={(e) => setNewRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"><option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option></select></div>
              </div>
              {(newRisk === 'medium' || newRisk === 'high') && (
                <div className="space-y-2 bg-zinc-950 p-3 rounded border border-zinc-800">
                   <input placeholder="Comentario" value={rolComment} onChange={(e) => setRolComment(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white"/>
                   <textarea placeholder="Plan de Acción" value={rolPlan} onChange={(e) => setRolPlan(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-20"/>
                </div>
              )}
              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700">{savingRol ? 'Guardando...' : 'Guardar ROL'}</Button>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 h-80"><CardContent className="h-full flex items-center justify-center pt-6">{chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="session" stroke="#999"/><YAxis stroke="#999" domain={[0,4]} ticks={[1,2,3]}/><Tooltip contentStyle={{backgroundColor:'#18181b', borderColor:'#333', color:'#fff'}}/><Line type="monotone" dataKey="risk" stroke="#8884d8" strokeWidth={3}/></LineChart></ResponsiveContainer> : <p className="text-zinc-500">Sin datos</p>}</CardContent></Card>
          <div className="space-y-2"><h3 className="text-white font-bold">Historial</h3>{rolLogs.map((log:any) => (<div key={log.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex justify-between"><span className="text-white font-bold">Sesión {log.session_number}</span><span className={`text-xs px-2 py-0.5 rounded ${log.risk_level==='high'?'bg-red-900 text-red-300':log.risk_level==='medium'?'bg-yellow-900 text-yellow-300':'bg-green-900 text-green-300'}`}>{log.risk_level.toUpperCase()}</span></div>))}</div>
        </div>
      ) : (
        /* --- DATOS CLÍNICOS (Con Sub-Tabs) --- */
        <div className="space-y-6 animate-in fade-in">
          
          {/* Sub-Tabs */}
          <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-2">
            <button onClick={() => setInnerTab('protocol')} className={`text-sm px-3 py-1 rounded ${innerTab === 'protocol' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Protocolo Neuro-Apogeo</button>
            <button onClick={() => setInnerTab('sessions')} className={`text-sm px-3 py-1 rounded ${innerTab === 'sessions' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Historial de Sesiones</button>
          </div>

          {innerTab === 'protocol' ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-xl">HISTORIA CLÍNICA VANTAGE - PROTOCOLO NEURO-APOGEO</CardTitle></CardHeader>
              <CardContent className="space-y-6 text-sm leading-relaxed text-zinc-300">
                <div><strong className="text-white block mb-1">DATOS DE FILIACIÓN</strong>Paciente: {patient.full_name}<br/>Motivo: Burnout severo, insomnio crónico.</div>
                <hr className="border-zinc-800"/>
                <div><strong className="text-white block mb-1">II. CAPITAL MENTAL</strong>Autoeficacia: Alto-Funcional. Esperanza: Bajo. Optimismo: Medio-Bajo. Resiliencia: Medio.</div>
                <hr className="border-zinc-800"/>
                <div><strong className="text-white block mb-1">III. DIAGNÓSTICO</strong>DASS-21: Estrés/Ansiedad Severa. MBI: Agotamiento Crítico.</div>
                <hr className="border-zinc-800"/>
                <div><strong className="text-white block mb-1">IV. EJES</strong>Biológico: Sueño Tipo B. Cognitivo: Rumiación. Emocional: Evitación. Ejecutivo: Fatiga. Relacional: Fusión Laboral.</div>
                <hr className="border-zinc-800"/>
                <div><strong className="text-white block mb-1">V. PLAN</strong>1. Estabilización (Sueño). 2. Procesamiento (Cognitivo). 3. Integración (Identidad).</div>
              </CardContent>
            </Card>
          ) : (
            /* --- HISTORIAL DE SESIONES --- */
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
                <CardHeader><CardTitle className="text-white">Registrar Nueva Sesión</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-xs text-zinc-400">N° Sesión</label><input type="number" id="sessNum" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div className="col-span-2"><label className="text-xs text-zinc-400">Tema</label><input type="text" id="sessTopic" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div><label className="text-xs text-zinc-400">Estado (0-10)</label><input type="number" min="0" max="10" id="sessScore" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  </div>
                  <div><label className="text-xs text-zinc-400">Observaciones</label><textarea id="sessObs" rows={3} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <div><label className="text-xs text-zinc-400">Compromisos</label><textarea id="sessComm" rows={2} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <Button onClick={handleSaveSession} className="w-full bg-blue-600 hover:bg-blue-700">Guardar Sesión</Button>
                </CardContent>
              </Card>
              <div className="space-y-4"><h3 className="text-white font-bold">Historial</h3>{sessionHistory.length === 0 ? <p className="text-zinc-500">Sin sesiones</p> : sessionHistory.map((s:any) => (<Card key={s.id} className="bg-zinc-900 border-zinc-800"><CardHeader className="pb-2"><div className="flex justify-between"><span className="text-white font-bold">Sesión {s.session_number}: {s.module_topic}</span><Badge className={s.patient_status_score>=7?'bg-green-900 text-green-400':s.patient_status_score>=4?'bg-yellow-900 text-yellow-400':'bg-red-900 text-red-400'}>{s.patient_status_score}/10</Badge></div></CardHeader><CardContent className="text-sm text-zinc-300"><p><span className="text-zinc-500">Obs:</span> {s.clinical_observations}</p><p><span className="text-zinc-500">Comp:</span> {s.patient_commitments||'N/A'}</p></CardContent></Card>))}</div>
            </div>
          )}

          {/* Gestión de Estado (Siempre visible en Datos Clínicos) */}
          <Card className="bg-zinc-900 border-zinc-800 mt-8">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500"/> Gestión de Estado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs text-zinc-400">Estado</label><select value={currentStatus} onChange={(e)=>setCurrentStatus(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="deserter">Desertor</option></select></div>
                {(currentStatus==='inactive'||currentStatus==='deserter') && <div><label className="text-xs text-zinc-400">Fecha</label><input type="date" value={statusDate} onChange={(e)=>setStatusDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>}
              </div>
              <div><label className="text-xs text-zinc-400">Comentario</label><textarea value={statusComment} onChange={(e)=>setStatusComment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"></textarea></div>
              {currentStatus==='deserter' && <div><label className="text-xs text-zinc-400">Pruebas (URL)</label><input type="text" value={statusEvidence} onChange={(e)=>setStatusEvidence(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>}
              {currentStatus==='inactive' && <div><label className="text-xs text-zinc-400">Retorno Estimado</label><input type="date" value={expectedReturn} onChange={(e)=>setExpectedReturn(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>}
              <Button onClick={handleSaveStatus} disabled={savingStatus} className="w-full bg-blue-600 hover:bg-blue-700">{savingStatus?'Guardando...':'Actualizar Estado'}</Button>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}