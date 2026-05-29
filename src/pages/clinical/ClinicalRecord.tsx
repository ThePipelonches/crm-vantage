import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Save, CheckCircle, AlertCircle } from 'lucide-react';

type Moment = 'pre' | 'mid' | 'post';

interface EvalProps { patientId: string; }

export default function PsychometricEval({ patientId }: EvalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Estados para almacenar los puntajes de cada momento
  // Estructura: { pre: { se: 0, h: 0... }, mid: {...}, post: {...} }
  const [pcq, setPcq] = useState<Record<Moment, Record<string, number>>>(
    { pre: {}, mid: {}, post: {} }
  );
  const [mbi, setMbi] = useState<Record<Moment, Record<string, number>>>(
    { pre: {}, mid: {}, post: {} }
  );
  const [dass, setDass] = useState<Record<Moment, Record<string, number>>>(
    { pre: {}, mid: {}, post: {} }
  );

  // Cargar datos existentes
  useEffect(() => {
    if (!patientId) return;
    const loadData = async () => {
      const { data, error } = await supabase
        .from('psychometric_evaluations')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (!error && data) {
        setPcq(data.pcq_data || { pre: {}, mid: {}, post: {} });
        setMbi(data.mbi_data || { pre: {}, mid: {}, post: {} });
        setDass(data.dass_data || { pre: {}, mid: {}, post: {} });
      }
      setLoading(false);
    };
    loadData();
  }, [patientId]);

  const handleSave = async () => {
    if (!user || !patientId) return;
    setSaving(true);
    
    const payload = {
      patient_id: patientId,
      pcq_data: pcq,
      mbi_data: mbi,
      dass_data: dass
    };

    // Upsert: Insertar o actualizar si ya existe para este paciente
    const { error } = await supabase
      .from('psychometric_evaluations')
      .upsert(payload, { onConflict: 'patient_id' });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setSuccessMsg("Ã¢Å“â€¦ Evaluaciones guardadas correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSaving(false);
  };

  // Helper para inputs numÃƒÂ©ricos
  const NumInput = ({ val, onChange, max }: any) => (
    <Input 
      type="number" 
      min="0" 
      max={max} 
      value={val || ''} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-8 w-full text-center bg-zinc-950 border-zinc-700 text-white focus:border-blue-500"
      placeholder="-"
    />
  );

  if (loading) return <div className="p-6 text-zinc-400">Cargando evaluaciones...</div>;

  return (
    <div className="space-y-8 pb-10">
      {successMsg && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* --- PCQ SECTION --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Activity className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">PCQ-24 (Capital PsicolÃƒÂ³gico)</h2>
        </div>
        
        {/* Inputs PCQ */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-sm text-zinc-400">Ingrese Puntajes Promedio por DimensiÃƒÂ³n</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-500">
                    <th className="p-2">DimensiÃƒÂ³n</th>
                    <th className="p-2 text-center w-24">Inicio (Pre)</th>
                    <th className="p-2 text-center w-24">Mitad (Mid)</th>
                    <th className="p-2 text-center w-24">Final (Post)</th>
                  </tr>
                </thead>
                <tbody>
                  {['Autoeficacia', 'Esperanza', 'Resiliencia', 'Optimismo'].map((dim, idx) => {
                    const keys = ['se', 'h', 'r', 'o'][idx];
                    return (
                      <tr key={dim} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-2 font-medium text-zinc-300">{dim}</td>
                        {(['pre', 'mid', 'post'] as Moment[]).map((m) => (
                          <td key={m} className="p-2">
                            <NumInput 
                              val={pcq[m][keys]} 
                              max={7}
                              onChange={(v: number) => setPcq(prev => ({ ...prev, [m]: { ...prev[m], [keys]: v } }))} 
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* GrÃƒÂ¡fica PCQ */}
        <PCQChart data={pcq} />
      </section>

      {/* --- MBI SECTION --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Activity className="text-orange-400" />
          <h2 className="text-xl font-bold text-white">MBI (Burnout)</h2>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-500">
                    <th className="p-2">Escala</th>
                    <th className="p-2 text-center w-24">Inicio</th>
                    <th className="p-2 text-center w-24">Mitad</th>
                    <th className="p-2 text-center w-24">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {['Agotamiento Emocional', 'DespersonalizaciÃƒÂ³n', 'RealizaciÃƒÂ³n Personal*'].map((dim, idx) => {
                    const keys = ['ae', 'dp', 'rp'][idx];
                    return (
                      <tr key={dim} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-2 font-medium text-zinc-300">{dim} {idx===2 && <span className="text-xs text-zinc-500">(Invertida)</span>}</td>
                        {(['pre', 'mid', 'post'] as Moment[]).map((m) => (
                          <td key={m} className="p-2">
                            <NumInput 
                              val={mbi[m][keys]} 
                              max={54} // Max aproximado dependiendo items
                              onChange={(v: number) => setMbi(prev => ({ ...prev, [m]: { ...prev[m], [keys]: v } }))} 
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <MBIChart data={mbi} />
      </section>

      {/* --- DASS SECTION --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Activity className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">DASS-21</h2>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-500">
                    <th className="p-2">Subescala</th>
                    <th className="p-2 text-center w-24">Inicio</th>
                    <th className="p-2 text-center w-24">Mitad</th>
                    <th className="p-2 text-center w-24">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {['DepresiÃƒÂ³n', 'Ansiedad', 'EstrÃƒÂ©s'].map((dim, idx) => {
                    const keys = ['d', 'a', 's'][idx];
                    return (
                      <tr key={dim} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-2 font-medium text-zinc-300">{dim}</td>
                        {(['pre', 'mid', 'post'] as Moment[]).map((m) => (
                          <td key={m} className="p-2">
                            <NumInput 
                              val={dass[m][keys]} 
                              max={42} 
                              onChange={(v: number) => setDass(prev => ({ ...prev, [m]: { ...prev[m], [keys]: v } }))} 
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <DASSChart data={dass} />
      </section>

      <div className="sticky bottom-4 flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-8 py-6 text-lg">
          {saving ? 'Guardando...' : <><Save className="mr-2" /> Guardar Cambios</>}
        </Button>
      </div>
    </div>
  );
}

// --- COMPONENTES DE GRÃƒÂFICAS ---

function PCQChart({ data }: { data: any }) {
  const chartData = [
    { name: 'Autoeficacia', Pre: data.pre.se, Mid: data.mid.se, Post: data.post.se },
    { name: 'Esperanza', Pre: data.pre.h, Mid: data.mid.h, Post: data.post.h },
    { name: 'Resiliencia', Pre: data.pre.r, Mid: data.mid.r, Post: data.post.r },
    { name: 'Optimismo', Pre: data.pre.o, Mid: data.mid.o, Post: data.post.o },
  ].filter(d => d.Pre !== undefined || d.Mid !== undefined || d.Post !== undefined);

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">EvoluciÃƒÂ³n PCQ (Meta: Tendencia Alza)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" fontSize={12} />
            <YAxis domain={[0, 7]} stroke="#888" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
            <Legend />
            <ReferenceLine y={4.5} stroke="#ca8a04" strokeDasharray="3 3" label={{ position: 'right', value: 'Medio', fill: '#ca8a04', fontSize: 10 }} />
            <Bar dataKey="Pre" fill="#64748b" name="Inicio" />
            <Bar dataKey="Mid" fill="#3b82f6" name="Mitad" />
            <Bar dataKey="Post" fill="#22c55e" name="Final" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MBIChart({ data }: { data: any }) {
  const chartData = [
    { name: 'Agotamiento', Pre: data.pre.ae, Mid: data.mid.ae, Post: data.post.ae },
    { name: 'Despers.', Pre: data.pre.dp, Mid: data.mid.dp, Post: data.post.dp },
    { name: 'Realizac.', Pre: data.pre.rp, Mid: data.mid.rp, Post: data.post.rp },
  ].filter(d => d.Pre !== undefined || d.Mid !== undefined || d.Post !== undefined);

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">EvoluciÃƒÂ³n MBI (Ã¢Å¡Â Ã¯Â¸Â Agotamiento/Despers. deben bajar, Realizac. subir)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
            <Legend />
            <Bar dataKey="Pre" fill="#64748b" name="Inicio" />
            <Bar dataKey="Mid" fill="#3b82f6" name="Mitad" />
            <Bar dataKey="Post" fill="#22c55e" name="Final" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function DASSChart({ data }: { data: any }) {
  const chartData = [
    { name: 'DepresiÃƒÂ³n', Pre: data.pre.d, Mid: data.mid.d, Post: data.post.d },
    { name: 'Ansiedad', Pre: data.pre.a, Mid: data.mid.a, Post: data.post.a },
    { name: 'EstrÃƒÂ©s', Pre: data.pre.s, Mid: data.mid.s, Post: data.post.s },
  ].filter(d => d.Pre !== undefined || d.Mid !== undefined || d.Post !== undefined);

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">EvoluciÃƒÂ³n DASS-21 (Meta: Tendencia Baja)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
            <Legend />
            <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Umbral Alerta', fill: '#ef4444', fontSize: 10 }} />
            <Bar dataKey="Pre" fill="#64748b" name="Inicio" />
            <Bar dataKey="Mid" fill="#3b82f6" name="Mitad" />
            <Bar dataKey="Post" fill="#22c55e" name="Final" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
}