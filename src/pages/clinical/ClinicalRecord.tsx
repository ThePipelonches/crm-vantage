import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [rolLogs, setRolLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para pestaÃ±as principales
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');

  // Estados para formulario ROL
  const [newRisk, setNewRisk] = useState('low');
  const [commentText, setCommentText] = useState('');
  const [planText, setPlanText] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Paciente
      const { data: pData, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      if (pErr) throw pErr;
      setPatient(pData);

      // 2. Cargar Historial ROL
      const { data: rData, error: rErr } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });
      
      if (!rErr) setRolLogs(rData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRol = async () => {
    if (!patientId) return;
    setSavingRol(true);
    
    // Calcular sesiÃ³n siguiente
    const nextSession = (rolLogs.length > 0 ? Math.max(...rolLogs.map((l: any) => l.session_number || 0)) : 0) + 1;
    
    // Mapeo de riesgo texto a nÃºmero
    const riskMap: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
    const riskNum = riskMap[newRisk] || 1;

    try {
      const { error } = await supabase.from('patient_rol_logs').insert([{
        patient_id: patientId,
        session_number: nextSession,
        risk_level: newRisk,
        risk_numeric: riskNum,
        comments: commentText || null,
        action_plan: planText || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }]);

      if (error) throw error;

      alert('âœ… ROL guardado correctamente');
      setCommentText('');
      setPlanText('');
      fetchData(); // Recargar grÃ¡fica
    } catch (err: any) {
      alert('âŒ Error: ' + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  // Preparar datos para la grÃ¡fica (Compatibilidad Legacy)
  const chartData = (rolLogs || []).map((log: any, index: number) => {
    const session = log.session_number ? parseInt(log.session_number) : index + 1;
    let riskVal = log.risk_numeric;
    
    // Fallback para registros antiguos sin risk_numeric
    if (riskVal === null || riskVal === undefined) {
      if (log.risk_level === 'high') riskVal = 3;
      else if (log.risk_level === 'medium') riskVal = 2;
      else if (log.risk_level === 'low') riskVal = 1;
      else riskVal = 0;
    }
    
    return { session, risk: riskVal, level: log.risk_level };
  });

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" /> {patient.full_name}
          </h1>
          <div className="flex gap-4 mt-1 text-sm text-zinc-400">
            <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
            <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patient.phone || 'N/A'}</span>
            <Badge className={`${getStatusColor(patient.status)} border px-2 py-0 text-xs`}>
              {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}
            </Badge>
          </div>
        </div>
      </div>

      {/* PestaÃ±as Principales */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Datos ClÃ­nicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Evaluaciones</button>
      </div>

      {/* Contenido DinÃ¡mico */}
      {activeTab === 'eval' ? (
        <PsychometricEval patientId={patientId} />
      ) : activeTab === 'rol' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Formulario ROL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500"/> Registrar Nueva SesiÃ³n (SesiÃ³n {rolLogs.length + 1})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nivel de Riesgo</label>
                  <select value={newRisk} onChange={(e) => setNewRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 text-white rounded p-2">
                    <option value="low">Bajo (Verde)</option>
                    <option value="medium">Medio (Amarillo)</option>
                    <option value="high">Alto (Rojo)</option>
                  </select>
                </div>
              </div>
              
              {(newRisk === 'medium' || newRisk === 'high') && (
                <div className="space-y-4 p-4 bg-zinc-950/50 rounded border border-zinc-800 animate-in fade-in">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Comentarios (Â¿Por quÃ© este nivel?)</label>
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 h-20" placeholder="Describa los indicadores observados..." />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Plan de AcciÃ³n</label>
                    <textarea value={planText} onChange={(e) => setPlanText(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 h-20" placeholder="Estrategias para esta semana..." />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {savingRol ? 'Guardando...' : 'Guardar Registro ROL'}
              </Button>
            </CardContent>
          </Card>

          {/* GrÃ¡fica ROL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500"/> EvoluciÃ³n del Riesgo por SesiÃ³n</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="session" stroke="#999" label={{ value: 'SesiÃ³n', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#999" domain={[0, 4]} ticks={[1, 2, 3]} label={{ value: 'Riesgo', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                      labelFormatter={(val) => `SesiÃ³n ${val}`}
                      formatter={(val: number) => {
                        if (val === 1) return ['Bajo', 'Riesgo'];
                        if (val === 2) return ['Medio', 'Riesgo'];
                        if (val === 3) return ['Alto', 'Riesgo'];
                        return [val, 'Riesgo'];
                      }}
                    />
                    <ReferenceLine y={1.5} stroke="#4ade80" strokeDasharray="3 3" label={{ value: 'LÃ­mite Bajo', fill: '#4ade80', fontSize: 12 }} />
                    <ReferenceLine y={2.5} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'LÃ­mite Medio', fill: '#fbbf24', fontSize: 12 }} />
                    <Line type="monotone" dataKey="risk" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">Sin datos registrados aÃºn</div>
              )}
            </CardContent>
          </Card>

          {/* Tabla HistÃ³rica */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Historial de Registros</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                  <thead className="text-xs uppercase bg-zinc-950 text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">SesiÃ³n</th>
                      <th className="px-4 py-3">Riesgo</th>
                      <th className="px-4 py-3">Comentarios</th>
                      <th className="px-4 py-3">Plan de AcciÃ³n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d, i) => (
                      <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="px-4 py-3 font-mono text-white">{d.session}</td>
                        <td className="px-4 py-3">
                          <Badge className={d.risk === 1 ? 'bg-green-900 text-green-400' : d.risk === 2 ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}>
                            {d.risk === 1 ? 'Bajo' : d.risk === 2 ? 'Medio' : 'Alto'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{rolLogs[i]?.comments || '-'}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{rolLogs[i]?.action_plan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* PestaÃ±a Datos ClÃ­nicos */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" /> InformaciÃ³n Financiera
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
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
              <div>
                <p className="text-xs text-zinc-500 uppercase">Fecha Inicio</p>
                <p className="text-white">{new Date(patient.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" /> Notas Generales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 min-h-[150px] text-zinc-400 text-sm">
                {patient.notes ? (
                  <p className="whitespace-pre-wrap">{patient.notes}</p>
                ) : (
                  <p className="italic">Sin notas generales registradas.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}