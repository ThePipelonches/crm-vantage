import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, FileText, Activity, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("No se proporcionó ID del paciente");
      setLoading(false);
      return;
    }
    
    const fetchPatient = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (fetchError) throw fetchError;
        setPatient(data);
      } catch (err: any) {
        console.error("Error cargando paciente:", err);
        setError(err.message || "Error desconocido al cargar");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4">Cargando historia clínica...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-red-400 p-6 text-center">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Paciente no encontrado</h2>
        <p className="mb-6 text-zinc-400">{error || "El registro no existe o fue eliminado."}</p>
        <Button onClick={() => navigate('/patients')} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Pacientes
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return <Badge className="bg-green-900/50 text-green-400 border-green-800">Activo</Badge>;
      case 'inactive': return <Badge className="bg-orange-900/50 text-orange-400 border-orange-800">Inactivo</Badge>;
      case 'deserter': return <Badge className="bg-red-900/50 text-red-400 border-red-800">Desertor</Badge>;
      default: return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Pendiente</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header de Navegación */}
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/patients')} 
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica</h1>
      </div>

      {/* Tarjeta Principal de Información */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 rounded-full border border-blue-800">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">{patient.full_name}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-400 pl-11">
                {patient.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-zinc-500" /> {patient.email}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-zinc-500" /> {patient.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="md:mt-0">
              {getStatusBadge(patient.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info Financiera */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Detalles de Venta
              </h3>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Valor Total Plan</p>
                  <p className="text-lg font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Pago Inicial</p>
                  <p className="text-lg font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
                </div>
                {patient.installments_count && patient.installments_count > 0 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">Plan de Pagos</p>
                    <p className="text-sm text-zinc-300">
                      {patient.installments_count} cuotas x ${patient.installment_value?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Info de Registro */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Registro
              </h3>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 h-full min-h-[140px]">
                 <p className="text-xs text-zinc-500 mb-2">Fecha de Creación</p>
                 <p className="text-white font-medium">
                   {new Date(patient.created_at).toLocaleDateString('es-ES', { 
                     year: 'numeric', month: 'long', day: 'numeric' 
                   })}
                 </p>
                 {patient.notes && (
                   <>
                    <p className="text-xs text-zinc-500 mt-4 mb-2">Notas Iniciales</p>
                    <p className="text-sm text-zinc-400 italic whitespace-pre-wrap border-l-2 border-zinc-800 pl-3">
                      "{patient.notes}"
                    </p>
                   </>
                 )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Notas Clínicas (Futura) */}
      <Card className="bg-zinc-900 border-zinc-800 opacity-75">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" /> Notas de Evolución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
            <p className="mb-2">Esta sección estará disponible pronto.</p>
            <p className="text-sm">Aquí podrás registrar las sesiones y avances del paciente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}