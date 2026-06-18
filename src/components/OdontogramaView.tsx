import { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  ChevronRight, 
  Phone,
  Cake,
  Activity,
  Award,
  AlertTriangle,
  Flame,
  Hammer,
  Crown
} from 'lucide-react';
import { Patient, ToothState, BudgetItem } from '../types';
import { getOdontogram, saveOdontogram } from '../api';

// Helper to determine anatomical Spanish name of tooth by FDI number
function getToothName(id: number): string {
  if (id >= 11 && id <= 18) {
    const names = [
      'Incisivo central superior derecho',
      'Incisivo lateral superior derecho',
      'Canino superior derecho',
      'Primer premolar superior derecho',
      'Segundo premolar superior derecho',
      'Primer molar superior derecho',
      'Segundo molar superior derecho',
      'Tercer molar superior derecho'
    ];
    return names[id - 11];
  }
  if (id >= 21 && id <= 28) {
    const names = [
      'Incisivo central superior izquierdo',
      'Incisivo lateral superior izquierdo',
      'Canino superior izquierdo',
      'Primer premolar superior izquierdo',
      'Segundo premolar superior izquierdo',
      'Primer molar superior izquierdo',
      'Segundo molar superior izquierdo',
      'Tercer molar superior izquierdo'
    ];
    return names[id - 21];
  }
  if (id >= 31 && id <= 38) {
    const names = [
      'Incisivo central inferior izquierdo',
      'Incisivo lateral inferior izquierdo',
      'Canino inferior izquierdo',
      'Primer premolar inferior izquierdo',
      'Segundo premolar inferior izquierdo',
      'Primer molar inferior izquierdo',
      'Segundo molar inferior izquierdo',
      'Tercer molar inferior izquierdo'
    ];
    return names[id - 31];
  }
  if (id >= 41 && id <= 48) {
    const names = [
      'Incisivo central inferior derecho',
      'Incisivo lateral inferior derecho',
      'Canino inferior derecho',
      'Primer premolar inferior derecho',
      'Segundo premolar inferior derecho',
      'Primer molar inferior derecho',
      'Segundo molar inferior derecho',
      'Tercer molar inferior derecho'
    ];
    return names[id - 41];
  }
  if (id >= 51 && id <= 55) {
    const names = [
      'Incisivo central temporal superior derecho',
      'Incisivo lateral temporal superior derecho',
      'Canino temporal superior derecho',
      'Primer molar temporal superior derecho',
      'Segundo molar temporal superior derecho'
    ];
    return names[id - 51];
  }
  if (id >= 61 && id <= 65) {
    const names = [
      'Incisivo central temporal superior izquierdo',
      'Incisivo lateral temporal superior izquierdo',
      'Canino temporal superior izquierdo',
      'Primer molar temporal superior izquierdo',
      'Segundo molar temporal superior izquierdo'
    ];
    return names[id - 61];
  }
  if (id >= 71 && id <= 75) {
    const names = [
      'Incisivo central temporal inferior izquierdo',
      'Incisivo lateral temporal inferior izquierdo',
      'Canino temporal inferior izquierdo',
      'Primer molar temporal inferior izquierdo',
      'Segundo molar temporal inferior izquierdo'
    ];
    return names[id - 71];
  }
  if (id >= 81 && id <= 85) {
    const names = [
      'Incisivo central temporal inferior derecho',
      'Incisivo lateral temporal inferior derecho',
      'Canino temporal inferior derecho',
      'Primer molar temporal inferior derecho',
      'Segundo molar temporal inferior derecho'
    ];
    return names[id - 81];
  }
  return `Pieza Dental ${id}`;
}

// Helper to determine if a tooth is lower (inferior) or upper (superior)
function isLowerTooth(id: number): boolean {
  const quad = Math.floor(id / 10);
  return quad === 3 || quad === 4 || quad === 7 || quad === 8;
}

// Helper to determine if a tooth is pediatric (child deciduous)
function isToothPediatric(id: number): boolean {
  return id >= 51 && id <= 85;
}

interface OdontogramaViewProps {
  activePatient?: Patient;
  onAddTreatmentItem: (item: BudgetItem) => void;
  searchQuery: string;
  onOpenPatientModal?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OdontogramaView({
  activePatient,
  onAddTreatmentItem,
  onOpenPatientModal,
  showToast
}: OdontogramaViewProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(18); // Diente 18 seleccionado por defecto
  const [activeTool, setActiveTool] = useState<'Caries' | 'Fracture' | 'Extraction' | 'Crown' | 'Implant'>('Caries');
  const [selectedFinding, setSelectedFinding] = useState('Saludable / Intacto');
  const [observationNotes, setObservationNotes] = useState('');
  const [customInterventions, setCustomInterventions] = useState<any[]>([]);
  const [teethStates, setTeethStates] = useState<Record<number, ToothState>>({});

  // Cargar datos iniciales del odontograma
  useEffect(() => {
    if (!activePatient) return;
    getOdontogram(activePatient.id)
      .then((data) => {
        if (data && data.teeth) {
          setTeethStates(data.teeth);
          setCustomInterventions(data.interventions || []);
        } else {
          setTeethStates({});
          setCustomInterventions([]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar odontograma:', err);
      });
  }, [activePatient?.id]);

  if (!activePatient) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white dark:bg-slate-900 border border-[#ebeef0] dark:border-slate-800 rounded-2xl shadow-sm mt-12 text-center space-y-6 font-sans">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-450 animate-pulse">
          <Activity className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Sin Paciente Seleccionado</h3>
          <p className="text-xs text-[#444748] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Para registrar hallazgos en el odontograma e iniciar un plan de tratamiento, primero debes registrar o seleccionar un paciente activo en el portal clínico.
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

  // Actualizar texto del hallazgo seleccionado
  const updateSelectedFinding = (toothState: ToothState | undefined, toothId: number) => {
    if (!toothState) {
      setSelectedFinding('Saludable / Intacto');
      return;
    }
    const parts: string[] = [];
    if (toothState.hasMissing) parts.push('Diente Ausente');
    if (toothState.hasImplant) parts.push('Implante Integrado');
    if (toothState.hasCrown) parts.push('Corona Completa');
    
    // Evaluar estado por superficies
    if (toothState.surfaces) {
      const surfaceNames: Record<string, string> = {
        top: 'Vestibular',
        bottom: 'Lingual/Palatino',
        left: 'Mesial/Distal Izq.',
        right: 'Distal/Mesial Der.',
        center: 'Oclusal/Incisal'
      };
      
      Object.entries(toothState.surfaces).forEach(([surface, cond]) => {
        if (cond === 'caries') {
          parts.push(`Caries en ${surfaceNames[surface] || surface}`);
        } else if (cond === 'fracture') {
          parts.push(`Fractura en ${surfaceNames[surface] || surface}`);
        } else if (cond === 'crown') {
          parts.push(`Corona parcial en ${surfaceNames[surface] || surface}`);
        }
      });
    } else {
      if (toothState.hasCaries) parts.push('Caries (General)');
      if (toothState.hasFracture) parts.push('Fractura (General)');
    }

    setSelectedFinding(parts.length > 0 ? parts.join(', ') : 'Saludable / Intacto');
  };

  const selectTooth = (id: number) => {
    setSelectedTooth(id);
    updateSelectedFinding(teethStates[id], id);
  };

  // Aplicar diagnóstico a una superficie específica del diente
  const applyDiagnosticToSurface = (toothId: number, surface: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
    setSelectedTooth(toothId);

    const updatedTeeth = { ...teethStates };
    const current = updatedTeeth[toothId] || { 
      id: toothId, 
      isPediatric: isToothPediatric(toothId), 
      hasCaries: false, 
      hasFracture: false, 
      hasMissing: false, 
      hasCrown: false, 
      hasImplant: false 
    };

    if (!current.surfaces) {
      current.surfaces = {};
    }

    const currentCond = current.surfaces[surface];

    if (activeTool === 'Caries') {
      current.surfaces[surface] = currentCond === 'caries' ? 'healthy' : 'caries';
      current.hasCaries = Object.values(current.surfaces).some(c => c === 'caries');
    } else if (activeTool === 'Fracture') {
      current.surfaces[surface] = currentCond === 'fracture' ? 'healthy' : 'fracture';
      current.hasFracture = Object.values(current.surfaces).some(c => c === 'fracture');
    } else if (activeTool === 'Crown') {
      current.surfaces[surface] = currentCond === 'crown' ? 'healthy' : 'crown';
      current.hasCrown = Object.values(current.surfaces).some(c => c === 'crown');
    } else if (activeTool === 'Implant') {
      current.hasImplant = !current.hasImplant;
    } else if (activeTool === 'Extraction') {
      current.hasMissing = !current.hasMissing;
    }

    updatedTeeth[toothId] = current;
    setTeethStates(updatedTeeth);
    updateSelectedFinding(current, toothId);
  };

  // Aplicar diagnóstico de forma general al diente seleccionado
  const applyDiagnosticTool = (tool: 'Caries' | 'Fracture' | 'Extraction' | 'Crown' | 'Implant') => {
    setActiveTool(tool);
    if (!selectedTooth) return;

    const updatedTeeth = { ...teethStates };
    const current = updatedTeeth[selectedTooth] || { 
      id: selectedTooth, 
      isPediatric: isToothPediatric(selectedTooth), 
      hasCaries: false, 
      hasFracture: false, 
      hasMissing: false, 
      hasCrown: false, 
      hasImplant: false 
    };

    if (tool === 'Caries') {
      current.hasCaries = !current.hasCaries;
      if (current.hasCaries) {
        if (!current.surfaces) current.surfaces = {};
        current.surfaces.center = 'caries';
      } else {
        if (current.surfaces) {
          Object.keys(current.surfaces).forEach(k => {
            if (current.surfaces![k as any] === 'caries') current.surfaces![k as any] = 'healthy';
          });
        }
      }
    } else if (tool === 'Fracture') {
      current.hasFracture = !current.hasFracture;
      if (current.hasFracture) {
        if (!current.surfaces) current.surfaces = {};
        current.surfaces.center = 'fracture';
      } else {
        if (current.surfaces) {
          Object.keys(current.surfaces).forEach(k => {
            if (current.surfaces![k as any] === 'fracture') current.surfaces![k as any] = 'healthy';
          });
        }
      }
    } else if (tool === 'Extraction') {
      current.hasMissing = !current.hasMissing;
    } else if (tool === 'Crown') {
      current.hasCrown = !current.hasCrown;
      if (current.hasCrown) {
        if (current.surfaces) {
          Object.keys(current.surfaces).forEach(k => {
            if (current.surfaces![k as any] === 'crown') current.surfaces![k as any] = 'healthy';
          });
        }
      }
    } else if (tool === 'Implant') {
      current.hasImplant = !current.hasImplant;
    }

    updatedTeeth[selectedTooth] = current;
    setTeethStates(updatedTeeth);
    updateSelectedFinding(current, selectedTooth);
  };

  // Agregar tratamiento al presupuesto
  const triggerAddToPlan = () => {
    if (!selectedTooth) return;

    let procCode = 'D2740';
    let procPrice = 850.0;
    let procDesc = 'Corona - Porcelana / Sustrato Cerámico';

    if (activeTool === 'Caries') {
      procCode = 'D2391';
      procPrice = 180.0;
      procDesc = 'Resina Compuesta - 1 Superficie';
    } else if (activeTool === 'Fracture') {
      procCode = 'D2950';
      procPrice = 250.0;
      procDesc = 'Reconstrucción Dental / Núcleo';
    } else if (activeTool === 'Extraction') {
      procCode = 'D7140';
      procPrice = 220.0;
      procDesc = 'Extracción Dental Simple';
    } else if (activeTool === 'Crown') {
      procCode = 'D2740';
      procPrice = 850.0;
      procDesc = 'Corona - Porcelana / Sustrato Cerámico';
    } else if (activeTool === 'Implant') {
      procCode = 'D6010';
      procPrice = 1950.0;
      procDesc = 'Implante - Colocación Quirúrgica';
    }

    // Agregar superficie a la descripción si corresponde
    let detailedDesc = `${procDesc} (Diente ${selectedTooth})`;
    const current = teethStates[selectedTooth];
    if (current && (activeTool === 'Caries' || activeTool === 'Fracture' || activeTool === 'Crown')) {
      const surfaceNames: Record<string, string> = {
        top: 'Vestibular',
        bottom: 'Lingual/Palatino',
        left: 'Mesial/Distal Izq.',
        right: 'Distal/Mesial Der.',
        center: 'Oclusal/Incisal'
      };
      const activeSurfaces = Object.entries(current.surfaces || {})
        .filter(([_, cond]) => cond === activeTool.toLowerCase())
        .map(([surf, _]) => surfaceNames[surf] || surf);

      if (activeSurfaces.length > 0) {
        detailedDesc = `${procDesc} - Superficie ${activeSurfaces.join('/')} (Diente ${selectedTooth})`;
      }
    }

    const newItem: BudgetItem = {
      code: procCode,
      description: detailedDesc,
      tooth: String(selectedTooth),
      unitPrice: procPrice,
      total: procPrice
    };

    onAddTreatmentItem(newItem);

    const newInt = {
      id: String(Date.now()),
      title: `Diente ${selectedTooth} - ${procDesc}`,
      desc: `Hoy • Dr. Pérez`,
      type: 'healthy' as const
    };

    setCustomInterventions([newInt, ...customInterventions]);
    setObservationNotes('');
    if (showToast) {
      showToast(`¡Tratamiento "${procDesc} (Diente ${selectedTooth})" añadido correctamente al presupuesto!`, 'success');
    } else {
      alert(`¡Tratamiento "${procDesc} (Diente ${selectedTooth})" añadido correctamente!`);
    }
  };

  // Renderizar la pieza dental de 5 superficies
  const renderToothIcon = (toothId: number) => {
    const isSelected = selectedTooth === toothId;
    const stats = teethStates[toothId];
    const isLower = isLowerTooth(toothId);
    
    const hasMissing = stats?.hasMissing;
    const hasImplant = stats?.hasImplant;
    const hasCrown = stats?.hasCrown;

    const getSurfaceClass = (surface: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
      if (hasMissing) {
        return 'fill-slate-100 dark:fill-slate-800/40 stroke-slate-350 dark:stroke-slate-700 opacity-40';
      }
      if (hasImplant) {
        return 'fill-indigo-500/20 dark:fill-indigo-950/20 stroke-indigo-400 dark:stroke-indigo-600';
      }
      if (hasCrown) {
        return 'fill-blue-500/20 dark:fill-blue-500/10 stroke-blue-500 dark:stroke-blue-400';
      }

      const cond = stats?.surfaces?.[surface];
      if (cond === 'caries') {
        return 'fill-red-500 dark:fill-red-600 stroke-red-650 dark:stroke-red-500';
      }
      if (cond === 'fracture') {
        return 'fill-amber-500 dark:fill-amber-600 stroke-amber-600 dark:stroke-amber-400';
      }
      if (cond === 'crown') {
        return 'fill-blue-500 dark:fill-blue-600 stroke-blue-600 dark:stroke-blue-400';
      }

      // Fallback retrocompatible
      if (stats?.hasCaries && surface === 'center') {
        return 'fill-red-500 dark:fill-red-600 stroke-red-650 dark:stroke-red-500';
      }
      if (stats?.hasFracture && surface === 'center') {
        return 'fill-amber-500 dark:fill-amber-600 stroke-amber-600 dark:stroke-amber-400';
      }

      return 'fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-650 hover:fill-slate-50 dark:hover:fill-slate-800';
    };

    return (
      <div 
        onClick={() => selectTooth(toothId)}
        key={toothId}
        className="flex flex-col items-center group relative cursor-pointer"
        title={`Diente FDI: ${toothId} - ${getToothName(toothId)}`}
      >
        {/* Número arriba si es superior */}
        {!isLower && (
          <span className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 mb-1.5 group-hover:text-slate-700 dark:group-hover:text-slate-200">
            {toothId}
          </span>
        )}
        
        {/* Contenedor interactivo */}
        <div className={`p-1.5 rounded-full transition-all duration-100 ${
          isSelected 
            ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
            : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
        }`}>
          <svg 
            width="38" 
            height="38" 
            viewBox="0 0 40 40" 
            className="transform transition-transform group-hover:scale-105 duration-100 select-none relative"
          >
            {/* Top Surface */}
            <path 
              d="M 15 15 L 8.7 8.7 A 16 16 0 0 1 31.3 8.7 L 25 15 A 7 7 0 0 0 15 15 Z" 
              className={`transition-colors duration-100 cursor-pointer ${getSurfaceClass('top')}`}
              onClick={(e) => {
                e.stopPropagation();
                applyDiagnosticToSurface(toothId, 'top');
              }}
            />
            {/* Right Surface */}
            <path 
              d="M 25 15 L 31.3 8.7 A 16 16 0 0 1 31.3 31.3 L 25 25 A 7 7 0 0 0 25 15 Z" 
              className={`transition-colors duration-100 cursor-pointer ${getSurfaceClass('right')}`}
              onClick={(e) => {
                e.stopPropagation();
                applyDiagnosticToSurface(toothId, 'right');
              }}
            />
            {/* Bottom Surface */}
            <path 
              d="M 25 25 L 31.3 31.3 A 16 16 0 0 1 8.7 31.3 L 15 25 A 7 7 0 0 0 25 25 Z" 
              className={`transition-colors duration-100 cursor-pointer ${getSurfaceClass('bottom')}`}
              onClick={(e) => {
                e.stopPropagation();
                applyDiagnosticToSurface(toothId, 'bottom');
              }}
            />
            {/* Left Surface */}
            <path 
              d="M 15 25 L 8.7 31.3 A 16 16 0 0 1 8.7 8.7 L 15 15 A 7 7 0 0 0 15 25 Z" 
              className={`transition-colors duration-100 cursor-pointer ${getSurfaceClass('left')}`}
              onClick={(e) => {
                e.stopPropagation();
                applyDiagnosticToSurface(toothId, 'left');
              }}
            />
            {/* Center Surface */}
            <circle 
              cx="20" 
              cy="20" 
              r="7" 
              className={`transition-colors duration-100 cursor-pointer ${getSurfaceClass('center')}`}
              onClick={(e) => {
                e.stopPropagation();
                applyDiagnosticToSurface(toothId, 'center');
              }}
            />

            {/* Si está ausente: Cruz Roja */}
            {hasMissing && (
              <>
                <line x1="5" y1="5" x2="35" y2="35" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="35" y1="5" x2="5" y2="35" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Si tiene implante: Perno metálico */}
            {hasImplant && (
              <g transform="translate(14, 11) scale(0.65)" stroke="#4f46e5" strokeWidth="2" fill="none" strokeLinecap="round">
                <line x1="9" y1="2" x2="9" y2="24" strokeWidth="3" />
                <line x1="5" y1="6" x2="13" y2="6" />
                <line x1="6" y1="11" x2="12" y2="11" />
                <line x1="7" y1="16" x2="11" y2="16" />
                <line x1="8" y1="21" x2="10" y2="21" />
              </g>
            )}
          </svg>
        </div>

        {/* Número abajo si es inferior */}
        {isLower && (
          <span className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 mt-1.5 group-hover:text-slate-700 dark:group-hover:text-slate-200">
            {toothId}
          </span>
        )}
      </div>
    );
  };

  // Cuadrantes de adulto e infantil bajo la norma FDI
  const adultUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const childUpperRight = [55, 54, 53, 52, 51];
  const childLowerRight = [85, 84, 83, 82, 81];
  const adultLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  const adultUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const childUpperLeft = [61, 62, 63, 64, 65];
  const childLowerLeft = [71, 72, 73, 74, 75];
  const adultLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div id="odontograma-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Barra de Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
          <span>Pacientes</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="hover:text-blue-600 transition-colors cursor-pointer">{activePatient.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 dark:text-white font-bold">Odontograma</span>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 font-sans font-bold text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 transform active:scale-98 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            Imprimir Ficha
          </button>
          
          <button 
            onClick={async () => {
              try {
                await saveOdontogram(activePatient.id, {
                  teeth: teethStates,
                  interventions: customInterventions
                });
                if (showToast) {
                  showToast('¡Historial del odontograma sincronizado con éxito!', 'success');
                } else {
                  alert('¡Historial del odontograma sincronizado con éxito!');
                }
              } catch (err: any) {
                if (showToast) {
                  showToast(`Error al guardar cambios: ${err.message}`, 'error');
                } else {
                  alert(`Error al guardar cambios: ${err.message}`);
                }
              }
            }}
            className="px-4 py-2 font-sans font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg flex items-center gap-2 transform active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tarjeta del Paciente */}
      <div className="bg-white dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
        {activePatient.avatar ? (
          <img 
            alt={activePatient.name} 
            src={activePatient.avatar} 
            className="w-18 h-18 rounded-full border border-slate-100 dark:border-slate-800 object-cover shadow-xs" 
          />
        ) : (
          <div className="w-18 h-18 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xl shadow-inner uppercase shrink-0">
            {activePatient.initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {activePatient.name}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1.5 text-xs text-[#444748] dark:text-slate-400 font-sans">
            <span className="flex items-center gap-1">
              <Cake className="w-3.5 h-3.5 text-slate-400" />
              Nacimiento: {activePatient.dob} ({activePatient.age} años)
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              ID Ficha: {activePatient.id}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Teléfono: {activePatient.phone}
            </span>
          </div>
        </div>

        {/* Alergias */}
        <div className="flex flex-wrap gap-1.5">
          {activePatient.allergies && (
            <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]/80 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-[#ba1a1a]" />
              Alergias: {activePatient.allergies}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300">
            {activePatient.riskLevel}
          </span>
        </div>
      </div>

      {/* Grid del Odontograma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Panel del mapa dental (Izquierda) */}
        <div className="bg-white dark:bg-slate-900 lg:col-span-8 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 font-sans">
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">Odontograma Clínico (FDI)</h3>
            <p className="text-2xs text-[#444748] dark:text-slate-450 mt-0.5">
              Haz clic en cualquier superficie para aplicar el diagnóstico activo de la derecha. Selecciona la pieza dental completa para procedimientos generales (implantes, coronas o extracciones).
            </p>
          </div>

          {/* Gráfico dental interactivo */}
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 p-5 min-h-[360px] flex flex-col justify-center overflow-x-auto">
            
            <div className="flex justify-center items-center flex-nowrap shrink-0 px-2 gap-4">
              {/* Cuadrantes Derechos (Lado Izquierdo del Diagrama) */}
              <div className="grid grid-cols-8 gap-x-2 gap-y-6 text-center select-none">
                {/* Fila 1: Adulto Superior Derecho */}
                {adultUpperRight.map(t => renderToothIcon(t))}
                
                {/* Fila 2: Infantil Superior Derecho (3 vacíos, 5 dientes) */}
                <div className="col-span-3" />
                {childUpperRight.map(t => renderToothIcon(t))}
                
                {/* Fila 3: Infantil Inferior Derecho (3 vacíos, 5 dientes) */}
                <div className="col-span-3" />
                {childLowerRight.map(t => renderToothIcon(t))}
                
                {/* Fila 4: Adulto Inferior Derecho */}
                {adultLowerRight.map(t => renderToothIcon(t))}
              </div>

              {/* Línea Media Separadora */}
              <div className="w-0.5 bg-slate-200 dark:bg-slate-850 self-stretch my-2 relative flex items-center justify-center">
                <div className="absolute bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full select-none shadow-xs border border-blue-250 dark:border-blue-800">
                  L.M.
                </div>
              </div>

              {/* Cuadrantes Izquierdos (Lado Derecho del Diagrama) */}
              <div className="grid grid-cols-8 gap-x-2 gap-y-6 text-center select-none">
                {/* Fila 1: Adulto Superior Izquierdo */}
                {adultUpperLeft.map(t => renderToothIcon(t))}
                
                {/* Fila 2: Infantil Superior Izquierdo (5 dientes, 3 vacíos) */}
                {childUpperLeft.map(t => renderToothIcon(t))}
                <div className="col-span-3" />
                
                {/* Fila 3: Infantil Inferior Izquierdo (5 dientes, 3 vacíos) */}
                {childLowerLeft.map(t => renderToothIcon(t))}
                <div className="col-span-3" />
                
                {/* Fila 4: Adulto Inferior Izquierdo */}
                {adultLowerLeft.map(t => renderToothIcon(t))}
              </div>
            </div>

          </div>

          {/* Guía de Colores / Leyenda */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-slate-350 dark:border-slate-600 bg-white dark:bg-slate-900 block"></span>
              <span>Saludable / Intacto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-red-500 bg-red-500 block"></span>
              <span>Caries / Infiltración</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-amber-500 bg-amber-500 block"></span>
              <span>Fractura / Daño</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-blue-500 bg-blue-500/20 block"></span>
              <span>Corona / Prótesis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-indigo-500 bg-indigo-500/20 block"></span>
              <span>Implante Integrado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-red-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[9px] text-red-500">X</span>
              <span>Pieza Ausente</span>
            </div>
          </div>

        </div>

        {/* Panel lateral de diagnósticos (Derecha) */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* Herramientas de Diagnóstico */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs font-sans">
            <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white mb-4">Herramientas Diagnósticas</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {/* Acción Caries */}
              <button 
                onClick={() => applyDiagnosticTool('Caries')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Caries' 
                    ? 'border-red-500 text-red-650 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Flame className={`w-5 h-5 ${activeTool === 'Caries' ? 'text-red-500' : 'text-slate-400'}`} />
                <span>Caries</span>
              </button>

              {/* Acción Fractura */}
              <button 
                onClick={() => applyDiagnosticTool('Fracture')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Fracture' 
                    ? 'border-amber-500 text-amber-650 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${activeTool === 'Fracture' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Fractura</span>
              </button>

              {/* Acción Corona */}
              <button 
                onClick={() => applyDiagnosticTool('Crown')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Crown' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Crown className={`w-5 h-5 ${activeTool === 'Crown' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Corona</span>
              </button>

              {/* Acción Implante */}
              <button 
                onClick={() => applyDiagnosticTool('Implant')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Implant' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Hammer className={`w-5 h-5 ${activeTool === 'Implant' ? 'text-indigo-650' : 'text-slate-400'}`} />
                <span>Implante</span>
              </button>

              {/* Acción Extracción */}
              <button 
                onClick={() => applyDiagnosticTool('Extraction')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer col-span-2 ${
                  activeTool === 'Extraction' 
                    ? 'border-slate-650 text-slate-850 dark:text-slate-200 bg-slate-100 dark:bg-slate-850' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Award className={`w-5 h-5 ${activeTool === 'Extraction' ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`} />
                <span>Ausente / Extracción</span>
              </button>
            </div>
          </div>

          {/* Formulario del Diente Seleccionado */}
          {selectedTooth ? (
            <div id="selected-tooth-form" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col font-sans">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase leading-tight">Pieza FDI {selectedTooth}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">{getToothName(selectedTooth)}</span>
                </div>
                <span className="bg-blue-600 text-white border border-blue-700 rounded text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">Seleccionado</span>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 leading-none">Diagnósticos en Pieza</label>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium min-h-[36px] flex items-center border border-slate-200 dark:border-slate-800">
                    {selectedFinding}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 leading-none">Notas de Observación</label>
                  <textarea 
                    value={observationNotes}
                    onChange={(e) => setObservationNotes(e.target.value)}
                    className="w-full h-20 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-lg p-2.5 outline-none resize-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Escribe notas clínicas específicas de la pieza..."
                  />
                </div>
                
                {/* Botón Añadir a Plan */}
                <button 
                  onClick={triggerAddToPlan}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transform active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Añadir al Presupuesto de Tratamiento
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
              Ningún diente seleccionado. Haz clic en cualquier diente del odontograma para auditar sus detalles clínicos.
            </div>
          )}

          {/* Historial de Intervenciones Recientes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs font-sans">
            <h4 className="text-[10px] font-sans font-bold tracking-wider text-[#444748] dark:text-slate-400 uppercase mb-3">Historial Local Reciente</h4>
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {customInterventions.length > 0 ? (
                customInterventions.map((int) => (
                  <div key={int.id} className="flex gap-3 items-start text-xs border-b border-slate-50 dark:border-slate-850 pb-2 last:border-b-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5"></span>
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-white">{int.title}</h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{int.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-450 py-4 text-2xs">Sin intervenciones registradas hoy.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
