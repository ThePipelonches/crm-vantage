import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Brain, Activity, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EvalProps {
  patientId?: string;
}

export default function PsychometricEval({ patientId }: EvalProps) {
  const [activeTab, setActiveTab] = useState<'pre' | 'mid' | 'post'>('pre');
  const [activeTest, setActiveTest] = useState<'pcq' | 'mbi' | 'dass'>('pcq');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para almacenar datos cargados de la BD
  const [savedData, setSavedData] = useState<any>({});

  // Estructura base de datos
  const initialFormState = {
    pcq: { se: '', h: '', r: '', o: '' },
    mbi: { ae: '', dp: '', rp: '' },
    dass: { dep: '', ans: '', str: '' }
  };

  const [formData, setFormData] = useState(initialFormState);

  // Cargar datos existentes al cambiar de pestaña/test
  useEffect(() => {
    if (!patientId) return;
    loadData();
  }, [activeTab, activeTest, patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('moment', activeTab)
        .eq('test_type', activeTest)
        .single();

      if (data && !error) {
        setSavedData(data);
        setFormData({
          pcq: { 
            se: data.se_score || '', 
            h: data.hope_score || '', 
            r: data.resilience_score || '', 
            o: data.optimism_score || '' 
          },
          mbi: { 
            ae: data.ae_score || '', 
            dp: data.dp_score || '', 
            rp: data.rp_score || '' 
          },
          dass: { 
            dep: data.depression_score || '', 
            ans: data.anxiety_score || '', 
            str: data.stress_score || '' 
          }
        });
      } else {
        setSavedData({});
        setFormData(initialFormState);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setFormData(initialFormState);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (test: keyof typeof formData, field: string, value: string) => {
    // Permitir solo números o vacío
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setFormData(prev => ({
      ...prev,
      [test]: { ...prev[test], [field]: value }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        patient_id: patientId,
        moment: activeTab,
        test_type: activeTest,
        ...(activeTest === 'pcq' && {
          se_score: parseInt(formData.pcq.se) || 0,
          hope_score: parseInt(formData.pcq.h) || 0,
          resilience_score: parseInt(formData.pcq.r) || 0,
          optimism_score: parseInt(formData.pcq.o) || 0
        }),
        ...(activeTest === 'mbi' && {
          ae_score: parseInt(formData.mbi.ae) || 0,
          dp_score: parseInt(formData.mbi.dp) || 0,
          rp_score: parseInt(formData.mbi.rp) || 0
        }),
        ...(activeTest === 'dass' && {
          depression_score: parseInt(formData.dass.dep) || 0,
          anxiety_score: parseInt(formData.dass.ans) || 0,
          stress_score: parseInt(formData.dass.str) || 0
        })
      };

      let error;
      if (savedData.id) {
        const res = await supabase.from('psychometric_evaluations').update(payload).eq('id', savedData.id);
        error = res.error;
      } else {
        const res = await supabase.from('psychometric_evaluations').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadData(); // Recargar para actualizar gráficas
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar datos para gráfica comparativa
  const getChartData = () => {
    // Esta lógica debería venir de un padre o contexto compartido, 
    // pero para simplificar, asumimos que las gráficas se muestran en otra vista o aquí mismo si hay datos.
    // Por ahora, retornamos estructura vacía si no hay datos cargados de los 3 momentos.
    return [];
  };

  const renderInput = (label: string, value: string, onChange: (val: string) => void, maxScore?: number) => (
    <div className="flex flex-col items-center p-3 bg-zinc-950 rounded border border-zinc-800">
      <span className="text-xs text-zinc-400 mb-2 text-center h-8">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="0"
      />
      {maxScore && <span className="text-[10px] text-zinc-600 mt-1">Max: {maxScore}</span>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Tabs de Momento */}
      <div className="flex justify-center gap-2 border-b border-zinc-800 pb-4">
        <Button variant={activeTab === 'pre' ? 'default' : 'ghost'} onClick={() => setActiveTab('pre')} className={activeTab === 'pre' ? 'bg-white text-black' : 'text-zinc-400'}>Inicio (Pre)</Button>
        <Button variant={activeTab === 'mid' ? 'default' : 'ghost'} onClick={() => setActiveTab('mid')} className={activeTab === 'mid' ? 'bg-white text-black' : 'text-zinc-400'}>Mitad (Intermedio)</Button>
        <Button variant={activeTab === 'post' ? 'default' : 'ghost'} onClick={() => setActiveTab('post')} className={activeTab === 'post' ? 'bg-white text-black' : 'text-zinc-400'}>Final (Post)</Button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2 justify-center">
          <CheckCircle className="w-4 h-4" /> Datos guardados correctamente.
        </div>
      )}

      {/* Tabs de Pruebas (Filtro) */}
      <div className="flex gap-2 justify-center mb-6">
        <Button variant={activeTest === 'pcq' ? 'default' : 'outline'} onClick={() => setActiveTest('pcq')} className={activeTest === 'pcq' ? 'bg-blue-600 border-blue-600' : 'border-zinc-700 text-zinc-400'}>PCQ-24</Button>
        {activeTab !== 'mid' && (
          <>
            <Button variant={activeTest === 'mbi' ? 'default' : 'outline'} onClick={() => setActiveTest('mbi')} className={activeTest === 'mbi' ? 'bg-orange-600 border-orange-600' : 'border-zinc-700 text-zinc-400'}>MBI</Button>
            <Button variant={activeTest === 'dass' ? 'default' : 'outline'} onClick={() => setActiveTest('dass')} className={activeTest === 'dass' ? 'bg-purple-600 border-purple-600' : 'border-zinc-700 text-zinc-400'}>DASS-21</Button>
          </>
        )}
      </div>

      {/* Formulario de Ingreso */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {activeTest === 'pcq' && <Brain className="w-5 h-5 text-blue-500" />}
            {activeTest === 'mbi' && <Activity className="w-5 h-5 text-orange-500" />}
            {activeTest === 'dass' && <AlertTriangle className="w-5 h-5 text-purple-500" />}
            Ingreso de Puntajes - {activeTab.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* PCQ FORM */}
          {activeTest === 'pcq' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderInput("Autoeficacia", formData.pcq.se, (v) => handleInputChange('pcq', 'se', v), 42)}
              {renderInput("Esperanza", formData.pcq.h, (v) => handleInputChange('pcq', 'h', v), 42)}
              {renderInput("Resiliencia", formData.pcq.r, (v) => handleInputChange('pcq', 'r', v), 42)}
              {renderInput("Optimismo", formData.pcq.o, (v) => handleInputChange('pcq', 'o', v), 42)}
            </div>
          )}

          {/* MBI FORM */}
          {activeTest === 'mbi' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInput("Agotamiento Emocional", formData.mbi.ae, (v) => handleInputChange('mbi', 'ae', v), 54)}
              {renderInput("Despersonalización", formData.mbi.dp, (v) => handleInputChange('mbi', 'dp', v), 30)}
              {renderInput("Realización Personal", formData.mbi.rp, (v) => handleInputChange('mbi', 'rp', v), 48)}
            </div>
          )}

          {/* DASS FORM */}
          {activeTest === 'dass' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInput("Depresión", formData.dass.dep, (v) => handleInputChange('dass', 'dep', v), 42)}
              {renderInput("Ansiedad", formData.dass.ans, (v) => handleInputChange('dass', 'ans', v), 42)}
              {renderInput("Estrés", formData.dass.str, (v) => handleInputChange('dass', 'str', v), 42)}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2"/> Guardar Puntajes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm text-zinc-400">
        <p><strong>Nota:</strong> Ingresa únicamente el puntaje total obtenido en cada subescala. El sistema guardará automáticamente el momento (Pre/Mid/Post) y el tipo de prueba.</p>
      </div>
    </div>
  );
}