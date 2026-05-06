import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Video, Clock, Calendar as CalendarIcon, User } from 'lucide-react';

// Datos mock
const mockClinicalAppointments = [
  { id: 1, patient: 'María Gómez', date: '2024-05-02', time: '09:00 AM', status: 'confirmed', type: 'Seguimiento' },
  { id: 2, patient: 'Carlos Ruiz', date: '2024-05-04', time: '11:30 AM', status: 'pending', type: 'Primera vez' },
];

export default function ClinicalAppointments() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Citas Clínicas</h1>
        <Button className="bg-white text-black hover:bg-zinc-200">
          <CalendarIcon className="w-4 h-4 mr-2" /> Agendar Paciente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockClinicalAppointments.map((apt) => (
          <Card key={apt.id} className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{apt.patient}</CardTitle>
                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                  {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{apt.type}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-zinc-400">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {apt.date} - {apt.time}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                  <Video className="w-4 h-4 mr-2" /> Iniciar Sesión
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <Clock className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockClinicalAppointments.length === 0 && (
        <div className="text-center py-10 text-zinc-500">No hay citas clínicas programadas.</div>
      )}
    </div>
  );
}