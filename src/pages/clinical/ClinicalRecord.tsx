import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, FileText, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// Datos mock (luego se conectará a Supabase)
const mockHistory = [
  { date: '2024-05-20', note: 'Primera sesión de evaluación.', type: 'Evaluación' },
  { date: '2024-05-25', note: 'Seguimiento inicial. Paciente responde bien.', type: 'Sesión' },
];

export default function ClinicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // En producción, aquí cargarías los datos reales del paciente usando patientId
  const patientName = "Nombre del Paciente"; // Reemplazar con dato real
  const patientEmail = "email@ejemplo.com";
  const patientPhone = "+57 300 123 4567";
  const status = "Activo";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Historia Clínica</h1>
      </div>

      {/* Información del Paciente */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                {patientName}
              </CardTitle>
              <div className="flex flex-col md:flex-row gap-4 mt-2 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {patientEmail}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {patientPhone}</span>
              </div>
            </div>
            <Badge className={status === 'Activo' ? 'bg-green-900 text-green-400 border-green-800' : 'bg-red-900 text-red-400 border-red-800'}>
              {status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Historial Clínico */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Registro de Sesiones y Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockHistory.length > 0 ? (
            <div className="space-y-3">
              {mockHistory.map((entry, idx) => (
                <div key={idx} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {entry.date}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{entry.type}</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{entry.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">No hay registros clínicos aún.</p>
          )}
          
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            <Activity className="w-4 h-4 mr-2" /> Agregar Nueva Nota
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}