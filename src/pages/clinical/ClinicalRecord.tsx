import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, AlertCircle, Save, Upload, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para Pestañas Principales
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');

  // Estados para ROL
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [newRisk, setNewRisk] = useState('low');
  const [commentText, setCommentText] = useState('');
  const [planText, setPlanText] = useState('');
  const [sessionNum, setSessionNum] = useState(1);

  // Estados para GESTIÓN DE ESTADO DEL PACIENTE
  const [currentStatus, setCurrentStatus] = useState('active');
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  // Formulario Estado
  const [statusDate, setStatusDate] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cargar Datos Iniciales
  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
    fetchRolLogs();
    fetchStatusLogs();
  }, [patientId]);

  const fetchPatientData = async () => {
    const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
    if (!error && data) {
      setPatient(data);
      setCurrentStatus(data.status || 'active');
    }
    setLoading(false);
  };

  const fetchRolLogs = async () => {
    const { data } = await supabase.from('patient_rol_logs').select('*').eq('patient_id', patientId).order('session_number', { ascending: true });
    if (data) setRolLogs(data);
  };

  const fetchStatusLogs = async () => {
    const { data } = await supabase.from('patient_status_logs').select('*').eq('patient_id', patientId).order('changed_at', { ascending: false });
    if (data) setStatusLogs(data);
  };

  // --- HANDLERS: ROL ---
  const handleSaveRol = async () => {
    if (!user) return;
    const riskVal = newRisk === 'high' ? 3 : newRisk === 'medium' ? 2 : 1;
    const { error } = await supabase.from('patient_rol_logs').insert([{
      patient_id: patientId,
      created_by: user.id,
      session_number: parseInt(sessionNum.toString()),
      risk_level: newRisk,
      risk_numeric: riskVal,
      comments: commentText,
      action_plan: planText
    }]);
    if (!error) {
      alert('✅ ROL guardado correctamente');
      setCommentText(''); setPlanText(''); setSessionNum(s => s + 1);
      fetchRolLogs();
    } else {
      alert('❌ Error: ' + error.message);
    }
  };

  // --- HANDLERS: ESTADO DEL PACIENTE ---
  const handleStatusChange = async () => {
    if (!user || !patientId) return;
    setUploading(true);
    
    let proofUrl = null;
    // Simulación de subida de archivo (en producción usar supabase.storage)
    if (proofFile && currentStatus === 'deserter') {
      // Aquí iría la lógica real de storage. Por ahora simulamos éxito.
      proofUrl = "archivo_adjunto_simulado.pdf"; 
    }

    const { error } = await supabase.from('patient_status_logs').insert([{
      patient_id: patientId,
      changed_by: user.id,
      status: currentStatus,
      changed_at: statusDate || new Date().toISOString(),
      deserter_date: currentStatus === 'deserter' ? statusDate : null,
      deserter_reason: currentStatus === 'deserter' ? statusReason : null,
      deserter_proof_url: proofUrl,
      inactive_reason: currentStatus === 'inactive' ? statusReason : null,
      expected_return_date: currentStatus === 'inactive' ? returnDate : null
    }]);

    // Actualizar también el estado en la tabla patients
    if (!error) {
      await supabase.from('patients').update({ status: currentStatus }).eq('id', patientId);
      alert('✅ Estado actualizado correctamente');
      setStatusReason(''); setReturnDate(''); setStatusDate(''); setProofFile(null);
      fetchPatientData();
      fetchStatusLogs();
    } else {
      alert('❌ Error al guardar: ' + error.message);
    }
    setUploading(false);
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  // Preparar datos para gráfica ROL
  const rolChartData = rolLogs.map((log, idx) => ({
    session: `Sesión ${log.session_number || idx + 1}`,
    risk: log.risk_numeric || (log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1)
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{patient.full_name}</h1>
          <p className="text-zinc-400 text-sm">{patient.email} • {patient.phone}</p>
        </div>
        <Badge className={`ml-auto ${currentStatus === 'active' ? 'bg-green-900 text-green-400' : currentStatus === 'inactive' ? 'bg-orange-900 text-orange-400' : 'bg-red-900 text-red-400'}`}>
          {currentStatus === 'active' ? 'Activo' : currentStatus === 'inactive' ? 'Inactivo' : 'Desertor'}
        </Badge>
      </div>

      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-2 px-4 ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Datos Clínicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Evaluaciones</button>
      </div>

      {/* CONTENIDO: DATOS CLÍNICOS & ESTADO */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* 1. Gestión de Estado del Paciente */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><AlertCircle className="text-blue-500"/> Gestión de Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase">Estado Actual</label>
                  <select 
                    value={currentStatus} 
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="deserter">Desertor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase">Fecha del Cambio</label>
                  <input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" />
                </div>
              </div>

              {/* Campos Condicionales */}
              {currentStatus === 'deserter' && (
                <div className="bg-red-900/10 p-4 rounded border border-red-900/30 space-y-3">
                  <div>
                    <label className="text-xs text-red-400 uppercase">Motivo del Abandono</label>
                    <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" rows={2} placeholder="Explique por qué se marca como desertor..." />
                  </div>
                  <div>
                    <label className="text-xs text-red-400 uppercase">Pruebas de Comunicación (PDF/Img)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-900 file:text-red-200 hover:file:bg-red-800" />
                    </div>
                  </div>
                </div>
              )}

              {currentStatus === 'inactive' && (
                <div className="bg-orange-900/10 p-4 rounded border border-orange-900/30 space-y-3">
                  <div>
                    <label className="text-xs text-orange-400 uppercase">Motivo de Pausa</label>
                    <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" rows={2} placeholder="Explique la razón de la inactividad..." />
                  </div>
                  <div>
                    <label className="text-xs text-orange-400 uppercase">Fecha Estimada de Retorno</label>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" />
                  </div>
                </div>
              )}

              <Button onClick={handleStatusChange} disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {uploading ? 'Guardando...' : 'Actualizar Estado'}
              </Button>
            </CardContent>
          </Card>

          {/* 2. Historial de Cambios de Estado */}
          {statusLogs.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-sm">Historial de Estados</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded border border-zinc-800 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge className={log.status === 'active' ? 'bg-green-900 text-green-400' : log.status === 'inactive' ? 'bg-orange-900 text-orange-400' : 'bg-red-900 text-red-400'}>
                          {log.status.toUpperCase()}
                        </Badge>
                        <span className="text-zinc-300">{new Date(log.changed_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        {log.deserter_reason && <p>Causa: {log.deserter_reason}</p>}
                        {log.inactive_reason && <p>Causa: {log.inactive_reason}</p>}
                        {log.expected_return_date && <p>Retorno: {new Date(log.expected_return_date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Notas de Evolución (Existente) */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="text-purple-500"/> Notas de Evolución</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 min-h-[150px] text-zinc-400 text-sm">
                {patient.notes ? <p className="whitespace-pre-wrap">{patient.notes}</p> : <p>Sin notas clínicas.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENIDO: ROL SEMANAL */}
      {activeTab === 'rol' && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Registro ROL (Riesgo de Abandono)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">Sesión #</label>
                  <input type="number" value={sessionNum} onChange={e => setSessionNum(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Nivel de Riesgo</label>
                  <select value={newRisk} onChange={e => setNewRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1">
                    <option value="low">Bajo (Verde)</option>
                    <option value="medium">Medio (Amarillo)</option>
                    <option value="high">Alto (Rojo)</option>
                  </select>
                </div>
              </div>
              
              {(newRisk === 'medium' || newRisk === 'high') && (
                <>
                  <div>
                    <label className="text-xs text-zinc-400">Comentarios / Justificación</label>
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" rows={2} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Plan de Acción</label>
                    <textarea value={planText} onChange={e => setPlanText(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white mt-1" rows={2} />
                  </div>
                </>
              )}
              <Button onClick={handleSaveRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Guardar Registro ROL</Button>
            </CardContent>
          </Card>

          {/* Gráfica ROL */}
          {rolChartData.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-sm">Evolución del Riesgo</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rolChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="session" stroke="#666" />
                    <YAxis domain={[0, 3]} ticks={[1, 2, 3]} stroke="#666" />
                    <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a'}} />
                    <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} name="Riesgo" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CONTENIDO: EVALUACIONES */}
      {activeTab === 'eval' && (
        <div className="animate-in fade-in">
          <PsychometricEval patientId={patientId} />
        </div>
      )}
    </div>
  );
}