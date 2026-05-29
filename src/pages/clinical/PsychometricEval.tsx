import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Activity, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PsychometricEvalProps {
  patientId: string;
}

type Moment = 'pre' | 'mid' | 'post';
type TestType = 'pcq' | 'mbi' | 'dass';

export default function PsychometricEval({ patientId }: PsychometricEvalProps) {
  const [activeMoment, setActiveMoment] = useState<Moment>('pre');
  const [activeTest, setActiveTest] = useState<TestType>('pcq');
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Estado inicial seguro para evitar errores de undefined
  const initialFormState = {
    pcq: { se: 0, hope: 0, res: 0, opt: 0 },
    mbi: { ee: 0, dp: 0, pa: 0 },
    dass: { dep: 0, anx: 0, str: 0 }
  };

  const [formData, setFormData] = useState<Record<Moment, typeof initialFormState>>({
    pre: { ...initialFormState },
    mid: { ...initialFormState },
    post: { ...initialFormState }
  });

  // Cargar datos existentes al montar
  useEffect(() => {
    if (!patientId) return;
    loadEvaluations();
  }, [patientId]);

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      if (data && data.length > 0) {
        const newData = { ...formData };
        data.forEach((row: any) => {
          const moment = row.moment as Moment;
          const test = row.test_type as TestType;
          if (newData[moment] && newData[moment][test]) {
            // Mapear columnas de la BD al estado local
            if (test === 'pcq') {
              newData[moment].pcq = {
                se: row.se_score || 0,
                hope: row.hope_score || 0,
                res: row.res_score || 0,
                opt: row.opt_score || 0
              };
            } else if (test === 'mbi') {
              newData[moment].mbi = {
                ee: row.ee_score || 0,
                dp: row.dp_score || 0,
                pa: row.pa_score || 0
              };
            } else if (test === 'dass') {
              newData[moment].dass = {
                dep: row.dep_score || 0,
                anx: row.anx_score || 0,
                str: row.str_score || 0
              };
            }
          }
        });
        setFormData(newData);
      }
    } catch (err) {
      console.error("Error cargando evaluaciones:", err);
    }
  };

  const handleInputChange = (test: TestType, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [activeMoment]: {
        ...prev[activeMoment],
        [test]: {
          ...prev[activeMoment][test],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentData = formData[activeMoment];
      
      // Preparar datos para PCQ
      if (activeTest === 'pcq' || activeMoment !== 'mid') { // En mid solo guardamos PCQ si estamos en esa tab, pero prevenimos errores
         const pcqRow = {
           patient_id: patientId,
           moment: activeMoment,
           test_type: 'pcq',
           se_score: currentData.pcq.se,
           hope_score: currentData.pcq.hope,
           res_score: currentData.pcq.res,
           opt_score: currentData.pcq.opt
         };
         
         await supabase.from('psychometric_evaluations').upsert(pcqRow, { onConflict: 'patient_id,moment,test_type' });
      }

      // Preparar datos para MBI (Solo Pre y Post)
      if (activeTest === 'mbi' && activeMoment !== 'mid') {
        const mbiRow = {
           patient_id: patientId,
           moment: activeMoment,
           test_type: 'mbi',
           ee_score: currentData.mbi.ee,
           dp_score: currentData.mbi.dp,
           pa_score: currentData.mbi.pa
        };
        await supabase.from('psychometric_evaluations').upsert(mbiRow, { onConflict: 'patient_id,moment,test_type' });
      }

      // Preparar datos para DASS (Solo Pre y Post)
      if (activeTest === 'dass' && activeMoment !== 'mid') {
        const dassRow = {
           patient_id: patientId,
           moment: activeMoment,
           test_type: 'dass',
           dep_score: currentData.dass.dep,
           anx_score: currentData.dass.anx,
           str_score: currentData.dass.str
        };
        await supabase.from('psychometric_evaluations').upsert(dassRow, { onConflict: 'patient_id,moment,test_type' });
      }

      setSavedMsg('✅ Evaluación guardada correctamente');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setSavedMsg('❌ Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  // Generar datos para la gráfica comparativa
  const getChartData = () => {
    if (activeTest === 'pcq') {
      return [
        { name: 'Autoeficacia', Pre: formData.pre.pcq.se, Mid: formData.mid.pcq.se, Post: formData.post.pcq.se },
        { name: 'Esperanza', Pre: formData.pre.pcq.hope, Mid: formData.mid.pcq.hope, Post: formData.post.pcq.hope },
        { name: 'Resiliencia', Pre: formData.pre.pcq.res, Mid: formData.mid.pcq.res, Post: formData.post.pcq.res },
        { name: 'Optimismo', Pre: formData.pre.pcq.opt, Mid: formData.mid.pcq.opt, Post: formData.post.pcq.opt },
      ];
    } else if (activeTest === 'mbi') {
      return [
        { name: 'Agotamiento', Pre: formData.pre.mbi.ee, Post: formData.post.mbi.ee },
        { name: 'Despersonalización', Pre: formData.pre.mbi.dp, Post: formData.post.mbi.dp },
        { name: 'Realización Pers.', Pre: formData.pre.mbi.pa, Post: formData.post.mbi.pa },
      ];
    } else {
      return [
        { name: 'Depresión', Pre: formData.pre.dass.dep, Post: formData.post.dass.dep },
        { name: 'Ansiedad', Pre: formData.pre.dass.anx, Post: formData.post.dass.anx },
        { name: 'Estrés', Pre: formData.pre.dass.str, Post: formData.post.dass.str },
      ];
    }
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6 p-2">
      {savedMsg && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      {/* Selector de Momento */}
      <div className="flex justify-center gap-2 mb-6">
        <Button variant={activeMoment === 'pre' ? 'default' : 'outline'} onClick={() => setActiveMoment('pre')} className={activeMoment === 'pre' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>Inicio (Pre)</Button>
        <Button variant={activeMoment === 'mid' ? 'default' : 'outline'} onClick={() => setActiveMoment('mid')} className={activeMoment === 'mid' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>Mitad (Intermedio)</Button>
        <Button variant={activeMoment === 'post' ? 'default' : 'outline'} onClick={() => setActiveMoment('post')} className={activeMoment === 'post' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>Final (Post)</Button>
      </div>

      {/* Selector de Prueba (Solo visible si no es Mitad, o forzar PCQ en Mitad) */}
      {activeMoment !== 'mid' && (
        <div className="flex justify-center gap-2 mb-4 border-b border-zinc-800 pb-4">
          <Button variant={activeTest === 'pcq' ? 'secondary' : 'ghost'} onClick={() => setActiveTest('pcq')} className={activeTest === 'pcq' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}><Brain className="w-4 h-4 mr-2"/>PCQ-24</Button>
          <Button variant={activeTest === 'mbi' ? 'secondary' : 'ghost'} onClick={() => setActiveTest('mbi')} className={activeTest === 'mbi' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}><Activity className="w-4 h-4 mr-2"/>MBI</Button>
          <Button variant={activeTest === 'dass' ? 'secondary' : 'ghost'} onClick={() => setActiveTest('dass')} className={activeTest === 'dass' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}><AlertTriangle className="w-4 h-4 mr-2"/>DASS-21</Button>
        </div>
      )}
      
      {activeMoment === 'mid' && (
        <div className="text-center mb-4 text-zinc-400 italic">
          Mostrando únicamente PCQ-24 (Evaluación Intermedia)
        </div>
      )}

      {/* Formulario de Ingreso */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {activeTest === 'pcq' && <><Brain className="text-blue-500"/> Ingreso de Resultados PCQ-24</>}
            {activeTest === 'mbi' && <><Activity className="text-orange-500"/> Ingreso de Resultados MBI</>}
            {activeTest === 'dass' && <><AlertTriangle className="text-red-500"/> Ingreso de Resultados DASS-21</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inputs Dinámicos según la prueba */}
          {activeTest === 'pcq' && (
            <>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Autoeficacia (SE)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].pcq.se} onChange={(e) => handleInputChange('pcq', 'se', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Esperanza (Hope)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].pcq.hope} onChange={(e) => handleInputChange('pcq', 'hope', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Resiliencia (Res)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].pcq.res} onChange={(e) => handleInputChange('pcq', 'res', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Optimismo (Opt)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].pcq.opt} onChange={(e) => handleInputChange('pcq', 'opt', parseFloat(e.target.value) || 0)} /></div>
            </>
          )}
          
          {activeTest === 'mbi' && activeMoment !== 'mid' && (
            <>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Agotamiento Emocional (EE)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].mbi.ee} onChange={(e) => handleInputChange('mbi', 'ee', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Despersonalización (DP)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].mbi.dp} onChange={(e) => handleInputChange('mbi', 'dp', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Realización Personal (PA)</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].mbi.pa} onChange={(e) => handleInputChange('mbi', 'pa', parseFloat(e.target.value) || 0)} /></div>
            </>
          )}

          {activeTest === 'dass' && activeMoment !== 'mid' && (
            <>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Depresión</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].dass.dep} onChange={(e) => handleInputChange('dass', 'dep', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Ansiedad</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].dass.anx} onChange={(e) => handleInputChange('dass', 'anx', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-2"><label className="text-sm text-zinc-400">Estrés</label><input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white" value={formData[activeMoment].dass.str} onChange={(e) => handleInputChange('dass', 'str', parseFloat(e.target.value) || 0)} /></div>
            </>
          )}
        </CardContent>
        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2"/> Guardar Resultados</>}
          </Button>
        </div>
      </Card>

      {/* Gráfica Comparativa */}
      <Card className="bg-zinc-900 border-zinc-800 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Evolución Comparativa</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
              <Legend />
              {activeMoment === 'pre' && <ReferenceLine y={0} stroke="#fff" />} 
              {/* Barras dinámicas según momento actual para resaltar comparación */}
              <Bar dataKey="Pre" fill="#6b7280" name="Inicio" />
              {activeMoment !== 'pre' && <Bar dataKey="Mid" fill="#3b82f6" name="Mitad" />}
              {activeMoment !== 'mid' && <Bar dataKey="Post" fill="#10b981" name="Final" />}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}