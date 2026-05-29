import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine , Cell } from 'recharts';
import { CheckCircle, AlertCircle } from 'lucide-react';

// ConfiguraciÃ³n de escalas
const SCALES = {
  PCQ: [
    { key: 'self_efficacy', label: 'Autoeficacia' },
    { key: 'hope', label: 'Esperanza' },
    { key: 'resilience', label: 'Resiliencia' },
    { key: 'optimism', label: 'Optimismo' }
  ],
  MBI: [
    { key: 'emotional_exhaustion', label: 'Agotamiento Emocional' },
    { key: 'depersonalization', label: 'DespersonalizaciÃ³n' },
    { key: 'personal_accomplishment', label: 'RealizaciÃ³n Personal' }
  ],
  DASS: [
    { key: 'depression', label: 'DepresiÃ³n' },
    { key: 'anxiety', label: 'Ansiedad' },
    { key: 'stress', label: 'EstrÃ©s' }
  ]
};

interface EvalProps { patientId: string; }\n\nexport default function PsychometricEval() {
  const { patientId } = useParams<{ patientId: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Estado seguro inicializado en 0 o null
  const [formData, setFormData] = useState({
    pre: { PCQ: {}, MBI: {}, DASS: {} },
    mid: { PCQ: {} }, // Solo PCQ en mitad
    post: { PCQ: {}, MBI: {}, DASS: {} }
  });

  const [selectedTest, setSelectedTest] = useState<'PCQ' | 'MBI' | 'DASS'>('PCQ');
  const [selectedScale, setSelectedScale] = useState<string>('self_efficacy');

  // Cargar datos existentes
  useEffect(() => {
    if (!patientId) return;
    loadResults();
  }, [patientId]);

  // Actualizar escala seleccionada cuando cambia el test
  useEffect(() => {
    if (SCALES[selectedTest] && SCALES[selectedTest].length > 0) {
      setSelectedScale(SCALES[selectedTest][0].key);
    }
  }, [selectedTest]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      // Reconstruir el estado de forma segura
      const newData = {
        pre: { PCQ: {}, MBI: {}, DASS: {} },
        mid: { PCQ: {} },
        post: { PCQ: {}, MBI: {}, DASS: {} }
      };

      if (data) {
        data.forEach((row: any) => {
          const moment = row.moment as 'pre' | 'mid' | 'post';
          const testType = row.test_type as 'PCQ' | 'MBI' | 'DASS';
          
          if (newData[moment] && newData[moment][testType]) {
            // Guardamos los puntajes directos
            newData[moment][testType] = { ...newData[moment][testType], ...row.results };
          }
        });
      }
      setFormData(newData);
    } catch (err: any) {
      console.error("Error cargando:", err);
      setMessage({ type: 'error', text: 'No se pudieron cargar los resultados anteriores.' });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (moment: string, test: string, scale: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [moment]: {
        ...prev[moment],
        [test]: {
          ...(prev[moment] as any)[test],
          [scale]: value
        }
      }
    }));
  };

  const saveResults = async () => {
    if (!patientId) return;
    setSaving(true);
    setMessage(null);

    try {
      const recordsToInsert = [];
      const moments = ['pre', 'mid', 'post'];
      
      for (const moment of moments) {
        const tests = Object.keys(formData[moment as keyof typeof formData]);
        for (const test of tests) {
          const results = (formData[moment as keyof typeof formData] as any)[test];
          // Solo guardar si hay al menos un dato en ese test
          if (results && Object.keys(results).length > 0) {
            recordsToInsert.push({
              patient_id: patientId,
              moment,
              test_type: test,
              results
            });
          }
        }
      }

      if (recordsToInsert.length === 0) {
        setMessage({ type: 'error', text: 'Ingresa al menos un puntaje antes de guardar.' });
        setSaving(false);
        return;
      }

      // Upsert: Intentar actualizar si existe, o insertar si no
      // Para simplificar, borramos los existentes de este paciente yé‡æ–°insertamos todo (estrategia segura para MVP)
      await supabase.from('psychometric_evaluations').delete().eq('patient_id', patientId);
      
      const { error } = await supabase.from('psychometric_evaluations').insert(recordsToInsert);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Resultados guardados correctamente.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al guardar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Preparar datos para la grÃ¡fica de forma DEFENSIVA
  const getChartData = () => {
    const currentScale = selectedScale;
    if (!currentScale) return [];

    // Extraer valores seguros, defaults a 0 si no existen
    const preVal = (formData.pre[selectedTest] as any)?.[currentScale] ?? 0;
    const midVal = selectedTest === 'PCQ' ? ((formData.mid.PCQ as any)?.[currentScale] ?? 0) : null;
    const postVal = (formData.post[selectedTest] as any)?.[currentScale] ?? 0;

    const data = [
      { name: 'Pre', value: preVal, fill: '#94a3b8' }, // Slate 400
      { name: 'Post', value: postVal, fill: '#22c55e' } // Green 500
    ];

    if (selectedTest === 'PCQ' && midVal !== null) {
      data.splice(1, 0, { name: 'Mitad', value: midVal, fill: '#3b82f6' }); // Blue 500
    }

    return data;
  };

  const chartData = getChartData();

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando evaluaciones...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {message && (
        <div className={`p-4 rounded border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end bg-zinc-900/50 p-4 rounded border border-zinc-800">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Prueba</label>
          <select 
            value={selectedTest} 
            onChange={(e) => setSelectedTest(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm"
          >
            <option value="PCQ">PCQ-24</option>
            <option value="MBI">MBI</option>
            <option value="DASS">DASS-21</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Subescala</label>
          <select 
            value={selectedScale} 
            onChange={(e) => setSelectedScale(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm"
          >
            {SCALES[selectedTest as keyof typeof SCALES]?.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GrÃ¡fica Comparativa */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex justify-between">
            <span>EvoluciÃ³n: {SCALES[selectedTest as keyof typeof SCALES]?.find(s => s.key === selectedScale)?.label}</span>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">Comparativa</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="value" name="Puntaje" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                {/* LÃ­nea de referencia ejemplo (ajustable segÃºn prueba) */}
                {selectedTest === 'DASS' && <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label="Umbral Moderado" />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              Sin datos para graficar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formularios de Entrada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRE */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-base">Inicio (Pre)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {SCALES[selectedTest as keyof typeof SCALES]?.map((scale) => (
              <div key={`pre-${scale.key}`}>
                <label className="text-xs text-zinc-400 block mb-1">{scale.label}</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                  value={(formData.pre[selectedTest] as any)?.[scale.key] || ''}
                  onChange={(e) => handleScoreChange('pre', selectedTest, scale.key, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* MID (Solo PCQ) */}
        {selectedTest === 'PCQ' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-base">Mitad (Intermedio)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {SCALES.PCQ.map((scale) => (
                <div key={`mid-${scale.key}`}>
                  <label className="text-xs text-zinc-400 block mb-1">{scale.label}</label>
                  <input 
                    type="number" 
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                    value={(formData.mid.PCQ as any)?.[scale.key] || ''}
                    onChange={(e) => handleScoreChange('mid', 'PCQ', scale.key, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* POST */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-base">Final (Post)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {SCALES[selectedTest as keyof typeof SCALES]?.map((scale) => (
              <div key={`post-${scale.key}`}>
                <label className="text-xs text-zinc-400 block mb-1">{scale.label}</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                  value={(formData.post[selectedTest] as any)?.[scale.key] || ''}
                  onChange={(e) => handleScoreChange('post', selectedTest, scale.key, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-800">
        <Button 
          onClick={saveResults} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          {saving ? 'Guardando...' : 'Guardar Resultados'}
        </Button>
      </div>
    </div>
  );
}