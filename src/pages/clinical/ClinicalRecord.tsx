import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Activity, FileText, Save, TrendingUp, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs Principales
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  const [innerTab, setInnerTab] = useState<'protocol' | 'sessions'>('protocol');

  // Estados Gestión de Estado Paciente
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

  // Estados Protocolo Clínico (Editable)
  const [protoAffiliation, setProtoAffiliation] = useState('');
  const [protoMentalCapital, setProtoMentalCapital] = useState('');
  const [protoDiagnosis, setProtoDiagnosis] = useState('');
  const [protoAxes, setProtoAxes] = useState('');
  const [protoPlan, setProtoPlan] = useState('');
  const [savingProto, setSavingProto] = useState(false);

  // Estados Sesiones
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
    } catch (err) { console.error("Error paciente:", err); } 
    finally { setLoading(false); }
  };

  const fetchRolLogs = async () => {
    try {
      const { data, error } = await supabase.from('patient_rol_logs').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if (error) throw error;
      setRolLogs(data || []);
      const processed = (data || []).map((log: any, i: number) => ({
        session: log.session_number || i + 1,
        risk: log.risk_numeric || (log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1)
      }));
      setChartData(processed);
    } catch (err) { console.error("Error ROL:", err); }
  };

  const fetchProtocol = async () => {
    try {
      const { data, error } = await supabase.from('clinical_protocols').select('*').eq('patient_id', patientId).single();
      if (data) {
        setProtoAffiliation(data.affiliation_data || '');
        setProtoMentalCapital(data.mental_capital_eval || '');
        setProtoDiagnosis(data.functional_diagnosis || '');
        setProtoAxes(data.axes_analysis || '');
        setProtoPlan(data.treatment_plan || '');
      }
    } catch (err) { console.log("Sin protocolo previo, se inicia vacío."); }
  };

  const fetchSessionHistory = async () => {
    try {
      const { data, error } = await supabase.from('patient_sessions').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
      if (!error && data) setSessionHistory(data);
    } catch (err) { console.error("Error sesiones:", err); }
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const updateData: any = { status: currentStatus, status_changed_at: new Date().toISOString(), status_comment: statusComment };
      if (currentStatus === 'deserter') { updateData.deserter_date = statusDate; updateData.deserter_reason = statusComment; }
      else if (currentStatus === 'inactive') { updateData.expected_return = expectedReturn; updateData.inactive_reason = statusComment; }
      
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
        patient_id: patientId, session_number: parseInt(sessionNum.toString()),
        risk_level: newRisk, risk_numeric: newRisk === 'high' ? 3 : newRisk === 'medium' ? 2 : 1,
        comments: rolComment, action_plan: rolPlan
      }]);
      if (error) throw error;
      alert("✅ ROL guardado");
      setRolComment(''); setRolPlan('');
      fetchRolLogs();
    } catch (err: any) { alert("❌ Error ROL: " + err.message); }
    finally { setSavingRol(false); }
  };

  const handleSaveProtocol = async () => {
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
      
      // Upsert: Intenta actualizar, si no existe, inserta
      const { error: upErr } = await supabase.from('clinical_protocols').update(payload).eq('patient_id', patientId);
      if (upErr) {
        const { error: insErr } = await supabase.from('clinical_protocols').insert([payload]);
        if (insErr) throw insErr;
      }
      alert("✅ Historia Clínica (Protocolo) guardada correctamente");
    } catch (err: any) { alert("❌ Error Protocolo: " + err.message); }
    finally { setSavingProto(false); }
  };

  const handleSaveSession = async () => {
    const numEl = document.getElementById('sessNum') as HTMLInputElement;
    const topicEl = document.getElementById('sessTopic') as HTMLInputElement;
    const obsEl = document.getElementById('sessObs') as HTMLTextAreaElement;
    const commEl = document.getElementById('sessComm') as HTMLTextAreaElement;
    const scoreEl = document.getElementById('sessScore') as HTMLInputElement;

    if (!numEl || !topicEl || !numEl.value || !topicEl.value) { alert("⚠️ Completa Sesión y Tema"); return; }

    try {
      const { error } = await supabase.from('patient_sessions').insert([{
        patient_id: patientId,
        session_number: parseInt(numEl.value),
        module_topic: topicEl.value,
        clinical_observations: obsEl?.value || '',
        patient_commitments: commEl?.value || '',
        patient_status_score: scoreEl?.value ? parseInt(scoreEl.value) : null
      }]);
      if (error) throw error;
      alert("✅ Sesión guardada");
      // Limpiar
      if(numEl) numEl.value = ''; if(topicEl) topicEl.value = '';
      if(obsEl) obsEl.value = ''; if(commEl) commEl.value = ''; if(scoreEl) scoreEl.value = '';
      fetchSessionHistory();
    } catch (e: any) { alert("❌ Error Sesión: " + e.message); }
  };

  if (loading) return <div className="p-6 text-white">Cargando...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2"/> Volver</Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6 text-blue-500"/> {patient.full_name}</h1>
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
          <Card className="bg-zinc-900 border-zinc-800 h-64"><CardContent className="h-full pt-6">{chartData.length>0?<ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#333"/><XAxis dataKey="session" stroke="#999"/><YAxis domain={[0,4]} stroke="#999"/><Tooltip contentStyle={{backgroundColor:'#18181b',borderColor:'#333'}}/><Line type="monotone" dataKey="risk" stroke="#8884d8" strokeWidth={3}/></LineChart></ResponsiveContainer>:<p className="text-zinc-500 text-center">Sin datos</p>}</CardContent></Card>
          <div className="space-y-2">{rolLogs.map((l:any)=><div key={l.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between"><span className="text-white font-bold">Sesión {l.session_number}</span><span className="text-xs text-zinc-400">{l.comments}</span></div>)}</div>
        </div>
      ) : (
        /* --- DATOS CLÍNICOS (Con Sub-Tabs) --- */
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-Tabs Internas */}
          <div className="flex gap-2 mb-4 pl-4 border-l-2 border-blue-500">
            <button onClick={()=>setInnerTab('protocol')} className={`text-sm px-3 py-1 rounded ${innerTab==='protocol'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Protocolo Neuro-Apogeo</button>
            <button onClick={()=>setInnerTab('sessions')} className={`text-sm px-3 py-1 rounded ${innerTab==='sessions'?'bg-zinc-800 text-white':'text-zinc-500'}`}>Historial de Sesiones</button>
          </div>

          {innerTab === 'protocol' ? (
            <div className="space-y-6">
              {/* Gestión de Estado (Resumen) */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-sm">Gestión Rápida de Estado</CardTitle></CardHeader>
                <CardContent className="flex gap-4 items-end">
                  <div className="flex-1"><label className="text-xs text-zinc-400">Estado</label><select value={currentStatus} onChange={e=>setCurrentStatus(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="deserter">Desertor</option></select></div>
                  <Button onClick={handleSaveStatus} disabled={savingStatus} className="bg-blue-600">{savingStatus?'...':'Actualizar'}</Button>
                </CardContent>
              </Card>

              {/* Formulario Protocolo Editable */}
              <div className="space-y-4">
                <div><label className="text-xs text-blue-400 font-bold block mb-1">I. DATOS DE FILIACIÓN</label><textarea value={protoAffiliation} onChange={e=>setProtoAffiliation(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-32"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">II. EVALUACIÓN CAPITAL MENTAL</label><textarea value={protoMentalCapital} onChange={e=>setProtoMentalCapital(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">III. DIAGNÓSTICO FUNCIONAL</label><textarea value={protoDiagnosis} onChange={e=>setProtoDiagnosis(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">IV. ANÁLISIS POR EJES</label><textarea value={protoAxes} onChange={e=>setProtoAxes(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-64"/></div>
                <div><label className="text-xs text-blue-400 font-bold block mb-1">V. PLAN DE TRATAMIENTO</label><textarea value={protoPlan} onChange={e=>setProtoPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white h-48"/></div>
                
                <Button onClick={handleSaveProtocol} disabled={savingProto} className="w-full bg-green-700 hover:bg-green-600 text-white py-4 text-lg font-bold">
                  {savingProto ? 'Guardando Historia Clínica...' : '💾 GUARDAR HISTORIA CLÍNICA COMPLETA'}
                </Button>
              </div>
            </div>
          ) : (
            /* --- HISTORIAL DE SESIONES --- */
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
                <CardHeader><CardTitle className="text-white">Registrar Nueva Sesión</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-xs text-zinc-400">N° Sesión</label><input type="number" id="sessNum" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div className="col-span-2"><label className="text-xs text-zinc-400">Módulo/Tema</label><input type="text" id="sessTopic" placeholder="Ej: Módulo 2" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                    <div><label className="text-xs text-zinc-400">Estado (0-10)</label><input type="number" min="0" max="10" id="sessScore" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/></div>
                  </div>
                  <div><label className="text-xs text-zinc-400">Observaciones</label><textarea id="sessObs" rows={3} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <div><label className="text-xs text-zinc-400">Compromisos</label><textarea id="sessComm" rows={2} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"></textarea></div>
                  <Button onClick={handleSaveSession} className="w-full bg-blue-600">Guardar Sesión</Button>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <h3 className="text-white font-bold">Historial</h3>
                {sessionHistory.length===0 ? <p className="text-zinc-500">Sin sesiones.</p> : sessionHistory.map((s:any)=>(
                  <Card key={s.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2"><div className="flex justify-between"><span className="text-white font-bold">Sesión {s.session_number}: {s.module_topic}</span><Badge className={s.patient_status_score>=7?'bg-green-900':s.patient_status_score>=4?'bg-yellow-900':'bg-red-900'}>{s.patient_status_score}/10</Badge></div></CardHeader>
                    <CardContent className="text-sm text-zinc-300 space-y-1"><p><span className="text-zinc-500">Obs:</span> {s.clinical_observations}</p><p><span className="text-zinc-500">Comp:</span> {s.patient_commitments||'-'}</p></CardContent>
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