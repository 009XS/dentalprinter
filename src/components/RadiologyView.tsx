import { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Eye, 
  AlertOctagon
} from 'lucide-react';

export default function RadiologyView() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [scanFilter, setScanFilter] = useState<'panoramic' | 'bitewing'>('panoramic');

  const triggerScanAnalysis = () => {
    setAnalyzing(true);
    setAnalysisCompleted(false);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisCompleted(true);
    }, 2000);
  };

  return (
    <div id="radiology-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex justify-between items-start border-b border-sky-100/10 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Radiología</h2>
          <p className="font-sans text-sm md:text-base text-[#444748] dark:text-slate-400 mt-1">
            Escaneos panorámicos clínicos, tomografía computarizada 3D y reportes diagnósticos por IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Visor de Radiología */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl overflow-hidden shadow-xl border border-slate-900 flex flex-col min-h-[350px] relative justify-between">
          
          <div className="p-4 bg-slate-900/60 flex justify-between items-center z-15">
            <span className="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Transmisión RAD en Vivo: DICOM_3.0
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setScanFilter('panoramic')}
                className={`px-3 py-1 text-[10px] font-mono rounded font-bold uppercase cursor-pointer transition-colors ${
                  scanFilter === 'panoramic' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                Panorámica
              </button>
              <button 
                onClick={() => setScanFilter('bitewing')}
                className={`px-3 py-1 text-[10px] font-mono rounded font-bold uppercase cursor-pointer transition-colors ${
                  scanFilter === 'bitewing' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aleta de Mordida
              </button>
            </div>
          </div>

          {/* Gráfico vectorial simulando la dentadura */}
          <div className="flex-grow flex items-center justify-center p-6 relative">
            <div className="absolute inset-x-0 h-0.5 bg-blue-500/20 top-1/4 animate-scan pointer-events-none"></div>
            
            <div className="relative w-80 h-44 border border-slate-800/80 rounded-full flex items-center justify-center bg-slate-905 opacity-80 mt-2 font-mono">
              <div className="absolute inset-4 border border-dashed border-slate-700/60 rounded-full"></div>
              
              <div className="grid grid-cols-8 gap-1 p-2 w-[70%]">
                <div className={`h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400 ${analyzing ? 'animate-pulse' : ''}`}>1</div>
                <div className="h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400">2</div>
                <div className={`h-8 border-2 border-amber-500/80 rounded bg-amber-900/10 flex items-center justify-center font-bold text-[8px] text-amber-400 ${analysisCompleted ? 'animate-bounce' : ''}`}>3</div>
                <div className="h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400">4</div>
                <div className="h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400">5</div>
                <div className={`h-8 border-2 border-red-500/80 rounded bg-red-900/10 flex items-center justify-center font-bold text-[8px] text-red-400 ${analysisCompleted ? 'animate-ping-slow' : ''}`}>14</div>
                <div className="h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400">15</div>
                <div className="h-8 border border-slate-700 rounded bg-slate-800/40 flex items-center justify-center font-bold text-[8px] text-slate-400">16</div>
              </div>

              {analysisCompleted && (
                <>
                  <div className="absolute top-[26%] right-[32%] px-2 py-0.5 rounded border border-red-500/50 bg-red-950/60 text-red-400 text-[8px] uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Caries Intersticial
                  </div>
                  <div className="absolute bottom-[24%] left-[28%] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-950/60 text-amber-400 text-[8px] uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Deterioro de Corona
                  </div>
                </>
              )}
            </div>

            {analyzing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 font-mono">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-[10px] text-blue-400 tracking-widest uppercase">Procesando cuadrantes del maxilar clínico...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900/80 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Resolución: DICOM 2400x1800px</span>
            <span>Foco: Segmento Maxilar Superior</span>
          </div>

        </div>

        {/* Panel lateral del Asesor de IA */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs font-sans">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400/20" />
              <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white">Asesor de Radiología por IA</h4>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Active nuestro modelo local seguro de IA (basado en los protocolos de razonamiento clínico de Google Gemini) para escanear las imágenes de radiología e identificar márgenes, lesiones, pérdida de densidad ósea e infiltraciones radiculares.
            </p>

            <button
              onClick={triggerScanAnalysis}
              disabled={analyzing}
              className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-sans font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg cursor-pointer transform active:scale-98 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Analizar Escaneo Panorámico
                </>
              )}
            </button>
          </div>

          {/* Reporte de IA */}
          {analysisCompleted && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs font-sans animate-in slide-in-from-bottom-2 duration-150">
              <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Análisis de IA Completado</span>
              
              <h4 className="font-bold text-xs text-slate-850 dark:text-white mt-4 border-b border-slate-100 dark:border-slate-800 pb-2">Resumen del Reporte Diagnóstico</h4>
              <div className="space-y-3 mt-3 text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p><strong>Diente 14:</strong> Lesión de caries moderada detectada en la cara distal del esmalte. Se recomienda resina compuesta antes de que se degrade la integridad estructural.</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p><strong>Diente 3:</strong> Patrón de sombra incipiente cerca del margen de la corona. Monitorear de cerca en la próxima consulta de higiene.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
