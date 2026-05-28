import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("No se encontró el ID del paciente");
      setLoading(false);
      return;
    }

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
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  if (loading) return <div className="p-6 text-white">Cargando historia clínica...</div>;
  if (error || !patient) return (
    <div className="p-6 text-red-400">
      <h2>Error: {error || "Paciente no encontrado"}</h2>
      <Button onClick={() => navigate('/patients')} variant="outline" className="mt-4 border-zinc-700 text-zinc-300">
        Volver a Pacientes
      </Button>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-900/30 text-green-400 border-green-800';
      case 'inactive': return 'bg-orange-900/30 text-orange-400 border-orange-800';
      case 'deserter': return 'bg-red-900/30 text-red-400 border-red-800';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={() => navigate('/patients')} variant="ghost" className="text-zinc-400 hover:text-white p-0 h-auto">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Historia Clínica: {patient.full_name}
          </h1>
          <p className="text-zinc-400 text-sm">Gestión de seguimiento y evolución</p>
        </div>
      </div>

      {/* Info Básica */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-blue-500"/> Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-zinc-500">Email</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4"/> {patient.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500">Teléfono</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {patient.phone || 'No registrado'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500">Estado Actual</p>
            <Badge className={`${getStatusColor(patient.status)} w-fit`}>
              {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : patient.status === 'deserter' ? 'Desertor' : 'Pendiente'}
            </Badge>
          </div>
          {patient.psychologist_name && (
            <div className="space-y-1">
              <p className="text-zinc-500">Psicólogo Asignado</p>
              <p>{patient.psychologist_name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos de Venta */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500"/> Datos de Admisión</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Valor Total Plan</p>
            <p className="text-lg font-mono text-white">${patient.sale_total?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Pago Inicial</p>
            <p className="text-lg font-mono text-green-400">${patient.cash_collected?.toLocaleString() || '0'}</p>
          </div>
          {patient.installments_count > 0 && (
            <>
              <div>
                <p className="text-zinc-500">Cuotas Restantes</p>
                <p className="text-lg font-mono text-white">{patient.installments_count}</p>
              </div>
              <div>
                <p className="text-zinc-500">Valor por Cuota</p>
                <p className="text-lg font-mono text-white">${patient.installment_value?.toLocaleString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Historial Clínico (Placeholder) */}
      <Card className="bg-zinc-900 border-zinc-800 text-white min-h-[300px]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-500"/> Notas de Evolución</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
            <p>No hay notas clínicas registradas aún.</p>
            <p className="text-xs mt-2">Esta funcionalidad estará disponible pronto para el psicólogo asignado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}