import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, FileText, DollarSign, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    
    const fetchPatient = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (error) throw error;
        setPatient(data);
      } catch (err: any) {
        console.error("Error cargando paciente:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Paciente no encontrado</h2>
        <Button onClick={() => navigate('/patients')} variant="outline" className="border-zinc-700 text-zinc-300">
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-green-900/50 text-green-400 border-green-800">Activo</Badge>;
      case 'inactive': return <Badge className="bg-orange-900/50 text-orange-400 border-orange-800">Inactivo</Badge>;
      case 'deserter': return <Badge className="bg-red-900/50 text-red-400 border-red-800">Desertor</Badge>;
      default: return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Pendiente</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header de Navegación */}
      <div className="flex items-center gap-4 mb-8">
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
      <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 rounded-full border border-blue-800">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">{patient.full_name}</CardTitle>
                  <CardDescription className="text-zinc-400 flex gap-4 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patient.email}</span>
                    {patient.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patient.phone}</span>}
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(patient.status)}
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 
                Registro: {new Date(patient.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
        
        {/* Sección de Datos Financieros (Venta) */}
        <CardContent className="pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Información de Venta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs uppercase">Valor Plan</span>
              </div>
              <p className="text-xl font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
            </div>
            
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs uppercase">Pago Inicial</span>
              </div>
              <p className="text-xl font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
            </div>

            {patient.installments_count && patient.installments_count > 0 && (
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs uppercase">Cuotas Restantes</span>
                </div>
                <p className="text-xl font-mono text-blue-400">
                  {patient.installments_count} x ${patient.installment_value?.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sección de Notas Clínicas */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Notas de Evolución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 min-h-[300px]">
            {patient.notes ? (
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{patient.notes}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg">Sin notas clínicas registradas aún.</p>
                <p className="text-sm mt-2">La historia clínica se irá llenando con las sesiones.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Activity className="w-4 h-4 mr-2" /> Agregar Nueva Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}