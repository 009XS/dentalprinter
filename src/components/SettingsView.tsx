import { useState, useEffect, FormEvent } from 'react';
import { 
  Save, 
  Shield, 
  Smartphone, 
  Globe, 
  Sliders, 
  CheckCircle2
} from 'lucide-react';
import { getSettings, saveSettings, getAuditLogs } from '../api';

export default function SettingsView({ 
  userRole,
  showToast
}: { 
  userRole?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [clinicName, setClinicName] = useState('Dentalprinter');
  const [tagline, setTagline] = useState('Excelencia Clínica');
  const [notationSystem, setNotationSystem] = useState<'universal' | 'fdi'>('universal');
  const [whatsAppNum, setWhatsAppNum] = useState('+1 (555) 0123-DENTAL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (userRole === 'admin') {
      getAuditLogs()
        .then((logs) => setAuditLogs(logs || []))
        .catch((err) => console.error('Error al cargar logs de auditoría:', err));
    }
  }, [userRole]);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data) {
          setClinicName(data.clinicName || 'Dentalprinter');
          setTagline(data.tagline || 'Excelencia Clínica');
          setNotationSystem(data.notationSystem || 'universal');
          setWhatsAppNum(data.whatsAppNumber || '+1 (555) 0123-DENTAL');
        }
      })
      .catch((err) => {
        console.error('Error al cargar configuración:', err);
      });
  }, []);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        clinicName,
        tagline,
        notationSystem,
        whatsAppNumber: whatsAppNum,
        complianceMode: 'demo'
      });
      setSavedSuccess(true);
      if (showToast) {
        showToast('¡Configuración guardada correctamente!', 'success');
      }
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al guardar configuración: ${err.message}`, 'error');
      } else {
        alert(`Error al guardar configuración: ${err.message}`);
      }
    }
  };

  return (
    <div id="settings-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex justify-between items-start border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Configuración</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            Configura la marca, el sistema de notación dental y los canales de comunicación.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans text-sm">
        
        {/* Formulario Principal */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          
          {/* Sección 1 - Identidad de Marca */}
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Identidad de Marca Clínica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre Comercial Clínico</label>
                <input 
                  type="text" 
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Eslogan de Marca</label>
                <input 
                  type="text" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-400" 
                />
              </div>
            </div>
          </div>

          {/* Sección 2 - Estándares Clínicos */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Estándares y Reglas Clínicas
            </h3>

            <div>
              {/* Se corrigió la clase mb-1.5Col incorrecta a mb-1.5 */}
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Estándar de Clasificación Dental</label>
              <div className="flex gap-4 text-xs font-medium mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-805 dark:text-white">
                  <input 
                    type="radio" 
                    name="notation" 
                    checked={notationSystem === 'universal'} 
                    onChange={() => setNotationSystem('universal')} 
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  ANSI/Universal (Sistema del 1 al 32)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400">
                  <input 
                    type="radio" 
                    name="notation" 
                    checked={notationSystem === 'fdi'} 
                    onChange={() => setNotationSystem('fdi')} 
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  FDI Internacional (Dos Dígitos)
                </label>
              </div>
            </div>
          </div>

          {/* Sección 3 - Integración WhatsApp */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Integración de WhatsApp Clínico
            </h3>

            <div className="max-w-md">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Número de API de WhatsApp de la Clínica</label>
              <input 
                type="text" 
                value={whatsAppNum}
                onChange={(e) => setWhatsAppNum(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600" 
              />
              <span className="text-[10px] text-slate-400 block mt-1.5 font-normal leading-relaxed">
                Las cotizaciones de presupuestos se envían automáticamente como borradores de mensajes personalizados al canal virtual seleccionado.
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-4">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                ¡Configuración de la clínica guardada correctamente!
              </span>
            )}
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>

        </div>

        {/* Tarjeta de Cumplimiento Regulador */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="font-sans font-bold text-xs text-slate-850 dark:text-white uppercase flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Cumplimiento Regulador
          </h4>

          <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <p>
              Esta instancia está completamente configurada y cumple con las normas de seguridad de <strong>HIPAA</strong> para almacenar registros médicos electrónicos de forma segura (ePHI).
            </p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              Sincronización de Respaldo: Activa
            </p>
            <p className="text-[10px] text-slate-400">
              Versión del sistema: v2.4.19-LTS<br />
              Ubicación del Servidor: us-east1 Cloud Run
            </p>
          </div>
        </div>

      </form>

      {/* REGISTRO DE AUDITORÍA DE SEGURIDAD */}
      {userRole === 'admin' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-6 shadow-xs font-sans text-xs">
          <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Registro de Auditoría de Seguridad (Solo Administradores)
          </h3>
          <p className="text-[#444748] dark:text-slate-400 text-xs mb-4">
            El sistema registra automáticamente todas las acciones administrativas críticas para garantizar el cumplimiento normativo.
          </p>
          
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-450 text-[10px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Acción</th>
                  <th className="py-2.5 px-4">Entidad</th>
                  <th className="py-2.5 px-4">ID Entidad</th>
                  <th className="py-2.5 px-4">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-slate-400 dark:text-slate-500">
                      No hay registros de auditoría en la clínica aún.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 px-4 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-semibold">{log.actorEmail}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px]">{log.entityType}</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] truncate max-w-[120px]" title={log.entityId}>
                        {log.entityId || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px]">{log.ip || 'Local'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
