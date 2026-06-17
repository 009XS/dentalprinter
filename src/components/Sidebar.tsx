import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  Settings, 
  HelpCircle, 
  Bell, 
  Plus,
  LogOut,
  Stethoscope,
  CalendarDays,
  Folder
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAppointmentModal: () => void;
  onOpenPatientModal: () => void;
  notificationsCount: number;
  onLogout?: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onOpenAppointmentModal, 
  onOpenPatientModal, 
  notificationsCount,
  onLogout
}: SidebarProps) {

  // Estructura de navegación traducida
  const navItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'archivero', label: 'Archivero', icon: Folder },
    { id: 'appointments', label: 'Citas', icon: CalendarDays },
    { id: 'odontogram', label: 'Odontograma', icon: Stethoscope },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'presupuestos', label: 'Presupuestos', icon: FileText },
    { id: 'radiology', label: 'Radiología', icon: Activity },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  // Metadatos de perfil clínico traducidos y actualizados
  const getProfile = () => {
    if (currentTab === 'odontogram' || currentTab === 'patients') {
      return {
        name: 'Dr. Juan Carlos',
        role: 'Director Clínico',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAszXuFy1xB42lWd4FL4Js326XUsuLh1JD8tlmzIhhBJH6L6E9g2TP9JH8m3kjUchgvZ4E-seKzO2oH_bBdrYZpXe7x64SRd5d4ZC4SdhyWKwxHd4tTofavR2HyQCYR-tLA0Z-jIwF8cW2jHqxlsTZoAc-vaXnthl4Rk0RNUhXV6mDs_ZHlz35F74dULM998FO5TRmeePUe7ILG2i_3fMVMKmXJobskRgPQC4S_hzmc46rAENzE44QGk--m0ANIj1dG8brMAGqtHlxH'
      };
    } else if (currentTab === 'presupuestos') {
      return {
        name: 'Dra. Sara Gómez',
        role: 'Especialista en Ortodoncia',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDmFXzZq52qoTlQc218FERZUoTdyjfwW6fLZjzzPKsAzaIEs-mB0T6ZX5MJk66uCCRUmkOMdvzSPpqpbo-qHCYOnR8SPsxpZmCkHf_Uj2VLYFNaflOdk6RtAiZQcoOo7twu26C4b-jGrIwrjuq4J9WYIl-aJNtoIWAHILZUXbSaAAHkwW99wmqdzsYgwxksdx5HZKDQmVttvOK77BbwRrncuiRHW4ExUVMhyZFtjhhyhoAz4hK8qyIhqgCnqrxuJkae708GHPtN4H5'
      };
    } else {
      return {
        name: 'Dr. Juan Carlos',
        role: 'Director Médico Administrador',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9qY-Yo00VAQICr4JJ8sjr3bcyW73OqlAdbBL9K4aJ_-wBiYeiysx1fXFCtu99EFQa6EpLb2qGz4s5SfjPUA6ZTbjTSL-Akpy6FN6Nt4hFvkGbnaEwGlVPKjFgm3AWpZOTFQjguy3fRw0SgjZSPVX2W05e7En8MD6QtvEp7m7TzcBTx5onCAnTOYoK_Y-_cqzgQl7DvHnbdGPKzFJiYU8UklBZbmdBYGUYHteTQBNG4dxOaOgY4ndRj5h8ZqjWErnu8F-O0TgNPwRQ'
      };
    }
  };

  const activeProfile = getProfile();

  return (
    <aside 
      id="main-sidebar"
      className="hidden md:flex flex-col h-screen w-[280px] shrink-0 border-r border-[#ebeef0] dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sticky top-0 left-0 z-30 transition-colors duration-300"
    >
      {/* Logo y Encabezado de Marca */}
      <div className="mb-6 flex flex-col items-center px-2">
        <img 
          src="/clinic-logo.jpg" 
          alt="Logo de la Clínica" 
          className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100 dark:border-slate-700 shadow-md mb-3"
        />
        <h1 className="font-serif text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
          Dentalprinter
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#444748] dark:text-slate-400 mt-0.5">
          Excelencia Clínica
        </p>
      </div>

      {/* Acciones Principales */}
      <div className="flex flex-col gap-2 mb-6">
        <button 
          id="btn-sidebar-new-appt"
          onClick={onOpenAppointmentModal}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transform active:scale-98 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nueva Cita
        </button>
        <button 
          id="btn-sidebar-new-patient"
          onClick={onOpenPatientModal}
          className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-700 font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transform active:scale-98 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Paciente
        </button>
      </div>

      {/* Enlaces de Navegación Principal */}
      <nav id="sidebar-nav" className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left group ${
                isActive 
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border-r-4 border-blue-600 dark:border-blue-400' 
                  : 'text-[#444748] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'stroke-[2.5] text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className="font-sans text-sm tracking-wide">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Secciones de Soporte y Notificaciones */}
      <div id="sidebar-bottom-section" className="mt-auto pt-4 border-t border-[#ebeef0] dark:border-slate-800 space-y-1">
        <button
          id="nav-support"
          onClick={() => setCurrentTab('support')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#444748] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-955 dark:hover:text-white transition-all text-left cursor-pointer ${
            currentTab === 'support' ? 'bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <span className="text-sm">Soporte Técnico</span>
        </button>

        <button
          id="nav-notifications"
          onClick={() => setCurrentTab('notifications')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#444748] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-955 dark:hover:text-white transition-all text-left cursor-pointer ${
            currentTab === 'notifications' ? 'bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Notificaciones</span>
          </div>
          {notificationsCount > 0 && (
            <span className="bg-red-500 text-white font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Tarjeta de Información del Médico y Logout */}
        <div id="sidebar-profile-card" className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              alt="Avatar del Médico" 
              src={activeProfile.avatar}
              className="w-9 h-9 rounded-full object-cover border border-[#c4c7c8] dark:border-slate-700 bg-slate-100 placeholder-avatar shadow-xs" 
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#181c1e] dark:text-white truncate">
                {activeProfile.name}
              </span>
              <span className="text-[10px] text-[#444748] dark:text-slate-400 font-medium truncate">
                {activeProfile.role}
              </span>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
