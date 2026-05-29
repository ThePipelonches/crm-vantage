import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Save, Activity, Brain, AlertTriangle } from 'lucide-react';

interface PsychometricEvalProps {
  patientId: string;
}

// Configuración de escalas y subescalas
const TEST_CONFIG: any = {
  pcq: {
    label: 'PCQ-24 (Capital Psicológico)',
    icon: Brain,
    scales: {
      self_efficacy: 'Autoeficacia',
      hope: 'Esperanza',
      resilience: 'Resiliencia',
      optimism: 'Optimismo'
    },
    maxScore: 7 // Escala 1-7
  },
  mbi: {
    label: 'MBI (Burnout)',
    icon: Activity,
    scales: {
      emotional_exhaustion: 'Agotamiento Emocional',
      depersonalization: 'Despersonalización',
      personal_accomplishment: 'Realización Personal'
    },
    maxScore: 6 // Escala 0-6 (suma varía, pero referencia visual útil)
  },
  dass: {
    label: 'DASS-21',
    icon: AlertTriangle,
    scales: {
      depression: 'Depresión',
      anxiety: 'Ansiedad',
      stress: 'Estrés'
    },
    maxScore: 42 // Escala 0-3 * 2 * 7 items aprox (referencia visual)
  }
};

export default function PsychometricEval({ patientId }: PsychometricEvalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados de Filtros
  const [selectedTest, setSelectedTest] = useState<'pcq' | 'mbi' | 'dass'>('pcq');
  const [selectedScale, setSelectedScale] = useState<string>('');

  // Estados de Datos (Inputs)
  // Estructura: { pre: { scale: value }, mid: { scale: value }, post: { scale: value } }
  const [scores, setScores] = useState<any>({
    pre: {},
    mid: {},
    post: {}
  });

  // Cargar datos al montar o cambiar paciente
  useEffect(() => {
    if (patientId) fetchScores();
  }, [patientId]);

  // Resetear subescala cuando cambia la prueba
  useEffect(() => {
    const firstScale = Object.keys(TEST_CONFIG[selectedTest].scales)[0];
    setSelectedScale(firstScale);
  }, [selectedTest]);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      const newScores: any = { pre: {}, mid: {}, post: {} };
      
      data?.forEach((row: any) => {
        const moment = row.moment as 'pre' | 'mid' | 'post';
        const testType = row.test_type; // pcq, mbi, dass
        
        // Iterar sobre las escalas de ese test y guardar los valores
        if (TEST_CONFIG[testType]) {
          Object.keys(TEST_CONFIG[testType].scales).forEach(scaleKey => {
            if (row[scaleKey] !== null && row[scaleKey] !== undefined) {
              newScores[moment][scaleKey] = row[scaleKey];
            }
          });
        }
      });

      setScores(newScores);
    } catch (err) {
      console.error("Error cargando evaluaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (moment: 'pre' | 'mid' | 'post', scale: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [moment]: {
        ...prev[moment],
        [scale]: value
      }
    }));
  };

  const saveEvaluation = async (moment: 'pre' | 'mid' | 'post') => {
    setSaving(true);
    try {
      const currentScores = scores[moment];
      const payload = {
        patient_id: patientId,
        test_type: selectedTest,
        moment: moment,
        ...currentScores // Desglosa las escalas: self_efficacy: 5, hope: 6...
      };

      // Verificar si ya existe para actualizar o insertar
      const { data: existing } = await supabase
        .from('psychometric_evaluations')
        .select('id')
        .eq('patient_id', patientId)
        .eq('test_type', selectedTest)
        .eq('moment', moment)
        .single();

      let error;
      if (existing) {
        const res = await supabase.from('psychometric_evaluations').update(payload).eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabase.from('psychometric_evaluations').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      alert(`✅ Resultados ${moment === 'pre' ? 'Pre' : moment === 'mid' ? 'Intermedios' : 'Post'} guardados correctamente.`);
    } catch (err: any) {
      alert(`❌ Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    if (!selectedScale) return [];
    
    const dataPoint: any = {
      name: TEST_CONFIG[selectedTest].scales[selectedScale] || selectedScale
    };

    // Obtener valores para cada momento, solo si el test es válido para ese momento
    // PCQ: Pre, Mid, Post | MBI/DASS: Pre, Post
    if (scores.pre[selectedScale]) dataPoint.Pre = scores.pre[selectedScale];
    
    if (selectedTest === 'pcq' && scores.mid[selectedScale]) {
      dataPoint.Mitad = scores.mid[selectedScale];
    }
    
    if (scores.post[selectedScale]) dataPoint.Post = scores.post[selectedScale];

    return [dataPoint];
  }, [scores, selectedTest, selectedScale]);

  const currentConfig = TEST_CONFIG[selectedTest];
  const ScaleIcon = currentConfig.icon;

  return (
    <div className="space-y-8 p-2">
      {/* Controles Superiores: Filtros */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Filtros de Comparación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-zinc-400">Prueba Psicológica</Label>
            <div className="flex gap-2">
              {Object.entries(TEST_CONFIG).map(([key, config]: any) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant={selectedTest === key ? 'default' : 'outline'}
                    className={`flex-1 ${selectedTest === key ? 'bg-blue-600 hover:bg-blue-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
                    onClick={() => setSelectedTest(key as any)}
                  >
                    <Icon className="w-4 h-4 mr-2" /> {key.toUpperCase()}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Subescala / Dimensión</Label>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.entries(currentConfig.scales).map(([key, label]: any) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica Comparativa */}
      <Card className="bg-zinc-900 border-zinc-800 h-[400px]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Evolución: {currentConfig.scales[selectedScale]}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {chartData.length > 0 && chartData[0].Pre !== undefined || chartData[0].Post !== undefined ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" domain={[0, currentConfig.maxScore * 1.2]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <ReferenceLine y={currentConfig.maxScore * 0.7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Umbral Alto', fill: '#ef4444', fontSize: 12 }} />
                
                <Bar dataKey="Pre" fill="#71717a" name="Inicio (Pre)" radius={[4, 4, 0, 0]} />
                {selectedTest === 'pcq' && (
                  <Bar dataKey="Mitad" fill="#3b82f6" name="Mitad (Intermedio)" radius={[4, 4, 0, 0]} />
                )}
                <Bar dataKey="Post" fill="#10b981" name="Final (Post)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <p>Suficientes datos para mostrar la gráfica.</p>
              <p className="text-sm">Ingresa resultados en los formularios de abajo.</p>
              {selectedTest !== 'pcq' && (
                <p className="text-xs mt-2 text-orange-400">Nota: La evaluación "Mitad" solo aplica para PCQ-24.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formularios de Ingreso por Momento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Badge className="bg-zinc-700">PRE</Badge> Inicio del Tratamiento
            </h3>
            <Button size="sm" onClick={() => saveEvaluation('pre')} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-3 h-3 mr-1" /> Guardar
            </Button>
          </div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              {Object.entries(currentConfig.scales).map(([key, label]: any) => (
                <div key={`pre-${key}`} className="space-y-1">
                  <Label className="text-xs text-zinc-400">{label}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scores.pre[key] || ''}
                    onChange={(e) => handleScoreChange('pre', key, parseFloat(e.target.value))}
                    placeholder="0"
                    className="bg-zinc-950 border-zinc-700 text-white focus:ring-blue-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* MID (Solo PCQ) */}
        <div className={`space-y-4 ${selectedTest !== 'pcq' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Badge className="bg-blue-900 text-blue-200">MID</Badge> Mitad del Tratamiento
            </h3>
            <Button size="sm" onClick={() => saveEvaluation('mid')} disabled={saving || selectedTest !== 'pcq'} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-3 h-3 mr-1" /> Guardar
            </Button>
          </div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              {selectedTest === 'pcq' ? (
                Object.entries(currentConfig.scales).map(([key, label]: any) => (
                  <div key={`mid-${key}`} className="space-y-1">
                    <Label className="text-xs text-zinc-400">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={scores.mid[key] || ''}
                      onChange={(e) => handleScoreChange('mid', key, parseFloat(e.target.value))}
                      placeholder="0"
                      className="bg-zinc-950 border-zinc-700 text-white focus:ring-blue-500"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No se evalúa en la mitad del tratamiento.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* POST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Badge className="bg-green-900 text-green-200">POST</Badge> Final del Tratamiento
            </h3>
            <Button size="sm" onClick={() => saveEvaluation('post')} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-3 h-3 mr-1" /> Guardar
            </Button>
          </div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              {Object.entries(currentConfig.scales).map(([key, label]: any) => (
                <div key={`post-${key}`} className="space-y-1">
                  <Label className="text-xs text-zinc-400">{label}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scores.post[key] || ''}
                    onChange={(e) => handleScoreChange('post', key, parseFloat(e.target.value))}
                    placeholder="0"
                    className="bg-zinc-950 border-zinc-700 text-white focus:ring-blue-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}