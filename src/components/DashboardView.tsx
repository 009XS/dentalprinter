import { useState, FormEvent } from 'react';
import { 
  Users as UsersIcon, 
  DollarSign, 
  Calendar as CalendarIcon, 
  MoreVertical, 
  MessageSquare,
  TrendingUp,
  Clock,
  Send,
  User,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { Patient, Appointment, Chat, AppointmentStatus, Budget } from '../types';
import { updateChat } from '../api';

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedPatientId: (id: string) => void;
  searchQuery: string;
}

export default function DashboardView({
  patients,
  appointments,
  setAppointments,
  chats,
  setChats,
  setCurrentTab,
  setSelectedPatientId,
  searchQuery
}: DashboardViewProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');

  // Estados de dropdown para cada menú de acción de cita
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtrar citas según la búsqueda global
  const filteredAppointments = appointments.filter(appt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      appt.patient.name.toLowerCase().includes(query) ||
      appt.treatment.toLowerCase().includes(query) ||
      appt.time.toLowerCase().includes(query)
    );
  });

  // Ciclo interactivo de estados de cita
  const cycleStatus = (id: string, currentStatus: AppointmentStatus) => {
    const statuses: AppointmentStatus[] = ['Confirmada', 'En Espera', 'Atrasada', 'Pendiente'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    const updated = appointments.map(appt => {
      if (appt.id === id) {
        return { ...appt, status: nextStatus };
      }
      return appt;
    });
    setAppointments(updated);
  };

  // Eliminar/Cancelar cita
  const deleteAppointment = (id: string) => {
    const updated = appointments.filter(appt => appt.id !== id);
    setAppointments(updated);
    setActiveMenuId(null);
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

  // Cálculos dinámicos reales basados en los datos del sistema
  const totalPatientsCount = patients.length;
  // Simular un ingreso mensual sumando unitarios de citas confirmadas
  const totalFinancialEstimate = 45000 + (appointments.filter(a => a.status === 'Confirmada').length * 150);

  return (
    <div id="dashboard-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Encabezado */}
      <div id="greeting-header">
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
          Buenos días, Dr. Pérez
        </h2>
        <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
          Aquí está el resumen de la clínica para el día de hoy.
        </p>
      </div>

      {/* Bento Grid de Indicadores (KPIs) */}
      <div id="kpi-bento-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1 - Pacientes Totales */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-[#c4c7c8]/40 dark:border-slate-700/60 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#444748] dark:text-slate-400">Pacientes Totales</span>
            <UsersIcon className="w-9 h-9 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 p-2 rounded-lg" />
          </div>
          <div className="flex items-end gap-2.5">
            <span className="font-serif text-3xl font-bold text-[#181c1e] dark:text-white">{totalPatientsCount}</span>
            <span className="font-sans text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center mb-1">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5 shrink-0" /> Activos
            </span>
          </div>
        </div>

        {/* KPI 2 - Ingresos Mensuales */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-[#c4c7c8]/40 dark:border-slate-700/60 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#444748] dark:text-slate-400">Ingresos Estimados</span>
            <DollarSign className="w-9 h-9 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 p-2 rounded-lg" />
          </div>
          <div className="flex items-end gap-2.5">
            <span className="font-serif text-3xl font-bold text-[#181c1e] dark:text-white">${totalFinancialEstimate.toLocaleString()}</span>
            <span className="font-sans text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center mb-1">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5 shrink-0" /> Mes Actual
            </span>
          </div>
        </div>

        {/* KPI 3 - Citas de Hoy */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-[#c4c7c8]/40 dark:border-slate-700/60 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#444748] dark:text-slate-400">Citas de Hoy</span>
            <CalendarIcon className="w-9 h-9 text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10 p-2 rounded-lg" />
          </div>
          <div className="flex items-end gap-2.5">
            <span className="font-serif text-3xl font-bold text-[#181c1e] dark:text-white">{filteredAppointments.length}</span>
            <span className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {filteredAppointments.filter(a => a.status === 'Pendiente').length} Pendientes
            </span>
          </div>
        </div>

      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA - Agenda del Día */}
        <div id="today-schedule-table-card" className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-[#ebeef0] dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Encabezado de la Tarjeta */}
          <div className="p-5 border-b border-[#ebeef0] dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-sans font-bold text-base text-[#181c1e] dark:text-white">Agenda del Día</h3>
              <p className="text-2xs text-[#444748] dark:text-slate-400 mt-0.5">Haz clic en el estado para cambiarlo, o en la fila para ver detalles en el Odontograma.</p>
            </div>
            <button 
              onClick={() => setCurrentTab('calendar')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-sans font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              Ver Calendario
            </button>
          </div>

          {/* Tabla de Citas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ebeef0] dark:border-slate-800 text-[#444748] dark:text-slate-400 font-sans font-bold text-xs uppercase tracking-wider bg-slate-50/20 dark:bg-slate-900/20">
                  <th className="py-3 px-5">Hora</th>
                  <th className="py-3 px-5">Paciente</th>
                  <th className="py-3 px-5">Tratamiento</th>
                  <th className="py-3 px-5">Estado</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef0]/60 dark:divide-slate-800/60 font-sans text-sm">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No hay citas programadas para hoy.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => {
                    
                    // Clases dinámicas de colores para estados de cita (Azul Médico / Menta / Alertas)
                    let statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; // Confirmada
                    if (appt.status === 'En Espera') {
                      statusClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-350';
                    } else if (appt.status === 'Atrasada') {
                      statusClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-350';
                    } else if (appt.status === 'Pendiente') {
                      statusClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-350';
                    }

                    return (
                      <tr 
                        key={appt.id} 
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer relative"
                      >
                        {/* Columna de Hora */}
                        <td 
                          onClick={() => {
                            setSelectedPatientId(appt.patient.id);
                            setCurrentTab('patients');
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
                            setSelectedPatientId(appt.patient.id);
                            setCurrentTab('patients');
                          }}
                          className="py-4 px-5 align-middle"
                        >
                          <div className="flex items-center gap-3">
                            {appt.patient.avatar ? (
                              <img 
                                src={appt.patient.avatar} 
                                alt={appt.patient.name} 
                                className="w-8 h-8 rounded-full object-cover border border-[#c4c7c8]/20 bg-slate-100"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shadow-inner">
                                {appt.patient.initials}
                              </div>
                            )}
                            <div>
                              <p className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{appt.patient.name}</p>
                              {appt.patient.allergies && (
                                <p className="text-[10px] text-red-500 font-semibold dark:text-red-400 mt-0.5">⚠️ Alergia: {appt.patient.allergies}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Columna de Tratamiento */}
                        <td 
                          onClick={() => {
                            setSelectedPatientId(appt.patient.id);
                            setCurrentTab('patients');
                          }}
                          className="py-4 px-5 text-slate-500 dark:text-slate-300 align-middle truncate max-w-[150px]"
                        >
                          {appt.treatment}
                        </td>

                        {/* Columna de Estado */}
                        <td className="py-4 px-5 align-middle">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleStatus(appt.id, appt.status);
                            }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold select-none cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-600/30 transition-all ${statusClass}`}
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
                            className="p-1.5 hover:bg-slate-105 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                            title="Más Acciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === appt.id && (
                            <div className="absolute right-3 mt-1.5 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md py-1 z-40 text-left">
                              <button
                                onClick={() => {
                                  setSelectedPatientId(appt.patient.id);
                                  setCurrentTab('patients');
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5" />
                                Ficha Clínica
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

        {/* COLUMNA DERECHA - Chats Activos */}
        <div id="chats-sidebar-panel" className="bg-white/95 dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-xl shadow-xs flex flex-col min-h-[400px] overflow-hidden">
          
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
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
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
                  <span className="w-1.5 h-1.5 bg-green-505 bg-emerald-500 rounded-full"></span>
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
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-105 dark:border-slate-700/50'
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
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg cursor-pointer transition-colors"
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
  );
}
