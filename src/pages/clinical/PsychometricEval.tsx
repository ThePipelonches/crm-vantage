import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Activity, AlertTriangle, CheckCircle, Save } from 'lucide-react';

// Definición estricta de Props para evitar el error TS2322
interface PsychometricEvalProps {
  patientId: string;
}

export default function PsychometricEval({ patientId }: PsychometricEvalProps) {
  const [activeMoment, setActiveMoment] = useState<'pre' | 'mid' | 'post'>('pre');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Estado local para los formularios (clave: nombre_subescala, valor: puntaje)
  const [formData, setFormData] = useState<Record<string, number>>({});
  
  // Estado para datos históricos (para gráficas)
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Cargar datos existentes al cambiar de momento o paciente
  useEffect(() => {
    if (!patientId) return;
    loadData();
  }, [patientId, activeMoment]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar datos del momento actual
      const { data: currentData, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('moment', activeMoment)
        .single();

      if (currentData) {
        // Mapear columnas de la BD al estado del formulario
        const formState: Record<string, number> = {};
        Object.keys(currentData).forEach(key => {
          if (key !== 'id' && key !== 'patient_id' && key !== 'moment' && key !== 'created_at') {
            formState[key] = currentData[key];
          }
        });
        setFormData(formState);
      } else {
        setFormData({}); // Limpiar si no hay datos
      }

      // 2. Cargar histórico para gráficas (siempre cargamos todo para comparar)
      const { data: allData } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .order('moment', { ascending: true });

      if (allData) processChartData(allData);

    } catch (err) {
      console.error("Error cargando evaluaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: any[]) => {
    // Transformar datos de BD a formato Recharts
    // Estructura esperada: [{ name: 'Autoeficacia', pre: 5, mid: 6, post: 7 }, ...]
    const metrics = ['self_efficacy', 'hope', 'resilience', 'optimism', 'emotional_exhaustion', 'depersonalization', 'personal_accomplishment', 'depression', 'anxiety', 'stress'];
    
    const chartData = metrics.map(metric => {
      const entry: any = { name: getMetricLabel(metric) };
      data.forEach(record => {
        if (record[metric] !== null && record[metric] !== undefined) {
          entry[record.moment] = record[metric];
        }
      });
      return entry;
    }).filter(item => item.pre !== undefined || item.mid !== undefined || item.post !== undefined);

    setHistoryData(chartData);
  };

  const getMetricLabel = (key: string) => {
    const labels: Record<string, string> = {
      self_efficacy: 'Autoeficacia', hope: 'Esperanza', resilience: 'Resiliencia', optimism: 'Optimismo',
      emotional_exhaustion: 'Agotamiento', depersonalization: 'Despersonalización', personal_accomplishment: 'Realización',
      depression: 'Depresión', anxiety: 'Ansiedad', stress: 'Estrés'
    };
    return labels[key] || key;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        patient_id: patientId,
        moment: activeMoment,
        ...formData
      };

      // Upsert: Insertar o actualizar si ya existe para este paciente y momento
      const { error } = await supabase
        .from('psychometric_evaluations')
        .upsert(payload, { onConflict: 'patient_id,moment' });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadData(); // Recargar para actualizar gráficas
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Configuración de campos según prueba y momento
  const getFields = () => {
    const commonPCQ = [
      { key: 'self_efficacy', label: 'Autoeficacia (PCQ)', max: 42 },
      { key: 'hope', label: 'Esperanza (PCQ)', max: 42 },
      { key: 'resilience', label: 'Resiliencia (PCQ)', max: 42 },
      { key: 'optimism', label: 'Optimismo (PCQ)', max: 42 }
    ];
    
    const mbiFields = [
      { key: 'emotional_exhaustion', label: 'Agotamiento Emocional (MBI)', max: 54 },
      { key: 'depersonalization', label: 'Despersonalización (MBI)', max: 30 },
      { key: 'personal_accomplishment', label: 'Realización Personal (MBI)', max: 48 }
    ];

    const dassFields = [
      { key: 'depression', label: 'Depresión (DASS)', max: 42 },
      { key: 'anxiety', label: 'Ansiedad (DASS)', max: 24 },
      { key: 'stress', label: 'Estrés (DASS)', max: 42 }
    ];

    if (activeMoment === 'mid') return commonPCQ; // Solo PCQ en mitad
    return [...commonPCQ, ...mbiFields, ...dassFields]; // Todo en Pre y Post
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selector de Momento Temporal */}
      <div className="flex justify-center gap-2 mb-6 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
        <Button 
          variant={activeMoment === 'pre' ? 'default' : 'ghost'} 
          onClick={() => setActiveMoment('pre')}
          className={activeMoment === 'pre' ? 'bg-blue-600 text-white' : 'text-zinc-400'}
        >
          📍 Inicio (Pre)
        </Button>
        <Button 
          variant={activeMoment === 'mid' ? 'default' : 'ghost'} 
          onClick={() => setActiveMoment('mid')}
          className={activeMoment === 'mid' ? 'bg-blue-600 text-white' : 'text-zinc-400'}
        >
          ⏳ Mitad (Solo PCQ)
        </Button>
        <Button 
          variant={activeMoment === 'post' ? 'default' : 'ghost'} 
          onClick={() => setActiveMoment('post')}
          className={activeMoment === 'post' ? 'bg-blue-600 text-white' : 'text-zinc-400'}
        >
          🏁 Final (Post)
        </Button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Datos guardados correctamente.
        </div>
      )}

      {/* Formulario de Ingreso de Puntajes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-500" />
            Ingreso de Resultados - {activeMoment === 'pre' ? 'Inicio' : activeMoment === 'mid' ? 'Mitad' : 'Final'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFields().map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-zinc-300 text-sm">{field.label}</Label>
                <Input 
                  type="number" 
                  value={formData[field.key] || ''} 
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder="0"
                  className="bg-zinc-950 border-zinc-700 text-white focus:border-blue-500"
                  max={field.max}
                />
                <p className="text-xs text-zinc-500">Máx: {field.max}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Resultados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficas Comparativas */}
      {historyData.length > 0 && (
        <div className="space-y-8 mt-8">
          <h3 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">Evolución Clínica</h3>
          
          {/* Gráfica PCQ */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-sm">Capital Psicológico (PCQ)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData.filter(d => ['Autoeficacia', 'Esperanza', 'Resiliencia', 'Optimismo'].includes(d.name))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" angle={-10} textAnchor="end" height={60} tick={{fontSize: 12}} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#333', color: '#fff'}} />
                  <Legend />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" label="Umbral Riesgo" />
                  <Bar dataKey="pre" fill="#71717a" name="Inicio" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mid" fill="#3b82f6" name="Mitad" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#22c55e" name="Final" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfica MBI */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-sm">Burnout (MBI)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData.filter(d => ['Agotamiento', 'Despersonalización', 'Realización'].includes(d.name))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" angle={-10} textAnchor="end" height={60} tick={{fontSize: 12}} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#333', color: '#fff'}} />
                  <Legend />
                  <Bar dataKey="pre" fill="#71717a" name="Inicio" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mid" fill="#3b82f6" name="Mitad" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#22c55e" name="Final" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

           {/* Gráfica DASS */}
           <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-sm">Salud Mental (DASS-21)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData.filter(d => ['Depresión', 'Ansiedad', 'Estrés'].includes(d.name))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" angle={-10} textAnchor="end" height={60} tick={{fontSize: 12}} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#333', color: '#fff'}} />
                  <Legend />
                  <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label="Severo" />
                  <Bar dataKey="pre" fill="#71717a" name="Inicio" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mid" fill="#3b82f6" name="Mitad" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#22c55e" name="Final" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}