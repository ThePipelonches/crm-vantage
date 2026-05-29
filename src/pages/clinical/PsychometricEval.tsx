import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PsychometricEvalProps {
  patientId?: string;
}

export default function PsychometricEval({ patientId: propPatientId }: PsychometricEvalProps) {
  const { patientId: urlPatientId } = useParams<{ patientId: string }>();
  const patientId = propPatientId || urlPatientId;

  const [activeMoment, setActiveMoment] = useState<'pre' | 'mid' | 'post'>('pre');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [scores, setScores] = useState({
    pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
    mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
    dass_depression: '', dass_anxiety: '', dass_stress: ''
  });

  // Cargar datos y actualizar gráfica
  useEffect(() => {
    if (!patientId) return;
    loadScores();
    loadChartData();
  }, [activeMoment, patientId]);

  const loadScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('moment', activeMoment)
        .single();

      if (data) {
        setScores({
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
        setScores({
          pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
          mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
          dass_depression: '', dass_anxiety: '', dass_stress: ''
        });
      }
    } catch (err) { console.error("Error cargando:", err); } 
    finally { setLoading(false); }
  };

  const loadChartData = async () => {
    try {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('moment, pcq_efficacy, pcq_hope, pcq_resilience, pcq_optimism')
        .eq('patient_id', patientId)
        .order('moment', { ascending: true }); // Asume orden pre, mid, post
      
      if (data) {
        const formatted = data.map(d => ({
          name: d.moment === 'pre' ? 'Inicio' : d.moment === 'mid' ? 'Mitad' : 'Final',
          'Autoeficacia': d.pcq_efficacy,
          'Esperanza': d.pcq_hope,
          'Resiliencia': d.pcq_resilience,
          'Optimismo': d.pcq_optimism
        }));
        setChartData(formatted);
      }
    } catch (err) { console.error("Error gráfica:", err); }
  };

  const handleSave = async () => {
    if (!patientId) { alert("❌ Error: No hay ID de paciente"); return; }
    setLoading(true);
    try {
      const payload = {
        patient_id: patientId,
        moment: activeMoment,
        pcq_efficacy: parseFloat(scores.pcq_efficacy) || null,
        pcq_hope: parseFloat(scores.pcq_hope) || null,
        pcq_resilience: parseFloat(scores.pcq_resilience) || null,
        pcq_optimism: parseFloat(scores.pcq_optimism) || null,
        mbi_exhaustion: parseFloat(scores.mbi_exhaustion) || null,
        mbi_depersonalization: parseFloat(scores.mbi_depersonalization) || null,
        mbi_personal_accomplishment: parseFloat(scores.mbi_personal_accomplishment) || null,
        dass_depression: parseFloat(scores.dass_depression) || null,
        dass_anxiety: parseFloat(scores.dass_anxiety) || null,
        dass_stress: parseFloat(scores.dass_stress) || null
      };

      // ESTRATEGIA DE GUARDADO ROBUSTA:
      // 1. Intentar Insertar directamente (si falla por duplicado, actualizamos)
      const { data: insertData, error: insertError } = await supabase
        .from('psychometric_evaluations')
        .insert([payload])
        .select();

      if (insertError && insertError.code === '23505') { // Error de clave única duplicada
        // 2. Si ya existe, Actualizar
        const { error: updateError } = await supabase
          .from('psychometric_evaluations')
          .update(payload)
          .eq('patient_id', patientId)
          .eq('moment', activeMoment);
        
        if (updateError) throw updateError;
      } else if (insertError) {
        throw insertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadChartData(); // Recargar gráfica
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof scores, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const showMBI = activeMoment !== 'mid';
  const showDASS = activeMoment !== 'mid';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <Button variant={activeMoment === 'pre' ? 'default' : 'ghost'} onClick={() => setActiveMoment('pre')} className={activeMoment === 'pre' ? 'bg-white text-black' : 'text-zinc-400'}>Inicio (Pre)</Button>
        <Button variant={activeMoment === 'mid' ? 'default' : 'ghost'} onClick={() => setActiveMoment('mid')} className={activeMoment === 'mid' ? 'bg-white text-black' : 'text-zinc-400'}>Mitad (Intermedio)</Button>
        <Button variant={activeMoment === 'post' ? 'default' : 'ghost'} onClick={() => setActiveMoment('post')} className={activeMoment === 'post' ? 'bg-white text-black' : 'text-zinc-400'}>Final (Post)</Button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Guardado correctamente
        </div>
      )}

      {/* GRÁFICA COMPARATIVA (RESTAURADA) */}
      <Card className="bg-zinc-900 border-zinc-800 h-80">
        <CardHeader><CardTitle className="text-white text-sm">Evolución PCQ-24</CardTitle></CardHeader>
        <CardContent className="h-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" domain={[0, 7]} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Autoeficacia" fill="#3b82f6" />
                <Bar dataKey="Esperanza" fill="#10b981" />
                <Bar dataKey="Resiliencia" fill="#f59e0b" />
                <Bar dataKey="Optimismo" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-500 text-center mt-10">Sin datos para graficar aún.</p>}
        </CardContent>
      </Card>

      {/* Formulario PCQ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-lg">🧠 PCQ-24</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['pcq_efficacy', 'pcq_hope', 'pcq_resilience', 'pcq_optimism'].map((field) => (
              <div key={field}>
                <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('pcq_', '')}</label>
                <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center" placeholder="0.0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulario MBI */}
      {showMBI && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">🔥 MBI</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['mbi_exhaustion', 'mbi_depersonalization', 'mbi_personal_accomplishment'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('mbi_', '')}</label>
                  <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center" placeholder="0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario DASS */}
      {showDASS && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">⚠️ DASS-21</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['dass_depression', 'dass_anxiety', 'dass_stress'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('dass_', '')}</label>
                  <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center" placeholder="0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4 border-t border-zinc-800">
        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          {loading ? 'Guardando...' : 'Guardar Puntuaciones'}
        </Button>
      </div>
    </div>
  );
}