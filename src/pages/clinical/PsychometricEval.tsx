import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PsychometricEval() {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeMoment, setActiveMoment] = useState<'pre' | 'mid' | 'post'>('pre');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado único para todos los puntajes
  const [scores, setScores] = useState({
    pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
    mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
    dass_depression: '', dass_anxiety: '', dass_stress: ''
  });

  // Cargar datos existentes al cambiar de pestaña
  useEffect(() => {
    if (!patientId || !activeMoment) return;
    loadScores();
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
        // Limpiar si no hay datos
        setScores({
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

      // Intentar actualizar primero, si no existe, insertar
      let { error: updateError } = await supabase
        .from('psychometric_evaluations')
        .update(payload)
        .eq('patient_id', patientId)
        .eq('moment', activeMoment);

      if (updateError || false) { // Si falla update o no encuentra rows
         const { error: insertError } = await supabase.from('psychometric_evaluations').insert([payload]);
         if (insertError) throw insertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof scores, value: string) => {
    // Solo permitir números
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setScores(prev => ({ ...prev, [field]: value }));
  };

  // Renderizado condicional de pruebas según el momento
  const showMBI = activeMoment !== 'mid';
  const showDASS = activeMoment !== 'mid';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Tabs Superiores */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <Button variant={activeMoment === 'pre' ? 'default' : 'ghost'} onClick={() => setActiveMoment('pre')} className={activeMoment === 'pre' ? 'bg-white text-black' : 'text-zinc-400'}>Inicio (Pre)</Button>
        <Button variant={activeMoment === 'mid' ? 'default' : 'ghost'} onClick={() => setActiveMoment('mid')} className={activeMoment === 'mid' ? 'bg-white text-black' : 'text-zinc-400'}>Mitad (Intermedio)</Button>
        <Button variant={activeMoment === 'post' ? 'default' : 'ghost'} onClick={() => setActiveMoment('post')} className={activeMoment === 'post' ? 'bg-white text-black' : 'text-zinc-400'}>Final (Post)</Button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Guardado correctamente en {activeMoment.toUpperCase()}
        </div>
      )}

      {/* PCQ-24 (Siempre visible) */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-lg">🧠 PCQ-24 (Capital Psicológico)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-500 mb-4">Ingresa el puntaje promedio final de cada subescala (1-7).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['pcq_efficacy', 'pcq_hope', 'pcq_resilience', 'pcq_optimism'].map((field) => (
              <div key={field}>
                <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('pcq_', '')}</label>
                <input 
                  type="text" 
                  value={scores[field as keyof typeof scores]} 
                  onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MBI (Solo Pre y Post) */}
      {showMBI && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">🔥 MBI (Burnout)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mb-4">Ingresa la suma total de cada subescala.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['mbi_exhaustion', 'mbi_depersonalization', 'mbi_personal_accomplishment'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('mbi_', '')}</label>
                  <input 
                    type="text" 
                    value={scores[field as keyof typeof scores]} 
                    onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DASS-21 (Solo Pre y Post) */}
      {showDASS && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">⚠️ DASS-21</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mb-4">Ingresa el puntaje final (suma x2) de cada subescala.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['dass_depression', 'dass_anxiety', 'dass_stress'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('dass_', '')}</label>
                  <input 
                    type="text" 
                    value={scores[field as keyof typeof scores]} 
                    onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
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