import { useState } from 'react';
import { 
  Clock, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Grid,
  Check,
  ChevronDown
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

interface PositionedAppointment {
  appt: Appointment;
  top: number;
  height: number;
  left: number;
  width: number;
}

// Helper to resolve doctor details
const getDoctorDetails = (id: string) => {
  if (id === 'Dr. Pérez') {
    return {
      name: 'Dr. Juan Carlos',
      title: 'General',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9qY-Yo00VAQICr4JJ8sjr3bcyW73OqlAdbBL9K4aJ_-wBiYeiysx1fXFCtu99EFQa6EpLb2qGz4s5SfjPUA6ZTbjTSL-Akpy6FN6Nt4hFvkGbnaEwGlVPKjFgm3AWpZOTFQjguy3fRw0SgjZSPVX2W05e7En8MD6QtvEp7m7TzcBTx5onCAnTOYoK_Y-_cqzgQl7DvHnbdGPKzFJiYU8UklBZbmdBYGUYHteTQBNG4dxOaOgY4ndRj5h8ZqjWErnu8F-O0TgNPwRQ',
      color: 'bg-blue-600'
    };
  }
  if (id === 'Dra. Gómez') {
    return {
      name: 'Dra. Gómez',
      title: 'Ortodoncia',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLRQC-BcBnh3F0qDNddgXvkogPzXCRPbRYL6mS1QjC8W_hfCxUV8wFN4_Xcr1uxqJVI6UoL1U1RWd2zG4KCQIsxbRrwkgrWZDYWP6ncKkTGFqQk2ofUEFA4QddJS84-C-qU8ObPppAJMkfGcTDBUr319XGLqdEKxNuD1BIztWDozhoGLU84Z3An0evqb_uOD-gd2-UiRT8gTJA8MoHbJN4BQv1Q_Ucw8VuhFBIx7olzFJGA6bub7Dn9NqHMiFmBnKwK1wCTGWks91L',
      color: 'bg-emerald-600'
    };
  }
  return {
    name: 'Higiene 1',
    title: 'Limpieza',
    avatar: '',
    color: 'bg-amber-600'
  };
};

export default function CalendarView({
  appointments,
  onOpenAppointmentModal,
  searchQuery
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year' | 'agenda' | 'fourdays'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Track month in the mini calendar sidebar
  const [miniCalMonth, setMiniCalMonth] = useState<Date>(new Date());
  
  // Dropdown menus and toggles
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [showRejectedEvents, setShowRejectedEvents] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
  // Filter active doctors
  const [activeDoctors, setActiveDoctors] = useState<string[]>(['Dr. Pérez', 'Dra. Gómez', 'Higiene 1']);

  // Local sidebar search state
  const [localSearch, setLocalSearch] = useState('');

  // Date parsing safely
  const parseDateLocal = (str: string) => {
    return new Date(str + 'T12:00:00');
  };

  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appt => {
    // Global filter search or local sidebar search
    const query = (localSearch || searchQuery || '').toLowerCase();
    if (query) {
      const matchSearch = 
        (appt.patient?.name || '').toLowerCase().includes(query) ||
        appt.treatment.toLowerCase().includes(query);
      if (!matchSearch) return false;
    }

    // Cancelled (rejected) filter
    if (!showRejectedEvents && appt.status === 'Cancelada') {
      return false;
    }

    // Doctor filter
    if (!activeDoctors.includes(appt.doctor)) {
      return false;
    }

    return true;
  });

  // Overlapping events positioning algorithm
  const getPositionedAppointments = (dayAppts: Appointment[]): PositionedAppointment[] => {
    if (dayAppts.length === 0) return [];
    
    // Sort by start hour
    const sorted = [...dayAppts].sort((a, b) => a.startHour - b.startHour);
    
    const blocks: Appointment[][] = [];
    let currentBlock: Appointment[] = [];
    let maxEndHour = 0;
    
    for (const appt of sorted) {
      const endHour = appt.startHour + appt.durationHours;
      if (currentBlock.length === 0) {
        currentBlock.push(appt);
        maxEndHour = endHour;
      } else if (appt.startHour < maxEndHour) {
        currentBlock.push(appt);
        maxEndHour = Math.max(maxEndHour, endHour);
      } else {
        blocks.push(currentBlock);
        currentBlock = [appt];
        maxEndHour = endHour;
      }
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }
    
    const result: PositionedAppointment[] = [];
    
    for (const block of blocks) {
      const columns: Appointment[][] = [];
      
      for (const appt of block) {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
          const lastInCol = columns[c][columns[c].length - 1];
          const lastEnd = lastInCol.startHour + lastInCol.durationHours;
          if (appt.startHour >= lastEnd) {
            columns[c].push(appt);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([appt]);
        }
      }
      
      const numCols = columns.length;
      for (let c = 0; c < numCols; c++) {
        for (const appt of columns[c]) {
          // Clamp start and duration to 8:00 to 18:00
          const start = Math.max(8.0, Math.min(18.0, appt.startHour));
          const end = Math.max(8.0, Math.min(18.0, appt.startHour + appt.durationHours));
          
          const top = (start - 8) * 60;
          const height = Math.max(20, (end - start) * 60);
          const left = (c / numCols) * 100;
          const width = (1 / numCols) * 100;
          
          result.push({
            appt,
            top,
            height,
            left,
            width
          });
        }
      }
    }
    
    return result;
  };

  // Date Navigation handlers
  const handlePrev = () => {
    const d = parseDateLocal(selectedDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() - 1);
    else if (viewMode === 'fourdays') d.setDate(d.getDate() - 4);
    else d.setDate(d.getDate() - 7);
    
    const iso = formatDateISO(d);
    setSelectedDate(iso);
    setMiniCalMonth(d);
  };

  const handleNext = () => {
    const d = parseDateLocal(selectedDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + 1);
    else if (viewMode === 'fourdays') d.setDate(d.getDate() + 4);
    else d.setDate(d.getDate() + 7);

    const iso = formatDateISO(d);
    setSelectedDate(iso);
    setMiniCalMonth(d);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(formatDateISO(today));
    setMiniCalMonth(today);
  };

  // Labels for the header
  const getHeaderLabel = () => {
    const d = parseDateLocal(selectedDate);
    if (viewMode === 'day') {
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const days = getWeekDays(selectedDate);
      const start = days[0];
      const end = days[6];
      return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (viewMode === 'month') {
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    if (viewMode === 'year') {
      return d.getFullYear().toString();
    }
    if (viewMode === 'fourdays') {
      const days = getFourDays(selectedDate);
      return `${days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${days[3].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return 'Agenda';
  };

  // Helper arrays for date logic
  const getWeekDays = (selectedStr: string) => {
    const current = parseDateLocal(selectedStr);
    const dayOfWeek = current.getDay(); // 0: Sun, 1: Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);
    
    const days = [];
    const loopLimit = showWeekends ? 7 : 5;
    for (let i = 0; i < loopLimit; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const getFourDays = (selectedStr: string) => {
    const current = parseDateLocal(selectedStr);
    const days = [];
    let count = 0;
    let index = 0;
    while (count < 4) {
      const nextDay = new Date(current);
      nextDay.setDate(current.getDate() + index);
      const isWeekend = nextDay.getDay() === 0 || nextDay.getDay() === 6;
      if (showWeekends || !isWeekend) {
        days.push(nextDay);
        count++;
      }
      index++;
    }
    return days;
  };

  const getMonthDays = (selectedStr: string) => {
    const current = parseDateLocal(selectedStr);
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon...
    
    const padding = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - padding);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Get mini calendar grid
  const getMiniCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const padding = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - padding);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Render daily appointment card
  const renderApptCard = (pos: PositionedAppointment) => {
    const { appt, top, height, left, width } = pos;
    const doctorObj = getDoctorDetails(appt.doctor);
    
    // Status styling
    let statusBorder = 'border-l-blue-600 dark:border-l-blue-400';
    let statusBg = 'bg-blue-50/70 dark:bg-blue-950/20';
    if (appt.status === 'En Espera') {
      statusBorder = 'border-l-emerald-600 dark:border-l-emerald-400';
      statusBg = 'bg-emerald-50/70 dark:bg-emerald-950/20';
    } else if (appt.status === 'Atrasada') {
      statusBorder = 'border-l-red-500 dark:border-l-red-400';
      statusBg = 'bg-red-50/70 dark:bg-red-950/20';
    } else if (appt.status === 'Cancelada') {
      statusBorder = 'border-l-slate-400 dark:border-l-slate-600';
      statusBg = 'bg-slate-100/70 dark:bg-slate-900/30 line-through';
    }

    return (
      <div
        key={appt.id}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: `${left}%`,
          width: `calc(${width}% - 3px)`
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenAppointmentModal();
        }}
        className={`absolute rounded-xl p-2.5 shadow-2xs border border-slate-200 dark:border-slate-800 border-l-4 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group ${statusBorder} ${statusBg}`}
      >
        <span className="block font-sans font-bold text-xs text-slate-900 dark:text-white truncate">
          {appt.patient?.name || 'Paciente'}
        </span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate font-semibold mt-0.5">
          {appt.treatment}
        </span>
        
        {/* Doctor info pill inside the card */}
        <div className="flex items-center gap-1.5 mt-2 bg-white/80 dark:bg-slate-900/70 rounded-full py-0.5 px-2 w-fit border border-slate-100 dark:border-slate-800">
          {doctorObj.avatar ? (
            <img src={doctorObj.avatar} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-3.5 h-3.5 rounded-full ${doctorObj.color} text-white text-[8px] flex items-center justify-center font-bold shrink-0`}>
              {doctorObj.name.charAt(0)}
            </div>
          )}
          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
            {doctorObj.name}
          </span>
        </div>

        {/* Time Badge */}
        <span className="absolute right-2 bottom-2 text-[8px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-sm px-1 py-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Clock className="w-2.5 h-2.5" />
          {appt.time}
        </span>
      </div>
    );
  };

  // Helper to toggle doctor filter
  const toggleDoctorFilter = (id: string) => {
    setActiveDoctors(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Timeline Hour grid (08:00 to 18:00)
  const timelineHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Current Time line indicator coordinates
  const getNowIndicatorTop = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < 8.0 || currentHour > 18.0) return null;
    return (currentHour - 8) * 60;
  };

  const nowIndicatorTop = getNowIndicatorTop();

  return (
    <div id="calendar-view-root" className="flex h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans select-none overflow-hidden">
      
      {/* BARRA LATERAL IZQUIERDA (Estilo Google Calendar) */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-850 p-4 space-y-6 hidden lg:flex flex-col shrink-0 bg-white dark:bg-slate-900/60 overflow-y-auto">
        
        {/* Botón Crear Cita */}
        <button 
          onClick={onOpenAppointmentModal}
          className="flex items-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-750 shadow-md hover:shadow-lg rounded-full py-3 px-6 w-fit transition-all duration-200 cursor-pointer transform active:scale-98"
        >
          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[3]" />
          <span className="text-sm font-bold tracking-wide">Crear Cita</span>
        </button>

        {/* Buscador de Citas */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar citas o personas..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-450 dark:placeholder-slate-500"
          />
        </div>

        {/* MINICALENDARIO MENSUAL INTERACTIVO */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {miniCalMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setMiniCalMonth(new Date(miniCalMonth.setMonth(miniCalMonth.getMonth() - 1)))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setMiniCalMonth(new Date(miniCalMonth.setMonth(miniCalMonth.getMonth() + 1)))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grilla Mini Calendario */}
          <div className="grid grid-cols-7 text-center gap-y-1">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, idx) => (
              <span key={idx} className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{d}</span>
            ))}
            {getMiniCalendarDays(miniCalMonth).map((day, idx) => {
              const iso = formatDateISO(day);
              const isSelected = iso === selectedDate;
              const isToday = iso === formatDateISO(new Date());
              const isCurrentMonth = day.getMonth() === miniCalMonth.getMonth();

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(iso)}
                  className={`text-[10px] font-semibold w-6 h-6 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-bold' 
                      : isToday 
                        ? 'text-blue-600 dark:text-blue-400 font-bold border border-blue-400' 
                        : isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'text-slate-300 dark:text-slate-650 hover:bg-slate-100/40 dark:hover:bg-slate-800/20'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* FILTROS DE DOCTORES (Mis Calendarios) */}
        <div className="space-y-3 border-t border-slate-150 dark:border-slate-800/80 pt-4">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 px-1">Mis Calendarios</h4>
          
          <div className="space-y-2.5">
            {[
              { id: 'Dr. Pérez', name: 'Dr. Juan Carlos', color: 'bg-blue-600 ring-blue-500' },
              { id: 'Dra. Gómez', name: 'Dra. Gómez', color: 'bg-emerald-600 ring-emerald-500' },
              { id: 'Higiene 1', name: 'Higiene 1', color: 'bg-amber-600 ring-amber-500' }
            ].map(doc => {
              const active = activeDoctors.includes(doc.id);
              return (
                <label key={doc.id} className="flex items-center gap-3 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleDoctorFilter(doc.id)}
                    className="hidden"
                  />
                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
                    active 
                      ? `${doc.color} border-transparent text-white` 
                      : 'border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}>
                    {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>{doc.name}</span>
                </label>
              );
            })}
          </div>
        </div>

      </div>

      {/* CUERPO DEL CALENDARIO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 py-3.5 px-6 bg-white dark:bg-slate-900/40">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-xl md:text-2xl font-black tracking-wide text-slate-900 dark:text-white shrink-0 w-64 md:w-80 truncate">
              {getHeaderLabel()}
            </h3>

            {/* Controles de Navegación */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-750/50">
              <button 
                onClick={handlePrev}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-655 dark:text-slate-250 cursor-pointer"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={handleToday}
                className="px-3 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-2xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer uppercase tracking-wider"
              >
                Hoy
              </button>
              <button 
                onClick={handleNext}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-655 dark:text-slate-250 cursor-pointer"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* SELECTOR DE VISTAS (Estilo Google Calendar Dropdown) */}
          <div className="relative">
            <button 
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-750 shadow-2xs hover:shadow-xs px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-450" />
              <span>
                {viewMode === 'day' && 'Día'}
                {viewMode === 'week' && 'Semana'}
                {viewMode === 'month' && 'Mes'}
                {viewMode === 'year' && 'Año'}
                {viewMode === 'agenda' && 'Agenda'}
                {viewMode === 'fourdays' && '4 días'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            </button>

            {/* Dropdown Menu (Imagen 3) */}
            {showViewDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowViewDropdown(false)} />
                <div className="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl py-1.5 text-slate-700 dark:text-slate-200 w-56 z-50 animate-in zoom-in-95 duration-100">
                  {[
                    { id: 'day', label: 'Día', shortcut: 'D' },
                    { id: 'week', label: 'Semana', shortcut: 'W' },
                    { id: 'month', label: 'Mes', shortcut: 'M' },
                    { id: 'year', label: 'Año', shortcut: 'Y' },
                    { id: 'agenda', label: 'Agenda', shortcut: 'A' },
                    { id: 'fourdays', label: '4 días', shortcut: 'X' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setViewMode(mode.id as any);
                        setShowViewDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-semibold cursor-pointer"
                    >
                      <span className={viewMode === mode.id ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                        {mode.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">{mode.shortcut}</span>
                    </button>
                  ))}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />
                  
                  {/* Toggles */}
                  <button 
                    onClick={() => setShowWeekends(!showWeekends)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-semibold cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      showWeekends ? 'bg-blue-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}>
                      {showWeekends && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Mostrar fines de semana</span>
                  </button>

                  <button 
                    onClick={() => setShowRejectedEvents(!showRejectedEvents)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-semibold cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      showRejectedEvents ? 'bg-blue-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}>
                      {showRejectedEvents && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Mostrar eventos rechazados</span>
                  </button>

                  <button 
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-semibold cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      showCompletedTasks ? 'bg-blue-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}>
                      {showCompletedTasks && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Mostrar tareas completadas</span>
                  </button>

                </div>
              </>
            )}
          </div>
        </div>

        {/* CONTENEDOR DE VISTAS */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-50/50 dark:bg-slate-950/20">

          {/* VISTA DIARIA */}
          {viewMode === 'day' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs relative">
              <div className="flex relative min-h-[600px] h-[600px]">
                
                {/* Eje de Horas */}
                <div className="w-20 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-1 text-right pr-3 font-semibold text-[10px] text-slate-400 dark:text-slate-500 shrink-0 select-none bg-slate-50/20 dark:bg-slate-900/65">
                  {timelineHours.map(hour => (
                    <div key={hour} className="h-6 leading-none flex items-center justify-end">
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Área de Timeline de Citas */}
                <div className="flex-1 relative h-full bg-transparent">
                  {/* Grid Lines Horizontales */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="w-full border-b border-slate-100 dark:border-slate-800/40 h-px"></div>
                    ))}
                  </div>

                  {/* Renderizar Citas del Día */}
                  <div className="absolute inset-0 pl-1">
                    {(() => {
                      const dayAppts = filteredAppointments.filter(a => a.date === selectedDate);
                      const positioned = getPositionedAppointments(dayAppts);
                      return positioned.map(renderApptCard);
                    })()}
                  </div>

                  {/* Indicador de hora actual en tiempo real */}
                  {selectedDate === formatDateISO(new Date()) && nowIndicatorTop !== null && (
                    <div 
                      style={{ top: `${nowIndicatorTop}px` }}
                      className="absolute left-0 right-0 w-full h-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-500"
                    >
                      <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-md"></div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* VISTA SEMANAL */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col h-[650px]">
              
              {/* Encabezado de la semana */}
              <div className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 text-center py-2.5"
                style={{ gridTemplateColumns: `80px repeat(${showWeekends ? 7 : 5}, minmax(0, 1fr))` }}
              >
                {/* Celda vacía superior izquierda */}
                <div className="border-r border-slate-200 dark:border-slate-800" />
                {getWeekDays(selectedDate).map(day => {
                  const dayIso = formatDateISO(day);
                  const isToday = dayIso === formatDateISO(new Date());
                  return (
                    <div key={dayIso} className="flex flex-col items-center justify-center font-sans">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </span>
                      <span className={`text-base font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                        isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cuerpo del Timeline Semanal */}
              <div className="flex-1 flex overflow-y-auto relative min-h-0">
                {/* Eje de Horas */}
                <div className="w-20 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-1 text-right pr-3 font-semibold text-[10px] text-slate-400 dark:text-slate-500 shrink-0 select-none bg-slate-50/20 dark:bg-slate-900/40 h-[600px]">
                  {timelineHours.map(hour => (
                    <div key={hour} className="h-6 leading-none flex items-center justify-end">
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Columnas de los Días */}
                <div className="flex-1 grid h-[600px] relative divide-x divide-slate-150 dark:divide-slate-850"
                  style={{ gridTemplateColumns: `repeat(${showWeekends ? 7 : 5}, minmax(0, 1fr))` }}
                >
                  {/* Grid Lines Horizontales */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="w-full border-b border-slate-100 dark:border-slate-850/40 h-px"></div>
                    ))}
                  </div>

                  {/* Cada día como una columna */}
                  {getWeekDays(selectedDate).map(day => {
                    const dayIso = formatDateISO(day);
                    const dayAppts = filteredAppointments.filter(a => a.date === dayIso);
                    const positioned = getPositionedAppointments(dayAppts);
                    const isToday = dayIso === formatDateISO(new Date());

                    return (
                      <div key={dayIso} className="relative h-full px-0.5">
                        {positioned.map(renderApptCard)}

                        {/* Indicador de hora actual si es hoy */}
                        {isToday && nowIndicatorTop !== null && (
                          <div 
                            style={{ top: `${nowIndicatorTop}px` }}
                            className="absolute left-0 right-0 w-full h-0.5 bg-red-500 z-30 pointer-events-none"
                          >
                            <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-md"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* VISTA 4 DÍAS */}
          {viewMode === 'fourdays' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col h-[650px]">
              
              {/* Encabezado */}
              <div className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 text-center py-2.5"
                style={{ gridTemplateColumns: `80px repeat(4, minmax(0, 1fr))` }}
              >
                <div className="border-r border-slate-200 dark:border-slate-800" />
                {getFourDays(selectedDate).map(day => {
                  const dayIso = formatDateISO(day);
                  const isToday = dayIso === formatDateISO(new Date());
                  return (
                    <div key={dayIso} className="flex flex-col items-center justify-center font-sans">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                        {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </span>
                      <span className={`text-base font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                        isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Cuerpo */}
              <div className="flex-1 flex overflow-y-auto relative min-h-0">
                {/* Eje de Horas */}
                <div className="w-20 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-1 text-right pr-3 font-semibold text-[10px] text-slate-400 dark:text-slate-500 shrink-0 select-none bg-slate-50/20 dark:bg-slate-900/40 h-[600px]">
                  {timelineHours.map(hour => (
                    <div key={hour} className="h-6 leading-none flex items-center justify-end">
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Columnas de los 4 Días */}
                <div className="flex-1 grid h-[600px] relative divide-x divide-slate-150 dark:divide-slate-850"
                  style={{ gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}
                >
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="w-full border-b border-slate-100 dark:border-slate-850/40 h-px"></div>
                    ))}
                  </div>

                  {getFourDays(selectedDate).map(day => {
                    const dayIso = formatDateISO(day);
                    const dayAppts = filteredAppointments.filter(a => a.date === dayIso);
                    const positioned = getPositionedAppointments(dayAppts);
                    const isToday = dayIso === formatDateISO(new Date());

                    return (
                      <div key={dayIso} className="relative h-full px-0.5">
                        {positioned.map(renderApptCard)}

                        {isToday && nowIndicatorTop !== null && (
                          <div 
                            style={{ top: `${nowIndicatorTop}px` }}
                            className="absolute left-0 right-0 w-full h-0.5 bg-red-500 z-30 pointer-events-none"
                          >
                            <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-md"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* VISTA MENSUAL (Google Calendar Style) */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col">
              
              {/* Nombres de los Días */}
              <div className="grid border-b border-slate-200 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/60 text-center py-2.5"
                style={{ gridTemplateColumns: `repeat(${showWeekends ? 7 : 5}, minmax(0, 1fr))` }}
              >
                {(showWeekends 
                  ? ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
                  : ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE']
                ).map(d => (
                  <span key={d} className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500">
                    {d}
                  </span>
                ))}
              </div>

              {/* Rejilla del Mes */}
              <div className="grid divide-x divide-y divide-slate-150 dark:divide-slate-850 border-t border-slate-150 dark:border-slate-850"
                style={{ 
                  gridTemplateColumns: `repeat(${showWeekends ? 7 : 5}, minmax(0, 1fr))`
                }}
              >
                {getMonthDays(selectedDate).map((day, idx) => {
                  const dayIso = formatDateISO(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  // Skip rendering weekend cells if hidden
                  if (!showWeekends && isWeekend) return null;

                  const dayAppts = filteredAppointments.filter(a => a.date === dayIso);
                  const isToday = dayIso === formatDateISO(new Date());
                  const currentMonth = parseDateLocal(selectedDate).getMonth();
                  const isCurrentMonth = day.getMonth() === currentMonth;

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedDate(dayIso);
                        setViewMode('day');
                      }}
                      className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors duration-150 hover:bg-slate-50/60 dark:hover:bg-slate-850/30 ${
                        isToday ? 'bg-blue-50/15 dark:bg-blue-950/5' : ''
                      } ${!isCurrentMonth ? 'opacity-35' : ''}`}
                    >
                      {/* Día y Contadores */}
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-extrabold font-sans rounded-full w-5.5 h-5.5 flex items-center justify-center transition-all ${
                          isToday 
                            ? 'bg-blue-600 text-white dark:bg-blue-500 font-bold shadow-2xs' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {day.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-sans text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {dayAppts.length} {dayAppts.length === 1 ? 'cita' : 'citas'}
                          </span>
                        )}
                      </div>

                      {/* Lista Compacta de Citas */}
                      <div className="space-y-1.5 mt-2 flex-1 flex flex-col justify-end">
                        {dayAppts.slice(0, 3).map((appt) => {
                          const docObj = getDoctorDetails(appt.doctor);
                          return (
                            <div 
                              key={appt.id}
                              className="text-[9px] bg-slate-50 dark:bg-slate-800/80 border-l-2 border-l-blue-600 dark:border-l-blue-400 p-1 rounded-md truncate text-slate-800 dark:text-slate-300 hover:-translate-x-0.5 transition-transform flex items-center gap-1 font-medium"
                              title={`${appt.time} - ${appt.patient?.name} (${docObj.name})`}
                            >
                              <strong className="text-[8px] text-slate-500 dark:text-slate-400 shrink-0">{appt.time.split(' ')[0]}</strong>
                              <span className="truncate">{appt.patient?.name.split(' ')[0]}</span>
                              <span className="text-[8px] text-slate-450 italic truncate">({docObj.name.split(' ')[1] || docObj.name})</span>
                            </div>
                          );
                        })}
                        {dayAppts.length > 3 && (
                          <div className="text-[8px] text-blue-600 dark:text-blue-400 font-bold pl-1 pb-1">
                            + {dayAppts.length - 3} más...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VISTA ANUAL (12 Mini Calendarios) */}
          {viewMode === 'year' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
              {Array.from({ length: 12 }).map((_, mIdx) => {
                const targetDate = parseDateLocal(selectedDate);
                const targetYear = targetDate.getFullYear();
                const monthDate = new Date(targetYear, mIdx, 1, 12, 0, 0);
                
                return (
                  <div key={mIdx} className="space-y-2 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl hover:shadow-2xs transition-shadow">
                    <h4 className="text-xs font-bold text-center text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {monthDate.toLocaleDateString('es-ES', { month: 'long' })}
                    </h4>
                    
                    <div className="grid grid-cols-7 text-center gap-y-1">
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, idx) => (
                        <span key={idx} className="text-[8px] font-bold text-slate-400 dark:text-slate-500">{d}</span>
                      ))}
                      {getMiniCalendarDays(monthDate).map((day, idx) => {
                        const iso = formatDateISO(day);
                        const isCurrentMonth = day.getMonth() === mIdx;
                        const isSelected = iso === selectedDate;
                        const isToday = iso === formatDateISO(new Date());

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(iso);
                              setViewMode('day');
                            }}
                            className={`text-[9px] font-bold w-5 h-5 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : isToday 
                                  ? 'text-blue-600 dark:text-blue-400 border border-blue-400'
                                  : isCurrentMonth 
                                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                                    : 'text-slate-300 dark:text-slate-700/50 pointer-events-none'
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA AGENDA */}
          {viewMode === 'agenda' && (
            <div className="space-y-4">
              {(() => {
                // Group filtered appointments by date (starting from selectedDate)
                const startLimit = parseDateLocal(selectedDate);
                const futureAppts = filteredAppointments
                  .filter(a => parseDateLocal(a.date) >= startLimit)
                  .sort((a, b) => {
                    const diff = a.date.localeCompare(b.date);
                    if (diff !== 0) return diff;
                    return a.startHour - b.startHour;
                  });

                // Group by date string
                const groups: Record<string, Appointment[]> = {};
                futureAppts.forEach(appt => {
                  if (!groups[appt.date]) groups[appt.date] = [];
                  groups[appt.date].push(appt);
                });

                const groupKeys = Object.keys(groups);

                if (groupKeys.length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No hay citas programadas desde la fecha seleccionada.
                    </div>
                  );
                }

                return groupKeys.map(dateKey => {
                  const dObj = parseDateLocal(dateKey);
                  const isToday = dateKey === formatDateISO(new Date());
                  
                  return (
                    <div key={dateKey} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                      {/* Date header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850 mb-3">
                        <span className="font-serif font-black text-sm text-slate-800 dark:text-slate-200">
                          {dObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                        </span>
                        {isToday && (
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Hoy</span>
                        )}
                      </div>

                      {/* Day list */}
                      <div className="divide-y divide-slate-50 dark:divide-slate-850">
                        {groups[dateKey].map(appt => {
                          const docObj = getDoctorDetails(appt.doctor);
                          return (
                            <div 
                              key={appt.id} 
                              onClick={onOpenAppointmentModal}
                              className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 px-2 rounded-xl transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                  {appt.time}
                                </span>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {appt.patient?.name || 'Paciente'}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-450 font-semibold mt-0.5">{appt.treatment}</p>
                                </div>
                              </div>

                              {/* Doctor Badge */}
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750/60 rounded-full py-1 px-3">
                                {docObj.avatar ? (
                                  <img src={docObj.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className={`w-4 h-4 rounded-full ${docObj.color} text-white text-[8px] flex items-center justify-center font-bold shrink-0`}>
                                    {docObj.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">{docObj.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });

              })()}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
