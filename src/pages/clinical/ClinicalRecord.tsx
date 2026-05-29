import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PsychometricEval from './PsychometricEval'; // <--- IMPORTANTE: Asegura que este archivo exista

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [rolData, setRolData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADO DE PESTAÑAS (Clave para que funcione)
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');

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

      // 2. Cargar Historial ROL
      const { data: rData, error: rErr } = await supabase
        .from('patient_rol_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_number', { ascending: true });
      
      if (!rErr) setRolData(rData || []);

    } catch (err) {
      console.error("Error cargando historia clínica:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-900 text-green-400 border-green-800';
      case 'inactive': return 'bg-orange-900 text-orange-400 border-orange-800';
      case 'deserter': return 'bg-red-900 text-red-400 border-red-800';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  // --- RENDERIZADO DE PESTAÑAS ---
  const renderContent = () => {
    switch (activeTab) {
      case 'rol':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Gráfica ROL */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Evolución del Riesgo (ROL)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {rolData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rolData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="session_number" stroke="#888" label={{ value: 'Sesión', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#888" domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelFormatter={(val) => `Sesión ${val}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="risk_numeric" name="Nivel de Riesgo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">No hay registros de ROL aún.</div>
                )}
              </CardContent>
            </Card>

            {/* Formulario ROL */}
            <RolForm patientId={patientId} onRefresh={fetchData} />
          </div>
        );

      case 'eval':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <PsychometricEval patientId={patientId} />
          </div>
        );

      case 'data':
      default:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
              <CardContent className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Valor Plan</p>
                  <p className="text-lg font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Pago Inicial</p>
                  <p className="text-lg font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Notas Generales</CardTitle></CardHeader>
              <CardContent>
                <p className="text-zinc-400">{patient.notes || "Sin notas registradas."}</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Navegación */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica</h1>
      </div>

      {/* Tabs Superiores */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('data')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'data' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Datos Clínicos
          {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('rol')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'rol' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          ROL Semanal
          {activeTab === 'rol' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('eval')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'eval' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Evaluaciones Psicométricas
          {activeTab === 'eval' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
      </div>

      {/* Contenido Dinámico */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}

// Componente interno simplificado para el formulario ROL (para mantener todo en un archivo si es necesario)
function RolForm({ patientId, onRefresh }: { patientId: string, onRefresh: () => void }) {
  const [session, setSession] = useState('');
  const [risk, setRisk] = useState('low');
  const [comment, setComment] = useState('');
  const [plan, setPlan] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!session) return alert("Ingresa el número de sesión");
    setSaving(true);
    
    const riskMap: any = { low: 1, medium: 2, high: 3 };
    
    const { error } = await supabase.from('patient_rol_logs').insert([{
      patient_id: patientId,
      session_number: parseInt(session),
      risk_level: risk,
      risk_numeric: riskMap[risk],
      comments: comment,
      action_plan: plan,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }]);

    if (error) {
      alert("❌ Error: " + error.message);
    } else {
      alert("✅ ROL guardado correctamente");
      setSession(''); setComment(''); setPlan(''); setRisk('low');
      onRefresh();
    }
    setSaving(false);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader><CardTitle className="text-white">Registrar Nueva Sesión</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400">Número de Sesión</label>
            <input type="number" value={session} onChange={e => setSession(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" placeholder="Ej: 1" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Nivel de Riesgo</label>
            <select value={risk} onChange={e => setRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
              <option value="low">Verde (Bajo)</option>
              <option value="medium">Amarillo (Medio)</option>
              <option value="high">Rojo (Alto)</option>
            </select>
          </div>
        </div>
        
        {(risk === 'medium' || risk === 'high') && (
          <>
            <div>
              <label className="text-xs text-zinc-400">Justificación del Riesgo</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white h-20" placeholder="¿Por qué este nivel?" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Plan de Acción</label>
              <textarea value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white h-20" placeholder="Acciones para esta semana" />
            </div>
          </>
        )}
        
        <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? 'Guardando...' : 'Guardar Registro'}
        </Button>
      </CardContent>
    </Card>
  );
}