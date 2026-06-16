import { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Send, 
  Percent, 
  Printer, 
  Plus,
  MessageCircle,
  Check,
  TrendingUp,
  Save
} from 'lucide-react';
import { Budget, BudgetItem, Patient } from '../types';
import { createBudget } from '../api';

interface PresupuestosViewProps {
  budgets: Budget[];
  setBudgets: (b: Budget[]) => void;
  activePatient?: Patient;
  liveItems: BudgetItem[];
  setLiveItems: (items: BudgetItem[]) => void;
  searchQuery: string;
  onOpenPatientModal?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PresupuestosView({
  budgets,
  setBudgets,
  activePatient,
  liveItems,
  setLiveItems,
  searchQuery,
  onOpenPatientModal,
  showToast
}: PresupuestosViewProps) {
  const [activeBudgetId, setActiveBudgetId] = useState<string>('live');
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);

  // Sincronizar activeBudgetId con presupuestos reales si existen
  useEffect(() => {
    if (budgets && budgets.length > 0) {
      setActiveBudgetId(budgets[0].id);
    } else {
      setActiveBudgetId('live');
    }
  }, [budgets]);

  if (!activePatient) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-2xl shadow-sm mt-12 text-center space-y-6 font-sans">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-450 animate-pulse">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Sin Paciente Seleccionado</h3>
          <p className="text-xs text-[#444748] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Para poder planificar y visualizar los presupuestos de un paciente, primero debes registrar un paciente nuevo o seleccionar uno activo en el portal clínico.
          </p>
        </div>
        {onOpenPatientModal && (
          <button 
            onClick={onOpenPatientModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer transform active:scale-98"
          >
            Registrar Paciente Nuevo
          </button>
        )}
      </div>
    );
  }

  // Cálculos dinámicos de KPIs reales de presupuestos
  const pendingBudgets = budgets.filter(b => b.status === 'Pendiente');
  const totalPendingVal = pendingBudgets.reduce((sum, b) => {
    const bSubtotal = b.items.reduce((acc, item) => acc + item.unitPrice, 0);
    const bDiscount = bSubtotal * (b.discountPercent / 100);
    return sum + (bSubtotal - bDiscount);
  }, 0);

  const approvedBudgets = budgets.filter(b => b.status === 'Aprobado');
  const approvalRate = budgets.length > 0 ? Math.round((approvedBudgets.length / budgets.length) * 100) : 0;
  const recentApprovedCount = approvedBudgets.length;

  const saveLiveBudget = async () => {
    if (liveItems.length === 0 || !activePatient) return;
    try {
      const newBudget = await createBudget({
        patientId: activePatient.id,
        discountPercent: discountPercent,
        status: 'Pendiente',
        items: liveItems
      });
      const mappedBudget: Budget = {
        id: newBudget.id,
        patientName: activePatient.name,
        status: 'Pendiente',
        discountPercent: newBudget.discountPercent,
        items: newBudget.items
      };
      setBudgets([mappedBudget, ...budgets]);
      setLiveItems([]);
      setActiveBudgetId(newBudget.id);
      if (showToast) {
        showToast(`¡Presupuesto ${newBudget.id} guardado correctamente!`, 'success');
      } else {
        alert(`¡Presupuesto ${newBudget.id} guardado correctamente en la base de datos!`);
      }
    } catch (err: any) {
      if (showToast) {
        showToast(`Error al guardar el presupuesto: ${err.message}`, 'error');
      } else {
        alert(`Error al guardar el presupuesto: ${err.message}`);
      }
    }
  };

  // Filtrar presupuestos según búsqueda global
  const filteredBudgets = budgets.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return b.patientName.toLowerCase().includes(query) || b.id.toLowerCase().includes(query);
  });

  const isLive = activeBudgetId === 'live';
  const activeBudget = budgets.find(b => b.id === activeBudgetId);

  // Datos del paciente activo
  const activeName = isLive ? (activePatient?.name || 'Paciente') : (activeBudget?.patientName || activePatient?.name || 'Paciente');
  const activeItems = isLive ? liveItems : (activeBudget?.items || []);

  // Cálculos dinámicos reales basados en la lista de ítems activos
  const subtotal = activeItems.reduce((acc, current) => acc + current.unitPrice, 0);
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;

  const isLiveEmpty = isLive && liveItems.length === 0;

  // Generar borrador de mensaje de WhatsApp en español
  const getWhatsappMessageDraft = () => {
    const itemsText = activeItems.map(i => `• Diente ${i.tooth} - ${i.description}: $${i.unitPrice}`).join('\n');
    return `¡Hola ${activeName}! Este es el resumen de tu presupuesto de la clínica dental Dentalprinter:\n\n${itemsText || 'Sin tratamientos agregados.'}\n\nSubtotal: $${subtotal.toFixed(2)}\nDescuento aplicado: ${discountPercent}%\nTotal del Presupuesto: $${total.toFixed(2)}\n\n¿Te gustaría que programemos las citas correspondientes para iniciar el tratamiento? Podemos aplicar este descuento de inmediato. ¡Escríbenos de vuelta!`;
  };

  // Insertar un tratamiento simulado en español
  const insertMockBudgetItem = () => {
    const codeList = ['D0120', 'D1110', 'D2330', 'D4341'];
    const descList = [
      'Evaluación Oral Periódica',
      'Profilaxis - Limpieza de Adulto',
      'Resina Compuesta Estética - 1 Superficie',
      'Raspado y Alisado Radicular Periodontal'
    ];
    const prices = [75.0, 110.0, 195.0, 240.0];
    const randomIndex = Math.floor(Math.random() * codeList.length);

    const manualItem: BudgetItem = {
      code: codeList[randomIndex],
      description: descList[randomIndex],
      tooth: '-',
      unitPrice: prices[randomIndex],
      total: prices[randomIndex]
    };

    if (isLive) {
      setLiveItems([...liveItems, manualItem]);
    } else {
      const updated = budgets.map(b => {
        if (b.id === activeBudgetId) {
          return {
            ...b,
            items: [...b.items, manualItem]
          };
        }
        return b;
      });
      setBudgets(updated);
    }
  };

  // Eliminar un tratamiento del plan dinámico
  const removeBudgetItem = (index: number) => {
    if (isLive) {
      setLiveItems(liveItems.filter((_, idx) => idx !== index));
    } else {
      const updated = budgets.map(b => {
        if (b.id === activeBudgetId) {
          return {
            ...b,
            items: b.items.filter((_, idx) => idx !== index)
          };
        }
        return b;
      });
      setBudgets(updated);
    }
  };

  return (
    <div id="presupuestos-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Título de la página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Presupuestos</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            Gestiona y realiza el seguimiento de los planes de tratamiento y presupuestos de los pacientes.
          </p>
        </div>

        <button 
          onClick={insertMockBudgetItem}
          className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Añadir Concepto
        </button>
      </div>

      {/* Bento Grid de Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI 1 - Total Pendiente */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-[#c4c7c8]/40 dark:border-slate-700/60 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-xl"></div>
          <p className="font-sans font-bold text-[10px] tracking-wider text-[#444748] dark:text-slate-400 uppercase mb-2">Total Pendiente (Presupuestos Activos)</p>
          <h3 className="font-serif text-3xl font-bold text-[#181c1e] dark:text-white">${totalPendingVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="font-sans text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Sincronizado en tiempo real
          </p>
        </div>

        {/* KPI 2 - Tasa de Aprobación */}
        <div className="bg-white/90 dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <p className="font-sans font-bold text-[10px] tracking-wider text-[#444748] dark:text-slate-400 uppercase mb-2">Tasa de Aprobación</p>
          <h3 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">{approvalRate}%</h3>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-4">
            <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style={{ width: `${approvalRate}%` }}></div>
          </div>
        </div>

        {/* KPI 3 - Aprobaciones Recientes */}
        <div className="bg-white/90 dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <p className="font-sans font-bold text-[10px] tracking-wider text-[#444748] dark:text-slate-400 uppercase mb-2">Aprobaciones Recientes</p>
          <h3 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">{recentApprovedCount}</h3>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-2">En espera de programación de citas</p>
        </div>

      </div>

      {/* Selector de Presupuestos (Dinamizado para cualquier paciente) */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Seleccionar Presupuesto de Paciente</label>
          <select 
            value={activeBudgetId}
            onChange={(e) => {
              setActiveBudgetId(e.target.value);
            }}
            className="w-full max-w-md border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold"
          >
            {filteredBudgets.map(b => (
              <option key={b.id} value={b.id}>{b.patientName} - Folio {b.id} ({b.items.length} conceptos)</option>
            ))}
            <option value="live">Odontograma Activo: {activePatient?.name || 'Paciente'} ({liveItems.length} conceptos agregados)</option>
          </select>
        </div>
      </div>

      {/* Planilla de Conceptos */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        
        {/* Encabezado */}
        <div className="p-6 border-b border-[#ebeef0] dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f1f4f6]/35 dark:bg-slate-900/60 font-sans">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-sans font-bold text-sm text-[#181c1e] dark:text-white uppercase">
                {isLive ? `PR-ACTIVO-${activePatient?.id.slice(-4) || 'N/A'}` : activeBudgetId}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#fff3e0] text-[#e65100]">
                Pendiente
              </span>
            </div>
            <p className="text-sm font-semibold text-[#181c1e] dark:text-white leading-relaxed">
              Paciente: <span className="font-bold underline">{activeName}</span>
            </p>
          </div>

          {/* Exportar */}
          <div className="flex gap-2 w-full md:w-auto">
            {isLive && liveItems.length > 0 && (
              <button 
                onClick={saveLiveBudget}
                className="flex-grow md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transform active:scale-98 transition-all cursor-pointer font-sans"
              >
                <Save className="w-4 h-4" />
                Guardar Presupuesto
              </button>
            )}
            <button 
              onClick={() => {
                if (showToast) {
                  showToast('Preparando impresión del presupuesto...', 'info');
                } else {
                  alert('Descargando archivo PDF del presupuesto...');
                }
                window.print();
              }}
              className="flex-grow md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-[#c4c7c8]/60 dark:border-slate-700 hover:bg-slate-50 rounded-lg transform active:scale-98 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              Imprimir PDF
            </button>
            <button 
              onClick={() => setWhatsappPreviewOpen(true)}
              className="flex-grow md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transform active:scale-98 transition-all cursor-pointer font-sans"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
          </div>
        </div>

        {/* Tabla de Conceptos */}
        <div className="p-6">
          <h4 className="font-sans font-bold text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4 border-b border-[#ebeef0] dark:border-slate-800/80 pb-2">Conceptos del Tratamiento</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-sans font-bold text-[10px] uppercase">
                  <th className="py-2 px-3 w-20">Código</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-3 text-center w-24">Diente</th>
                  <th className="py-2 px-3 text-right w-32">Precio Unitario</th>
                  <th className="py-2 px-3 text-right w-32">Total</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-sans text-xs">
                
                {isLiveEmpty ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No hay tratamientos cotizados aún. Ve a la pestaña "Odontograma", selecciona un diente (ej. 18) y haz clic en "Añadir al Plan de Tratamiento".
                    </td>
                  </tr>
                ) : (
                  activeItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 text-slate-500 font-mono">{item.code}</td>
                      <td className="py-3 px-3 text-[#181c1e] dark:text-white font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-600/5 dark:bg-blue-400/5 rounded-sm inline-block scale-90 px-1">{item.tooth}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">$ {item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-white">$ {item.total.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">
                        <button 
                          onClick={() => removeBudgetItem(index)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 hover:text-red-700 rounded cursor-pointer transition-colors"
                          title="Eliminar Concepto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* Ajuste de Descuentos e Importes */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Percent className="w-4 h-4 text-slate-400" />
              <span>Configurar Descuento:</span>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-12 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-705 text-xs text-center rounded px-1.5 py-0.5 ml-1 font-bold outline-none" 
              />
              <span>%</span>
            </div>

            <div className="w-full sm:w-72 font-sans space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  $ {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Descuento ({discountPercent}%)</span>
                <span className="font-semibold text-emerald-600">
                  -$ {discount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-white pt-2.5 border-t border-slate-100 dark:border-slate-800 font-bold text-sm">
                <span>Total Cotizado</span>
                <span className="text-blue-600 dark:text-blue-450">
                  $ {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* PREVISUALIZACIÓN DE BORRADOR DE WHATSAPP */}
      {whatsappPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-120">
            
            {/* Encabezado del Modal */}
            <div className="bg-emerald-800 p-4 text-white flex items-center gap-3">
              <MessageCircle className="w-5 h-5 fill-white" />
              <div>
                <h3 className="font-sans font-bold text-sm">Creador de Presupuestos de WhatsApp</h3>
                <p className="text-[10px] text-emerald-250">Previsualización del borrador del presupuesto para el cliente</p>
              </div>
            </div>

            {/* Cuerpo del borrador */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 flex-1 overflow-y-auto min-h-[180px] text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-lg rounded-tr-none shadow-xs whitespace-pre-wrap font-mono tracking-tight leading-relaxed">
                {getWhatsappMessageDraft()}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-2.5">
              <button 
                onClick={() => {
                  if (showToast) {
                    showToast('¡Mensaje enviado al canal virtual del paciente!', 'success');
                  } else {
                    alert('¡Mensaje enviado correctamente al canal virtual del paciente!');
                  }
                  setWhatsappPreviewOpen(false);
                }}
                className="bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 text-white text-xs font-bold font-sans py-2 px-4 rounded-lg cursor-pointer transition-colors uppercase flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Enviar WhatsApp
              </button>
              <button 
                onClick={() => setWhatsappPreviewOpen(false)}
                className="text-xs font-bold text-[#444748] dark:text-slate-300 hover:bg-slate-105 dark:hover:bg-slate-800 py-2 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
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
