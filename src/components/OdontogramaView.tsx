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
  Hammer
} from 'lucide-react';
import { Patient, ToothState, BudgetItem } from '../types';
import { getOdontogram, saveOdontogram } from '../api';

interface OdontogramaViewProps {
  activePatient: Patient;
  onAddTreatmentItem: (item: BudgetItem) => void;
  searchQuery: string;
}

export default function OdontogramaView({
  activePatient,
  onAddTreatmentItem,
  searchQuery
}: OdontogramaViewProps) {
  const [isPediatric, setIsPediatric] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(18); // Diente 18 seleccionado por defecto
  const [activeTool, setActiveTool] = useState<'Caries' | 'Extraction' | 'Crown' | 'Implant'>('Crown');
  const [selectedFinding, setSelectedFinding] = useState('Caries Profunda - Distal');
  const [observationNotes, setObservationNotes] = useState('');
  const [customInterventions, setCustomInterventions] = useState<any[]>([]);

  // Mapeo inicial de condiciones dentales para el paciente activo
  const [teethStates, setTeethStates] = useState<Record<number, ToothState>>({});

  useEffect(() => {
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
  }, [activePatient.id]);

  // Manejar selección de dientes
  const selectTooth = (id: number) => {
    setSelectedTooth(id);
    
    // Autocompletar hallazgos según la ficha dental
    const teethCondition = teethStates[id];
    if (teethCondition) {
      if (teethCondition.hasCaries) setSelectedFinding('Caries Profunda - Distal');
      else if (teethCondition.hasFracture) setSelectedFinding('Fractura / Filtración de Amalgama');
      else if (teethCondition.hasCrown) setSelectedFinding('Control de Corona Requerido');
      else if (teethCondition.hasImplant) setSelectedFinding('Control de Implante Requerido');
    } else {
      setSelectedFinding('Seleccionar hallazgo...');
    }
  };

  // Aplicar herramienta diagnóstica
  const applyDiagnosticTool = (tool: 'Caries' | 'Extraction' | 'Crown' | 'Implant') => {
    setActiveTool(tool);
    if (!selectedTooth) return;

    let updatedTeeth = { ...teethStates };
    let current = updatedTeeth[selectedTooth] || { 
      id: selectedTooth, isPediatric, hasCaries: false, hasFracture: false, hasMissing: false, hasCrown: false, hasImplant: false 
    };

    // Alternar condiciones dentales
    if (tool === 'Caries') {
      current.hasCaries = !current.hasCaries;
      setSelectedFinding(current.hasCaries ? 'Caries Profunda - Distal' : 'Saludable');
    } else if (tool === 'Extraction') {
      current.hasMissing = !current.hasMissing;
      setSelectedFinding(current.hasMissing ? 'Diente Ausente' : 'Saludable');
    } else if (tool === 'Crown') {
      current.hasCrown = !current.hasCrown;
      setSelectedFinding(current.hasCrown ? 'Corona de Metal Porcelana' : 'Saludable');
    } else if (tool === 'Implant') {
      current.hasImplant = !current.hasImplant;
      setSelectedFinding(current.hasImplant ? 'Implante Integrado' : 'Saludable');
    }

    updatedTeeth[selectedTooth] = current;
    setTeethStates(updatedTeeth);
  };

  // Enviar ítem de tratamiento al plan presupuestario
  const triggerAddToPlan = () => {
    if (!selectedTooth) return;

    let procCode = 'D2740';
    let procPrice = 850.0;
    let procDesc = 'Corona - Porcelana / Sustrato Cerámico';

    if (activeTool === 'Caries') {
      procCode = 'D2391';
      procPrice = 180.0;
      procDesc = 'Resina Compuesta - 1 Superficie';
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

    const newItem: BudgetItem = {
      code: procCode,
      description: `${procDesc} (Diente ${selectedTooth})`,
      tooth: String(selectedTooth),
      unitPrice: procPrice,
      total: procPrice
    };

    // Callback para agregar ítem al estado de presupuestos del componente padre
    onAddTreatmentItem(newItem);

    // Registrar en el mini-log clínico local
    const newInt = {
      id: String(Date.now()),
      title: `Diente ${selectedTooth} - ${procDesc}`,
      desc: `Hoy • Dr. Administrador`,
      type: 'healthy' as const
    };

    setCustomInterventions([newInt, ...customInterventions]);
    setObservationNotes('');
    alert(`¡Tratamiento "${procDesc} (Diente ${selectedTooth})" añadido correctamente al presupuesto de ${activePatient.name}!`);
  };

  // Renderizar ruta geométrica del diente SVG
  const renderToothIcon = (toothId: number, isLower = false) => {
    const isSelected = selectedTooth === toothId;
    const stats = teethStates[toothId];
    
    // Determinar la clase de color según el estado del diente
    let pathClass = 'fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600 transition-all cursor-pointer';
    if (stats?.hasCaries || stats?.hasFracture) {
      pathClass = 'fill-red-100 dark:fill-red-950/40 stroke-red-650 dark:stroke-red-500 cursor-pointer';
    } else if (stats?.hasCrown || stats?.hasImplant) {
      pathClass = 'fill-blue-50 dark:fill-blue-950/40 stroke-blue-500 dark:stroke-blue-400 cursor-pointer';
    }

    if (isSelected) {
      pathClass = 'fill-blue-600 dark:fill-blue-500 stroke-blue-800 dark:stroke-slate-950 cursor-pointer';
    }

    return (
      <div 
        onClick={() => selectTooth(toothId)}
        key={toothId}
        className="flex flex-col items-center group relative cursor-pointer"
        title={`Diente ID: ${toothId}`}
      >
        {!isLower && (
          <span className="text-[9px] font-sans font-bold text-slate-400 mb-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-200">
            {toothId}
          </span>
        )}
        
        <svg 
          width="26" 
          height="34" 
          viewBox="0 0 30 40" 
          className={`transform transition-transform group-hover:scale-105 duration-100 ${isLower ? 'rotate-180' : ''}`}
        >
          <path 
            className={pathClass}
            d="M5,10 C5,3 25,3 25,10 L21,34 C16,39 10,39 9,34 Z" 
          />
        </svg>

        {isLower && (
          <span className="text-[9px] font-sans font-bold text-slate-400 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-200">
            {toothId}
          </span>
        )}
      </div>
    );
  };

  const archTeeth = {
    upperRight: [1, 2, 3, 4, 5, 6, 7, 8],
    upperLeft: [9, 10, 11, 12, 13, 14, 15, 16],
    lowerLeft: [17, 18, 19, 20, 21, 22, 23, 24],
    lowerRight: [25, 26, 27, 28, 29, 30, 31, 32]
  };

  return (
    <div id="odontograma-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Pan de cada día / Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
          <span>Pacientes</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="hover:text-blue-600 transition-colors cursor-pointer">{activePatient.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 dark:text-white font-bold">Odontograma</span>
        </div>

        {/* Acciones */}
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
                alert('¡Historial del odontograma sincronizado con éxito en el servidor de la clínica!');
              } catch (err: any) {
                alert(`Error al guardar cambios: ${err.message}`);
              }
            }}
            className="px-4 py-2 font-sans font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg flex items-center gap-2 transform active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Ficha rápida del Paciente */}
      <div className="bg-white dark:bg-slate-900 border border-[#c4c7c8]/40 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
        {activePatient.avatar ? (
          <img 
            alt={activePatient.name} 
            src={activePatient.avatar} 
            className="w-18 h-18 rounded-full border border-slate-100 object-cover shadow-xs" 
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

        {/* Alergias y nivel de riesgo */}
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
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 font-sans">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">Dentición de Adulto (Permanente)</h3>
              <p className="text-2xs text-[#444748] mt-0.5">Selecciona un diente en el mapa inferior y aplica una herramienta clínica en el panel derecho.</p>
            </div>
            
            {/* Toggles Adulto vs Infantil */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input 
                  type="radio" 
                  name="dentition_toggle" 
                  checked={!isPediatric}
                  onChange={() => setIsPediatric(false)}
                  className="text-blue-600 focus:ring-blue-600" 
                />
                Adulto
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 dark:text-slate-400">
                <input 
                  type="radio" 
                  name="dentition_toggle" 
                  checked={isPediatric}
                  onChange={() => setIsPediatric(true)}
                  className="text-blue-600 focus:ring-blue-600" 
                />
                Infantil
              </label>
            </div>
          </div>

          {/* Gráfico dental interactivo */}
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 p-4 min-h-[250px] flex flex-col justify-center gap-10 overflow-x-auto">
            {isPediatric ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span className="font-bold text-slate-500 mb-4 block uppercase font-mono tracking-wider">Mapa de Dentición Infantil (Temporal)</span>
                <p className="max-w-md mx-auto">Los mapas de dientes temporales (marcados del 51 al 85 bajo normas FDI o letras A-T según universal) se cargan según la edad del paciente.</p>
                <button                  
                  onClick={() => setIsPediatric(false)}
                  className="mt-4 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold text-2xs px-3 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Cambiar a Vista Permanente
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Arcada Superior (dientes 1-16) */}
                <div className="flex justify-center flex-nowrap shrink-0 gap-1 md:gap-3 px-2">
                  <div className="flex gap-1 md:gap-2">
                    {archTeeth.upperRight.map(t => renderToothIcon(t, false))}
                  </div>
                  
                  {/* Línea media */}
                  <div className="w-px bg-slate-250 dark:bg-slate-700 h-9 mx-1 self-center" title="Eje de la Línea Media"></div>
                  
                  <div className="flex gap-1 md:gap-2">
                    {archTeeth.upperLeft.map(t => renderToothIcon(t, false))}
                  </div>
                </div>

                {/* Arcada Inferior (dientes 17-32) */}
                <div className="flex justify-center flex-nowrap shrink-0 gap-1 md:gap-3 px-2">
                  <div className="flex gap-1 md:gap-2">
                    {archTeeth.lowerLeft.map(t => renderToothIcon(t, true))}
                  </div>
                  
                  {/* Línea media */}
                  <div className="w-px bg-slate-250 dark:bg-slate-700 h-9 mx-1 self-center" title="Eje de la Línea Media"></div>
                  
                  <div className="flex gap-1 md:gap-2">
                    {archTeeth.lowerRight.map(t => renderToothIcon(t, true))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guía de Colores / Leyenda */}
          <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-slate-350 dark:border-slate-600 bg-white dark:bg-slate-900 block"></span>
              <span>Saludable / Intacto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-blue-600 bg-blue-600 block"></span>
              <span>Diente Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-red-400 bg-red-100 dark:bg-red-950 block"></span>
              <span>Infiltración / Caries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-blue-400 bg-blue-100 dark:bg-blue-950/40 block"></span>
              <span>Corona / Prótesis</span>
            </div>
          </div>

        </div>

        {/* PANEL LATERAL DE DETALLES CLÍNICOS (Derecha) */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* Herramientas de Diagnóstico */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs font-sans">
            <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white mb-4">Diagnósticos</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Acción Caries */}
              <button 
                onClick={() => applyDiagnosticTool('Caries')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Caries' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/55 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Flame className={`w-5 h-5 ${activeTool === 'Caries' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>Caries</span>
              </button>

              {/* Acción Extracción */}
              <button 
                onClick={() => applyDiagnosticTool('Extraction')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Extraction' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/55 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Award className={`w-5 h-5 ${activeTool === 'Extraction' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>Extracción</span>
              </button>

              {/* Acción Corona */}
              <button 
                onClick={() => applyDiagnosticTool('Crown')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Crown' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/55 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Save className={`w-5 h-5 ${activeTool === 'Crown' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>Corona</span>
              </button>

              {/* Acción Implante */}
              <button 
                onClick={() => applyDiagnosticTool('Implant')}
                className={`py-3 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  activeTool === 'Implant' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/55 dark:text-slate-350 bg-white dark:bg-slate-900'
                }`}
              >
                <Hammer className={`w-5 h-5 ${activeTool === 'Implant' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>Implante</span>
              </button>
            </div>
          </div>

          {/* Formulario de Diagnóstico del Diente Seleccionado */}
          {selectedTooth ? (
            <div id="selected-tooth-form" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col font-sans">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase leading-tight">Diente {selectedTooth} (Tercer Molar Inferior Izquierdo)</h4>
                <span className="bg-white dark:bg-slate-700 border border-slate-350 dark:border-slate-600 rounded text-[9px] font-bold px-2 py-0.5 uppercase text-slate-700 dark:text-white">Seleccionado</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 leading-none">Hallazgo Clínico</label>
                  <select 
                    value={selectedFinding}
                    onChange={(e) => setSelectedFinding(e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Select">Seleccionar hallazgo...</option>
                    <option value="Caries Profunda - Distal">Caries Profunda - Distal</option>
                    <option value="Fracture">Fractura / Filtración de Amalgama</option>
                    <option value="Missing">Diente Ausente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 leading-none">Notas de Observación</label>
                  <textarea 
                    value={observationNotes}
                    onChange={(e) => setObservationNotes(e.target.value)}
                    className="w-full h-24 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-lg p-2.5 outline-none resize-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Escribe notas clínicas específicas aquí..."
                  />
                </div>
                
                {/* Botón Añadir a Plan */}
                <button 
                  onClick={triggerAddToPlan}
                  className="w-full bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#181c1e] dark:text-white font-sans font-semibold text-xs py-2.5 px-4 rounded-lg cursor-pointer transform active:scale-98 transition-all"
                >
                  Añadir al Plan de Tratamiento
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
              Ningún diente seleccionado. Haz clic en cualquier diente del odontograma para auditar sus detalles clínicos.
            </div>
          )}

          {/* Historial de Intervenciones Recientes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs font-sans">
            <h4 className="text-[10px] font-sans font-bold tracking-wider text-[#444748] dark:text-slate-400 uppercase mb-3">Intervenciones Recientes</h4>
            <div className="space-y-4">
              {customInterventions.map((int) => (
                <div key={int.id} className="flex gap-3 items-start text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5"></span>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-white">{int.title}</h5>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{int.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
