import { useState } from 'react';
import { 
  Search, 
  Clock, 
  Calendar, 
  User, 
  Trash2, 
  Check, 
  Filter, 
  ArrowUpDown,
  FolderOpen
} from 'lucide-react';
import type { Appointment, Patient } from '../types';
import { updateAppointment, cancelAppointment } from '../api';

interface AppointmentsViewProps {
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  patients: Patient[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  setSelectedPatientId: (id: string) => void;
  setCurrentTab: (tab: string) => void;
}

export default function AppointmentsView({
  appointments,
  setAppointments,
  patients,
  showToast,
  setSelectedPatientId,
  setCurrentTab
}: AppointmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<'Todos' | 'Hoy' | 'Futuras' | 'Pasadas'>('Todos');
  const [doctorFilter, setDoctorFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'date' | 'doctor' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const todayStr = new Date().toISOString().split('T')[0];

  // Acción: cambiar estado de cita
  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateAppointment(id, { status: newStatus });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
      if (showToast) {
        showToast(`Cita actualizada a: ${newStatus}`, 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al actualizar cita: ${err.message}`, 'error');
      }
    }
  };

  // Acción: eliminar cita
  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(appointments.filter(a => a.id !== id));
      if (showToast) {
        showToast('Cita eliminada con éxito', 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al eliminar cita: ${err.message}`, 'error');
      }
    }
  };

  // Filtrado de citas
  const filteredAppointments = appointments.filter(appt => {
    // 1. Filtro de búsqueda (Paciente o Tratamiento)
    const patientObj = appt.patient || patients.find(p => p.id === appt.patientId);
    const patientName = patientObj?.name || '';
    const treatment = appt.treatment || '';
    const matchesSearch = !searchQuery ? true : (
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Filtro de estado
    const matchesStatus = statusFilter === 'Todos' ? true : appt.status === statusFilter;

    // 3. Filtro de doctor
    const matchesDoctor = doctorFilter === 'Todos' ? true : appt.doctor === doctorFilter;

    // 4. Filtro de fecha
    let matchesDate = true;
    const apptDate = appt.date || '2026-06-16';
    if (dateFilter === 'Hoy') {
      matchesDate = apptDate === todayStr;
    } else if (dateFilter === 'Futuras') {
      matchesDate = apptDate > todayStr;
    } else if (dateFilter === 'Pasadas') {
      matchesDate = apptDate < todayStr;
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  // Ordenamiento de citas
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortBy === 'date') {
      // Ordenar por fecha + hora de inicio
      valA = (a.date || '') + String(a.startHour).padStart(5, '0');
      valB = (b.date || '') + String(b.startHour).padStart(5, '0');
    } else if (sortBy === 'doctor') {
      valA = a.doctor;
      valB = b.doctor;
    } else if (sortBy === 'status') {
      valA = a.status;
      valB = b.status;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: 'date' | 'doctor' | 'status') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'En Espera':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'Atrasada':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
      case 'Cancelada':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450';
    }
  };

  return (
    <div id="appointments-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Citas</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            Concentrado administrativo general de todas las citas y reservas programadas.
          </p>
        </div>
      </div>

      {/* Caja de Búsqueda y Filtros */}
      <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-[#c4c7c8]/30 dark:border-slate-800 p-4 rounded-2xl space-y-4 shadow-3xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Búsqueda de Paciente */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Buscar Paciente / Tratamiento</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre del paciente, tratamiento..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-450 shadow-3xs"
              />
            </div>
          </div>

          {/* Filtro por Doctor */}
          <div>
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Médico Encargado</label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="Todos">Todos los médicos</option>
              <option value="Dr. Pérez">Dr. Juan Carlos</option>
              <option value="Dra. Gómez">Dra. Gómez</option>
              <option value="Higiene 1">Higiene 1</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div>
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-505 dark:text-slate-400 mb-1.5">Rango de Fecha</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="Todos">Todo el historial</option>
              <option value="Hoy">Hoy</option>
              <option value="Futuras">Citas futuras</option>
              <option value="Pasadas">Citas pasadas</option>
            </select>
          </div>
        </div>

        {/* Filtro de Estado Rápido */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/80">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {['Todos', 'Pendiente', 'Confirmada', 'En Espera', 'Atrasada', 'Cancelada'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-3xs font-extrabold cursor-pointer transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-3xs'
                  : 'bg-white dark:bg-slate-800 text-slate-655 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {status === 'Todos' ? 'Todos los estados' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de la Tabla */}
      <div className="bg-white dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-3xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-900/50 text-[#444748] dark:text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800/80">
                <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    Fecha y Hora
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-5">Paciente</th>
                <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleSort('doctor')}>
                  <div className="flex items-center gap-1">
                    Médico
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-5">Tratamiento / Consulta</th>
                <th className="py-3.5 px-5">Duración</th>
                <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">
                    Estado Cita
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-5 text-right">Acciones Clínicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-505 font-sans">
                    No se encontraron citas registradas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                sortedAppointments.map((appt) => {
                  const patientObj = appt.patient || patients.find(p => p.id === appt.patientId);

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Fecha y Hora */}
                      <td className="py-4 px-5 align-middle">
                        <div className="space-y-0.5">
                          <span className="block font-bold text-slate-805 dark:text-white">{appt.date}</span>
                          <span className="text-2xs text-slate-450 dark:text-slate-400 flex items-center font-medium">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {appt.time}
                          </span>
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="py-4 px-5 align-middle font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-[10px] border border-blue-100 dark:border-blue-900/30">
                            {patientObj?.initials || 'P'}
                          </div>
                          <div>
                            <span className="block font-bold">{patientObj?.name || 'Paciente'}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{patientObj?.id || appt.patientId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Médico */}
                      <td className="py-4 px-5 align-middle font-medium text-slate-705 dark:text-slate-350">
                        {appt.doctor}
                      </td>

                      {/* Tratamiento */}
                      <td className="py-4 px-5 align-middle text-slate-705 dark:text-slate-300 font-medium">
                        {appt.treatment}
                      </td>

                      {/* Duración */}
                      <td className="py-4 px-5 align-middle text-slate-500 dark:text-slate-400">
                        {appt.durationHours * 60} minutos
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-5 align-middle">
                        <select
                          value={appt.status}
                          onChange={(e) => handleStatusChange(appt.id, e.target.value as any)}
                          className={`font-sans text-2xs font-extrabold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 ${getStatusBadgeClass(appt.status)}`}
                        >
                          <option value="Pendiente">🟡 Pendiente</option>
                          <option value="Confirmada">🔵 Confirmada</option>
                          <option value="En Espera">🟢 En Espera</option>
                          <option value="Atrasada">🔴 Atrasada</option>
                          <option value="Cancelada">❌ Cancelada</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right align-middle">
                        <div className="flex justify-end items-center gap-1.5">
                          
                          {/* Ver Expediente */}
                          <button
                            onClick={() => {
                              if (patientObj?.id) {
                                setSelectedPatientId(patientObj.id);
                                setCurrentTab('archivero');
                              }
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg cursor-pointer transition-colors"
                            title="Ver Expediente en Archivero"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>

                          {appt.status !== 'Confirmada' && appt.status !== 'Cancelada' && (
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Confirmada')}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                              title="Confirmar Cita"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {appt.status !== 'Cancelada' && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:text-red-400 rounded-lg cursor-pointer transition-colors"
                              title="Cancelar Cita"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
