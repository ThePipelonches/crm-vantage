import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Activity, FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea'; // Asegúrate de tener este componente o usa un textarea normal

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingRol, setSavingRol] = useState(false);
  
  // Estados locales para el formulario ROL
  const [selectedRisk, setSelectedRisk] = useState<'green' | 'yellow' | 'red'>('green');
  const [rolComment, setRolComment] = useState('');

  useEffect(() => {
    if (!patientId) return;
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      setPatient(data);
      // Inicializar estados con los datos actuales
      if (data) {
        setSelectedRisk((data.rol_risk as 'green' | 'yellow' | 'red') || 'green');
        setRolComment(data.rol_comment || '');
      }
    } catch (err) {
      console.error("Error cargando paciente:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRolChange = async (riskLevel: 'green' | 'yellow' | 'red') => {
    setSelectedRisk(riskLevel);
    
    // Si es verde, limpiamos comentario y guardamos directo
    if (riskLevel === 'green') {
      await saveRolData('green', '');
    } else {
      // Si es amarillo o rojo, forzamos a escribir comentario antes de guardar (o mantenemos el estado local)
      // Aquí solo actualizamos el estado visual, el guardado se hace al perder foco o con botón, 
      // pero para simplificar, guardaremos automáticamente si hay comentario o al cambiar a verde.
      // Estrategia: Mostramos el input, y guardamos cuando el usuario escriba o cambie de nuevo.
      if (patient.rol_risk !== riskLevel) {
         // Solo actualizamos visualmente por ahora, esperamos a que llene el comentario o haga blur
         // Para mejor UX, podríamos añadir un botón "Guardar Evaluación", pero lo haremos auto-guardado con debounce o blur.
      }
    }
  };

  const saveRolData = async (risk: string, comment: string) => {
    setSavingRol(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          rol_risk: risk, 
          rol_comment: comment,
          rol_updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;
      
      // Actualizar estado local del paciente
      setPatient((prev: any) => ({ ...prev, rol_risk: risk, rol_comment: comment }));
    } catch (err: any) {
      alert('Error guardando evaluación ROL: ' + err.message);
    } finally {
      setSavingRol(false);
    }
  };

  // Manejar cambio en el textarea (con pequeño delay o al perder foco para no saturar)
  const handleCommentBlur = () => {
    if (selectedRisk !== 'green') {
      saveRolData(selectedRisk, rolComment);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (!patient) return <div className="p-6 text-red-400">Paciente no encontrado.</div>;

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'green': return 'bg-green-900/50 text-green-400 border-green-800 hover:bg-green-900';
      case 'yellow': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800 hover:bg-yellow-900';
      case 'red': return 'bg-red-900/50 text-red-400 border-red-800 hover:bg-red-900';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch(risk) {
      case 'green': return 'Riesgo Bajo';
      case 'yellow': return 'Riesgo Medio';
      case 'red': return 'Riesgo Alto';
      default: return 'Sin evaluar';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica</h1>
      </div>

      {/* Info Paciente */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> {patient.full_name}
              </CardTitle>
              <div className="flex gap-4 mt-2 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patient.phone || 'N/A'}</span>
              </div>
            </div>
            <Badge className={`${
              patient.status === 'active' ? 'bg-green-900 text-green-400 border-green-800' : 
              patient.status === 'inactive' ? 'bg-orange-900 text-orange-400 border-orange-800' : 'bg-red-900 text-red-400 border-red-800'
            } border px-3 py-1`}>
              {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : 'Desertor'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase">Valor Plan</p>
            <p className="text-lg font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase">Pago Inicial</p>
            <p className="text-lg font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
          </div>
          {patient.installments_count > 0 && (
            <>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Cuotas</p>
                <p className="text-white">{patient.installments_count} x ${patient.installment_value?.toLocaleString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- NUEVA SECCIÓN: EVALUACIÓN ROL (Riesgo de Abandono) --- */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> 
            Evaluación Semanal de Riesgo (ROL)
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Clasifique el riesgo de abandono del paciente esta semana.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Selector de Riesgo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['green', 'yellow', 'red'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => handleRolChange(risk)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
                  ${selectedRisk === risk 
                    ? getRiskColor(risk) + ' ring-2 ring-offset-2 ring-offset-zinc-900 ' + (risk === 'green' ? 'ring-green-500' : risk === 'yellow' ? 'ring-yellow-500' : 'ring-red-500')
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
              >
                {risk === 'green' && <CheckCircle className="w-8 h-8" />}
                {risk === 'yellow' && <AlertTriangle className="w-8 h-8" />}
                {risk === 'red' && <Activity className="w-8 h-8" />}
                
                <span className="font-bold text-sm uppercase">{getRiskLabel(risk)}</span>
                
                {selectedRisk === risk && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Área de Comentarios (Solo para Amarillo/Rojo) */}
          {(selectedRisk === 'yellow' || selectedRisk === 'red') && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <Label className="text-sm font-bold uppercase">Justificación y Plan de Acción Requerido</Label>
              </div>
              <Textarea
                value={rolComment}
                onChange={(e) => setRolComment(e.target.value)}
                onBlur={handleCommentBlur} // Guarda al perder el foco
                placeholder="Describa por qué existe este riesgo y cuál es su plan de acción para esta semana..."
                className="min-h-[120px] bg-zinc-950 border-zinc-700 text-white focus:border-yellow-500 focus:ring-yellow-500/20 resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => saveRolData(selectedRisk, rolComment)}
                  disabled={savingRol || !rolComment.trim()}
                  className={`mt-2 ${selectedRisk === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                >
                  {savingRol ? 'Guardando...' : 'Guardar Evaluación'}
                </Button>
              </div>
              <p className="text-xs text-zinc-500 italic">
                * El guardado también se realiza automáticamente al salir del cuadro de texto.
              </p>
            </div>
          )}

          {/* Estado Actual Guardado */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Última actualización:</span>
            <span className="text-zinc-300 font-mono">
              {patient.rol_updated_at ? new Date(patient.rol_updated_at).toLocaleDateString() : 'Sin registros'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Historial Básico / Notas */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" /> Notas de Evolución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 min-h-[200px] text-zinc-400 text-sm">
            {patient.notes ? (
              <p className="whitespace-pre-wrap">{patient.notes}</p>
            ) : (
              <p className="italic">Sin notas clínicas registradas aún.</p>
            )}
          </div>
          <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Activity className="w-4 h-4 mr-2" /> Agregar Nueva Nota (Próximamente)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}