import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Users,
  Activity, 
  FileText, 
  Calendar, 
  Edit, 
  Phone, 
  ShieldAlert,
  FolderOpen
} from 'lucide-react';
import type { Patient } from '../types';

interface PatientsViewProps {
  patients: Patient[];
  setSelectedPatientId: (id: string) => void;
  setCurrentTab: (tab: string) => void;
  onOpenPatientModal: () => void;
  onOpenEditPatientModal: (patient: Patient) => void;
  onScheduleForPatient: (patientId: string) => void;
  onUpdatePatientStatus?: (patientId: string, newStatus: 'Activo' | 'Inactivo' | 'Archivado') => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PatientsView({
  patients,
  setSelectedPatientId,
  setCurrentTab,
  onOpenPatientModal,
  onOpenEditPatientModal,
  onScheduleForPatient,
  onUpdatePatientStatus,
  showToast
}: PatientsViewProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Inactivo' | 'Archivado'>('Todos');
  const [riskFilter, setRiskFilter] = useState<string>('Todos');
  const [allergyFilter, setAllergyFilter] = useState<string>('Todos');
  const [sortOrder, setSortOrder] = useState<string>('A-Z');

  // Conteos dinámicos rápidos
  const totalCount = patients.length;
  const activeCount = patients.filter(p => p.status === 'Activo' || !p.status).length; // considerar default
  const inactiveCount = patients.filter(p => p.status === 'Inactivo').length;
  const archivedCount = patients.filter(p => p.status === 'Archivado').length;

  // Filtrar pacientes por búsqueda y estado
  const filteredPatients = patients.filter(p => {
    // 1. Filtrar por estado
    const statusOfPatient = p.status || 'Activo';
    if (statusFilter !== 'Todos' && statusOfPatient !== statusFilter) {
      return false;
    }

    // 2. Filtrar por nivel de riesgo
    if (riskFilter !== 'Todos' && p.riskLevel !== riskFilter) {
      return false;
    }

    // 3. Filtrar por alergias
    if (allergyFilter === 'Con Alergias' && !p.allergies) {
      return false;
    }
    if (allergyFilter === 'Sin Alergias' && p.allergies) {
      return false;
    }
    
    // 4. Filtrar por búsqueda
    if (!localSearch) return true;
    const query = localSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      (p.allergies || '').toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    if (sortOrder === 'A-Z') {
      return a.name.localeCompare(b.name);
    }
    if (sortOrder === 'Z-A') {
      return b.name.localeCompare(a.name);
    }
    if (sortOrder === 'Edad-Asc') {
      return a.age - b.age;
    }
    if (sortOrder === 'Edad-Desc') {
      return b.age - a.age;
    }
    return 0;
  });

  const getRiskBadgeClass = (risk: Patient['riskLevel']) => {
    switch (risk) {
      case 'Alto Riesgo':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/40';
      case 'Medio Riesgo':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40';
    }
  };

  const getStatusBadgeClass = (status: Patient['status']) => {
    const normStatus = status || 'Activo';
    switch (normStatus) {
      case 'Activo':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'Inactivo':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      case 'Archivado':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
    }
  };

  return (
    <div id="patients-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Pacientes</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            Directorio general de expedientes clínicos y pacientes de la clínica.
          </p>
        </div>
        <button 
          onClick={onOpenPatientModal}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Paciente
        </button>
      </div>

      {/* Filtros de Estado y Búsqueda */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        
        {/* Pestañas de Filtro Rápido */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-max overflow-x-auto shadow-3xs">
          {[
            { id: 'Todos', label: 'Todos', count: totalCount },
            { id: 'Activo', label: 'Activos', count: activeCount },
            { id: 'Inactivo', label: 'Inactivos', count: inactiveCount },
            { id: 'Archivado', label: 'Archivados', count: archivedCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-3xs font-extrabold'
                  : 'text-[#444748] dark:text-slate-350 hover:bg-white/40 dark:hover:bg-slate-750'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                statusFilter === tab.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                  : 'bg-slate-200/55 dark:bg-slate-900/55 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Input de Búsqueda y Resultados */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center flex-1 w-full lg:max-w-none">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar por nombre, código, teléfono..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs text-slate-805 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-all shadow-3xs"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filtro de Riesgo */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-2xs rounded-xl px-3 py-2.5 outline-none font-sans text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-1 focus:ring-blue-600 shadow-3xs"
            >
              <option value="Todos">Riesgo: Todos</option>
              <option value="Bajo Riesgo">Bajo Riesgo</option>
              <option value="Medio Riesgo">Medio Riesgo</option>
              <option value="Alto Riesgo">Alto Riesgo</option>
            </select>

            {/* Filtro de Alergias */}
            <select
              value={allergyFilter}
              onChange={(e) => setAllergyFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-2xs rounded-xl px-3 py-2.5 outline-none font-sans text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-1 focus:ring-blue-600 shadow-3xs"
            >
              <option value="Todos">Alergias: Todos</option>
              <option value="Con Alergias">Con Alergias</option>
              <option value="Sin Alergias">Sin Alergias</option>
            </select>

            {/* Ordenamiento */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-2xs rounded-xl px-3 py-2.5 outline-none font-sans text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-1 focus:ring-blue-600 shadow-3xs"
            >
              <option value="A-Z">Ordenar: A – Z</option>
              <option value="Z-A">Ordenar: Z – A</option>
              <option value="Edad-Asc">Edad: Menor a Mayor</option>
              <option value="Edad-Desc">Edad: Mayor a Menor</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-2xs font-sans font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap px-1">
            <span>Filtrados: <strong>{filteredPatients.length}</strong> de <strong>{patients.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabla del Directorio */}
      <div className="bg-white dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-3xs">
        
        {/* Vista Escritorio (Tabla) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-900/50 text-[#444748] dark:text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800/80">
                <th className="py-3.5 px-5">Paciente</th>
                <th className="py-3.5 px-5">Expediente</th>
                <th className="py-3.5 px-5">Edad / F. Nac</th>
                <th className="py-3.5 px-5">Contacto</th>
                <th className="py-3.5 px-5">Nivel Riesgo</th>
                <th className="py-3.5 px-5">Alergias</th>
                <th className="py-3.5 px-5">Estado Clínico</th>
                <th className="py-3.5 px-5 text-right">Acciones Clínicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans">
                    No se encontraron pacientes que coincidan con la búsqueda y filtros activos.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  const normStatus = patient.status || 'Activo';
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Paciente y Avatar */}
                      <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white align-middle">
                        <div className="flex items-center gap-3">
                          {patient.avatar ? (
                            <img 
                              src={patient.avatar} 
                              alt={patient.name} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-150 dark:border-slate-800 bg-slate-50"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-900/40 shadow-3xs">
                              {patient.initials}
                            </div>
                          )}
                          <div>
                            <span className="block font-bold">{patient.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Paciente Dental Printer</span>
                          </div>
                        </div>
                      </td>

                      {/* Código Clínico */}
                      <td className="py-4 px-5 align-middle">
                        <span className="font-mono text-2xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-bold">
                          {patient.id}
                        </span>
                      </td>

                      {/* Edad / Fecha Nacimiento */}
                      <td className="py-4 px-5 align-middle text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="block font-medium">{patient.age} años</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{patient.dob}</span>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-5 align-middle text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          <span className="font-mono text-xs">{patient.phone}</span>
                        </div>
                      </td>

                      {/* Nivel de Riesgo */}
                      <td className="py-4 px-5 align-middle">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRiskBadgeClass(patient.riskLevel)}`}>
                          {patient.riskLevel}
                        </span>
                      </td>

                      {/* Alergias */}
                      <td className="py-4 px-5 align-middle">
                        {patient.allergies ? (
                          <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]" title={patient.allergies}>{patient.allergies}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-2xs">Ninguna reportada</span>
                        )}
                      </td>

                      {/* Estado Clínico (Selector Rápido) */}
                      <td className="py-4 px-5 align-middle">
                        <select
                          value={normStatus}
                          onChange={(e) => onUpdatePatientStatus?.(patient.id, e.target.value as any)}
                          className={`font-sans text-2xs font-extrabold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 ${getStatusBadgeClass(normStatus)}`}
                        >
                          <option value="Activo">🟢 Activo</option>
                          <option value="Inactivo">🔴 Inactivo</option>
                          <option value="Archivado">📁 Archivado</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Ver Expediente */}
                          <button
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setCurrentTab('archivero');
                            }}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Ver Expediente en Archivero"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>

                          {/* Ver Odontograma */}
                          <button
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setCurrentTab('odontogram');
                            }}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded-lg transition-colors cursor-pointer"
                            title="Ver Odontograma y Ficha Clínica"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {/* Nueva Cita */}
                          <button
                            onClick={() => onScheduleForPatient(patient.id)}
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                            title="Agendar Cita Médica"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Ver Presupuestos */}
                          <button
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setCurrentTab('presupuestos');
                            }}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-lg transition-colors cursor-pointer"
                            title="Ver Presupuestos Dental"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onOpenEditPatientModal(patient)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Modificar Datos"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Tarjetas) */}
        <div className="block lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
          {filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans">
              No se encontraron pacientes que coincidan con la búsqueda.
            </div>
          ) : (
            filteredPatients.map(patient => {
              const normStatus = patient.status || 'Activo';
              return (
                <div key={patient.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3 transition-all duration-300 hover:shadow-md interactive-hover-card">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {patient.avatar ? (
                        <img 
                          src={patient.avatar} 
                          alt={patient.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-150 dark:border-slate-800 bg-slate-50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-900/40 shadow-inner">
                          {patient.initials}
                        </div>
                      )}
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white text-xs">{patient.name}</span>
                        <span className="font-mono text-3xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded block mt-0.5 w-max">{patient.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getRiskBadgeClass(patient.riskLevel)}`}>
                        {patient.riskLevel}
                      </span>
                      
                      <select
                        value={normStatus}
                        onChange={(e) => onUpdatePatientStatus?.(patient.id, e.target.value as any)}
                        className={`font-sans text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 outline-none ${getStatusBadgeClass(normStatus)}`}
                      >
                        <option value="Activo">🟢 Activo</option>
                        <option value="Inactivo">🔴 Inactivo</option>
                        <option value="Archivado">📁 Archivado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-sans text-slate-600 dark:text-slate-350">
                    <div>
                      <span className="text-3xs uppercase text-slate-400 block">Edad / F. Nac</span>
                      <span>{patient.age} años ({patient.dob})</span>
                    </div>
                    <div>
                      <span className="text-3xs uppercase text-slate-400 block">Teléfono</span>
                      <span className="font-mono">{patient.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-3xs uppercase text-slate-400 block">Alergias</span>
                      {patient.allergies ? (
                        <span className="text-red-500 font-semibold flex items-center gap-0.5 text-2xs">
                          ⚠️ {patient.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-2xs">Ninguna reportada</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 justify-end">
                    <button
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setCurrentTab('archivero');
                      }}
                      className="flex-1 min-w-[70px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-3 h-3" />
                      Expediente
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setCurrentTab('odontogram');
                      }}
                      className="flex-1 min-w-[75px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Activity className="w-3 h-3" />
                      Odontograma
                    </button>
                    <button
                      onClick={() => onScheduleForPatient(patient.id)}
                      className="flex-1 min-w-[75px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" />
                      Cita
                    </button>
                    <button
                      onClick={() => onOpenEditPatientModal(patient)}
                      className="bg-slate-100 dark:bg-slate-850 p-2 text-slate-500 dark:text-slate-400 rounded-lg hover:text-blue-600 cursor-pointer"
                      title="Editar Expediente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
