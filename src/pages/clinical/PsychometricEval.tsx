import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Brain, Activity, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvalProps {
  patientId?: string;
}

export default function PsychometricEval({ patientId }: EvalProps) {
  // Estado para el momento temporal (Pre, Mid, Post)
  const [activeMoment, setActiveMoment] = useState<'pre' | 'mid' | 'post'>('pre');
  const [loading, setLoading] = useState(false);
  
  // Estados para los formularios (Inicializados en 0 o vacío)
  const [formData, setFormData] = useState({
    pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
    mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
    dass_depression: '', dass_anxiety: '', dass_stress: ''
  });

  // Cargar datos existentes al cambiar de pestaña
  useEffect(() => {
    if (!patientId || !activeMoment) return;
    loadEvaluation();
  }, [activeMoment, patientId]);

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('moment', activeMoment)
        .single();

      if (data) {
        setFormData({
          pcq_efficacy: data.pcq_efficacy?.toString() || '',
          pcq_hope: data.pcq_hope?.toString() || '',
          pcq_resilience: data.pcq_resilience?.toString() || '',
          pcq_optimism: data.pcq_optimism?.toString() || '',
          mbi_exhaustion: data.mbi_exhaustion?.toString() || '',
          mbi_depersonalization: data.mbi_depersonalization?.toString() || '',
          mbi_personal_accomplishment: data.mbi_personal_accomplishment?.toString() || '',
          dass_depression: data.dass_depression?.toString() || '',
          dass_anxiety: data.dass_anxiety?.toString() || '',
          dass_stress: data.dass_stress?.toString() || ''
        });
      } else {
        // Limpiar si no hay datos
        setFormData({
          pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
          mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
          dass_depression: '', dass_anxiety: '', dass_stress: ''
        });
      }
    } catch (err) {
      console.error("Error cargando:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!patientId) return;
    setLoading(true);
    
    // Construir objeto explícito con tipos numéricos
    const payload = {
      patient_id: patientId,
      moment: activeMoment,
      pcq_efficacy: formData.pcq_efficacy ? parseFloat(formData.pcq_efficacy) : null,
      pcq_hope: formData.pcq_hope ? parseFloat(formData.pcq_hope) : null,
      pcq_resilience: formData.pcq_resilience ? parseFloat(formData.pcq_resilience) : null,
      pcq_optimism: formData.pcq_optimism ? parseFloat(formData.pcq_optimism) : null,
      mbi_exhaustion: formData.mbi_exhaustion ? parseFloat(formData.mbi_exhaustion) : null,
      mbi_depersonalization: formData.mbi_depersonalization ? parseFloat(formData.mbi_depersonalization) : null,
      mbi_personal_accomplishment: formData.mbi_personal_accomplishment ? parseFloat(formData.mbi_personal_accomplishment) : null,
      dass_depression: formData.dass_depression ? parseFloat(formData.dass_depression) : null,
      dass_anxiety: formData.dass_anxiety ? parseFloat(formData.dass_anxiety) : null,
      dass_stress: formData.dass_stress ? parseFloat(formData.dass_stress) : null,
    };

    try {
      // Intentar actualizar primero (upsert manual)
      const { data: existing } = await supabase
        .from('psychometric_evaluations')
        .select('id')
        .eq('patient_id', patientId)
        .eq('moment', activeMoment)
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
      alert("✅ Evaluación guardada correctamente");
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Permitir solo números o vacío
    if (value !== '' && !/^\d+\.?\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Renderizado condicional de pruebas según el momento
  const showPCQ = true;
  const showMBI = activeMoment !== 'mid'; // No mostrar MBI en mitad
  const showDASS = activeMoment !== 'mid'; // No mostrar DASS en mitad

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Selector de Momento */}
      <div className="flex justify-center gap-4 mb-8">
        <Button variant={activeMoment === 'pre' ? 'default' : 'outline'} onClick={() => setActiveMoment('pre')} className={activeMoment === 'pre' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>
          Inicio (Pre)
        </Button>
        <Button variant={activeMoment === 'mid' ? 'default' : 'outline'} onClick={() => setActiveMoment('mid')} className={activeMoment === 'mid' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>
          Mitad (Intermedio)
        </Button>
        <Button variant={activeMoment === 'post' ? 'default' : 'outline'} onClick={() => setActiveMoment('post')} className={activeMoment === 'post' ? 'bg-blue-600 text-white' : 'border-zinc-700 text-zinc-400'}>
          Final (Post)
        </Button>
      </div>

      {loading && <p className="text-center text-zinc-400">Cargando datos...</p>}

      {/* PCQ-24 */}
      {showPCQ && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500"/> PCQ-24 (Capital Psicológico)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Autoeficacia', key: 'pcq_efficacy' },
              { label: 'Esperanza', key: 'pcq_hope' },
              { label: 'Resiliencia', key: 'pcq_resilience' },
              { label: 'Optimismo', key: 'pcq_optimism' }
            ].map((item) => (
              <div key={item.key}>
                <label className="text-xs text-zinc-400 block mb-1">{item.label}</label>
                <input 
                  type="text" 
                  value={formData[item.key as keyof typeof formData]} 
                  onChange={(e) => handleInputChange(item.key, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* MBI */}
      {showMBI && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500"/> MBI (Burnout)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Agotamiento Emocional', key: 'mbi_exhaustion' },
              { label: 'Despersonalización', key: 'mbi_depersonalization' },
              { label: 'Realización Personal', key: 'mbi_personal_accomplishment' }
            ].map((item) => (
              <div key={item.key}>
                <label className="text-xs text-zinc-400 block mb-1">{item.label}</label>
                <input 
                  type="text" 
                  value={formData[item.key as keyof typeof formData]} 
                  onChange={(e) => handleInputChange(item.key, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* DASS-21 */}
      {showDASS && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> DASS-21</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Depresión', key: 'dass_depression' },
              { label: 'Ansiedad', key: 'dass_anxiety' },
              { label: 'Estrés', key: 'dass_stress' }
            ].map((item) => (
              <div key={item.key}>
                <label className="text-xs text-zinc-400 block mb-1">{item.label}</label>
                <input 
                  type="text" 
                  value={formData[item.key as keyof typeof formData]} 
                  onChange={(e) => handleInputChange(item.key, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-8">
          {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2"/> Guardar Puntuaciones</>}
        </Button>
      </div>
    </div>
  );
}