import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, User, Phone, Mail, Activity, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formulario ROL
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  const [riskLevel, setRiskLevel] = useState('low');
  const [sessionNum, setSessionNum] = useState(1);
  const [comments, setComments] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (!patientId) return;
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Datos Paciente
      const { data: pData, error: pErr } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (pErr) throw pErr;
      setPatient(pData);

      // 2. Historial ROL (Ordenado por sesión)
      const { data: rData, error: rErr } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });
      
      if (!rErr && rData) {
        setRolLogs(rData);
        // Auto-sugerir siguiente número de sesión
        const nextSession = rData.length > 0 ? Math.max(...rData.map((l: any) => l.session_number)) + 1 : 1;
        setSessionNum(nextSession);
      }

      // 3. Evaluaciones (Si existiera la tabla, aquí cargaríamos)
      // const { data: eData } = await supabase.from('psychometric_evaluations')...
      
    } catch (err) {
      console.error("Error cargando datos:", err);
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
        session_number: parseInt(sessionNum.toString()),
        risk_level: riskLevel,
        comments: comments || null,
        action_plan: actionPlan || null
      }]);

      if (error) throw error;

      alert("✅ ROL guardado correctamente");
      setComments('');
      setActionPlan('');
      fetchData(); // Recargar gráfica
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  // Preparar datos para la gráfica
  const chartData = rolLogs.map((log: any) => ({
    session: `Sesión ${log.session_number}`,
    value: log.risk_level === 'high' ? 3 : log.risk_level === 'medium' ? 2 : 1,
    fullRisk: log.risk_level
  }));

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'bg-red-900 text-red-400 border-red-800';
    if (level === 'medium') return 'bg-yellow-900 text-yellow-400 border-yellow-800';
    return 'bg-green-900 text-green-400 border-green-800';
  };

  const getRiskLabel = (level: string) => {
    if (level === 'high') return 'Alto';
    if (level === 'medium') return 'Medio';
    return 'Bajo';
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
            <FileText className="w-6 h-6 text-blue-500" /> Historia Clínica
          </h1>
          <p className="text-zinc-400 text-sm">{patient.full_name}</p>
        </div>
      </div>

      {/* Tabs Navegación */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Datos Generales</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500'}`}>Evaluaciones</button>
      </div>

      {/* CONTENIDO TABS */}
      {activeTab === 'data' && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white">Información del Paciente</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-zinc-300">
            <div><span className="text-zinc-500 block text-xs">Email</span>{patient.email}</div>
            <div><span className="text-zinc-500 block text-xs">Teléfono</span>{patient.phone || 'N/A'}</div>
            <div><span className="text-zinc-500 block text-xs">Estado Actual</span>
              <Badge className={getRiskColor(patient.status)}>{getRiskLabel(patient.status)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'rol' && (
        <div className="space-y-6">
          {/* GRÁFICA DE EVOLUCIÓN */}
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Evolución del Riesgo (ROL)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              {rolLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 italic">
                  No hay registros suficientes para mostrar la gráfica.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="session" stroke="#888" fontSize={12} />
                    <YAxis 
                      stroke="#888" 
                      fontSize={12} 
                      domain={[0, 4]} 
                      tickFormatter={(val) => val === 1 ? 'Bajo' : val === 2 ? 'Medio' : val === 3 ? 'Alto' : ''} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                      formatter={(value: number) => [value === 1 ? 'Bajo' : value === 2 ? 'Medio' : 'Alto', 'Riesgo']}
                    />
                    <ReferenceLine y={1.5} stroke="#22c55e" strokeDasharray="3 3" />
                    <ReferenceLine y={2.5} stroke="#eab308" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* FORMULARIO NUEVO REGISTRO */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Registrar Nueva Sesión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Número de Sesión</label>
                  <input 
                    type="number" 
                    value={sessionNum} 
                    onChange={(e) => setSessionNum(parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nivel de Riesgo</label>
                  <select 
                    value={riskLevel} 
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="low">🟢 Bajo (Verde)</option>
                    <option value="medium">🟡 Medio (Amarillo)</option>
                    <option value="high">🔴 Alto (Rojo)</option>
                  </select>
                </div>
              </div>

              {(riskLevel === 'medium' || riskLevel === 'high') && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Justificación / Comentarios</label>
                    <textarea 
                      value={comments} 
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"
                      placeholder="¿Por qué este nivel de riesgo?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Plan de Acción</label>
                    <textarea 
                      value={actionPlan} 
                      onChange={(e) => setActionPlan(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20"
                      placeholder="Acciones concretas para esta semana"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingRol ? 'Guardando...' : 'Guardar Registro'}
              </Button>
            </CardContent>
          </Card>

          {/* LISTA HISTORIAL */}
          <div className="space-y-2">
            <h3 className="text-white font-bold">Historial de Registros</h3>
            {rolLogs.map((log: any) => (
              <div key={log.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex justify-between items-center">
                <div>
                  <span className="text-white font-bold mr-2">Sesión {log.session_number}</span>
                  <Badge className={getRiskColor(log.risk_level)}>{getRiskLabel(log.risk_level)}</Badge>
                  {log.comments && <p className="text-xs text-zinc-500 mt-1 italic">"{log.comments}"</p>}
                </div>
                <span className="text-xs text-zinc-600">{new Date(log.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'eval' && (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center text-zinc-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Módulo de evaluaciones psicométricas (Próximamente)</p>
        </Card>
      )}
    </div>
  );
}