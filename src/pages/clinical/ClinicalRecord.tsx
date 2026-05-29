import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, AlertCircle, Save, TrendingUp, Plus, Trash2, Paperclip } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  
  // --- ESTADOS PARA GESTIÃ“N DE ESTADO DEL PACIENTE ---
  const [currentStatus, setCurrentStatus] = useState('active');
  const [statusDate, setStatusDate] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusEvidence, setStatusEvidence] = useState(''); // URL simulada
  const [expectedReturn, setExpectedReturn] = useState('');
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);

  // --- ESTADOS PARA ROL (LÃ³gica intacta) ---
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [newRisk, setNewRisk] = useState('low');
  const [sessionNum, setSessionNum] = useState(1);
  const [rolComment, setRolComment] = useState('');
  const [rolPlan, setRolPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // Cargar Datos Iniciales
  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
    fetchRolLogs();
    fetchStatusHistory();
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

  // --- LÃ“GICA DE CARGA DE ROL (INTACTA PARA RECUPERAR DATOS) ---
  const fetchRolLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });
      
      if (error) throw error;

      setRolLogs(data || []);

      // TransformaciÃ³n segura para la grÃ¡fica (Soporta datos viejos y nuevos)
      const processedData = (data || []).map((log: any, index: number) => {
        const session = log.session_number ? parseInt(log.session_number) : index + 1;
        let riskVal = log.risk_numeric;
        if (riskVal === null || riskVal === undefined) {
          if (log.risk_level === 'high') riskVal = 3;
          else if (log.risk_level === 'medium') riskVal = 2;
          else if (log.risk_level === 'low') riskVal = 1;
          else riskVal = 0;
        }
        return { session, risk: riskVal, date: log.created_at };
      });
      setChartData(processedData);
    } catch (err) { console.error("Error cargando ROL:", err); }
  };

  // --- LÃ“GICA DE CARGA DE ESTADO ---
  const fetchStatusHistory = async () => {
    // Simulado: En producciÃ³n crearÃ­as una tabla 'patient_status_logs'
    // Por ahora usamos los datos bÃ¡sicos del paciente si existen
    if(patient && patient.status_changed_at) {
       setStatusHistory([{
         status: patient.status,
         changed_at: patient.status_changed_at,
         comment: patient.status_comment || 'Sin comentario'
       }]);
    }
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const updateData: any = {
        status: currentStatus,
        status_changed_at: new Date().toISOString(),
        status_comment: statusComment
      };
      
      if (currentStatus === 'deserter') {
        updateData.deserter_date = statusDate;
        updateData.deserter_reason = statusComment;
        updateData.deserter_evidence = statusEvidence;
      } else if (currentStatus === 'inactive') {
        updateData.inactive_date = statusDate;
        updateData.expected_return = expectedReturn;
        updateData.inactive_reason = statusComment;
      }

      const { error } = await supabase.from('patients').update(updateData).eq('id', patientId);
      if (error) throw error;
      
      alert("âœ… Estado actualizado correctamente");
      fetchPatientData(); // Recargar para ver cambios
    } catch (err: any) {
      alert("âŒ Error: " + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveRol = async () => {
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
      alert("âœ… ROL guardado correctamente");
      setRolComment(''); setRolPlan('');
      fetchRolLogs(); // Recargar grÃ¡fica
    } catch (err: any) {
      alert("âŒ Error al guardar ROL: " + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clÃ­nica...</div>;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" /> {patient.full_name}
          </h1>
          <div className="flex gap-4 mt-1 text-sm text-zinc-400">
             <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
             <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patient.phone || 'N/A'}</span>
             <Badge className={getStatusColor(patient.status)}>{patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs de NavegaciÃ³n */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Datos ClÃ­nicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Evaluaciones PsicomÃ©tricas</button>
      </div>

      {/* CONTENIDO TABS */}
      {activeTab === 'eval' ? (
        <PsychometricEval patientId={patientId} />
      ) : activeTab === 'rol' ? (
        // --- PESTAÃ‘A ROL (VisualizaciÃ³n Intacta) ---
        <div className="space-y-6 animate-in fade-in">
           <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500"/> Registro de Riesgo (ROL)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">SesiÃ³n #</label>
                  <input type="number" value={sessionNum} onChange={(e) => setSessionNum(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"/>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Nivel de Riesgo</label>
                  <select value={newRisk} onChange={(e) => setNewRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white">
                    <option value="low">Bajo (Verde)</option>
                    <option value="medium">Medio (Amarillo)</option>
                    <option value="high">Alto (Rojo)</option>
                  </select>
                </div>
              </div>
              { (newRisk === 'medium' || newRisk === 'high') && (
                <div className="space-y-2 bg-zinc-950 p-3 rounded border border-zinc-800">
                   <input placeholder="Comentario: Â¿Por quÃ© este nivel?" value={rolComment} onChange={(e) => setRolComment(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white"/>
                   <textarea placeholder="Plan de AcciÃ³n para esta semana" value={rolPlan} onChange={(e) => setRolPlan(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-20"/>
                </div>
              )}
              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700">
                {savingRol ? 'Guardando...' : 'Guardar Registro ROL'}
              </Button>
            </CardContent>
          </Card>

          {/* GrÃ¡fica ROL */}
          <Card className="bg-zinc-900 border-zinc-800 h-80">
            <CardContent className="h-full flex items-center justify-center pt-6">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                     <XAxis dataKey="session" stroke="#999" label={{ value: 'SesiÃ³n', position: 'insideBottom', offset: -5 }} />
                     <YAxis stroke="#999" domain={[0, 4]} ticks={[1, 2, 3]} label={{ value: 'Riesgo', angle: -90, position: 'insideLeft' }} />
                     <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                     <Legend />
                     <Line type="monotone" dataKey="risk" stroke="#8884d8" strokeWidth={3} name="Nivel de Riesgo" dot={{ r: 6 }} />
                   </LineChart>
                 </ResponsiveContainer>
               ) : <p className="text-zinc-500">Sin datos registrados aÃºn.</p>}
            </CardContent>
          </Card>
          
          {/* Historial ROL */}
          <div className="space-y-2">
            <h3 className="text-white font-bold">Historial de Registros</h3>
            {rolLogs.map((log: any) => (
              <div key={log.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex justify-between items-center">
                <div>
                  <span className="text-white font-bold">SesiÃ³n {log.session_number}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${log.risk_level === 'high' ? 'bg-red-900 text-red-300' : log.risk_level === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                    {log.risk_level.toUpperCase()}
                  </span>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <p>{new Date(log.created_at).toLocaleDateString()}</p>
                  {log.comments && <p className="italic">"{log.comments}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // --- PESTAÃ‘A DATOS CLÃNICOS (Incluye NUEVA GestiÃ³n de Estado) ---
        <div className="space-y-6 animate-in fade-in">
          
          {/* Info Financiera BÃ¡sica */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div><p className="text-xs text-zinc-500">Valor Plan</p><p className="text-lg text-white">${patient.sale_total?.toLocaleString()}</p></div>
               <div><p className="text-xs text-zinc-500">Pagado</p><p className="text-lg text-green-400">${patient.cash_collected?.toLocaleString()}</p></div>
               <div><p className="text-xs text-zinc-500">Cuotas</p><p className="text-lg text-white">{patient.installments_count || 0}</p></div>
               <div><p className="text-xs text-zinc-500">PrÃ³xima Cuota</p><p className="text-lg text-orange-400">${patient.installment_value?.toLocaleString()}</p></div>
            </CardContent>
          </Card>

          {/* --- NUEVA SECCIÃ“N: GESTIÃ“N DE ESTADO --- */}
          <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> GestiÃ³n de Estado del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estado Actual</label>
                  <select 
                    value={currentStatus} 
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="deserter">Desertor</option>
                  </select>
                </div>
                
                {/* Campos Condicionales */}
                {(currentStatus === 'inactive' || currentStatus === 'deserter') && (
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Fecha de Cambio</label>
                    <input 
                      type="date" 
                      value={statusDate} 
                      onChange={(e) => setStatusDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Comentario / JustificaciÃ³n</label>
                <textarea 
                  value={statusComment} 
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder={currentStatus === 'deserter' ? "Explique por quÃ© se marca como desertor..." : "Motivo de inactividad..."}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"
                />
              </div>

              {currentStatus === 'deserter' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 flex items-center gap-1"><Paperclip className="w-3 h-3"/> Pruebas de ComunicaciÃ³n (URL o Referencia)</label>
                  <input 
                    type="text" 
                    value={statusEvidence} 
                    onChange={(e) => setStatusEvidence(e.target.value)}
                    placeholder="https://drive.google.com/... o ID del archivo adjunto"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Adjunte capturas de WhatsApp, correos o llamadas intentadas.</p>
                </div>
              )}

              {currentStatus === 'inactive' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Fecha Estimada de Retorno</label>
                  <input 
                    type="date" 
                    value={expectedReturn} 
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
              )}

              <Button onClick={handleSaveStatus} disabled={savingStatus} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingStatus ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </CardContent>
          </Card>

          {/* Notas de EvoluciÃ³n (Existente) */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500"/> Notas de EvoluciÃ³n</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 min-h-[100px] text-zinc-400 text-sm">
                {patient.notes ? <p className="whitespace-pre-wrap">{patient.notes}</p> : <p className="italic">Sin notas clÃ­nicas registradas aÃºn.</p>}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}