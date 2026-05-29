import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [rolData, setRolData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para pestaÃ±as internas
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');
  
  // Estados para formulario ROL
  const [sessionNum, setSessionNum] = useState(1);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [comments, setComments] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Datos Paciente
      const { data: pData, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (pErr) throw pErr;
      setPatient(pData);

      // 2. Cargar HistÃ³rico ROL
      const { data: rData, error: rErr } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });

      if (!rErr && rData) {
        setRolData(rData);
        // Auto-sugerir siguiente nÃºmero de sesiÃ³n
        const lastSession = rData.length > 0 ? rData[rData.length - 1].session_number : 0;
        setSessionNum(lastSession + 1);
      }
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
      let numericVal = 0;
      if (riskLevel === 'low') numericVal = 1;
      else if (riskLevel === 'medium') numericVal = 2;
      else if (riskLevel === 'high') numericVal = 3;

      const { error } = await supabase.from('patient_rol_logs').insert([{
        patient_id: patientId,
        created_by: user.id,
        session_number: sessionNum,
        risk_level: riskLevel,
        risk_numeric: numericVal,
        comments: comments || null,
        action_plan: actionPlan || null
      }]);

      if (error) throw error;
      
      alert("âœ… ROL guardado correctamente");
      setComments('');
      setActionPlan('');
      fetchData(); // Recargar grÃ¡fica
    } catch (err: any) {
      alert("âŒ Error: " + err.message);
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

  const getRiskColor = (level: string) => {
    if (level === 'low') return 'text-green-500 fill-green-500';
    if (level === 'medium') return 'text-yellow-500 fill-yellow-500';
    return 'text-red-500 fill-red-500';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia ClÃ­nica</h1>
      </div>

      {/* Info Paciente */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> {patient.full_name}
              </CardTitle>
              <div className="flex gap-4 mt-2 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patient.phone || 'N/A'}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor(patient.status)} border px-3 py-1`}>
              {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de NavegaciÃ³n */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setActiveTab('data')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Datos ClÃ­nicos</button>
        <button onClick={() => setActiveTab('rol')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'rol' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>ROL Semanal</button>
        <button onClick={() => setActiveTab('eval')} className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'eval' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Evaluaciones PsicomÃ©tricas</button>
      </div>

      {/* Contenido DinÃ¡mico */}
      {activeTab === 'data' && (
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Notas Generales</h3>
          <p className="text-zinc-400">{patient.notes || "Sin notas registradas."}</p>
        </Card>
      )}

      {activeTab === 'rol' && (
        <div className="space-y-6">
          {/* Formulario ROL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white">Registrar ROL - SesiÃ³n #{sessionNum}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">NÃºmero de SesiÃ³n</label>
                  <input type="number" value={sessionNum} onChange={(e) => setSessionNum(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nivel de Riesgo</label>
                  <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white">
                    <option value="low">Verde (Bajo)</option>
                    <option value="medium">Amarillo (Medio)</option>
                    <option value="high">Rojo (Alto)</option>
                  </select>
                </div>
              </div>
              
              {riskLevel !== 'low' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">JustificaciÃ³n del Riesgo</label>
                    <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20" placeholder="Â¿Por quÃ© aumentÃ³ el riesgo?" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Plan de AcciÃ³n</label>
                    <textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20" placeholder="Acciones concretas para esta semana" />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveRol} disabled={savingRol} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {savingRol ? 'Guardando...' : 'Guardar Registro ROL'}
              </Button>
            </CardContent>
          </Card>

          {/* GrÃ¡fica ROL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5"/> EvoluciÃ³n del Riesgo por SesiÃ³n</CardTitle></CardHeader>
            <CardContent className="h-64">
              {rolData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rolData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="session_number" stroke="#888" label={{ value: 'SesiÃ³n', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#888" domain={[0, 4]} ticks={[1, 2, 3]} label={{ value: 'Riesgo', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                      formatter={(val: number) => val === 1 ? 'Bajo' : val === 2 ? 'Medio' : 'Alto'}
                    />
                    <ReferenceLine y={1.5} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Bajo', fill: '#22c55e', fontSize: 12 }} />
                    <ReferenceLine y={2.5} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Medio', fill: '#eab308', fontSize: 12 }} />
                    <Line type="monotone" dataKey="risk_numeric" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">No hay registros aÃºn</div>
              )}
            </CardContent>
          </Card>
          
          {/* Tabla HistÃ³rica */}
          <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
                 <tr><th className="px-4 py-3">SesiÃ³n</th><th className="px-4 py-3">Riesgo</th><th className="px-4 py-3">Comentarios</th><th className="px-4 py-3">Plan</th></tr>
               </thead>
               <tbody className="divide-y divide-zinc-800 text-zinc-300">
                 {rolData.map((row: any) => (
                   <tr key={row.id}>
                     <td className="px-4 py-3 font-mono">#{row.session_number}</td>
                     <td className="px-4 py-3">
                       <Badge className={row.risk_level === 'low' ? 'bg-green-900 text-green-400' : row.risk_level === 'medium' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}>
                         {row.risk_level === 'low' ? 'Bajo' : row.risk_level === 'medium' ? 'Medio' : 'Alto'}
                       </Badge>
                     </td>
                     <td className="px-4 py-3 max-w-xs truncate">{row.comments || '-'}</td>
                     <td className="px-4 py-3 max-w-xs truncate">{row.action_plan || '-'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'eval' && (
        <PsychometricEval patientId={patientId!} />
      )}
    </div>
  );
}