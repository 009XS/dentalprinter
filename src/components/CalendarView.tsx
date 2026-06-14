import { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Calendar,
  Plus
} from 'lucide-react';
import { Appointment, Patient } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  patients: Patient[];
  onOpenAppointmentModal: () => void;
  searchQuery: string;
}

export default function CalendarView({
  appointments,
  setAppointments,
  patients,
  onOpenAppointmentModal,
  searchQuery
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any>(null);

  // Filtrar citas según la búsqueda global
  const filteredAppointments = appointments.filter(appt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      appt.patient.name.toLowerCase().includes(query) ||
      appt.treatment.toLowerCase().includes(query)
    );
  });

  // Médicos y módulos de la clínica
  const doctors = [
    { 
      id: 'Dr. Pérez', 
      name: 'Dr. Pérez', 
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
    const randomPatient = patients[Math.floor(Math.random() * patients.length)] || patients[0];
    const newAppt: Appointment = {
      id: `ai-appt-${Date.now()}`,
      time: '11:45 AM',
      patient: randomPatient,
      treatment: 'Ajuste de Ortodoncia',
      status: 'Confirmada',
      doctor: 'Dra. Gómez',
      startHour: 11.75, // Ajustado a 11.75 de forma decimal (11:45 AM)
      durationHours: 0.75
    };

    setAppointments([...appointments, newAppt]);
    setShowAiModal(false);
  };

  // Calcular la posición porcentual de la tarjeta en el timeline
  // Escala desde las 08:00 AM (8.0) hasta las 02:00 PM (14.0). Total 6 horas de rango.
  const getPositionStyling = (startHour: number, duration: number) => {
    const calendarStart = 8.0;
    const calendarEnd = 14.0;
    const totalSpan = calendarEnd - calendarStart; // Rango de 6 horas
    
    const leftOffset = ((startHour - calendarStart) / totalSpan) * 100;
    const widthPercentage = (duration / totalSpan) * 100;

    return {
      left: `${Math.max(0, Math.min(100, leftOffset))}%`,
      width: `${Math.max(10, Math.min(100, widthPercentage))}%`
    };
  };

  return (
    <div id="calendar-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Controles del Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Hoy</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">Jueves, 26 de Octubre</p>
        </div>

        {/* selectores de tipo de vista */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-[#c4c7c8]/30 dark:border-slate-700/50 shadow-xs">
          {[
            { id: 'day', label: 'Día' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' }
          ].map(mode => (
            <button 
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === mode.id 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold' 
                  : 'text-[#444748] dark:text-slate-350 hover:bg-white/40 dark:hover:bg-slate-700/45'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode !== 'day' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
            {viewMode === 'week' ? 'Programador Clínico Semanal' : 'Planificación Clínica Mensual'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Las vistas de varios días están actualmente optimizadas para roles de planificación clínica. Seleccione el modo "Día" para configurar los consultorios activos y visualizar la agenda de hoy.
          </p>
          <button 
            onClick={() => setViewMode('day')}
            className="mt-4 bg-blue-600 text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Regresar a la Agenda Diaria
          </button>
        </div>
      ) : (
        /* Tablero de Consultorios */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#c4c7c8]/40 dark:border-slate-800 overflow-hidden shadow-xs relative">
          
          {/* Marcadores de hora */}
          <div className="flex border-b border-[#ebeef0] dark:border-slate-800 bg-[#f7fafc] dark:bg-slate-900/60 sticky top-0 z-20 font-sans">
            <div className="w-[124px] shrink-0 border-r border-[#ebeef0] dark:border-slate-800 p-4 flex items-center justify-center bg-white dark:bg-slate-900">
              <span className="font-sans font-bold text-[10px] tracking-wider text-[#444748] dark:text-slate-400 uppercase">Consultorio</span>
            </div>
            <div className="flex-1 flex min-w-[700px] relative">
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">08:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">09:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">10:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">11:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">12:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">13:00</div>
              <div className="flex-1 text-center py-3 border-l border-slate-200/40 dark:border-slate-800/40 font-semibold text-[11px] text-slate-500 dark:text-slate-400">14:00</div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            {/* Canales correspondientes */}
            <div className="min-w-[700px] relative divide-y divide-[#ebeef0] dark:divide-slate-800">
              
              {/* Cuadrículas verticales de fondo */}
              <div className="absolute inset-0 flex pointer-events-none z-0">
                <div className="w-[124px] border-r border-[#ebeef0] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"></div>
                <div className="flex-1 flex justify-between h-full">
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30 bg-slate-50/15 dark:bg-slate-850/10"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30 bg-slate-50/15 dark:bg-slate-850/10"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30"></div>
                  <div className="flex-1 border-l border-slate-100 dark:border-slate-800/30 bg-slate-50/15 dark:bg-slate-850/10"></div>
                </div>
              </div>

              {doctors.map((doctor) => {
                const doctorAppointments = filteredAppointments.filter(a => a.doctor === doctor.id);

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
                            className={`absolute top-2 bottom-2 rounded-xl p-2.5 shadow-sm hover:shadow-md border border-[#c4c7c8]/40 dark:border-slate-800 bg-white dark:bg-slate-800 z-10 overflow-hidden cursor-pointer transition-all duration-200 border-l-4 hover:-translate-y-0.5 ${
                              isLate 
                                ? 'border-l-red-500 hover:border-red-650' 
                                : 'border-l-blue-600 hover:border-blue-700'
                            }`}
                          >
                            <span className="block font-sans font-bold text-xs text-slate-800 dark:text-white truncate">
                              {appt.patient.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
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
                          style={getPositionStyling(11.75, 0.75)} // Sincronizado a hora decimal 11.75
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

              {/* Indicador de hora actual del timeline (ej. 9:15 AM = 21% de escala) */}
              <div className="absolute top-0 bottom-0 left-[21%] w-px bg-red-500 z-30 pointer-events-none">
                <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow-md"></div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MODAL DE PROPUESTA IA */}
      {showAiModal && selectedSlotDetails && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400/20" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Propuesta de Cita por IA</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-4">
              Detecté un espacio altamente eficiente en la agenda de la <strong>{selectedSlotDetails.doctor} ({doctors.find(d => d.id === selectedSlotDetails.doctor)?.title})</strong> a las <strong>{selectedSlotDetails.time}</strong>. Reservar este ajuste reduce el tiempo inactivo del módulo de higiene.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs space-y-1 mb-5">
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
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-colors"
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
