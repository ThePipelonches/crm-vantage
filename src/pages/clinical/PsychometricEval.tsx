import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Brain, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface EvalProps {
  patientId?: string;
}

export default function PsychometricEval({ patientId }: EvalProps) {
  const [activeTab, setActiveTab] = useState<'pcq' | 'mbi' | 'dass'>('pcq');
  const [saved, setSaved] = useState(false);

  // --- ESTADOS PCQ ---
  const [pcq, setPcq] = useState<Record<string, number>>({});
  
  // --- ESTADOS MBI ---
  const [mbi, setMbi] = useState<Record<string, number>>({});

  // --- ESTADOS DASS ---
  const [dass, setDass] = useState<Record<string, number>>({});

  // Helper para renderizar opciones de radio
  const renderRadio = (value: number, current: number | undefined, onChange: (val: number) => void) => (
    <div className="flex justify-between items-center mb-2">
      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <label key={num} className={`flex flex-col items-center cursor-pointer p-2 rounded ${current === num ? 'bg-blue-900/50 border-blue-500' : 'hover:bg-zinc-800'} border border-zinc-700`}>
          <input 
            type="radio" 
            name={`q-${value}`} 
            className="hidden" 
            checked={current === num} 
            onChange={() => onChange(num)} 
          />
          <span className="text-xs text-zinc-400">{num}</span>
        </label>
      ))}
    </div>
  );

  // Cálculos PCQ
  const calcPcqAvg = (keys: string[]) => {
    const sum = keys.reduce((acc, key) => acc + (pcq[key] || 0), 0);
    const count = keys.filter(k => pcq[k]).length;
    return count === 0 ? 0 : sum / count;
  };

  const getPcqLevel = (avg: number) => {
    if (avg >= 6) return { label: 'Alto', color: 'bg-green-900 text-green-400' };
    if (avg >= 4.5) return { label: 'Medio', color: 'bg-yellow-900 text-yellow-400' };
    return { label: 'Bajo', color: 'bg-red-900 text-red-400' };
  };

  // Cálculos MBI
  const calcMbiSum = (keys: string[]) => keys.reduce((acc, key) => acc + (mbi[key] || 0), 0);
  
  const getMbiLevel = (score: number, type: 'high' | 'low') => {
    // Simplificado para demo
    if (type === 'high') {
      if (score > 20) return { label: 'Alto Riesgo', color: 'bg-red-900 text-red-400' };
      if (score > 10) return { label: 'Medio', color: 'bg-yellow-900 text-yellow-400' };
      return { label: 'Bajo', color: 'bg-green-900 text-green-400' };
    } else {
      // Realización personal (invertido)
      if (score < 30) return { label: 'Riesgo', color: 'bg-red-900 text-red-400' };
      return { label: 'Saludable', color: 'bg-green-900 text-green-400' };
    }
  };

  // Cálculos DASS
  const calcDass = (keys: string[]) => keys.reduce((acc, key) => acc + (dass[key] || 0), 0) * 2;

  const getDassLevel = (score: number, maxNormal: number) => {
    if (score > maxNormal * 2) return { label: 'Severo', color: 'bg-red-900 text-red-400' };
    if (score > maxNormal) return { label: 'Moderado', color: 'bg-yellow-900 text-yellow-400' };
    return { label: 'Normal', color: 'bg-green-900 text-green-400' };
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar en Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tabs de Navegación */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <Button variant={activeTab === 'pcq' ? 'default' : 'ghost'} onClick={() => setActiveTab('pcq')} className={activeTab === 'pcq' ? 'bg-white text-black' : 'text-zinc-400'}>
          <Brain className="w-4 h-4 mr-2" /> PCQ-24 (Capital Psicológico)
        </Button>
        <Button variant={activeTab === 'mbi' ? 'default' : 'ghost'} onClick={() => setActiveTab('mbi')} className={activeTab === 'mbi' ? 'bg-white text-black' : 'text-zinc-400'}>
          <Activity className="w-4 h-4 mr-2" /> MBI (Burnout)
        </Button>
        <Button variant={activeTab === 'dass' ? 'default' : 'ghost'} onClick={() => setActiveTab('dass')} className={activeTab === 'dass' ? 'bg-white text-black' : 'text-zinc-400'}>
          <AlertTriangle className="w-4 h-4 mr-2" /> DASS-21
        </Button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Evaluación guardada correctamente.
        </div>
      )}

      {/* --- PCQ CONTENT --- */}
      {activeTab === 'pcq' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm text-zinc-400">
            <p><strong>Escala:</strong> 1 (Totalmente en desacuerdo) a 7 (Totalmente de acuerdo).</p>
          </div>
          
          {/* Autoeficacia */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-lg">🚀 Autoeficacia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['se1','se2','se3','se4','se5','se6'].map((k, i) => (
                <div key={k}>
                  <p className="text-zinc-300 mb-2 text-sm">Ítem {i+1}: {['Me siento seguro analizando problemas complejos.','Tengo confianza en representar a mi equipo.','Contribuyo en discusiones importantes.','Manejo tareas difíciles con habilidad.','Encuentro soluciones si me esfuerzo.','Enfrento desafíos laborales con preparación.'][i]}</p>
                  {renderRadio(i+1, pcq[k], (v) => setPcq({...pcq, [k]: v}))}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between items-center">
                <span className="text-zinc-400">Promedio:</span>
                <Badge className={getPcqLevel(calcPcqAvg(['se1','se2','se3','se4','se5','se6'])).color}>{getPcqLevel(calcPcqAvg(['se1','se2','se3','se4','se5','se6'])).label} ({calcPcqAvg(['se1','se2','se3','se4','se5','se6']).toFixed(2)})</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Esperanza */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-lg">🎯 Esperanza</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['h1','h2','h3','h4','h5','h6'].map((k, i) => (
                <div key={k}>
                  <p className="text-zinc-300 mb-2 text-sm">Ítem {i+1}: {['Pienso en muchas formas de alcanzar mis metas.','Encuentro formas de lograr objetivos aunque otros se desanimen.','Soy persistente en la búsqueda de metas.','Dirijo mi camino al éxito ante obstáculos.','Tengo múltiples planes para lograr lo que quiero.','Siempre encuentro formas de avanzar.'][i]}</p>
                  {renderRadio(i+1, pcq[k], (v) => setPcq({...pcq, [k]: v}))}
                </div>
              ))}
               <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between items-center">
                <span className="text-zinc-400">Promedio:</span>
                <Badge className={getPcqLevel(calcPcqAvg(['h1','h2','h3','h4','h5','h6'])).color}>{getPcqLevel(calcPcqAvg(['h1','h2','h3','h4','h5','h6'])).label} ({calcPcqAvg(['h1','h2','h3','h4','h5','h6']).toFixed(2)})</Badge>
              </div>
            </CardContent>
          </Card>
          
           {/* Resiliencia y Optimismo (Simplificados para el ejemplo, seguir misma lógica) */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-lg">🛡️ Resiliencia</CardTitle></CardHeader>
                <CardContent className="text-zinc-500 text-sm">Formulario similar... (Espacio para ítems R1-R6)</CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-lg">☀️ Optimismo</CardTitle></CardHeader>
                <CardContent className="text-zinc-500 text-sm">Formulario similar... (Espacio para ítems O1-O6)</CardContent>
              </Card>
           </div>
        </div>
      )}

      {/* --- MBI CONTENT --- */}
      {activeTab === 'mbi' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm text-zinc-400">
            <p><strong>Escala:</strong> 0 (Nunca) a 6 (Todos los días).</p>
          </div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-lg">🔥 Agotamiento Emocional</CardTitle></CardHeader>
            <CardContent className="space-y-2">
               {[0,1,2,3,4,5,6,7,8].map((i) => (
                 <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800">
                   <span className="text-zinc-300 text-sm w-2/3">Ítem {i+1}...</span>
                   <select className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded p-1" onChange={(e) => setMbi({...mbi, [`ae${i}`]: parseInt(e.target.value)})}>
                     {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                   </select>
                 </div>
               ))}
               <div className="mt-4 flex justify-between items-center">
                 <span className="text-zinc-400">Puntaje: {calcMbiSum(['ae0','ae1','ae2','ae3','ae4','ae5','ae6','ae7','ae8'])}</span>
                 <Badge className={getMbiLevel(calcMbiSum(['ae0','ae1','ae2','ae3','ae4','ae5','ae6','ae7','ae8']), 'high').color}>{getMbiLevel(calcMbiSum(['ae0','ae1','ae2','ae3','ae4','ae5','ae6','ae7','ae8']), 'high').label}</Badge>
               </div>
            </CardContent>
          </Card>
          {/* Despersonalización y Realización Personal seguirían aquí */}
          <p className="text-zinc-500 text-center italic">... (Resto de escalas MBI implementadas de forma similar)</p>
        </div>
      )}

      {/* --- DASS CONTENT --- */}
      {activeTab === 'dass' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 text-sm text-zinc-400">
            <p><strong>Escala:</strong> 0 (No me aplicó) a 3 (Me aplicó mucho). Se multiplica x2 al final.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-base">Depresión</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                 {[2,7,10,13,16,17,20].map((itemNum) => (
                   <div key={itemNum} className="text-xs">
                     <p className="text-zinc-400 mb-1">Ítem {itemNum}</p>
                     <div className="flex gap-1">
                       {[0,1,2,3].map(n => (
                         <button key={n} onClick={() => setDass({...dass, [`d${itemNum}`]: n})} className={`flex-1 py-1 rounded ${dass[`d${itemNum}`]===n ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{n}</button>
                       ))}
                     </div>
                   </div>
                 ))}
                 <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
                   <p className="text-xs text-zinc-500">Total: <span className="text-white font-bold">{calcDass(['d2','d7','d10','d13','d16','d17','d20'])}</span></p>
                   <Badge className={getDassLevel(calcDass(['d2','d7','d10','d13','d16','d17','d20']), 9).color}>{getDassLevel(calcDass(['d2','d7','d10','d13','d16','d17','d20']), 9).label}</Badge>
                 </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-base">Ansiedad</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                 {[3,5,6,15,19,21].map((itemNum) => (
                   <div key={itemNum} className="text-xs">
                     <p className="text-zinc-400 mb-1">Ítem {itemNum}</p>
                     <div className="flex gap-1">
                       {[0,1,2,3].map(n => (
                         <button key={n} onClick={() => setDass({...dass, [`a${itemNum}`]: n})} className={`flex-1 py-1 rounded ${dass[`a${itemNum}`]===n ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{n}</button>
                       ))}
                     </div>
                   </div>
                 ))}
                 <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
                   <p className="text-xs text-zinc-500">Total: <span className="text-white font-bold">{calcDass(['a3','a5','a6','a15','a19','a21'])}</span></p>
                   <Badge className={getDassLevel(calcDass(['a3','a5','a6','a15','a19','a21']), 7).color}>{getDassLevel(calcDass(['a3','a5','a6','a15','a19','a21']), 7).label}</Badge>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-base">Estrés</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                 {[1,4,8,9,11,12,14,18].map((itemNum) => (
                   <div key={itemNum} className="text-xs">
                     <p className="text-zinc-400 mb-1">Ítem {itemNum}</p>
                     <div className="flex gap-1">
                       {[0,1,2,3].map(n => (
                         <button key={n} onClick={() => setDass({...dass, [`s${itemNum}`]: n})} className={`flex-1 py-1 rounded ${dass[`s${itemNum}`]===n ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{n}</button>
                       ))}
                     </div>
                   </div>
                 ))}
                 <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
                   <p className="text-xs text-zinc-500">Total: <span className="text-white font-bold">{calcDass(['s1','s4','s8','s9','s11','s12','s14','s18'])}</span></p>
                   <Badge className={getDassLevel(calcDass(['s1','s4','s8','s9','s11','s12','s14','s18']), 14).color}>{getDassLevel(calcDass(['s1','s4','s8','s9','s11','s12','s14','s18']), 14).label}</Badge>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-zinc-800">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          Guardar Evaluación
        </Button>
      </div>
    </div>
  );
}