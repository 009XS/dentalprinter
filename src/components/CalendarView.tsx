import { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  CalendarDays
} from 'lucide-react';
import { Appointment, Patient } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  patients: Patient[];
  onOpenAppointmentModal: () => void;
  searchQuery: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CalendarView({
  appointments,
  setAppointments,
  patients,
  onOpenAppointmentModal,
  searchQuery,
  showToast
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any>(null);

  // Convertir YYYY-MM-DD local de forma segura contra desplazamientos de zona horaria
  const parseDateLocal = (str: string) => {
    return new Date(str + 'T12:00:00');
  };

  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Filtrar citas según la búsqueda global
  const searchFilteredAppointments = appointments.filter(appt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (appt.patient?.name || '').toLowerCase().includes(query) ||
      appt.treatment.toLowerCase().includes(query)
    );
  });

  // Médicos y módulos de la clínica
  const doctors = [
    { 
      id: 'Dr. Pérez', 
      name: 'Dr. Juan Carlos', 
      title: 'General', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9qY-Yo00VAQICr4JJ8sjr3bcyW73OqlAdbBL9K4aJ_-wBiYeiysx1fXFCtu99EFQa6EpLb2qGz4s5SfjPUA6ZTbjTSL-Akpy6FN6Nt4hFvkGbnaEwGlVPKjFgm3AWpZOTFQjguy3fRw0SgjZSPVX2W05e7En8MD6QtvEp7m7TzcBTx5onCAnTOYoK_Y-_cqzgQl7DvHnbdGPKzFJiYU8UklBZbmdBYGUYHteTQBNG4dxOaOgY4ndRj5h8ZqjWErnu8F-O0TgNPwRQ' 
    },
    { 
      id: 'Dra. Gómez', 
      name: 'Dra. Gómez', 
      title: 'Ortodoncia', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLRQC-BcBnh3F0qDNddgXvkogPzXCRPbRYL6mS1QjC8W_hfCxUV8wFN4_Xcr1uxqJVI6UoL1U1RWd2zG4KCQIsxbRrwkgrWZDYWP6ncKkTGFqQk2ofUEFA4QddJS84-C-qU8ObPppAJMkfGcTDBUr319XGLqdEKxNuD1BIztWDozhoGLU84Z3An0evqb_uOD-gd2-UiRT8gTJA8MoHbJN4BQv1Q_Ucw8VuhFBIx7olzFJGA6bub7Dn9NqHMiFmBnKwK1wCTGWks91L' 
    },
    { 
      id: 'Higiene 1', 
      name: 'Higiene 1', 
      title: 'Limpieza', 
      avatar: 'water_drop' 
    }
  ];

  // Acción de clic en slot propuesto por IA
  const handleAiSuggestedSlotClick = () => {
    setSelectedSlotDetails({
      time: '11:45 AM - 12:30 PM',
      doctor: 'Dra. Gómez',
      reason: 'Horario óptimo basado en patrones clínicos de tratamiento de ortodoncia.'
    });
    setShowAiModal(true);
  };

  // Creación automática de reserva sugerida
  const acceptAiProposal = () => {
    if (patients.length === 0) {
      if (showToast) {
        showToast('Por favor, registra al menos un paciente antes de agendar una propuesta de la IA.', 'error');
      } else {
        alert('Por favor, registra al menos un paciente antes de agendar una propuesta de la IA.');
      }
      setShowAiModal(false);
      return;
    }
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    const newAppt: Appointment = {
      id: `ai-appt-${Date.now()}`,
      date: selectedDate, // Usar la fecha actual seleccionada en el calendario
      time: '11:45 AM',
      patient: randomPatient,
      treatment: 'Ajuste de Ortodoncia',
      status: 'Confirmada',
      doctor: 'Dra. Gómez',
      startHour: 11.75, 
      durationHours: 0.75
    };

    setAppointments([...appointments, newAppt]);
    setShowAiModal(false);
    if (showToast) {
      showToast('Propuesta de la IA agendada para el ' + selectedDate, 'success');
    }
  };

  // Calcular la posición porcentual de la tarjeta en el timeline (08:00 AM a 06:00 PM)
  const getPositionStyling = (startHour: number, duration: number) => {
    const calendarStart = 8.0;
    const calendarEnd = 18.0;
    const totalSpan = calendarEnd - calendarStart; // Rango de 10 horas
    
    const leftOffset = ((startHour - calendarStart) / totalSpan) * 100;
    const widthPercentage = (duration / totalSpan) * 100;

    return {
      left: `${Math.max(0, Math.min(100, leftOffset))}%`,
      width: `${Math.max(10, Math.min(100, widthPercentage))}%`
    };
  };

  // Obtener posición del indicador de hora actual
  const getNowIndicatorPosition = () => {
    const calendarStart = 8.0;
    const calendarEnd = 18.0;
    const totalSpan = calendarEnd - calendarStart;
    
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    if (currentHour < calendarStart || currentHour > calendarEnd) {
      return null;
    }
    
    const percentage = ((currentHour - calendarStart) / totalSpan) * 100;
    return `${percentage}%`;
  };

  const indicatorLeft = getNowIndicatorPosition();

  // Navegación de fecha
  const handlePrev = () => {
    const d = parseDateLocal(selectedDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    }
    setSelectedDate(formatDateISO(d));
  };

  const handleNext = () => {
    const d = parseDateLocal(selectedDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    }
    setSelectedDate(formatDateISO(d));
  };

  const handleToday = () => {
    setSelectedDate(formatDateISO(new Date()));
  };

  // Obtener fecha de hoy formateada en español para el día seleccionado
  const getDateLabel = () => {
    const d = parseDateLocal(selectedDate);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = d.toLocaleDateString('es-ES', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Obtener etiqueta de rango para semana
  const getWeekRangeLabel = () => {
    const weekDays = getWeekDays(selectedDate);
    const start = weekDays[0];
    const end = weekDays[6];
    const startOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const endOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `Semana: ${start.toLocaleDateString('es-ES', startOpt)} - ${end.toLocaleDateString('es-ES', endOpt)}`;
  };

  // Obtener etiqueta de mes
  const getMonthLabel = () => {
    const d = parseDateLocal(selectedDate);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const dateStr = d.toLocaleDateString('es-ES', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Obtener los días de la semana
  const getWeekDays = (selectedDateStr: string) => {
    const current = parseDateLocal(selectedDateStr);
    const day = current.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayDiff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Obtener los días de la rejilla mensual (42 días)
  const getMonthDays = (selectedDateStr: string) => {
    const current = parseDateLocal(selectedDateStr);
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const startDayOfWeek = firstDay.getDay(); // 0: Dom, 1: Lun...
    
    // Ajustar si la semana empieza el lunes
    const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - paddingDays);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return 'border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/10 dark:border-l-blue-400';
      case 'En Espera':
        return 'border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-l-emerald-400';
      case 'Atrasada':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10 dark:border-l-red-400';
      default:
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10 dark:border-l-amber-400';
    }
  };

  return (
    <div id="calendar-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Controles del Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            {viewMode === 'day' && 'Calendario Diario'}
            {viewMode === 'week' && 'Calendario Semanal'}
            {viewMode === 'month' && 'Calendario Mensual'}
          </h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            {viewMode === 'day' && getDateLabel()}
            {viewMode === 'week' && getWeekRangeLabel()}
            {viewMode === 'month' && getMonthLabel()}
          </p>
        </div>

        {/* Controles de Navegación de Fecha */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <button 
            onClick={handlePrev}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToday}
            className="px-3.5 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer uppercase tracking-wider"
          >
            Hoy
          </button>
          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo de Vista */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-[#c4c7c8]/30 dark:border-slate-700/50 shadow-2xs">
          {[
            { id: 'day', label: 'Día' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' }
          ].map(mode => (
            <button 
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === mode.id 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs' 
                  : 'text-[#444748] dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/45'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA DIARIA */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#c4c7c8]/40 dark:border-slate-800 overflow-hidden shadow-2xs relative">
          
          {/* Marcadores de hora */}
          <div className="flex border-b border-[#ebeef0] dark:border-slate-800 bg-[#f7fafc] dark:bg-slate-900/60 sticky top-0 z-20 font-sans">
            <div className="w-[124px] shrink-0 border-r border-[#ebeef0] dark:border-slate-800 p-4 flex items-center justify-center bg-white dark:bg-slate-900">
              <span className="font-sans font-bold text-[10px] tracking-wider text-[#444748] dark:text-slate-400 uppercase">Consultorio</span>
            </div>
            <div className="flex-1 flex min-w-[700px] relative">
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(hour => (
                <div key={hour} className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                  {hour}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <div className="min-w-[700px] relative divide-y divide-[#ebeef0] dark:divide-slate-800">
              
              {/* Cuadrículas verticales de fondo */}
              <div className="absolute inset-0 flex pointer-events-none z-0">
                <div className="w-[124px] border-r border-[#ebeef0] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"></div>
                <div className="flex-1 flex justify-between h-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 border-l border-slate-100 dark:border-slate-800/30"></div>
                  ))}
                </div>
              </div>

              {doctors.map((doctor) => {
                // Filtrar citas por doctor y por fecha seleccionada
                const doctorAppointments = searchFilteredAppointments.filter(
                  a => a.doctor === doctor.id && a.date === selectedDate
                );

                return (
                  <div key={doctor.id} className="flex relative z-10 min-h-[110px] group transition-colors duration-150 hover:bg-slate-50/20">
                    
                    {/* Celda del Médico */}
                    <div className="w-[124px] shrink-0 border-r border-[#ebeef0] dark:border-slate-800 p-4 bg-white dark:bg-slate-900 z-10 flex flex-col items-center justify-center text-center">
                      {doctor.id === 'Higiene 1' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-[#00201a] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 border border-blue-100 dark:border-blue-950 shadow-2xs">
                          <Plus className="w-5 h-5" />
                        </div>
                      ) : (
                        <img 
                          alt={doctor.name} 
                          className="w-10 h-10 rounded-full object-cover mb-1 border border-slate-100 bg-slate-50" 
                          src={doctor.avatar} 
                        />
                      )}
                      <span className="font-sans font-bold text-xs text-slate-800 dark:text-white block mt-1">{doctor.name}</span>
                      <span className="font-sans text-[10px] text-[#444748] dark:text-slate-400">{doctor.title}</span>
                    </div>

                    {/* Línea de tiempo del canal */}
                    <div className="flex-1 relative flex items-center h-full min-h-[110px]">
                      
                      {/* Tarjetas de citas */}
                      {doctorAppointments.map((appt) => {
                        const styleOffset = getPositionStyling(appt.startHour, appt.durationHours);
                        const isLate = appt.status === 'Atrasada';

                        return (
                          <div
                            key={appt.id}
                            style={styleOffset}
                            onClick={() => onOpenAppointmentModal()}
                            className={`absolute top-2 bottom-2 rounded-xl p-2.5 shadow-xs hover:shadow-md border border-[#c4c7c8]/40 dark:border-slate-800 bg-white dark:bg-slate-800 z-10 overflow-hidden cursor-pointer transition-all duration-200 border-l-4 hover:-translate-y-0.5 ${
                              isLate 
                                ? 'border-l-red-500 hover:border-red-650' 
                                : 'border-l-blue-600 hover:border-blue-700'
                            }`}
                          >
                            <span className="block font-sans font-bold text-xs text-slate-800 dark:text-white truncate">
                              {appt.patient?.name || 'Paciente'}
                            </span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-355 font-medium truncate mt-0.5">
                              {appt.treatment}
                            </span>
                            <span className="inline-flex items-center text-[9px] text-[#444748] dark:text-slate-300 font-semibold tracking-wider mt-1.5 uppercase">
                              <Clock className="w-3 h-3 mr-1" />
                              {appt.time}
                            </span>
                          </div>
                        );
                      })}

                      {/* Espacio inteligente de IA para Dra. Gómez */}
                      {doctor.id === 'Dra. Gómez' && (
                        <div 
                          style={getPositionStyling(11.75, 0.75)} 
                          onClick={handleAiSuggestedSlotClick}
                          className="absolute top-2 bottom-2 bg-blue-600/10 border border-dashed border-blue-600 dark:border-blue-400 rounded-xl p-2 flex flex-col justify-center items-center cursor-pointer z-10 backdrop-blur-xs hover:bg-blue-600/20 transition-colors group mx-1.5"
                          title="Propuesta de horario sugerida por la IA"
                        >
                          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform fill-amber-300/20" />
                          <div className="font-sans font-bold text-[9px] tracking-wide text-blue-600 dark:text-blue-400 text-center uppercase leading-tight">
                            Espacio Sugerido IA<br/>11:45 - 12:30
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

              {/* Indicador de hora actual en timeline */}
              {selectedDate === formatDateISO(new Date()) && indicatorLeft && (
                <div 
                  style={{ left: indicatorLeft }}
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none transition-all duration-500"
                >
                  <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-md"></div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* VISTA SEMANAL */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {getWeekDays(selectedDate).map((day) => {
            const formattedDayStr = formatDateISO(day);
            const dayAppointments = searchFilteredAppointments.filter(a => a.date === formattedDayStr);
            const isToday = formattedDayStr === formatDateISO(new Date());

            return (
              <div 
                key={formattedDayStr} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col min-h-[350px] ${
                  isToday 
                    ? 'border-blue-500 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Cabecera del día de la semana */}
                <div 
                  onClick={() => {
                    setSelectedDate(formattedDayStr);
                    setViewMode('day');
                  }}
                  className={`p-3 text-center border-b border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    isToday ? 'bg-blue-500/5 text-blue-600 dark:text-blue-450' : 'bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </span>
                  <span className="block text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {day.getDate()}
                  </span>
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                  </span>
                </div>

                {/* Listado de citas de ese día */}
                <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
                  {dayAppointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-[10px] font-medium py-12 text-center">
                      Sin citas agendadas
                    </div>
                  ) : (
                    dayAppointments.map((appt) => (
                      <div 
                        key={appt.id}
                        onClick={() => onOpenAppointmentModal()}
                        className={`p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 border-l-4 shadow-3xs cursor-pointer transition-all hover:translate-x-0.5 ${getStatusColor(appt.status)}`}
                      >
                        <span className="block font-bold text-xs text-slate-800 dark:text-white truncate">
                          {appt.patient?.name || 'Paciente'}
                        </span>
                        <span className="block text-[9px] text-slate-500 dark:text-slate-350 truncate mt-0.5">
                          {appt.treatment}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/50 text-[8px] text-[#444748] dark:text-slate-400">
                          <span className="flex items-center font-bold">
                            <Clock className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                            {appt.time}
                          </span>
                          <span className="font-semibold text-2xs truncate max-w-[50px] bg-slate-100 dark:bg-slate-800 px-1 rounded-sm">
                            {appt.doctor.split(' ')[1] || appt.doctor}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA MENSUAL */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {/* Cabecera de los nombres de los días */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-center py-3">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <span key={d} className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500">
                {d}
              </span>
            ))}
          </div>

          {/* Rejilla de celdas */}
          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 dark:divide-slate-850 border-t border-slate-100 dark:border-slate-850">
            {getMonthDays(selectedDate).map((day, idx) => {
              const formattedDayStr = formatDateISO(day);
              const dayAppointments = searchFilteredAppointments.filter(a => a.date === formattedDayStr);
              
              const isToday = formattedDayStr === formatDateISO(new Date());
              const currentMonth = parseDateLocal(selectedDate).getMonth();
              const isCurrentMonth = day.getMonth() === currentMonth;

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedDate(formattedDayStr);
                    setViewMode('day');
                  }}
                  className={`min-h-[90px] p-2 flex flex-col justify-between cursor-pointer transition-colors duration-150 hover:bg-slate-50/60 dark:hover:bg-slate-850/30 ${
                    isToday ? 'bg-blue-50/20 dark:bg-blue-950/5' : ''
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  {/* Número del día */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold font-sans rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday 
                        ? 'bg-blue-600 text-white dark:bg-blue-500' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {day.getDate()}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-sans text-[8px] font-bold px-1.5 py-0.5 rounded">
                        {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                      </span>
                    )}
                  </div>

                  {/* Listado compacto de citas (máximo 2) */}
                  <div className="space-y-1 mt-1.5 flex-1 justify-end flex flex-col">
                    {dayAppointments.slice(0, 2).map((appt) => (
                      <div 
                        key={appt.id}
                        className="text-[9px] bg-slate-50 dark:bg-slate-800/80 border-l border-l-blue-600 dark:border-l-blue-400 p-0.5 px-1 rounded-sm truncate text-[#181c1e] dark:text-slate-300"
                        title={`${appt.time} - ${appt.patient?.name}`}
                      >
                        <strong className="text-[8px] mr-0.5">{appt.time.split(' ')[0]}</strong>
                        {appt.patient?.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[8px] text-blue-600 dark:text-blue-400 font-bold pl-1">
                        + {dayAppointments.length - 2} más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE PROPUESTA IA */}
      {showAiModal && selectedSlotDetails && (
        <div className="fixed inset-0 bg-slate-955/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400/20" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Propuesta de Cita por IA</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-4">
              Detecté un espacio altamente eficiente en la agenda de la <strong>{selectedSlotDetails.doctor} ({doctors.find(d => d.id === selectedSlotDetails.doctor)?.title})</strong> a las <strong>{selectedSlotDetails.time}</strong> para el día <strong>{selectedDate}</strong>. Reservar este ajuste reduce el tiempo inactivo del módulo de higiene.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs space-y-1 mb-5">
              <span className="text-[#444748] dark:text-slate-400 block">Fecha propuesta: <strong>{selectedDate}</strong></span>
              <span className="text-[#444748] dark:text-slate-400 block">Médico Propuesto: <strong>{selectedSlotDetails.doctor}</strong></span>
              <span className="text-[#444748] dark:text-slate-400 block font-normal text-2xs italic">Razón Clínica: {selectedSlotDetails.reason}</span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={acceptAiProposal}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-all uppercase"
              >
                Agendar Espacio
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-355 text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
