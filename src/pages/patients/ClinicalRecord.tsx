import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useState } from 'react';

// TODO: Conectar con Supabase para obtener datos reales del paciente
export default function ClinicalRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Datos mock (se reemplazarán con llamada a DB)
  const patient = {
    name: "Nombre del Paciente",
    age: 30,
    therapist: "Psicólogo Asignado",
    sessions: 5
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Historia Clínica: {patient.name}</h1>
          <p className="text-zinc-400 text-sm">ID Paciente: {id}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'overview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>Resumen</button>
        <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'notes' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>Notas de Sesión</button>
        <button onClick={() => setActiveTab('files')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'files' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>Archivos</button>
      </div>

      {/* Contenido */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5"/> Información General</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-zinc-300">
                <p><strong>Edad:</strong> {patient.age}</p>
                <p><strong>Terapeuta:</strong> {patient.therapist}</p>
                <p><strong>Estado:</strong> <span className="text-green-400">Activo</span></p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5"/> Próxima Cita</CardTitle></CardHeader>
              <CardContent>
                <p className="text-zinc-400">No hay citas programadas.</p>
                <Button size="sm" className="mt-4 bg-white text-black hover:bg-zinc-200">Agendar Cita</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notes' && (
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> Notas de Evolución</CardTitle>
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200"><Plus className="w-4 h-4 mr-2"/> Nueva Nota</Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                No hay notas registradas aún.
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'files' && (
           <div className="text-center py-20 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
             <FileText className="w-12 h-12 mx-auto mb-4 opacity-50"/>
             <p>Área para subir documentos y evaluaciones.</p>
           </div>
        )}
      </div>
    </div>
  );
}