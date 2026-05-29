import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Brain, Activity, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EvalProps {
  patientId: string;
}

export default function PsychometricEval({ patientId }: EvalProps) {
  const [activeTab, setActiveTab] = useState<'pre' | 'mid' | 'post'>('pre');
  const [saving, setSaving] = useState(false);
  
  // Estructura de datos: { pcq: { se: 0, h: 0, r: 0, o: 0 }, mbi: { ae: 0, dp: 0, rp: 0 }, dass: { d: 0, a: 0, s: 0 } }
  const [formData, setFormData] = useState<any>({
    pcq: { se: '', h: '', r: '', o: '' },
    mbi: { ae: '', dp: '', rp: '' },
    dass: { d: '', a: '', s: '' }
  });

  const [savedData, setSavedData] = useState<any>(null);

  useEffect(() => {
    fetchSavedData();
  }, [patientId]);

  const fetchSavedData = async () => {
    const { data, error } = await supabase
      .from('psychometric_evaluations')
      .select('*')
      .eq('patient_id', patientId)
      .order('moment', { ascending: true });
    
    if (!error && data) {
      setSavedData(data);
    }
  };

  const handleInputChange = (test: string, scale: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [test]: { ...prev[test], [scale]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Transformar datos para guardar
      const payload = {
        patient_id: patientId,
        moment: activeTab, // 'pre', 'mid', 'post'
        pcq_se: parseFloat(formData.pcq.se) || 0,
        pcq_h: parseFloat(formData.pcq.h) || 0,
        pcq_r: parseFloat(formData.pcq.r) || 0,
        pcq_o: parseFloat(formData.pcq.o) || 0,
        mbi_ae: parseFloat(formData.mbi.ae) || 0,
        mbi_dp: parseFloat(formData.mbi.dp) || 0,
        mbi_rp: parseFloat(formData.mbi.rp) || 0,
        dass_d: parseFloat(formData.dass.d) || 0,
        dass_a: parseFloat(formData.dass.a) || 0,
        dass_s: parseFloat(formData.dass.s) || 0,
      };

      const { error } = await supabase.from('psychometric_evaluations').upsert(payload, { onConflict: 'patient_id,moment' });
      if (error) throw error;

      alert("✅ Resultados guardados correctamente");
      fetchSavedData();
    } catch (err: any) {
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generar datos para gráfica comparativa
  const getChartData = (type: 'pcq' | 'mbi' | 'dass') => {
    if (!savedData) return [];
    
    const mapMoment = (m: string) => m === 'pre' ? 'Inicio' : m === 'mid' ? 'Mitad' : 'Final';

    return savedData.map((d: any) => ({
      name: mapMoment(d.moment),
      ...(type === 'pcq' ? { 
        'Autoeficacia': d.pcq_se, 'Esperanza': d.pcq_h, 'Resiliencia': d.pcq_r, 'Optimismo': d.pcq_o 
      } : type === 'mbi' ? {
        'Agotamiento': d.mbi_ae, 'Despers.': d.mbi_dp, 'Realización': d.mbi_rp
      } : {
        'Depresión': d.dass_d, 'Ansiedad': d.dass_a, 'Estrés': d.dass_s
      })
    }));
  };

  const renderInput = (label: string, val: any, onChange: (v: string) => void, max: number) => (
    <div className="flex flex-col">
      <label className="text-xs text-zinc-400 mb-1">{label}</label>
      <input 
        type="number" 
        max={max}
        value={val} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center font-mono focus:border-blue-500 outline-none"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Selector de Momento */}
      <div className="flex justify-center gap-4 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
        <Button variant={activeTab === 'pre' ? 'default' : 'ghost'} onClick={() => setActiveTab('pre')} className={activeTab === 'pre' ? 'bg-white text-black' : 'text-zinc-400'}>Inicio (Pre)</Button>
        <Button variant={activeTab === 'mid' ? 'default' : 'ghost'} onClick={() => setActiveTab('mid')} className={activeTab === 'mid' ? 'bg-white text-black' : 'text-zinc-400'}>Mitad (Solo PCQ)</Button>
        <Button variant={activeTab === 'post' ? 'default' : 'ghost'} onClick={() => setActiveTab('post')} className={activeTab === 'post' ? 'bg-white text-black' : 'text-zinc-400'}>Final (Post)</Button>
      </div>

      {/* Inputs por Prueba (Separados Visualmente) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* TARJETA PCQ */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Brain className="text-purple-400"/> PCQ-24 (Capital Psicológico)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderInput("Autoeficacia (Max 42)", formData.pcq.se, (v) => handleInputChange('pcq', 'se', v), 42)}
              {renderInput("Esperanza (Max 42)", formData.pcq.h, (v) => handleInputChange('pcq', 'h', v), 42)}
              {renderInput("Resiliencia (Max 42)", formData.pcq.r, (v) => handleInputChange('pcq', 'r', v), 42)}
              {renderInput("Optimismo (Max 42)", formData.pcq.o, (v) => handleInputChange('pcq', 'o', v), 42)}
            </div>
          </CardContent>
        </Card>

        {/* TARJETA MBI (Solo en Pre y Post) */}
        {(activeTab === 'pre' || activeTab === 'post') && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Activity className="text-orange-400"/> MBI (Burnout)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderInput("Agotamiento Emocional (Max 54)", formData.mbi.ae, (v) => handleInputChange('mbi', 'ae', v), 54)}
                {renderInput("Despersonalización (Max 30)", formData.mbi.dp, (v) => handleInputChange('mbi', 'dp', v), 30)}
                {renderInput("Realización Personal (Max 48)", formData.mbi.rp, (v) => handleInputChange('mbi', 'rp', v), 48)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TARJETA DASS (Solo en Pre y Post) */}
        {(activeTab === 'pre' || activeTab === 'post') && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="text-red-400"/> DASS-21</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderInput("Depresión (Max 42)", formData.dass.d, (v) => handleInputChange('dass', 'd', v), 42)}
                {renderInput("Ansiedad (Max 42)", formData.dass.a, (v) => handleInputChange('dass', 'a', v), 42)}
                {renderInput("Estrés (Max 42)", formData.dass.s, (v) => handleInputChange('dass', 's', v), 42)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          {saving ? 'Guardando...' : <><Save className="w-4 h-4 mr-2"/> Guardar Resultados</>}
        </Button>
      </div>

      {/* GRÁFICAS COMPARATIVAS AUTOMÁTICAS */}
      {savedData && savedData.length > 0 && (
        <div className="space-y-8 pt-8 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-4">Evolución Comparativa</h3>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Evolución PCQ</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('pcq')}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="Autoeficacia" fill="#8b5cf6" />
                  <Bar dataKey="Esperanza" fill="#3b82f6" />
                  <Bar dataKey="Resiliencia" fill="#10b981" />
                  <Bar dataKey="Optimismo" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {(activeTab === 'pre' || activeTab === 'post') && savedData.some((d:any) => d.mbi_ae > 0) && (
             <Card className="bg-zinc-900 border-zinc-800">
             <CardHeader><CardTitle className="text-sm text-zinc-400">Evolución MBI</CardTitle></CardHeader>
             <CardContent className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={getChartData('mbi')}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                   <XAxis dataKey="name" stroke="#888" />
                   <YAxis stroke="#888" />
                   <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                   <Legend />
                   <Bar dataKey="Agotamiento" fill="#ef4444" />
                   <Bar dataKey="Despers." fill="#f97316" />
                   <Bar dataKey="Realización" fill="#22c55e" />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
          )}
          
          {(activeTab === 'pre' || activeTab === 'post') && savedData.some((d:any) => d.dass_d > 0) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Evolución DASS-21</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData('dass')}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }} />
                    <Legend />
                    <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label="Umbral Ansiedad" />
                    <Bar dataKey="Depresión" fill="#8b5cf6" />
                    <Bar dataKey="Ansiedad" fill="#ef4444" />
                    <Bar dataKey="Estrés" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}