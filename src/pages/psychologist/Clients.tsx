import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, Plus } from 'lucide-react';

export default function ClientsPage() {
  // Datos mock (luego se conectan a Supabase tabla 'clients')
  const clients = [
    { id: 1, name: 'Juan Pérez', status: 'Activo', sessions: 5 },
    { id: 2, name: 'María Gomez', status: 'En Pausa', sessions: 2 },
    { id: 3, name: 'Carlos Ruiz', status: 'Alta', sessions: 12 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Base de Datos de Pacientes</h1>
        <Button className="bg-white text-black hover:bg-zinc-200">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Paciente
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded ${
                  client.status === 'Activo' ? 'bg-green-900 text-green-200' : 
                  client.status === 'En Pausa' ? 'bg-yellow-900 text-yellow-200' : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {client.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Sesiones completadas: {client.sessions}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white">Ver Historia</Button>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white">Agendar Cita</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}