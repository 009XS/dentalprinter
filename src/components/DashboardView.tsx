import { useState, FormEvent, useMemo } from 'react';
import { 
  Users as UsersIcon, 
  Calendar as CalendarIcon, 
  MoreVertical, 
  MessageSquare,
  Clock,
  Send,
  User,
  Trash2,
  CalendarDays,
  Plus,
  AlertTriangle,
  Check,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  UserCheck,
  Activity,
  FolderOpen
} from 'lucide-react';
import { Patient, Appointment, Chat, AppointmentStatus } from '../types';
import { updateChat, cancelAppointment, updateAppointment } from '../api';

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedPatientId: (id: string) => void;
  searchQuery: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenAppointmentModal?: () => void;
  onOpenPatientModal?: () => void;
}

export default function DashboardView({
  patients,
  appointments,
  setAppointments,
  chats,
  setChats,
  setCurrentTab,
  setSelectedPatientId,
  searchQuery,
  showToast,
  onOpenAppointmentModal,
  onOpenPatientModal
}: DashboardViewProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');

  // Estados de dropdown para cada menú de acción de cita
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper para buscar paciente por ID
  const getPatientById = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  // 1. Filtrar citas de hoy según la búsqueda global y ordenarlas por hora (startHour)
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(appt => {
        const apptDate = appt.date || '2026-06-16';
        if (apptDate !== todayStr) return false;

        const patientObj = appt.patient || getPatientById(appt.patientId);
        const patientName = patientObj?.name || '';

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          patientName.toLowerCase().includes(query) ||
          appt.treatment.toLowerCase().includes(query) ||
          appt.time.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.startHour - b.startHour);
  }, [appointments, patients, searchQuery, todayStr]);

  // 2. Filtrar próximas citas futuras (excluyendo canceladas), ordenadas por fecha y hora más cercana
  const futureAppointments = useMemo(() => {
    return appointments
      .filter(appt => {
        const apptDate = appt.date || '2026-06-16';
        return apptDate > todayStr && appt.status !== 'Cancelada';
      })
      .sort((a, b) => {
        const dateA = a.date + String(a.startHour).padStart(5, '0');
        const dateB = b.date + String(b.startHour).padStart(5, '0');
        return dateA.localeCompare(dateB);
      })
      .slice(0, 8); // Mostrar las próximas 5 a 8 citas
  }, [appointments, todayStr]);

  // 3. Cálculos dinámicos reales para KPIs basados en los datos del sistema
  const activePatientsCount = useMemo(() => {
    return patients.filter(p => p.status === 'Activo').length;
  }, [patients]);

  const todayAppointmentsCount = useMemo(() => {
    // No contar canceladas en el total operativo
    return appointments.filter(a => (a.date || '2026-06-16') === todayStr && a.status !== 'Cancelada').length;
  }, [appointments, todayStr]);

  const futureAppointmentsCount = useMemo(() => {
    return appointments.filter(a => (a.date || '2026-06-16') > todayStr && a.status !== 'Cancelada').length;
  }, [appointments, todayStr]);

  const pendingAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.status === 'Pendiente').length;
  }, [appointments]);

  const cancelledAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.status === 'Cancelada').length;
  }, [appointments]);

  // 4. Generación automática de Alertas Operativas
  const operationalAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'danger' | 'warning' | 'info';
      text: string;
      actionText: string;
      onAction: () => void;
    }> = [];

    // Alerta 1: Citas de hoy con pacientes que tienen alergias (CRÍTICA)
    appointments.forEach(appt => {
      const apptDate = appt.date || '2026-06-16';
      if (apptDate === todayStr && appt.status !== 'Cancelada') {
        const patientObj = appt.patient || getPatientById(appt.patientId);
        if (patientObj?.allergies && patientObj.allergies.trim()) {
          alerts.push({
            id: `allergy-today-${appt.id}`,
            type: 'danger',
            text: `Paciente con Alergia hoy: ${patientObj.name} tiene cita a las ${appt.time} (Alergia a: ${patientObj.allergies}).`,
            actionText: 'Ver Alergias',
            onAction: () => {
              setSelectedPatientId(patientObj.id);
              setCurrentTab('odontogram');
            }
          });
        }
      }
    });

    // Alerta 2: Pacientes archivados con citas futuras
    appointments.forEach(appt => {
      const apptDate = appt.date || '2026-06-16';
      if (apptDate > todayStr && appt.status !== 'Cancelada') {
        const patientObj = appt.patient || getPatientById(appt.patientId);
        if (patientObj?.status === 'Archivado') {
          alerts.push({
            id: `archived-future-${appt.id}`,
            type: 'warning',
            text: `Paciente Archivado con Cita: ${patientObj.name} está archivado pero tiene cita el ${appt.date} a las ${appt.time}.`,
            actionText: 'Editar Paciente',
            onAction: () => {
              setCurrentTab('patients');
            }
          });
        }
      }
    });

    // Alerta 3: Inconsistencias (citas sin paciente válido en el sistema)
    appointments.forEach(appt => {
      const patientObj = appt.patient || getPatientById(appt.patientId);
      if (!patientObj) {
        alerts.push({
          id: `orphan-${appt.id}`,
          type: 'danger',
          text: `Cita Huérfana: Cita programada para el ${appt.date} (${appt.time}) no tiene un paciente válido vinculado en el sistema.`,
          actionText: 'Gestionar Citas',
          onAction: () => {
            setCurrentTab('appointments');
          }
        });
      }
    });

    // Alerta 4: Pacientes activos con alergias registradas (general)
    patients.forEach(p => {
      if (p.status === 'Activo' && p.allergies && p.allergies.trim()) {
        const hasAlertAlready = alerts.some(a => a.id.startsWith('allergy-today-') && a.text.includes(p.name));
        if (!hasAlertAlready) {
          alerts.push({
            id: `patient-allergy-${p.id}`,
            type: 'info',
            text: `Alergia Registrada: El paciente activo ${p.name} tiene alergia a: ${p.allergies}.`,
            actionText: 'Ficha Clínica',
            onAction: () => {
              setSelectedPatientId(p.id);
              setCurrentTab('odontogram');
            }
          });
        }
      }
    });

    // Alerta 5: Citas canceladas recientes (citas canceladas para hoy o el futuro)
    appointments.forEach(appt => {
      if (appt.status === 'Cancelada' && (appt.date || '2026-06-16') >= todayStr) {
        const patientObj = appt.patient || getPatientById(appt.patientId);
        alerts.push({
          id: `cancelled-recent-${appt.id}`,
          type: 'info',
          text: `Cita Cancelada: ${patientObj?.name || 'Paciente'} canceló su cita del día ${appt.date} (${appt.time}).`,
          actionText: 'Ver en Historial',
          onAction: () => {
            setCurrentTab('appointments');
          }
        });
      }
    });

    return alerts.slice(0, 5); // Mostrar máximo 5 alertas a la vez
  }, [appointments, patients, todayStr]);

  // Ciclo interactivo de estados de cita (con persistencia en el backend)
  const cycleStatus = async (id: string, currentStatus: AppointmentStatus) => {
    const statuses: AppointmentStatus[] = ['Confirmada', 'En Espera', 'Atrasada', 'Pendiente'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    try {
      await updateAppointment(id, { status: nextStatus });
      const updated = appointments.map(appt => {
        if (appt.id === id) {
          return { ...appt, status: nextStatus };
        }
        return appt;
      });
      setAppointments(updated);
      if (showToast) {
        showToast(`Estado de cita actualizado a: ${nextStatus}`, 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al actualizar estado: ${err.message}`, 'error');
      }
    }
  };

  // Eliminar cita de forma permanente en SQLite
  const deleteAppointment = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(appointments.filter(appt => appt.id !== id));
      setActiveMenuId(null);
      if (showToast) {
        showToast('Cita eliminada con éxito', 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al eliminar cita: ${err.message}`, 'error');
      }
    }
  };

  // Abrir chat
  const openChat = (id: string) => {
    setActiveChatId(id);
    setChats(chats.map(c => c.id === id ? { ...c, isNew: false } : c));
  };

  // Enviar mensaje en chat
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatId) return;

    const chatInstance = chats.find(c => c.id === activeChatId);
    if (!chatInstance) return;

    const newMsg = {
      id: String(Date.now()),
      sender: 'doctor' as const,
      text: typedMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const targetChat = {
      ...chatInstance,
      lastMessage: newMsg.text,
      time: newMsg.time,
      messages: [...chatInstance.messages, newMsg]
    };

    const updatedChats = chats.map(c => c.id === activeChatId ? targetChat : c);
    setChats(updatedChats);
    setTypedMessage('');
    if (showToast) {
      showToast('Mensaje enviado al paciente', 'success');
    }

    try {
      await updateChat(activeChatId, {
        lastMessage: targetChat.lastMessage,
        time: targetChat.time,
        isNew: false,
        messages: targetChat.messages,
        patientName: targetChat.name,
        initials: targetChat.initials,
        avatar: targetChat.avatar,
      });
    } catch (err) {
      console.error('Error al guardar mensaje en servidor:', err);
    }

    // Respuestas automáticas simuladas en español
    setTimeout(async () => {
      let patientReplyText = "Muchas gracias doctor, estaré al pendiente.";
      if (chatInstance.name.includes('Luis')) {
        patientReplyText = "¡Excelente! ¿Me confirma si las 3:30 PM está bien? Gracias de nuevo.";
      } else if (chatInstance.name.includes('David')) {
        patientReplyText = "Perfecto, estoy al lado de la ventana. Puedo pasar ya.";
      } else if (chatInstance.name.includes('Carlos')) {
        patientReplyText = "Excelente. Llamo más tarde para reservar mi espacio para el blanqueamiento.";
      }

      const replyMsg = {
        id: String(Date.now() + 1),
        sender: 'patient' as const,
        text: patientReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalChat = {
        ...targetChat,
        lastMessage: replyMsg.text,
        time: replyMsg.time,
        messages: [...targetChat.messages, replyMsg]
      };

      const finalChats = chats.map(c => c.id === activeChatId ? finalChat : c);
      setChats(finalChats);

      try {
        await updateChat(activeChatId, {
          lastMessage: finalChat.lastMessage,
          time: finalChat.time,
          isNew: finalChat.isNew,
          messages: finalChat.messages,
          patientName: finalChat.name,
          initials: finalChat.initials,
          avatar: finalChat.avatar,
        });
      } catch (err) {
        console.error('Error al guardar respuesta en servidor:', err);
      }
    }, 1500);
  };

  return (
    <div id="dashboard-view-root" className="p-4 md:p-5 overflow-y-auto space-y-4 md:space-y-5">
      
      {/* Encabezado */}
      <div id="greeting-header" className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-2">
        <div>
          <h2 className="font-serif text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
            Buenos días, Dr. Juan Carlos
          </h2>
          <p className="font-sans text-xs text-[#444748] dark:text-slate-400 mt-0.5">
            Aquí está el resumen clínico y operativo del consultorio para hoy.
          </p>
        </div>
      </div>

      {/* Sección de Accesos Rápidos */}
      <div id="quick-actions-panel" className="bg-slate-50/60 dark:bg-slate-900/40 border border-[#c4c7c8]/30 dark:border-slate-800 p-5 rounded-2xl shadow-3xs">
        <h3 className="text-2xs font-sans font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3.5 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Accesos y Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button 
            onClick={onOpenPatientModal}
            className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-3xs"
          >
            <Plus className="w-4 h-4" /> Nuevo Paciente
          </button>
          
          <button 
            onClick={onOpenAppointmentModal}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-3xs"
          >
            <CalendarIcon className="w-4 h-4" /> Agendar Cita
          </button>

          <button 
            onClick={() => setCurrentTab('patients')}
            className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 text-[#181c1e] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-3xs"
          >
            <UsersIcon className="w-4 h-4 text-blue-500" /> Ver Pacientes
          </button>

          <button 
            onClick={() => setCurrentTab('appointments')}
            className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 text-[#181c1e] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-3xs"
          >
            <Clock className="w-4 h-4 text-amber-500" /> Ver Citas
          </button>

          <button 
            onClick={() => setCurrentTab('calendar')}
            className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 text-[#181c1e] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-3xs"
          >
            <CalendarDays className="w-4 h-4 text-purple-500" /> Calendario
          </button>
        </div>
      </div>

      {/* Bento Grid de Indicadores (KPIs) - 5 Cards */}
      <div id="kpi-bento-grid" className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1 - Pacientes Activos */}
        <div 
          onClick={() => setCurrentTab('patients')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#c4c7c8]/40 dark:border-slate-800/80 relative overflow-hidden group hover:border-blue-600 transition-all duration-300 cursor-pointer shadow-3xs select-none"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-600/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#444748] dark:text-slate-400">P. Activos</span>
            <UsersIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 p-1.5 rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[#181c1e] dark:text-white">{activePatientsCount}</span>
            <span className="font-sans text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:underline">
              Administrar <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2 - Citas de Hoy */}
        <div 
          onClick={() => setCurrentTab('calendar')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#c4c7c8]/40 dark:border-slate-800/80 relative overflow-hidden group hover:border-emerald-600 transition-all duration-300 cursor-pointer shadow-3xs select-none"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-600/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#444748] dark:text-slate-400">Citas de Hoy</span>
            <CalendarIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/10 p-1.5 rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[#181c1e] dark:text-white">{todayAppointmentsCount}</span>
            <span className="font-sans text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:underline">
              Ir al Calendario <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3 - Citas Futuras */}
        <div 
          onClick={() => setCurrentTab('appointments')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#c4c7c8]/40 dark:border-slate-800/80 relative overflow-hidden group hover:border-amber-600 transition-all duration-300 cursor-pointer shadow-3xs select-none"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#444748] dark:text-slate-400">Futuras</span>
            <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400 bg-amber-600/10 dark:bg-amber-400/10 p-1.5 rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[#181c1e] dark:text-white">{futureAppointmentsCount}</span>
            <span className="font-sans text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:underline">
              Ver Concentrado <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4 - Citas Pendientes */}
        <div 
          onClick={() => setCurrentTab('appointments')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#c4c7c8]/40 dark:border-slate-800/80 relative overflow-hidden group hover:border-purple-650 transition-all duration-300 cursor-pointer shadow-3xs select-none"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-600/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#444748] dark:text-slate-400">Pendientes</span>
            <AlertCircle className="w-7 h-7 text-purple-600 dark:text-purple-400 bg-purple-600/10 dark:bg-purple-400/10 p-1.5 rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[#181c1e] dark:text-white">{pendingAppointmentsCount}</span>
            <span className="font-sans text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:underline">
              Ver Citas <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 5 - Citas Canceladas */}
        <div 
          onClick={() => setCurrentTab('appointments')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#c4c7c8]/40 dark:border-slate-800/80 relative overflow-hidden group hover:border-red-600 transition-all duration-300 cursor-pointer shadow-3xs select-none"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-650/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[#444748] dark:text-slate-400">Canceladas</span>
            <XCircle className="w-7 h-7 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10 p-1.5 rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[#181c1e] dark:text-white">{cancelledAppointmentsCount}</span>
            <span className="font-sans text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:underline">
              Historial de Canceladas <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA - Agenda de Hoy e Historial */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Agenda de Hoy */}
          <div id="today-schedule-table-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#ebeef0] dark:border-slate-800 shadow-3xs overflow-hidden">
            
            {/* Encabezado de la Tarjeta */}
            <div className="p-5 border-b border-[#ebeef0] dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-sans font-bold text-base text-[#181c1e] dark:text-white">Agenda del Día (Hoy)</h3>
                <p className="text-2xs text-[#444748] dark:text-slate-400 mt-0.5">Citas de la fecha actual del sistema ordenadas cronológicamente.</p>
              </div>
              <button 
                onClick={() => setCurrentTab('calendar')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-sans font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4" />
                Ver en Calendario
              </button>
            </div>

            {/* Tabla de Citas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ebeef0] dark:border-slate-800 text-[#444748] dark:text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider bg-slate-50/20 dark:bg-slate-900/20">
                    <th className="py-3 px-5">Hora</th>
                    <th className="py-3 px-5">Paciente</th>
                    <th className="py-3 px-5">Doctor</th>
                    <th className="py-3 px-5">Tratamiento / Motivo</th>
                    <th className="py-3 px-5">Duración</th>
                    <th className="py-3 px-5">Estado</th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef0]/60 dark:divide-slate-800/60 font-sans text-xs">
                  {todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hay citas programadas para hoy.
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.map((appt) => {
                      const patientObj = appt.patient || getPatientById(appt.patientId);
                      
                      let statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; // Confirmada
                      if (appt.status === 'En Espera') {
                        statusClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-350';
                      } else if (appt.status === 'Atrasada') {
                        statusClass = 'bg-red-100 text-red-750 dark:bg-red-900/30 dark:text-red-350';
                      } else if (appt.status === 'Pendiente') {
                        statusClass = 'bg-amber-100 text-amber-805 dark:bg-amber-900/30 dark:text-amber-350';
                      } else if (appt.status === 'Cancelada') {
                        statusClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
                      }

                      return (
                        <tr 
                          key={appt.id} 
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer relative"
                        >
                          {/* Columna de Hora */}
                          <td 
                            onClick={() => {
                              if (patientObj?.id) {
                                setSelectedPatientId(patientObj.id);
                                setCurrentTab('odontogram');
                              }
                            }}
                            className="py-4 px-5 text-slate-900 dark:text-white font-semibold align-middle shrink-0 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {appt.time}
                            </div>
                          </td>

                          {/* Columna de Paciente */}
                          <td 
                            onClick={() => {
                              if (patientObj?.id) {
                                setSelectedPatientId(patientObj.id);
                                setCurrentTab('odontogram');
                              }
                            }}
                            className="py-4 px-5 align-middle"
                          >
                            <div className="flex items-center gap-3">
                              {patientObj?.avatar ? (
                                <img 
                                  src={patientObj.avatar} 
                                  alt={patientObj.name || 'Paciente'} 
                                  className="w-8 h-8 rounded-full object-cover border border-[#c4c7c8]/20 bg-slate-100"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shadow-inner">
                                  {patientObj?.initials || 'P'}
                                </div>
                              )}
                              <div>
                                <p className="text-slate-900 dark:text-white font-bold group-hover:text-blue-650 dark:group-hover:text-blue-400 transition-colors">{patientObj?.name || 'Paciente'}</p>
                                <p className="text-[9px] font-mono text-slate-400 block mt-0.5">{patientObj?.id || appt.patientId}</p>
                                {patientObj?.allergies && (
                                  <p className="text-[10px] text-red-500 font-bold dark:text-red-400 mt-0.5">⚠️ Alergia: {patientObj.allergies}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Columna de Médico */}
                          <td className="py-4 px-5 text-slate-700 dark:text-slate-300 align-middle font-medium">
                            {appt.doctor}
                          </td>

                          {/* Columna de Tratamiento */}
                          <td className="py-4 px-5 text-slate-500 dark:text-slate-350 align-middle truncate max-w-[140px] font-medium">
                            {appt.treatment}
                          </td>

                          {/* Columna de Duración */}
                          <td className="py-4 px-5 text-slate-500 dark:text-slate-400 align-middle">
                            {appt.durationHours * 60} minutos
                          </td>

                          {/* Columna de Estado */}
                          <td className="py-4 px-5 align-middle">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleStatus(appt.id, appt.status);
                              }}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold select-none cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-600/30 transition-all ${statusClass}`}
                              title="Haz clic para cambiar el estado de la cita"
                            >
                              {appt.status}
                            </button>
                          </td>

                          {/* Acciones */}
                          <td className="py-4 px-3 text-right align-middle relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === appt.id ? null : appt.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                              title="Más Acciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === appt.id && (
                              <div className="absolute right-3 mt-1.5 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md py-1 z-45 text-left">
                                <button
                                  onClick={() => {
                                    if (patientObj?.id) {
                                      setSelectedPatientId(patientObj.id);
                                      setCurrentTab('odontogram');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <User className="w-3.5 h-3.5 text-blue-500" />
                                  Ficha Clínica
                                </button>
                                <button
                                  onClick={() => {
                                    if (patientObj?.id) {
                                      setSelectedPatientId(patientObj.id);
                                      setCurrentTab('archivero');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                                  Ver Expediente
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentTab('calendar');
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                                  Ver en Calendario
                                </button>
                                <button
                                  onClick={() => deleteAppointment(appt.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Cancelar Cita
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Próximas Citas */}
          <div id="future-appointments-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#ebeef0] dark:border-slate-800 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-[#ebeef0] dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-sans font-bold text-base text-[#181c1e] dark:text-white">Próximas Citas Programadas</h3>
                <p className="text-2xs text-[#444748] dark:text-slate-400 mt-0.5">Listado de las siguientes citas futuras agendadas.</p>
              </div>
              <button 
                onClick={() => setCurrentTab('appointments')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-sans font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver Concentrado Administrativo
              </button>
            </div>

            <div className="p-5">
              {futureAppointments.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No hay citas futuras registradas.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {futureAppointments.map(appt => {
                    const patientObj = appt.patient || getPatientById(appt.patientId);
                    
                    let statusColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450';
                    if (appt.status === 'Pendiente') {
                      statusColor = 'bg-amber-50 text-amber-805 dark:bg-amber-950/30 dark:text-amber-450';
                    } else if (appt.status === 'En Espera') {
                      statusColor = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450';
                    }

                    return (
                      <div 
                        key={appt.id}
                        onClick={() => {
                          if (patientObj?.id) {
                            setSelectedPatientId(patientObj.id);
                            setCurrentTab('odontogram');
                          }
                        }}
                        className="p-4 bg-slate-50/70 hover:bg-slate-100/60 dark:bg-slate-800/35 dark:hover:bg-slate-800/70 rounded-xl border border-slate-200/55 dark:border-slate-850 cursor-pointer transition-all flex items-start gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xs uppercase shadow-inner shrink-0 mt-0.5">
                          {patientObj?.initials || 'P'}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                              {patientObj?.name || 'Paciente'}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${statusColor}`}>
                              {appt.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appt.date}</span>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appt.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate">
                            Médico: <strong className="text-slate-655 dark:text-slate-300">{appt.doctor}</strong> · {appt.treatment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA - Alertas Operativas y Chats */}
        <div className="space-y-6">

          {/* Panel de Alertas Operativas */}
          <div id="alerts-panel-card" className="bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-4 border-b border-[#ebeef0] dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-sans font-bold text-sm text-[#181c1e] dark:text-white">Alertas Operativas</h3>
              </div>
              {operationalAlerts.length > 0 && (
                <span className="bg-red-550 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  {operationalAlerts.length} Activas
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {operationalAlerts.length === 0 ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-center">
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold">
                    ✓ Sin alertas operativas pendientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {operationalAlerts.map(alert => {
                    let containerClass = 'bg-blue-50/80 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-300';
                    let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
                    let badgeLabel = 'Aviso';

                    if (alert.type === 'danger') {
                      containerClass = 'bg-red-50 border-red-100 text-red-900 dark:bg-red-950/25 dark:border-red-900/40 dark:text-red-300';
                      badgeColor = 'bg-red-105 text-white dark:bg-red-900/80 dark:text-red-200';
                      badgeLabel = 'Crítico';
                    } else if (alert.type === 'warning') {
                      containerClass = 'bg-amber-50/80 border-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300';
                      badgeColor = 'bg-amber-100 text-amber-850 dark:bg-amber-900 dark:text-amber-250';
                      badgeLabel = 'Advertencia';
                    }

                    return (
                      <div 
                        key={alert.id}
                        className={`p-3.5 border rounded-xl space-y-2 ${containerClass}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-2xs font-semibold leading-relaxed">
                          {alert.text}
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={alert.onAction}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                          >
                            {alert.actionText} <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chats Activos */}
          <div id="chats-sidebar-panel" className="bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-2xl shadow-3xs flex flex-col min-h-[400px] overflow-hidden">
            
            {/* Encabezado del Panel */}
            <div className="p-4 border-b border-[#ebeef0] dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                <h3 className="font-sans font-bold text-sm text-[#181c1e] dark:text-white">Chats Activos</h3>
              </div>
              {chats.filter(c => c.isNew).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {chats.filter(c => c.isNew).length} Nuevos
                </span>
              )}
            </div>

            {/* Listado de Chats */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chats.map((c) => {
                const chatActive = activeChatId === c.id;
                return (
                  <div 
                    id={`chat-row-${c.id}`}
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    className={`flex items-start gap-3 p-3 hover:bg-[#f1f4f6]/60 dark:hover:bg-slate-800/45 rounded-xl cursor-pointer transition-colors relative ${
                      chatActive ? 'bg-[#f1f4f6] dark:bg-slate-800/90' : ''
                    }`}
                  >
                    {c.avatar ? (
                      <img 
                        src={c.avatar} 
                        alt={c.name} 
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-105 bg-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-inner">
                        {c.initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-sans text-xs font-bold text-[#181c1e] dark:text-white truncate">
                          {c.name}
                        </span>
                        <span className={`text-[9px] shrink-0 font-medium ${c.isNew ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {c.time}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${c.isNew ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-[#444748] dark:text-slate-400'}`}>
                        {c.lastMessage}
                      </p>
                    </div>

                    {c.isNew && (
                      <div className="absolute w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full right-3 top-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ventana de Conversación Activa */}
            {activeChatId && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950 p-3 h-80 flex flex-col animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 font-sans">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Chat con {chats.find(c => c.id === activeChatId)?.name}
                  </span>
                  <button 
                    onClick={() => setActiveChatId(null)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

                {/* Mensajes del Hilo */}
                <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xs">
                  {chats.find(c => c.id === activeChatId)?.messages.map((m) => {
                    const isDoctor = m.sender === 'doctor';
                    return (
                      <div key={m.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                          isDoctor 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/50'
                        }`}>
                          <p>{m.text}</p>
                          <span className={`block text-[8px] text-right mt-1 ${isDoctor ? 'text-slate-100/70' : 'text-slate-400'}`}>
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formulario de Redacción */}
                <form onSubmit={handleSendMessage} className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta clínica..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    className="flex-grow bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white border border-[#c4c7c8]/60 dark:border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    title="Enviar mensaje"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Enlace al final si no hay chat activo */}
            {!activeChatId && (
              <div className="p-3 border-t border-[#ebeef0] dark:border-slate-800 text-center bg-slate-50/30">
                <button 
                  onClick={() => openChat(chats[0]?.id || '')} 
                  className="text-xs font-bold text-blue-600 dark:text-blue-450 hover:underline cursor-pointer"
                >
                  Ver todos los mensajes
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
