import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle, Filter } from 'lucide-react';

interface PsychometricEvalProps {
  patientId?: string;
}

export default function PsychometricEval({ patientId: propPatientId }: PsychometricEvalProps) {
  const { patientId: urlPatientId } = useParams<{ patientId: string }>();
  const patientId = propPatientId || urlPatientId;

  const [activeMoment, setActiveMoment] = useState<'pre' | 'mid' | 'post'>('pre');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filtro para la gráfica
  const [chartFilter, setChartFilter] = useState<'pcq' | 'mbi' | 'dass'>('pcq');

  // Estado para inputs
  const [scores, setScores] = useState({
    pcq_efficacy: '', pcq_hope: '', pcq_resilience: '', pcq_optimism: '',
    mbi_exhaustion: '', mbi_depersonalization: '', mbi_personal_accomplishment: '',
    dass_depression: '', dass_anxiety: '', dass_stress: ''
  });

  // Datos para la gráfica
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    loadScores();
    loadChartData();
  }, [patientId]);

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
        .select('*')
        .eq('patient_id', patientId)
        .order('moment', { ascending: true }); // pre, mid, post

      if (!data) return;

      // Transformar datos para Recharts: Agrupar por subescala
      // Estructura objetivo: [{ name: 'Efficacy', pre: 5, mid: 6, post: 7 }, ...]
      const transformed: any[] = [];
      
      // Definir qué campos mostrar según el filtro
      let fieldsToShow: string[] = [];
      if (chartFilter === 'pcq') fieldsToShow = ['pcq_efficacy', 'pcq_hope', 'pcq_resilience', 'pcq_optimism'];
      if (chartFilter === 'mbi') fieldsToShow = ['mbi_exhaustion', 'mbi_depersonalization', 'mbi_personal_accomplishment'];
      if (chartFilter === 'dass') fieldsToShow = ['dass_depression', 'dass_anxiety', 'dass_stress'];

      fieldsToShow.forEach(field => {
        const entry: any = { name: field.replace(/^(pcq|mbi|dass)_/, '').toUpperCase() };
        
        data.forEach((row: any) => {
          const val = row[field];
          if (row.moment === 'pre') entry.pre = val;
          if (row.moment === 'mid') entry.mid = val;
          if (row.moment === 'post') entry.post = val;
        });
        
        // Solo agregar si tiene al menos un valor
        if (entry.pre !== undefined || entry.mid !== undefined || entry.post !== undefined) {
          transformed.push(entry);
        }
      });

      setChartData(transformed);
    } catch (err) { console.error("Error cargando gráfica:", err); }
  };

  // Recargar gráfica cuando cambia el filtro
  useEffect(() => {
    loadChartData();
  }, [chartFilter, patientId]);

  const handleSave = async () => {
    if (!patientId) return alert("❌ Error: No hay ID de paciente");
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

      // Estrategia Upsert: Intentar actualizar, si no existe, insertar
      const { error: updateError } = await supabase
        .from('psychometric_evaluations')
        .update(payload)
        .eq('patient_id', patientId)
        .eq('moment', activeMoment);

      // Si el update no encontró filas (porque no existía), hacemos insert
      // Nota: Supabase no da error si no encuentra rows, pero podemos verificar lógicamente o intentar insertar directamente si falla
      // Para simplificar y asegurar, intentamos insertar si sabemos que es nuevo, o usamos un upsert nativo si la PK lo permite.
      // Aquí usaremos un enfoque simple: Insertar si no existe registro previo (lo cual verificamos al cargar)
      // O mejor: Usar upsert on conflict si tenemos una unique constraint (patient_id, moment). Asumiremos insert directo si es nuevo.
      
      // Forzamos inserción si es la primera vez que guardamos en este momento
      // Como no sabemos si existe sin consultar de nuevo, intentamos update y si no afecta rows, insertamos.
      // Pero la API JS de Supabase no devuelve rowCount fácilmente en error null.
      // Solución robusta: Intentar insertar. Si da error de duplicado (unique violation), entonces actualizar.
      
      const { error: insertError } = await supabase.from('psychometric_evaluations').insert([payload]);
      
      if (insertError && !insertError.message.includes('duplicate')) {
         throw insertError;
      }
      
      if (insertError && insertError.message.includes('duplicate')) {
          // Si es duplicado, actualizamos
          await supabase.from('psychometric_evaluations').update(payload).eq('patient_id', patientId).eq('moment', activeMoment);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadChartData(); // Refrescar gráfica inmediatamente
    } catch (err: any) {
      alert("❌ Error: " + err.message);
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
      {/* Tabs Momentos */}
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

      {/* GRÁFICA CON FILTRO */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Evolución Comparativa</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select 
                value={chartFilter} 
                onChange={(e) => setChartFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded p-1 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pcq">PCQ-24</option>
                <option value="mbi">MBI</option>
                <option value="dass">DASS-21</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#999" tick={{fontSize: 12}} interval={0} height={60} angle={-45} textAnchor="end" />
                <YAxis stroke="#999" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="pre" name="Pre (Inicio)" fill="#71717a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mid" name="Mid (Intermedio)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="post" name="Post (Final)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No hay datos registrados aún para esta prueba.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inputs PCQ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-white text-lg">🧠 PCQ-24 (Capital Psicológico)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-500 mb-4">Ingresa el puntaje promedio final de cada subescala (1-7).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['pcq_efficacy', 'pcq_hope', 'pcq_resilience', 'pcq_optimism'].map((field) => (
              <div key={field}>
                <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('pcq_', '')}</label>
                <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.0"/>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inputs MBI */}
      {showMBI && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">🔥 MBI (Burnout)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mb-4">Ingresa la suma total de cada subescala.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['mbi_exhaustion', 'mbi_depersonalization', 'mbi_personal_accomplishment'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('mbi_', '')}</label>
                  <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0"/>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inputs DASS */}
      {showDASS && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-white text-lg">⚠️ DASS-21</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mb-4">Ingresa el puntaje final (suma x2) de cada subescala.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['dass_depression', 'dass_anxiety', 'dass_stress'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-zinc-400 capitalize block mb-1">{field.replace('dass_', '')}</label>
                  <input type="text" value={scores[field as keyof typeof scores]} onChange={(e) => handleInputChange(field as keyof typeof scores, e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0"/>
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