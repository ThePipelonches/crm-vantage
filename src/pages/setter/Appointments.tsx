import { useState, useMemo } from 'react';
import { getAppointments, updateAppointment } from '../../services/storage';
import { StatusBadge } from '../../components/StatusBadge';
import type { AppointmentStatus, Appointment } from '../../types';

import {
  CalendarDays,
  Search,
  XCircle,
  RotateCcw,
  UserCheck,
  Clock,
} from 'lucide-react';

//////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////

function toDateSafe(date: string) {
  return new Date(date);
}

//////////////////////////////////////////////////

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(getAppointments());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'tomorrow' | 'today' | 'upcoming'>('all');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  //////////////////////////////////////////////////

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        const matchesSearch =
          !search ||
          a.clientName.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
          filter === 'all' ||
          (filter === 'today' && a.date === today) ||
          (filter === 'tomorrow' && a.date === tomorrow) ||
          (filter === 'upcoming' && a.date >= today);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        return new Date(`${a.date}T${a.time}`).getTime() -
               new Date(`${b.date}T${b.time}`).getTime();
      });
  }, [appointments, search, filter, today, tomorrow]);

  //////////////////////////////////////////////////

  const changeStatus = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
    setAppointments(getAppointments());
  };

  //////////////////////////////////////////////////

  return (
    <div className="space-y-5">

      <h2 className="text-lg font-medium">Consultas</h2>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar"
      />

      {/* TABLE */}
      <div>
        {filtered.map((appt) => (
          <div key={appt.id} className="border p-3">

            <p>{appt.clientName}</p>
            <p>{appt.date} {appt.time}</p>

            <StatusBadge
              status={appt.status}
              type="appointment"
            />

            {appt.status === 'confirmed' && (
              <div className="flex gap-2 mt-2">

                <button onClick={() => changeStatus(appt.id, 'completed')}>
                  <UserCheck />
                </button>

                <button onClick={() => changeStatus(appt.id, 'rescheduled')}>
                  <RotateCcw />
                </button>

                <button onClick={() => changeStatus(appt.id, 'no_show')}>
                  <XCircle />
                </button>

              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}