import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Patient, MedicalHistory, ClinicalAttachment } from '../types';
import { getPatientAttachments } from '../api';

interface HistoriaClinicaPrintViewProps {
  patient: Patient;
  medicalHistory: MedicalHistory | null;
  onBack: () => void;
  onPrint?: () => void;
}

export default function HistoriaClinicaPrintView({
  patient,
  medicalHistory,
  onBack,
  onPrint
}: HistoriaClinicaPrintViewProps) {
  
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);

  useEffect(() => {
    if (patient.id) {
      getPatientAttachments(patient.id)
        .then(setAttachments)
        .catch(err => console.error("Error loading attachments for print view", err));
    }
  }, [patient.id]);

  const safe = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  };

  const parseOfficialSections = (value?: string) => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  };

  const official = parseOfficialSections(medicalHistory?.officialSections);

  const pd = official.patientData || {};
  const sh = official.systemicHealth || {};
  const fh = official.familyHistory || {};
  const ph = official.personalHistory || {};
  const sr = official.systemsReview || {};
  const pe = official.physicalExam || {};
  const ie = official.intrabucalExam || {};
  const ci = official.consentimiento || {};
  const dp = official.diagnosticoPlan || {};
  const en = official.evolucionNotes || {};

  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // List of pathologias for Section 3
  const patologiasList = [
    { id: 'infarto', label: 'Infarto y/o Angina' },
    { id: 'hipertension', label: 'Hipertensión Arterial' },
    { id: 'diabetes1', label: 'Diabetes Mellitus I' },
    { id: 'diabetes2', label: 'Diabetes Mellitus II' },
    { id: 'obesidad', label: 'Obesidad' },
    { id: 'hipertiroidismo', label: 'Hipertiroidismo' },
    { id: 'hipotiroidismo', label: 'Hipotiroidismo' },
    { id: 'alergias', label: 'Alergias' },
    { id: 'cancer', label: 'Cáncer' },
    { id: 'infectocontagiosas', label: 'Infectocontagiosas' },
    { id: 'crisis', label: 'Crisis Convulsivas' },
    { id: 'hemofilia', label: 'Hemofilia' },
    { id: 'adicciones', label: 'Adicciones' },
    { id: 'otra', label: 'Otra enfermedad' }
  ];

  const familiaresList = [
    { id: 'padre', label: 'Padre' },
    { id: 'madre', label: 'Madre' },
    { id: 'abueloPat', label: 'Ab. Pat' },
    { id: 'abuelaPat', label: 'Ab. Pat' },
    { id: 'abueloMat', label: 'Ab. Mat' },
    { id: 'abuelaMat', label: 'Ab. Mat' },
    { id: 'hijos', label: 'Hijos' },
    { id: 'hermanos', label: 'Hermanos' }
  ];

  // List of base diseases for Section 4
  const diseasesBase = [
    { id: 'diabetes', label: 'Diabetes Mellitus' },
    { id: 'hepatitis', label: 'Hepatitis' },
    { id: 'fa', label: 'F.A. Recurrente' },
    { id: 'vih', label: 'VIH' },
    { id: 'herpes', label: 'Herpes' },
    { id: 'tuberculosis', label: 'Tuberculosis' },
    { id: 'nefropatia', label: 'Nefropatía' },
    { id: 'gastropatia', label: 'Gastropatía' },
    { id: 'hipertension', label: 'Hipertensión' },
    { id: 'hipotension', label: 'Hipotensión' },
    { id: 'artritis', label: 'Artritis' },
    { id: 'anemia', label: 'Anemia' },
    { id: 'infarto', label: 'Infarto / Angina' },
    { id: 'asma', label: 'Asma' },
    { id: 'alergias', label: 'Alergias' },
    { id: 'otra', label: 'Otra enfermedad' }
  ];

  // Symptom labels for Section 5
  const symptomLabels: Record<string, string> = {
    ansiedad: 'Ansiedad',
    depresion: 'Depresión',
    cefalea: 'Cefalea',
    neuralgia: 'Neuralgia',
    temblor: 'Temblor',
    acufenos: 'Acúfenos',
    fosfenos: 'Fosfenos',
    taquicardia: 'Taquicardia',
    mareos: 'Mareos',
    dolorPrecordial: 'Dolor precordial',
    disnea: 'Disnea',
    astenia: 'Astenia',
    adinamia: 'Adinamia',
    edema: 'Edema',
    hematuria: 'Hematuria',
    respiracionBucal: 'Respiración bucal',
    anorexia: 'Anorexia',
    bulimia: 'Bulimia',
    xerostomia: 'Xerostomía',
    glosopirosis: 'Glosopirosis',
    glosodinea: 'Glosodinea',
    pirosis: 'Pirosis',
    nauseas: 'Náuseas',
    vomito: 'Vómito',
    hematemesis: 'Hematemesis',
    estreñimiento: 'Estreñimiento',
    diarrea: 'Diarrea',
    oliguria: 'Oliguria',
    poliuria: 'Poliuria',
    disuria: 'Disuria',
    polifagia: 'Polifagia',
    polidipsia: 'Polidipsia',
    perdidaPeso: 'Pérdida de peso',
    artralgia: 'Artralgia',
    artritis: 'Artritis',
    mialgia: 'Mialgia',
    calambres: 'Calambres',
    otros: 'Otros'
  };

  const activeSymptoms = Object.keys(sr.symptoms || {}).filter(k => sr.symptoms[k]?.presenta === true);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 font-sans text-slate-800 dark:text-slate-100">
      
      {/* CSS Styles Embedded to force print format */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Override Tailwind dark mode classes on print */
          .dark, html, body, div, table, tr, th, td, h1, h2, h3, h4, h5, p, span {
            background-color: transparent !important;
            color: #000000 !important;
            border-color: #cbd5e1 !important;
            box-shadow: none !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            padding-top: 2rem;
            padding-bottom: 2rem;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-border {
            border: 1px solid #94a3b8 !important;
          }
          .print-header-bg {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      ` }} />

      {/* Control buttons - HIDDEN ON PRINT */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Edición
        </button>
        <button
          onClick={handlePrintAction}
          className="px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Main Document Layout */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 border border-slate-205 dark:border-slate-800 shadow-sm rounded-3xl print:p-0 print:border-0 print:shadow-none print:rounded-none">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-450 print:text-black">DENTAL PRINTER</h1>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 print:text-black">Consultorio Odontológico Especializado</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-850 dark:text-white print:text-black">Historia Clínica</h2>
            <div className="text-3xs text-slate-500 dark:text-slate-400 mt-1 font-mono space-y-0.5 print:text-black">
              <div>Fecha: {safe(pd.fecha || (medicalHistory?.createdAt ? new Date(medicalHistory.createdAt).toISOString().split('T')[0] : ''))}</div>
              <div>Expediente: {safe(patient.id)}</div>
            </div>
          </div>
        </div>

        {/* Patient quick overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/20 p-4 border border-slate-205 dark:border-slate-800 rounded-2xl mb-8 print:bg-slate-50 print:border print:border-slate-300">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Paciente</span>
            <span className="text-2xs font-bold">{safe(patient.name)}</span>
          </div>
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Teléfono Principal</span>
            <span className="text-2xs font-bold">{safe(patient.phone)}</span>
          </div>
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</span>
            <span className="text-2xs font-bold">{safe(pd.correo)}</span>
          </div>
        </div>

        {/* 11 Sections Rendered in order */}

        {/* SECTION 1 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            1. Datos del Paciente & Signos Vitales
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nombre Completo</span>
              <span>{safe(pd.nombre || patient.name)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Sexo</span>
              <span>{safe(pd.sexo)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">F. Nacimiento</span>
              <span>{safe(pd.dob || patient.dob)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Edad</span>
              <span>{safe(pd.edad || patient.age)} años</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Lugar de Nacimiento</span>
              <span>{safe(pd.lugarNacimiento)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Domicilio</span>
              <span>{safe(pd.domicilio)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Teléfono</span>
              <span>{safe(pd.telefono || patient.phone)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Celular</span>
              <span>{safe(pd.celular)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</span>
              <span>{safe(pd.correo)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Estado Civil</span>
              <span>{safe(pd.estadoCivil)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Religión</span>
              <span>{safe(pd.religion)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Escolaridad</span>
              <span>{safe(pd.escolaridad)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Ocupación</span>
              <span>{safe(pd.ocupacion)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Derechohabiente</span>
              <span>{safe(pd.derechohabiente === 'si' ? 'Sí' : 'No')}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Institución</span>
              <span>{safe(pd.institucion)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Grupo Sanguíneo</span>
              <span>{safe(pd.grupoSanguineo)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 text-red-500 font-bold">Alergias</span>
              <span className="font-bold text-red-650 dark:text-red-400 print:text-black">{safe(pd.alergias || patient.allergies || medicalHistory?.allergies)}</span>
            </div>
          </div>
          
          <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Signos Vitales</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Peso (Kg)</span>
              <span>{safe(pd.peso)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Altura (m)</span>
              <span>{safe(pd.altura)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Temperatura</span>
              <span>{safe(pd.temperatura ? `${pd.temperatura} °C` : '')}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Pulso (lpm)</span>
              <span>{safe(pd.pulso)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">F. Cardiaca</span>
              <span>{safe(pd.fc)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">F. Respiratoria</span>
              <span>{safe(pd.fr)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Tensión Arterial</span>
              <span>{safe(pd.ta)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            2. Salud Sistémica & Medicamentos
          </h3>
          
          <div className="space-y-3">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Medicamentos que toma actualmente</h4>
            {sh.medications && sh.medications.length > 0 ? (
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Fármaco</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Frecuencia</th>
                    <th className="p-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {sh.medications.map((m: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{safe(m.farmaco)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(m.frecuencia)}</td>
                      <td className="p-2">{safe(m.motivo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-3xs text-slate-500 italic">No se registran medicamentos.</p>
            )}
          </div>

          <div className="space-y-3 pt-3">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Diagnósticos Sistémicos</h4>
            {sh.systemicDiseases && sh.systemicDiseases.length > 0 ? (
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Diagnóstico</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Tiempo de Evolución</th>
                    <th className="p-2">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sh.systemicDiseases.map((d: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{safe(d.diagnostico)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(d.tiempoEvolucion)}</td>
                      <td className="p-2">{safe(d.observaciones)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-3xs text-slate-500 italic">No se registran diagnósticos sistémicos.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Riesgo Sistémico</span>
              <span className="font-bold uppercase inline-block mt-1 px-2.5 py-1 text-[9px] rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 bg-slate-50">
                {safe(sh.systemicRisk).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Motivo de la Consulta</span>
              <span>{safe(sh.motivoConsulta)}</span>
            </div>
          </div>

          <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Datos del Informante</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nombre</span>
              <span>{safe(sh.informantName)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Parentesco</span>
              <span>{safe(sh.informantParentesco)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Domicilio</span>
              <span>{safe(sh.informantDomicilio)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Teléfono</span>
              <span>{safe(sh.informantTelefono)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            3. Antecedentes Familiares
          </h3>
          <p className="text-[10px] text-slate-400">Matriz de patologías hereditarias encontradas en familiares directos.</p>
          
          <div className="overflow-x-auto avoid-break">
            <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-800 text-[9px]">
              <thead>
                <tr className="bg-slate-55 dark:bg-slate-800/80 border-b border-slate-300 text-slate-500 font-bold uppercase text-[7px] print:bg-slate-100">
                  <th className="p-1 border-r border-slate-300">Patología / Familiar</th>
                  {familiaresList.map(fam => (
                    <th key={fam.id} className="p-1 border-r border-slate-300 text-center">{fam.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patologiasList.map(pat => {
                  const patMatrix = fh.matrix?.[pat.id] || {};
                  return (
                    <tr key={pat.id} className="border-b border-slate-300">
                      <td className="p-1 border-r border-slate-300 font-medium">{pat.label}</td>
                      {familiaresList.map(fam => {
                        const checked = patMatrix[fam.id] === true;
                        return (
                          <td key={fam.id} className="p-1 border-r border-slate-300 text-center font-bold text-slate-800 dark:text-slate-200">
                            {checked ? 'Sí' : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-3xs pt-3">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Detalles de Alergias</span>
              <p className="mt-0.5">{safe(fh.alergiasDetalle)}</p>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Detalles de Infectocontagiosas</span>
              <p className="mt-0.5">{safe(fh.infectocontagiosasDetalle)}</p>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Detalles de Adicciones</span>
              <p className="mt-0.5">{safe(fh.adiccionesDetalle)}</p>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Otras Enfermedades</span>
              <p className="mt-0.5">{safe(fh.otraEnfermedadDetalle)}</p>
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            4. Antecedentes Personales
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Vivienda</span>
              <p className="mt-0.5">{safe(ph.vivienda)}</p>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Hábitos Higiénicos</span>
              <p className="mt-0.5">{safe(ph.habitosHigienicos)}</p>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Hábitos Dietéticos</span>
              <p className="mt-0.5">{safe(ph.habitosDieteticos)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 mt-2">
            <div className="border border-slate-200 dark:border-slate-850 p-3 rounded-xl">
              <h4 className="font-bold text-[9px] uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-2">Gineco-Obstétricos (Mujeres)</h4>
              <div className="grid grid-cols-2 gap-3 text-3xs">
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Edad de Menarca</span>
                  <span>{safe(ph.menarca)} años</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Vida Sexual Activa</span>
                  <span>{safe(ph.vidaSexualActiva === 'si' ? 'Sí' : (ph.vidaSexualActiva === 'no' ? 'No' : '—'))}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nº Embarazos</span>
                  <span>{safe(ph.embarazos)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Embarazos a Término</span>
                  <span>{safe(ph.embarazosTermino)}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Edad de Menopausia</span>
                  <span>{safe(ph.menopausia)} años</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-850 p-3 rounded-xl">
              <h4 className="font-bold text-[9px] uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-2">Varones</h4>
              <div className="grid grid-cols-1 gap-3 text-3xs">
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Vida Sexual Activa</span>
                  <span>{safe(ph.varonVidaSexualActiva === 'si' ? 'Sí' : (ph.varonVidaSexualActiva === 'no' ? 'No' : '—'))}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Grupo y Tipo Sanguíneo</span>
                  <span>{safe(ph.varonGrupoSanguineo)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 avoid-break">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Historial de Patologías Personales</h4>
            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-1/3">Enfermedad</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Presentó</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Edad</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Control Médico</th>
                  <th className="p-2">Complicaciones</th>
                </tr>
              </thead>
              <tbody>
                {diseasesBase.map(d => {
                  const registered = (ph.pathologicalTable || []).find((item: any) => item.enfermedad === d.id);
                  const presento = registered ? registered.presento === true : false;
                  return (
                    <tr key={d.id} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{d.label}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold">
                        {presento ? 'Sí' : 'No'}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">
                        {presento ? safe(registered?.edad) : '—'}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center uppercase">
                        {presento ? safe(registered?.control) : '—'}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">
                        {presento ? safe(registered?.complicacion) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 pt-3 avoid-break">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Adicciones</h4>
            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800">Sustancia</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Activo</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Inactivo</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Edad Inicio</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800">Frecuencia</th>
                  <th className="p-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'tabaquismo', label: 'Tabaquismo' },
                  { key: 'alcoholismo', label: 'Alcoholismo' },
                  { key: 'adiccionOtra', label: 'Otra adicción' }
                ].map(item => {
                  const val = ph[item.key] || {};
                  return (
                    <tr key={item.key} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{item.label}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold">{val.activo ? 'Sí' : '—'}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold">{val.inactivo ? 'Sí' : '—'}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">{safe(val.edadInicio)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(val.frecuencia)}</td>
                      <td className="p-2">{safe(val.cantidad)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Anestesia y Traumatismos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-3xs">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">¿Ha recibido anestesia dental?</span>
              <span>{safe(ph.anestesiaDental === 'si' ? 'Sí' : (ph.anestesiaDental === 'no' ? 'No' : '—'))}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">¿Ha presentado algún problema?</span>
              <span>{safe(ph.anestesiaProblema === 'si' ? 'Sí' : (ph.anestesiaProblema === 'no' ? 'No' : '—'))}</span>
            </div>
            {ph.anestesiaProblema === 'si' && (
              <div className="col-span-2">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Especifique problemas de anestesia</span>
                <p className="mt-0.5">{safe(ph.anestesiaEspecifique)}</p>
              </div>
            )}
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">¿Ha sido transfundido?</span>
              <span>{safe(ph.transfundido === 'si' ? 'Sí' : (ph.transfundido === 'no' ? 'No' : '—'))}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">¿Ha sufrido traumatismos recientemente?</span>
              <span>{safe(ph.traumatismosRecientes === 'si' ? 'Sí' : (ph.traumatismosRecientes === 'no' ? 'No' : '—'))}</span>
            </div>
            {ph.traumatismosRecientes === 'si' && (
              <div className="col-span-2">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Especifique traumatismos</span>
                <p className="mt-0.5">{safe(ph.traumatismosEspecifique)}</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            5. Interrogatorio por Aparatos y Sistemas
          </h3>
          <p className="text-[10px] text-slate-400">Signos o síntomas reportados en la revisión corporal por aparatos y sistemas.</p>
          
          {activeSymptoms.length > 0 ? (
            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs avoid-break">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-1/3">Signo o Síntoma</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Presenta</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800">Frecuencia</th>
                  <th className="p-2">Tiempo de Evolución</th>
                </tr>
              </thead>
              <tbody>
                {activeSymptoms.map(key => {
                  const sObj = sr.symptoms[key] || {};
                  return (
                    <tr key={key} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{symptomLabels[key] || key}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-emerald-650">Sí</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(sObj.frecuencia)}</td>
                      <td className="p-2">{safe(sObj.tiempoEvolucion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-3xs text-slate-550 italic bg-slate-50 dark:bg-slate-900 border border-slate-200 p-3 rounded-xl">
              Interrogatorio por aparatos y sistemas sin hallazgos patológicos reportados.
            </p>
          )}
        </div>

        {/* SECTION 6 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            6. Exploración Física
          </h3>
          
          <div className="text-3xs space-y-3">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Actitud del Paciente</span>
              <p className="mt-0.5">{safe(pe.actitudPaciente)}</p>
            </div>
            
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Cara y Cuello</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Frente</span>
                <span>{safe(pe.caraCuello?.frente)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Cejas</span>
                <span>{safe(pe.caraCuello?.cejas)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Ojos</span>
                <span>{safe(pe.caraCuello?.ojos)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nariz</span>
                <span>{safe(pe.caraCuello?.nariz)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Labios</span>
                <span>{safe(pe.caraCuello?.labios)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Mejillas</span>
                <span>{safe(pe.caraCuello?.mejillas)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Mentón</span>
                <span>{safe(pe.caraCuello?.menton)}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Cuello</span>
                <span>{safe(pe.caraCuello?.cuello)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Exploración de la ATM</span>
              <p className="mt-0.5">{safe(pe.atmExploracion)}</p>
            </div>
            
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 pt-3 mt-4">Exploración Muscular (Dolor / Tensión)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-slate-200 dark:border-slate-850 p-3 rounded-xl avoid-break">
              {[
                { id: 'maseteros', label: 'Maseteros' },
                { id: 'temporales', label: 'Temporales' },
                { id: 'pterigoideoExt', label: 'Pterigoideo Externo' },
                { id: 'pterigoideoInt', label: 'Pterigoideo Interno' },
                { id: 'esternocleidomastoideo', label: 'Esternocleidomastoideo' },
                { id: 'trapecios', label: 'Trapecios' }
              ].map(m => {
                const dolorD = pe.musculos?.[`${m.id}D`] === true;
                const dolorI = pe.musculos?.[`${m.id}I`] === true;
                return (
                  <div key={m.id} className="p-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="font-bold block text-[10px] text-slate-700 dark:text-slate-300">{m.label}</span>
                    <div className="flex gap-4 mt-1 text-3xs">
                      <span>Derecho: <strong className={dolorD ? 'text-red-500' : 'text-slate-400'}>{dolorD ? 'Dolor' : '—'}</strong></span>
                      <span>Izquierdo: <strong className={dolorI ? 'text-red-500' : 'text-slate-400'}>{dolorI ? 'Dolor' : '—'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 7 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            7. Exploración Intrabucal & IHOS
          </h3>
          
          <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Tejidos Blandos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-3xs">
            {[
              { id: 'labios', label: 'Labios' },
              { id: 'mucosaYugal', label: 'Mucosa Yugal' },
              { id: 'frenillos', label: 'Frenillos' },
              { id: 'encia', label: 'Encía' },
              { id: 'paladar', label: 'Paladar' },
              { id: 'orofaringe', label: 'Orofaringe' },
              { id: 'istmoFauces', label: 'Istmo de las Fauces' },
              { id: 'uvula', label: 'Úvula' },
              { id: 'amigdalas', label: 'Amígdalas' },
              { id: 'lengua', label: 'Lengua' },
              { id: 'pisoBoca', label: 'Piso de Boca' }
            ].map(t => (
              <div key={t.id}>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{t.label}</span>
                <span>{safe(ie.tejidosBlandos?.[t.id])}</span>
              </div>
            ))}
          </div>

          <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Mediciones IHOS (Placa / Cálculo)</h4>
          <div className="space-y-4 avoid-break">
            {[
              { id: 'cita1', label: '1° Cita (Inicial)' },
              { id: 'mitadTx', label: 'Mitad de Tratamiento' },
              { id: 'ultimaCita', label: 'Última Cita (Conclusión)' }
            ].map(cita => {
              const cData = ie.ihos?.[cita.id] || {};
              return (
                <div key={cita.id} className="border border-slate-200 dark:border-slate-850 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                    <span className="font-bold text-3xs text-blue-900 dark:text-blue-450">{cita.label}</span>
                    <span className="text-3xs font-mono">Fecha: {safe(cData.fecha)}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 text-center text-3xs">
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 16</div>
                      <div>PDB: {safe(cData.d16_pdb)} / CAL: {safe(cData.d16_cal)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 11</div>
                      <div>PDB: {safe(cData.d11_pdb)} / CAL: {safe(cData.d11_cal)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 26</div>
                      <div>PDB: {safe(cData.d26_pdb)} / CAL: {safe(cData.d26_cal)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 46</div>
                      <div>PDB: {safe(cData.d46_pdb)} / CAL: {safe(cData.d46_cal)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 31</div>
                      <div>PDB: {safe(cData.d31_pdb)} / CAL: {safe(cData.d31_cal)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-[8px] uppercase tracking-wider text-slate-400">Pieza 36</div>
                      <div>PDB: {safe(cData.d36_pdb)} / CAL: {safe(cData.d36_cal)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-right text-3xs">
                    <span className="font-bold">Interpretación: </span>
                    <span className="font-bold uppercase text-blue-800 dark:text-blue-400">{safe(cData.interpretacion)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 8 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            8. Odontograma
          </h3>
          <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
            El odontograma se gestiona en su propia vista interactiva 2D dentro del expediente digital del paciente para registrar hallazgos y tratamientos específicos por pieza dental de forma gráfica.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 rounded-xl space-y-3 avoid-break">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[8px]">Resumen de Códigos Oficiales:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-3xs">
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-red-500 rounded-md shrink-0" /> Rojo: Caries</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-red-500 rounded-md shrink-0 flex items-center justify-center text-white font-bold text-[10px] leading-none">/</span> Rojo con diag: Exodoncia</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-blue-500 rounded-md shrink-0 flex items-center justify-center text-white font-bold text-[10px] leading-none">/</span> Azul con diag: Ausente</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-blue-500 rounded-md shrink-0" /> Azul: Obturado</div>
              <div className="flex items-center gap-2 sm:col-span-2"><span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-850 dark:text-white text-3xs tracking-tighter">I---I---I</span> Cálculo Dental</div>
            </div>
          </div>
          <div className="text-center py-4 text-3xs font-medium text-slate-400 italic">
            * Odontograma completo disponible en el expediente clínico digital.
          </div>
        </div>

        {/* SECTION 9 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            9. Consentimiento Informado
          </h3>
          
          <div className="text-3xs text-justify leading-relaxed space-y-3 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/20 avoid-break print:bg-white print:p-0 print:border-0">
            <p className="font-bold text-[9px] uppercase tracking-wider text-slate-850 dark:text-white print:text-black mb-2">Texto de Declaración Legal:</p>
            <p>
              Por la presente, autorizo a los cirujanos dentistas del consultorio a realizar los procedimientos odontológicos necesarios explicados previamente en detalle. Declaro haber informado verazmente sobre todos mis antecedentes de salud sistémicos, médicos y personales, así como de los medicamentos y alergias que presento.
            </p>
            <p>
              Entiendo los riesgos y posibles complicaciones generales y locales asociadas al tratamiento odontológico y la administración de anestesia dental local.
            </p>
            <div className="pt-2 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <span className="w-3.5 h-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 flex items-center justify-center rounded text-emerald-500 text-[10px]">
                {ci.acepto ? '✓' : ''}
              </span>
              <span>Enterado, conforme y acepto las condiciones descritas.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-3xs pt-3 avoid-break">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nombre del Paciente o Responsable</span>
              <span>{safe(ci.nombrePaciente || patient.name)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Fecha de Aceptación</span>
              <span>{safe(ci.fechaPaciente)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Nombre del Testigo</span>
              <span>{safe(ci.nombreTestigo)}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Fecha del Testigo</span>
              <span>{safe(ci.fechaTestigo)}</span>
            </div>
          </div>

          <div className="border-t border-slate-150 dark:border-slate-800 pt-3 mt-4 avoid-break">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-2">Conformidad por Conclusión de Tratamiento y Liquidación</h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-xl text-3xs leading-relaxed text-slate-500 print:bg-white print:border-0 print:p-0">
              <p>
                Manifiesto mi total conformidad con los tratamientos odontológicos recibidos a la fecha, dándolos por concluidos y liquidando en su totalidad el adeudo económico acordado.
              </p>
              <div className="pt-2 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <span className="w-3.5 h-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 flex items-center justify-center rounded text-emerald-500 text-[10px]">
                  {ci.concluidoConformidad ? '✓' : ''}
                </span>
                <span>Enterado y en plena conformidad.</span>
              </div>
            </div>
          </div>

          {/* Placeholders for legal signatures */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-3xs avoid-break">
            <div className="space-y-1 flex flex-col justify-end items-center h-28">
              {ci.patientSignatureDataUrl ? (
                <img src={ci.patientSignatureDataUrl} alt="Firma Paciente" className="max-h-16 object-contain" />
              ) : (
                <div className="h-16" />
              )}
              <div className="border-t border-slate-400 w-48 mx-auto mt-2" />
              <div className="font-bold text-slate-500">Firma del Paciente / Responsable</div>
              <div className="text-[8px] text-slate-400">Fecha: {safe(ci.fechaPaciente)}</div>
            </div>
            <div className="space-y-1 flex flex-col justify-end items-center h-28">
              {ci.witnessSignatureDataUrl ? (
                <img src={ci.witnessSignatureDataUrl} alt="Firma Testigo" className="max-h-16 object-contain" />
              ) : (
                <div className="h-16" />
              )}
              <div className="border-t border-slate-400 w-48 mx-auto mt-2" />
              <div className="font-bold text-slate-500">Firma del Testigo</div>
              <div className="text-[8px] text-slate-400">Fecha: {safe(ci.fechaTestigo)}</div>
            </div>
            {ci.concluidoConformidad && (
              <>
                <div className="space-y-1 pt-6 flex flex-col justify-end items-center h-34">
                  {ci.completionPatientSignatureDataUrl ? (
                    <img src={ci.completionPatientSignatureDataUrl} alt="Firma Conformidad Paciente" className="max-h-16 object-contain" />
                  ) : (
                    <div className="h-16" />
                  )}
                  <div className="border-t border-slate-400 w-48 mx-auto mt-2" />
                  <div className="font-bold text-slate-500">Firma de Conformidad por Conclusión de Tratamiento</div>
                  <div className="text-[8px] text-slate-400">Fecha: {safe(ci.conclusionFechaPaciente)}</div>
                </div>
                <div className="space-y-1 pt-6 flex flex-col justify-end items-center h-34">
                  {ci.completionWitnessSignatureDataUrl ? (
                    <img src={ci.completionWitnessSignatureDataUrl} alt="Firma Conformidad Testigo" className="max-h-16 object-contain" />
                  ) : (
                    <div className="h-16" />
                  )}
                  <div className="border-t border-slate-400 w-48 mx-auto mt-2" />
                  <div className="font-bold text-slate-500">Firma de Testigo de Conformidad</div>
                  <div className="text-[8px] text-slate-400">Fecha: {safe(ci.conclusionFechaTestigo)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 10 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            10. Diagnóstico & Plan de Tratamiento
          </h3>
          
          <div className="text-3xs space-y-2">
            <div>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Diagnóstico Integral</span>
              <p className="mt-0.5 whitespace-pre-line">{safe(dp.diagnosticoIntegral)}</p>
            </div>
            
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">Plan de Tratamiento</h4>
            {dp.planTxList && dp.planTxList.length > 0 ? (
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs avoid-break">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Procedimiento / Plan & Costo</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">TX Realizado</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-right">Costo ($)</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-right">A Cuenta ($)</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Fecha</th>
                    <th className="p-2">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {dp.planTxList.map((tx: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{safe(tx.planCosto)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(tx.txRealizado)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-right font-mono">{safe(tx.costo)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-right font-mono">{safe(tx.aCuenta)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{safe(tx.fecha)}</td>
                      <td className="p-2 font-bold text-center uppercase">{safe(tx.firma)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-3xs text-slate-500 italic">No se registra plan de tratamiento.</p>
            )}
          </div>
        </div>

        {/* SECTION 11 */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            11. Notas de Evolución
          </h3>
          
          <div className="space-y-4 avoid-break">
            {en.notes && en.notes.length > 0 ? (
              en.notes.map((n: any, idx: number) => (
                <div key={n.id || idx} className="border border-slate-200 dark:border-slate-850 p-3 rounded-2xl bg-slate-50/35 dark:bg-slate-900/10 space-y-1">
                  <div className="flex justify-between items-center text-3xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">
                    <span>{safe(n.titulo)}</span>
                    <span className="font-mono">{safe(n.fecha)}</span>
                  </div>
                  <p className="text-3xs text-slate-700 dark:text-slate-300">{safe(n.nota)}</p>
                  <div className="text-[8px] text-right font-bold uppercase text-slate-500">
                    Dr/Dra: {safe(n.doctor)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-3xs text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200">
                Sin notas de evolución registradas.
              </p>
            )}
          </div>
        </div>

        {/* SECCIÓN ADJUNTOS CLÍNICOS */}
        <div className="print-page space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-450 border-b border-slate-300 dark:border-slate-800 pb-1.5 print:text-black print:border-slate-400">
            Adjuntos Clínicos del Expediente
          </h3>
          
          <div className="space-y-4 avoid-break">
            {attachments && attachments.length > 0 ? (
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-3xs avoid-break">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px] print:bg-slate-100">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Nombre del Archivo</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Categoría</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">Fecha de Subida</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Descripción / Notas</th>
                    <th className="p-2">Subido Por</th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((att: ClinicalAttachment, idx: number) => {
                    const uploadDate = new Date(att.createdAt).toLocaleDateString([], {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    return (
                      <tr key={att.id || idx} className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-medium">{safe(att.originalName)}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold text-[#181c1e] dark:text-white">{safe(att.category)}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-mono">{safe(uploadDate)}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">{safe(att.description)}</td>
                        <td className="p-2 font-bold uppercase">{safe(att.uploadedBy)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-3xs text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200">
                Este paciente aún no tiene adjuntos clínicos.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
