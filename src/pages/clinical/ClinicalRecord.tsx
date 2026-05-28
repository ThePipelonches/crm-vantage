import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import PsychometricEval from './PsychometricEval';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para las pestañas: 'data' | 'rol' | 'eval'
  const [activeTab, setActiveTab] = useState<'data' | 'rol' | 'eval'>('data');

  useEffect(() => {
    if (!patientId) return;
    
    const fetchPatient = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (error) throw error;
        setPatient(data);
      } catch (err) {
        console.error("Error cargando paciente:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica: {patient.full_name}</h1>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex gap-2 border-b border-zinc-800 mb-6">
        <button 
          onClick={() => setActiveTab('data')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'data' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Datos Clínicos
          {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('rol')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'rol' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          ROL Semanal
          {activeTab === 'rol' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('eval')} 
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'eval' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Evaluaciones Psicométricas
          {activeTab === 'eval' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
        </button>
      </div>

      {/* Contenido Condicional */}
      {activeTab === 'eval' ? (
        <PsychometricEval patientId={patientId} />
      ) : activeTab === 'rol' ? (
        /* --- SECCIÓN ROL (Básica por ahora) --- */
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-yellow-500"/> Riesgo de Abandono (ROL)</CardTitle></CardHeader>
          <CardContent className="text-zinc-400">
            <p>Formulario de ROL pendiente de implementación completa en esta vista.</p>
          </CardContent>
        </Card>
      ) : (
        /* --- SECCIÓN DATOS CLÍNICOS (Original) --- */
        <>
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

          {/* Historial Básico */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" /> Notas de Evolución
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 min-h-[200px] text-zinc-400 text-sm">
                {patient.notes ? (
                  <p className="whitespace-pre-wrap">{patient.notes}</p>
                ) : (
                  <p className="italic">Sin notas clínicas registradas aún.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}