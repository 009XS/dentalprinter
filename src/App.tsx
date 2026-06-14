import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Sparkles, 
  X, 
  CalendarDays,
  Send,
  Users,
  LayoutDashboard,
  FileText,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';

// Importa submódulos
import { Patient, Appointment, Chat, Budget, BudgetItem } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import OdontogramaView from './components/OdontogramaView';
import PresupuestosView from './components/PresupuestosView';
import RadiologyView from './components/RadiologyView';
import SettingsView from './components/SettingsView';
import { getToken, setToken, bootstrap, login, logout, createAppointment, createPatient, markNotificationsRead } from './api';

export default function App() {
  // Enrutamiento de vistas y estados globales
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Base de datos clínica
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [liveItems, setLiveItems] = useState<BudgetItem[]>([]); // Captura tratamientos del odontograma
  const [selectedPatientId, setSelectedPatientId] = useState<string>(''); // Paciente por defecto

  // Autenticación
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario de login
  const [loginEmail, setLoginEmail] = useState('admin@dentalprinter.local');
  const [loginPassword, setLoginPassword] = useState('ChangeMe!2026');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Cargar datos reales
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    bootstrap()
      .then(data => {
        setUser(data.user || null);
        setPatients(data.patients || []);
        setAppointments(data.appointments || []);
        setChats(data.chats || []);
        setBudgets(data.budgets || []);
        setNotifications(data.notifications || []);
        setNotificationsCount(data.notifications?.filter((n: any) => !n.read).length || 0);
        if (data.patients && data.patients.length > 0) {
          setSelectedPatientId(data.patients[0].id);
        }
      })
      .catch(err => {
        console.error('Error al iniciar entorno clínico:', err);
        logout();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const loggedInUser = await login(loginEmail, loginPassword);
      setTokenState(getToken());
      setUser(loggedInUser);
    } catch (err: any) {
      setLoginError(err.message || 'Credenciales de acceso incorrectas.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setTokenState(null);
    setUser(null);
    setPatients([]);
    setAppointments([]);
    setChats([]);
    setBudgets([]);
    setCurrentTab('dashboard');
  };

  // Modales e interfaces emergentes
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Formulario de nuevo paciente
  const [newPatName, setNewPatName] = useState('');
  const [newPatDob, setNewPatDob] = useState('');
  const [newPatAge, setNewPatAge] = useState(30);
  const [newPatPhone, setNewPatPhone] = useState('');
  const [newPatAllergies, setNewPatAllergies] = useState('');
  const [newPatRiskLevel, setNewPatRiskLevel] = useState<'Bajo Riesgo' | 'Medio Riesgo' | 'Alto Riesgo'>('Bajo Riesgo');

  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const initials = newPatName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'P';
      const created = await createPatient({
        name: newPatName,
        initials,
        dob: newPatDob,
        age: newPatAge,
        phone: newPatPhone,
        allergies: newPatAllergies || undefined,
        riskLevel: newPatRiskLevel,
      });
      setPatients([created, ...patients]);
      setSelectedPatientId(created.id);
      setPatientModalOpen(false);
      setNewPatName('');
      setNewPatDob('');
      setNewPatAge(30);
      setNewPatPhone('');
      setNewPatAllergies('');
      setNewPatRiskLevel('Bajo Riesgo');
      alert(`¡Paciente "${created.name}" registrado correctamente y seleccionado como activo!`);
    } catch (err: any) {
      alert(`Error al registrar paciente: ${err.message}`);
    }
  };

  // Agregar un tratamiento diagnosticado en Odontograma al plan del paciente activo
  const handleAddTreatmentItem = (item: BudgetItem) => {
    setLiveItems(prev => [...prev, item]);
  };

  // Formulario de reserva de cita
  const [newApptPatientId, setNewApptPatientId] = useState<string>('');
  const [newApptTreatment, setNewApptTreatment] = useState<string>('Limpieza Dental');
  const [newApptDoctor, setNewApptDoctor] = useState<'Dr. Pérez' | 'Dra. Gómez' | 'Higiene 1'>('Dr. Pérez');
  const [newApptTime, setNewApptTime] = useState<string>('02:15 PM');
  const [newApptHour, setNewApptHour] = useState<number>(14.25); // 02:15 PM decimal 24H

  // Sincronizar nuevo ID de paciente por defecto en formulario de cita
  useEffect(() => {
    if (patients && patients.length > 0 && !newApptPatientId) {
      setNewApptPatientId(patients[0].id);
    }
  }, [patients, newApptPatientId]);

  const handleCreateAppointment = (e: FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === newApptPatientId) || patients[0];
    if (!patientObj) return;

    createAppointment({
      time: newApptTime,
      patientId: newApptPatientId,
      treatment: newApptTreatment,
      status: 'Pendiente',
      doctor: newApptDoctor,
      startHour: Number(newApptHour) || 12.0,
      durationHours: 0.75
    })
    .then((createdAppt) => {
      const mappedAppt: Appointment = {
        ...createdAppt,
        patient: patientObj
      };
      setAppointments([mappedAppt, ...appointments]);
      setAppointmentModalOpen(false);
      setNotificationsCount(prev => prev + 1);
      alert(`¡Cita programada con éxito para ${patientObj.name}!`);
    })
    .catch((err: any) => {
      alert(`Error al programar la cita: ${err.message}`);
    });
  };

  // Chat del Asistente de IA (simulado)
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: "¡Hola Dr. Juan Carlos! Noté que hay 2 pacientes que no han confirmado sus citas de mañana. ¿Desea que envíe recordatorios automáticos por WhatsApp?" }
  ]);

  const handleAiAsk = (e: FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userMsg = aiChatQuery.trim();
    setAiMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiChatQuery('');

    setTimeout(() => {
      let aiResponseText = "Buscaré espacios libres en la agenda o resumiré las cuentas de pacientes. Pídame 'optimizar espacios' o 'enviar recordatorios'.";
      if (userMsg.toLowerCase().includes('espacio') || userMsg.toLowerCase().includes('optimizar') || userMsg.toLowerCase().includes('recomendar')) {
        aiResponseText = "De acuerdo con los tiempos de limpieza del módulo de ortodoncia, la Dra. Gómez tiene un espacio libre de alta probabilidad a las 11:45 AM. ¡Lo he marcado visualmente en la línea de tiempo!";
      } else if (userMsg.toLowerCase().includes('recordatorio') || userMsg.toLowerCase().includes('confirmar') || userMsg.toLowerCase().includes('enviar')) {
        aiResponseText = "Sí, puedo enviar recordatorios automáticos a Elena Martínez y María García de inmediato. ¿Desea enviar esas notificaciones de WhatsApp?";
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
    }, 1000);
  };

  const dispatchWhatsappReminders = () => {
    alert('Enviando recordatorios de WhatsApp personalizados a los pacientes pendientes...');
    setAiAssistantOpen(false);
  };

  // Paciente activo seleccionado
  const activePatientObj = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Enrutador de vistas
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView 
            patients={patients}
            appointments={appointments}
            setAppointments={setAppointments}
            chats={chats}
            setChats={setChats}
            setCurrentTab={setCurrentTab}
            setSelectedPatientId={setSelectedPatientId}
            searchQuery={searchQuery}
          />
        );
      case 'patients':
        return (
          <OdontogramaView 
            activePatient={activePatientObj}
            onAddTreatmentItem={handleAddTreatmentItem}
            searchQuery={searchQuery}
            onOpenPatientModal={() => setPatientModalOpen(true)}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            appointments={appointments}
            setAppointments={setAppointments}
            patients={patients}
            onOpenAppointmentModal={() => setAppointmentModalOpen(true)}
            searchQuery={searchQuery}
          />
        );
      case 'presupuestos':
        return (
          <PresupuestosView 
            budgets={budgets}
            setBudgets={setBudgets}
            activePatient={activePatientObj}
            liveItems={liveItems}
            setLiveItems={setLiveItems}
            searchQuery={searchQuery}
            onOpenPatientModal={() => setPatientModalOpen(true)}
          />
        );
      case 'radiology':
        return <RadiologyView />;
      case 'settings':
        return <SettingsView userRole={user?.role} />;
      case 'notifications':
        return (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-sky-100/10 dark:border-slate-800 pb-5">
              <div>
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Notificaciones</h2>
                <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
                  Historial de alertas clínicas y eventos del sistema.
                </p>
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      await markNotificationsRead();
                      setNotificationsCount(0);
                      setNotifications(notifications.map(n => ({ ...n, read: true })));
                      alert('Notificaciones marcadas como leídas.');
                    } catch (err: any) {
                      alert('Error: ' + err.message);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-sans font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs divide-y divide-[#ebeef0] dark:divide-slate-850">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No hay notificaciones ni alertas registradas en el sistema.
                </div>
              ) : (
                notifications.map((n) => {
                  const titleLower = n.title.toLowerCase();
                  const descLower = n.desc.toLowerCase();
                  const handleNotificationClick = () => {
                    if (titleLower.includes('ficha') || titleLower.includes('paciente') || descLower.includes('expediente')) {
                      setCurrentTab('patients');
                    } else if (titleLower.includes('cita') || titleLower.includes('reserva') || titleLower.includes('programada')) {
                      setCurrentTab('calendar');
                    } else if (titleLower.includes('presupuesto')) {
                      setCurrentTab('presupuestos');
                    } else {
                      setCurrentTab('dashboard');
                    }
                  };

                  return (
                    <div 
                      key={n.id} 
                      onClick={handleNotificationClick}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex justify-between items-start gap-4 cursor-pointer ${
                        !n.read ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full shrink-0"></span>}
                          <p className="text-sm font-semibold text-[#181c1e] dark:text-white">{n.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">{n.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="border-b border-sky-100/10 dark:border-slate-800 pb-5">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Soporte Técnico</h2>
              <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
                ¿Necesitas ayuda con el portal clínico o la impresora dental? Contacta con el equipo técnico.
              </p>
            </div>

            <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs font-sans text-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Enviar Ticket de Soporte</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('¡Ticket enviado con éxito! Nuestro soporte técnico se pondrá en contacto a la brevedad.');
                  setCurrentTab('dashboard');
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Asunto</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Problema con sincronización de odontograma o impresora" 
                    className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descripción de la Incidencia</label>
                  <textarea 
                    required 
                    rows={4}
                    placeholder="Describe detalladamente el problema..." 
                    className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div className="flex justify-end gap-2.5">
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold py-2.5 px-4 rounded-lg uppercase cursor-pointer"
                  >
                    Enviar Incidencia
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('dashboard')} 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-12 text-center text-slate-400 font-sans">
            <h3 className="text-sm uppercase tracking-wider font-bold mb-2">Sección en Desarrollo</h3>
            <p className="text-xs">Esta sección del flujo de trabajo está experimentando actualizaciones menores de esquema. Regrese al Panel Principal.</p>
            <button 
              onClick={() => setCurrentTab('dashboard')}
              className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 underline cursor-pointer"
            >
              Volver
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-xs">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-500 dark:text-slate-400 mt-4">Iniciando entorno clínico seguro...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-slate-50 dark:bg-slate-955 text-slate-850 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 font-sans text-xs">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-450 mb-3">
              <Sparkles className="w-8 h-8 fill-amber-300/30 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Dentalprinter</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">Portal Clínico Protegido</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans text-xs">
            {loginError && (
              <div className="bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-lg text-[11px] font-semibold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">Correo Electrónico</label>
              <input 
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg p-2.5 text-xs text-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="ejemplo@dentalprinter.local"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">Contraseña</label>
              <input 
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg p-2.5 text-xs text-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-sm active:scale-98 transition-all flex justify-center items-center gap-1.5"
            >
              {loggingIn ? 'Iniciando Sesión...' : 'Ingresar al Portal'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            Cumple con las normas HIPAA de seguridad y ePHI.<br />
            Dentalprinter Clinic v2.4.19-LTS
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-[#f8fafc] dark:bg-slate-950 text-slate-850 dark:text-slate-100 min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-150">
        
        {/* NAVEGACIÓN LATERAL - Oculta en Móviles */}
        <Sidebar 
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          onOpenAppointmentModal={() => setAppointmentModalOpen(true)}
          onOpenPatientModal={() => setPatientModalOpen(true)}
          notificationsCount={notificationsCount}
          onLogout={handleLogout}
        />

        {/* NAVEGACIÓN MÓVIL COLAPSIBLE */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 md:hidden flex justify-start">
            <div className="w-[280px] bg-white dark:bg-slate-900 border-r border-[#ebeef0] dark:border-slate-800 p-6 h-full flex flex-col justify-between animate-in slide-in-from-left duration-150 font-sans">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold text-blue-600 dark:text-blue-400">Dentalprinter</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setAppointmentModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nueva Cita
                  </button>
                  <button 
                    onClick={() => {
                      setPatientModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border border-slate-250 dark:border-slate-700 font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Paciente
                  </button>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
                    { id: 'patients', label: 'Odontograma', icon: Users },
                    { id: 'calendar', label: 'Calendario', icon: CalendarDays },
                    { id: 'presupuestos', label: 'Presupuestos', icon: FileText },
                    { id: 'radiology', label: 'Radiología', icon: Activity },
                    { id: 'settings', label: 'Configuración', icon: Settings },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCurrentTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer ${
                        currentTab === tab.id 
                          ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold' 
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5 opacity-80" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3 items-center w-full font-sans text-xs">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9qY-Yo00VAQICr4JJ8sjr3bcyW73OqlAdbBL9K4aJ_-wBiYeiysx1fXFCtu99EFQa6EpLb2qGz4s5SfjPUA6ZTbjTSL-Akpy6FN6Nt4hFvkGbnaEwGlVPKjFgm3AWpZOTFQjguy3fRw0SgjZSPVX2W05e7En8MD6QtvEp7m7TzcBTx5onCAnTOYoK_Y-_cqzgQl7DvHnbdGPKzFJiYU8UklBZbmdBYGUYHteTQBNG4dxOaOgY4ndRj5h8ZqjWErnu8F-O0TgNPwRQ" 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full object-cover border"
                />
                <div className="text-left font-sans text-xs flex-grow min-w-0">
                  <p className="font-bold truncate">Dr. Juan Carlos</p>
                  <p className="text-[10px] text-slate-400 truncate">Director Médico Administrador</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENEDOR DE ESCENA PRINCIPAL */}
        <div id="main-scene-body" className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
          
          <Header 
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            notificationsCount={notificationsCount}
            setNotificationsCount={setNotificationsCount}
            onTriggerAIAssistant={() => setAiAssistantOpen(true)}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            patients={patients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            notifications={notifications}
            setNotifications={setNotifications}
          />

          {/* VISTA DINÁMICA ACTIVA */}
          <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950">
            {renderCurrentView()}
          </main>

        </div>

        {/* MODAL DE AGENDAR CITA CLÍNICA */}
        {appointmentModalOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-120 font-sans text-xs">
              
              {/* Encabezado del Modal */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-450" />
                  Programar Nueva Reserva
                </h3>
                <button 
                  onClick={() => setAppointmentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleCreateAppointment} className="space-y-4 font-sans text-xs">
                
                {/* Selector de paciente */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Seleccionar Paciente</label>
                  <select 
                    value={newApptPatientId}
                    onChange={(e) => setNewApptPatientId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-850 dark:text-white"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ID {p.id}</option>
                    ))}
                  </select>
                </div>

                {/* Tratamiento o motivo */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Tratamiento / Consulta de Diagnóstico</label>
                  <input 
                    type="text" 
                    value={newApptTreatment}
                    onChange={(e) => setNewApptTreatment(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white outline-none focus:border-blue-600" 
                    placeholder="Ej. Resina Estética, Blanqueamiento, Limpieza"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Doctor encargado */}
                  <div>
                    <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Médico Encargado</label>
                    <select 
                      value={newApptDoctor}
                      onChange={(e) => setNewApptDoctor(e.target.value as any)}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white"
                    >
                      <option value="Dr. Pérez">Dr. Juan Carlos (General)</option>
                      <option value="Dra. Gómez">Dra. Gómez (Ortodoncia)</option>
                      <option value="Higiene 1">Higiene 1 (Limpieza)</option>
                    </select>
                  </div>

                  {/* Horario de la consulta */}
                  <div>
                    <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Horario Consulta</label>
                    <select 
                      value={newApptTime}
                      onChange={(e) => {
                        setNewApptTime(e.target.value);
                        // Mapeo de hora decimal para el calendario
                        if (e.target.value === '08:45 AM') setNewApptHour(8.75);
                        else if (e.target.value === '10:00 AM') setNewApptHour(10.0);
                        else if (e.target.value === '11:45 AM') setNewApptHour(11.75);
                        else if (e.target.value === '01:00 PM') setNewApptHour(13.0);
                        else if (e.target.value === '02:15 PM') setNewApptHour(14.25);
                      }}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white"
                    >
                      <option value="08:45 AM">08:45 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:45 AM">11:45 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:15 PM">02:15 PM (Horario Disponible)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button 
                    type="submit"
                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold py-2.5 px-4 rounded-lg uppercase cursor-pointer transition-colors"
                  >
                    Confirmar Reserva
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAppointmentModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* MODAL DE NUEVO PACIENTE */}
        {patientModalOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-120 font-sans text-xs">
              
              {/* Encabezado del Modal */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-450" />
                  Registrar Nuevo Paciente
                </h3>
                <button 
                  onClick={() => setPatientModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleCreatePatient} className="space-y-4 font-sans text-xs">
                
                {/* Nombre completo */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={newPatName}
                    onChange={(e) => setNewPatName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-850 dark:text-white outline-none focus:border-blue-600" 
                    placeholder="Ej. Juan Pérez Gómez"
                    required
                  />
                </div>

                {/* Fecha de Nacimiento y Edad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Fecha de Nacimiento</label>
                    <input 
                      type="text" 
                      value={newPatDob}
                      onChange={(e) => setNewPatDob(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-850 dark:text-white outline-none focus:border-blue-600" 
                      placeholder="Ej. 12 Oct 1985"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Edad</label>
                    <input 
                      type="number" 
                      value={newPatAge}
                      onChange={(e) => setNewPatAge(Number(e.target.value))}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-850 dark:text-white outline-none focus:border-blue-600" 
                      min={0}
                      max={130}
                      required
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={newPatPhone}
                    onChange={(e) => setNewPatPhone(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white outline-none focus:border-blue-600" 
                    placeholder="Ej. +52 55 1234 5678"
                    required
                  />
                </div>

                {/* Alergias */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Alergias (Opcional)</label>
                  <input 
                    type="text" 
                    value={newPatAllergies}
                    onChange={(e) => setNewPatAllergies(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white outline-none focus:border-blue-600" 
                    placeholder="Ej. Látex, Penicilina (dejar vacío si no tiene)"
                  />
                </div>

                {/* Nivel de Riesgo */}
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nivel de Riesgo Clínico</label>
                  <select 
                    value={newPatRiskLevel}
                    onChange={(e) => setNewPatRiskLevel(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-855 dark:text-white outline-none focus:border-blue-600"
                  >
                    <option value="Bajo Riesgo">Bajo Riesgo</option>
                    <option value="Medio Riesgo">Medio Riesgo</option>
                    <option value="Alto Riesgo">Alto Riesgo</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button 
                    type="submit"
                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold py-2.5 px-4 rounded-lg uppercase cursor-pointer transition-colors"
                  >
                    Registrar Paciente
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPatientModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ASISTENTE CLÍNICO DE IA FLOTANTE */}
        {aiAssistantOpen && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans animate-in slide-in-from-bottom duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]">
              
              {/* Encabezado */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/20" />
                  <div>
                    <h3 className="font-sans font-bold text-sm">Asesor de IA Dentalprinter</h3>
                    <p className="text-[10px] text-blue-100">Inteligencia para automatización del flujo clínico</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAiAssistantOpen(false)}
                  className="text-white hover:text-red-200 cursor-pointer"
                  title="Cerrar asistente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Feed */}
              <div id="ai-messages-list" className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950 text-xs">
                {aiMessages.map((msg, idx) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        isAi 
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs border border-slate-100 dark:border-slate-700/50' 
                          : 'bg-blue-600 text-white rounded-br-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Accesos rápidos de acción del bot */}
                {aiMessages.length === 1 && (
                  <div className="pt-2 flex gap-1.5">
                    <button 
                      onClick={dispatchWhatsappReminders}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-md cursor-pointer uppercase transition-colors"
                    >
                      Sí, enviar
                    </button>
                    <button 
                      onClick={() => setAiMessages(prev => [...prev, { sender: 'ai', text: "No hay problema. Seguiré monitoreando la agenda por si surgen nuevas oportunidades." }])}
                      className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold py-1.5 px-3 rounded-md cursor-pointer transition-all"
                    >
                      No, descartar
                    </button>
                  </div>
                )}
              </div>

              {/* Input de Chat */}
              <form onSubmit={handleAiAsk} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={aiChatQuery}
                  onChange={(e) => setAiChatQuery(e.target.value)}
                  placeholder="Preguntar y optimizar horarios de citas..."
                  className="flex-grow text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white rounded-lg outline-none focus:border-blue-600" 
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
          </div>
        )}

      </div>
    </div>
  );
}
