import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Activity, AlertTriangle, Save, CheckCircle, TrendingUp } from 'lucide-react';

type Moment = 'pre' | 'mid' | 'post';
type TestType = 'pcq' | 'mbi' | 'dass';

interface Scores {
  [key: string]: number;
}

interface StoredData {
  id?: string;
  moment: Moment;
  test_type: TestType;
  scores: Scores;
  created_at?: string;
}

export default function PsychometricEval() {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeMoment, setActiveMoment] = useState<Moment>('pre');
  const [activeTest, setActiveTest] = useState<TestType>('pcq');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para los formularios (Inputs numéricos)
  const [formScores, setFormScores] = useState<Scores>({});
  
  // Estado para datos guardados (para gráficas)
  const [storedData, setStoredData] = useState<Record<Moment, Record<TestType, StoredData | null>>>({
    pre: { pcq: null, mbii: null, dass: null }, // Typo fix below
    mid: { pcq: null, mbii: null, dass: null },
    post: { pcq: null, mbii: null, dass: null }
  } as any);

  // Cargar datos al cambiar de pestaña
  useEffect(() => {
    if (patientId) fetchAllData();
  }, [patientId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      // Organizar datos por momento y prueba
      const organized: any = { pre: {}, mid: {}, post: {} };
      data?.forEach((row: any) => {
        organized[row.moment][row.test_type] = row;
      });
      setStoredData(organized);
      
      // Cargar formulario actual si existe data
      const currentData = organized[activeMoment]?.[activeTest];
      if (currentData) setFormScores(currentData.scores || {});
      else resetForm(activeTest);

    } catch (err) {
      console.error("Error cargando evaluaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (test: TestType) => {
    const empty: Scores = {};
    if (test === 'pcq') ['se', 'ho', 're', 'op'].forEach(k => empty[k] = 0);
    if (test === 'mbi') ['ee', 'dp', 'pa'].forEach(k => empty[k] = 0);
    if (test === 'dass') ['dep', 'anx', 'str'].forEach(k => empty[k] = 0);
    setFormScores(empty);
  };

  const handleScoreChange = (key: string, val: string) => {
    setFormScores(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        moment: activeMoment,
        test_type: activeTest,
        scores: formScores
      };

      const existing = storedData[activeMoment]?.[activeTest];
      
      let error;
      if (existing?.id) {
        const res = await supabase.from('psychometric_evaluations').update(payload).eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabase.from('psychometric_evaluations').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      alert("✅ Resultados guardados correctamente");
      fetchAllData(); // Recargar para actualizar gráficas
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generar datos para la gráfica comparativa
  const getChartData = (scaleKey: string, labelMap: Record<string, string>) => {
    const data = [];
    const moments: Moment[] = ['pre', 'mid', 'post'];
    
    // Solo mostramos 'mid' si es PCQ
    const validMoments = activeTest === 'pcq' ? moments : moments.filter(m => m !== 'mid');

    validMoments.forEach(m => {
      const record = storedData[m]?.[activeTest];
      const val = record ? (record.scores[scaleKey] || 0) : null;
      data.push({
        name: m === 'pre' ? 'Inicio' : m === 'mid' ? 'Mitad' : 'Final',
        value: val,
        fullLabel: labelMap[scaleKey]
      });
    });
    return data;
  };

  // Configuración de campos por prueba
  const getFields = () => {
    if (activeTest === 'pcq') return [
      { key: 'se', label: 'Autoeficacia', max: 42 },
      { key: 'ho', label: 'Esperanza', max: 42 },
      { key: 're', label: 'Resiliencia', max: 42 },
      { key: 'op', label: 'Optimismo', max: 42 }
    ];
    if (activeTest === 'mbi') return [
      { key: 'ee', label: 'Agotamiento Emocional', max: 54 },
      { key: 'dp', label: 'Despersonalización', max: 30 },
      { key: 'pa', label: 'Realización Personal', max: 48 } // Invertida en interpretación
    ];
    if (activeTest === 'dass') return [
      { key: 'dep', label: 'Depresión', max: 42 },
      { key: 'anx', label: 'Ansiedad', max: 24 },
      { key: 'str', label: 'Estrés', max: 42 }
    ];
    return [];
  };

  const fields = getFields();
  const isMidOnly = activeTest !== 'pcq' && activeMoment === 'mid';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Selector de MOMENTO (Pre / Mid / Post) */}
      <div className="flex justify-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
        <Button variant={activeMoment === 'pre' ? 'default' : 'ghost'} onClick={() => setActiveMoment('pre')} className={activeMoment === 'pre' ? 'bg-blue-600 text-white' : 'text-zinc-400'}>
          📍 Inicio (Pre)
        </Button>
        <Button variant={activeMoment === 'mid' ? 'default' : 'ghost'} onClick={() => setActiveMoment('mid')} disabled={activeTest !== 'pcq'} className={`${activeMoment === 'mid' ? 'bg-blue-600 text-white' : 'text-zinc-400'} ${activeTest !== 'pcq' ? 'opacity-50 cursor-not-allowed' : ''}`}>
          ⏳ Mitad (Solo PCQ)
        </Button>
        <Button variant={activeMoment === 'post' ? 'default' : 'ghost'} onClick={() => setActiveMoment('post')} className={activeMoment === 'post' ? 'bg-green-600 text-white' : 'text-zinc-400'}>
          🏁 Final (Post)
        </Button>
      </div>

      {isMidOnly && (
        <div className="bg-yellow-900/20 border border-yellow-700 text-yellow-400 p-3 rounded text-sm text-center">
          ⚠️ En la mitad del tratamiento solo se evalúa el PCQ-24.
        </div>
      )}

      {/* 2. Selector de PRUEBA (PCQ / MBI / DASS) */}
      {!isMidOnly && (
        <div className="flex justify-center gap-4 border-b border-zinc-800 pb-4">
          <Button variant={activeTest === 'pcq' ? 'outline' : 'ghost'} onClick={() => { setActiveTest('pcq'); resetForm('pcq'); }} className={activeTest === 'pcq' ? 'border-white text-white' : 'text-zinc-500'}>
            <Brain className="w-4 h-4 mr-2" /> PCQ-24
          </Button>
          <Button variant={activeTest === 'mbi' ? 'outline' : 'ghost'} onClick={() => { setActiveTest('mbi'); resetForm('mbi'); }} className={activeTest === 'mbi' ? 'border-white text-white' : 'text-zinc-500'}>
            <Activity className="w-4 h-4 mr-2" /> MBI
          </Button>
          <Button variant={activeTest === 'dass' ? 'outline' : 'ghost'} onClick={() => { setActiveTest('dass'); resetForm('dass'); }} className={activeTest === 'dass' ? 'border-white text-white' : 'text-zinc-500'}>
            <AlertTriangle className="w-4 h-4 mr-2" /> DASS-21
          </Button>
        </div>
      )}

      {/* 3. Formulario de Ingreso de Puntajes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-500" /> 
            Ingresar Resultados: {activeMoment.toUpperCase()} - {activeTest.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-zinc-300">{field.label}</Label>
              <Input 
                type="number" 
                value={formScores[field.key] || ''} 
                onChange={(e) => handleScoreChange(field.key, e.target.value)}
                placeholder="0"
                className="bg-zinc-950 border-zinc-700 text-white focus:border-blue-500"
              />
              <p className="text-xs text-zinc-500">Máx: {field.max}</p>
            </div>
          ))}
          
          <div className="flex items-end col-span-full">
            <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Guardando...' : '💾 Guardar Resultados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Gráficas Comparativas Automáticas */}
      <div className="space-y-8 pt-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" /> Evolución Clínica
        </h3>
        
        {fields.map((field) => {
          const chartData = getChartData(field.key, {});
          // Verificar si hay al menos un dato para graficar
          const hasData = chartData.some(d => d.value !== null);

          if (!hasData) return null;

          return (
            <Card key={field.key} className="bg-zinc-900 border-zinc-800 p-4">
              <h4 className="text-zinc-300 mb-4 font-medium">{field.label}</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                      formatter={(value: any) => [value, 'Puntaje']}
                    />
                    <ReferenceLine y={field.max * 0.75} stroke="red" strokeDasharray="3 3" label="Umbral Atención" />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
        
        {!Object.values(storedData).some(m => Object.values(m).some(t => t !== null)) && (
          <p className="text-zinc-500 text-center italic py-10">Aún no hay datos guardados para mostrar gráficas.</p>
        )}
      </div>
    </div>
  );
}