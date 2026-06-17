import React, { useState, useMemo, useEffect } from 'react';
import { getMedicalHistory, updateMedicalHistory, getPatientAttachments, uploadPatientAttachment, deleteAttachment, getToken } from '../api';
import { 
  Folder, 
  FolderOpen, 
  Search, 
  ArrowUpDown, 
  Filter, 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  Phone, 
  ShieldAlert, 
  Droplet, 
  ArrowLeft, 
  AlertCircle, 
  Check, 
  XCircle,
  FileHeart,
  ChevronRight,
  User,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  Archive,
  X,
  Trash2,
  Save,
  CheckCircle2,
  Printer,
  Paperclip,
  Upload,
  FileUp,
  Eye,
  Download,
  Loader2,
  Star,
  Share2,
  Mail,
  Microscope,
  ReceiptText,
  Contact
} from 'lucide-react';
import type { Patient, Appointment, Budget, BudgetItem, MedicalHistory, ClinicalAttachment } from '../types';
import HistoriaClinicaPrintView from './HistoriaClinicaPrintView';
import SignaturePad from './SignaturePad';

interface ArchiveroViewProps {
  patients: Patient[];
  appointments: Appointment[];
  budgets: Budget[];
  liveItems?: BudgetItem[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  setCurrentTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenPatientModal?: () => void;
}

export default function ArchiveroView({
  patients,
  appointments,
  budgets,
  liveItems,
  selectedPatientId,
  setSelectedPatientId,
  setCurrentTab,
  showToast,
  onOpenPatientModal
}: ArchiveroViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Inactivo' | 'Archivado' | 'Con Alergias' | 'Con Citas Futuras'>('Todos');
  const [sortBy, setSortBy] = useState<'A-Z' | 'proxima_cita' | 'ultima_cita' | 'fecha_registro' | 'estado'>('estado');
  const [activeExpedienteTab, setActiveExpedienteTab] = useState<'facturas' | 'ficha' | 'historial' | 'laboratorio'>('historial');
  const [sidebarSort, setSidebarSort] = useState<'A-Z' | 'recent'>('recent');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const alphabetSections = useMemo(() => [
    { label: 'A–C', start: 'A', end: 'C' },
    { label: 'D–F', start: 'D', end: 'F' },
    { label: 'G–I', start: 'G', end: 'I' },
    { label: 'J–L', start: 'J', end: 'L' },
    { label: 'M–O', start: 'M', end: 'O' },
    { label: 'P–R', start: 'P', end: 'R' },
    { label: 'S–U', start: 'S', end: 'U' },
    { label: 'V–Z', start: 'V', end: 'Z' },
  ], []);

  const [activeSection, setActiveSection] = useState(alphabetSections[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const getSortableChar = (name: string) => {
    return name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().charAt(0) || 'A';
  };

  const isInRange = (char: string, start: string, end: string) => {
    return char >= start && char <= end;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchQuery, statusFilter]);


  // Helper para buscar paciente seleccionado
  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [diseases, setDiseases] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [observations, setObservations] = useState('');
  const [flexibleSections, setFlexibleSections] = useState('');

  // Estados oficiales de Fase 7
  const [activeSectionTab, setActiveSectionTab] = useState<number>(1);
  const [officialSectionsData, setOfficialSectionsData] = useState<any>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState<boolean>(false);
  const [showQuickNoteForm, setShowQuickNoteForm] = useState<boolean>(false);

  // Estados de formularios auxiliares para tablas editables
  const [medForm, setMedForm] = useState({ farmaco: '', frecuencia: '', motivo: '' });
  const [diseaseForm, setDiseaseForm] = useState({ diagnostico: '', tiempoEvolucion: '', observaciones: '' });
  const [pathTxForm, setPathTxForm] = useState({ planCosto: '', txRealizado: '', costo: '', aCuenta: '', fecha: '', firma: '' });
  const [noteForm, setNoteForm] = useState({ fecha: new Date().toISOString().split('T')[0], titulo: '', nota: '', doctor: '' });

  const handleSaveQuickNote = () => {
    if (!noteForm.nota) return;
    const sec = officialSectionsData.evolucionNotes || { notes: [] };
    const list = [
      {
        id: Math.random().toString(36).substring(2, 9),
        ...noteForm
      },
      ...(sec.notes || [])
    ];
    setOfficialSectionsData((prev: any) => ({
      ...prev,
      evolucionNotes: {
        ...(prev.evolucionNotes || {}),
        notes: list
      }
    }));
    setIsDirty(true);
    setNoteForm({ fecha: new Date().toISOString().split('T')[0], titulo: '', nota: '', doctor: '' });
    setShowQuickNoteForm(false);
    showToast?.('Nota de evolución agregada localmente', 'success');
  };

  const handleRemoveQuickNote = (id: string) => {
    const sec = officialSectionsData.evolucionNotes || { notes: [] };
    const list = (sec.notes || []).filter((n: any) => n.id !== id);
    setOfficialSectionsData((prev: any) => ({
      ...prev,
      evolucionNotes: {
        ...(prev.evolucionNotes || {}),
        notes: list
      }
    }));
    setIsDirty(true);
    showToast?.('Nota eliminada localmente', 'info');
  };

  // Estados para Adjuntos Clínicos (Fase 10)
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentCategory, setAttachmentCategory] = useState('General');
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Cargar adjuntos del paciente
  const loadAttachments = async (patientId: string) => {
    if (!patientId) return;
    setLoadingAttachments(true);
    try {
      const data = await getPatientAttachments(patientId);
      setAttachments(data);
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Error al cargar los adjuntos clínicos', 'error');
      }
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Manejar subida de archivo
  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    if (!attachmentFile) {
      if (showToast) showToast('Por favor, selecciona un archivo.', 'error');
      return;
    }

    // Validación de tamaño local (10 MB)
    if (attachmentFile.size > 10 * 1024 * 1024) {
      if (showToast) showToast('El archivo supera el tamaño permitido.', 'error');
      return;
    }

    // Validación de tipo local
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(attachmentFile.type)) {
      if (showToast) showToast('Formato no permitido.', 'error');
      return;
    }

    setUploadingAttachment(true);
    try {
      const newAttachment = await uploadPatientAttachment(
        selectedPatientId,
        attachmentFile,
        attachmentCategory,
        attachmentDescription
      );
      setAttachments(prev => [newAttachment, ...prev]);
      setAttachmentFile(null);
      setAttachmentDescription('');
      setAttachmentCategory('General');
      
      // Reset input element
      const fileInput = document.getElementById('clinical-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (showToast) showToast('Archivo subido correctamente.', 'success');
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'No se pudo subir el archivo.', 'error');
      }
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Manejar eliminación de archivo
  const handleDeleteAttachment = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo de forma permanente?')) {
      return;
    }

    try {
      await deleteAttachment(id);
      setAttachments(prev => prev.filter(att => att.id !== id));
      if (showToast) showToast('Archivo eliminado correctamente.', 'success');
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Error al eliminar el archivo.', 'error');
      }
    }
  };

  useEffect(() => {
    setIsPrintMode(false);
    if (!selectedPatientId) {
      setMedicalHistory(null);
      setAttachments([]);
      return;
    }

    loadAttachments(selectedPatientId);
    setLoadingHistory(true);
    getMedicalHistory(selectedPatientId)
      .then(history => {
        setMedicalHistory(history);
        setAllergies(history.allergies || '');
        setMedications(history.medications || '');
        setDiseases(history.diseases || '');
        setSurgeries(history.surgeries || '');
        setObservations(history.observations || '');
        
        let flexVal = history.flexibleSections || '{}';
        try {
          const parsed = JSON.parse(flexVal);
          if (parsed && typeof parsed === 'object' && parsed.notes !== undefined) {
            flexVal = parsed.notes;
          }
        } catch {}
        setFlexibleSections(flexVal);

        // Parsear officialSections
        let officialParsed: any = {};
        if (history.officialSections) {
          try {
            officialParsed = JSON.parse(history.officialSections);
          } catch (e) {
            console.error("Error parsing officialSections", e);
          }
        }
        
        // Precargar con activePatient
        const patientDataMerged = {
          fecha: new Date().toISOString().split('T')[0],
          nombre: activePatient?.name || '',
          sexo: '',
          dob: activePatient?.dob || '',
          edad: activePatient?.age || 0,
          lugarNacimiento: '',
          domicilio: '',
          telefono: activePatient?.phone || '',
          celular: '',
          correo: '',
          estadoCivil: '',
          religion: '',
          escolaridad: '',
          ocupacion: '',
          derechohabiente: 'no',
          institucion: 'Ninguna',
          grupoSanguineo: '',
          alergias: activePatient?.allergies || history.allergies || '',
          peso: '',
          altura: '',
          temperatura: '',
          pulso: '',
          fc: '',
          fr: '',
          ta: '',
          ...(officialParsed.patientData || {})
        };

        const mergedOfficial = {
          patientData: patientDataMerged,
          systemicHealth: {
            medications: [],
            systemicDiseases: [],
            systemicRisk: 'bajo',
            informantName: '',
            informantParentesco: '',
            informantDomicilio: '',
            informantTelefono: '',
            motivoConsulta: '',
            ...(officialParsed.systemicHealth || {})
          },
          familyHistory: {
            matrix: {},
            alergiasDetalle: '',
            infectocontagiosasDetalle: '',
            adiccionesDetalle: '',
            otraEnfermedadDetalle: '',
            ...(officialParsed.familyHistory || {})
          },
          personalHistory: {
            vivienda: '',
            habitosHigienicos: '',
            habitosDieteticos: '',
            menarca: '',
            vidaSexualActiva: 'no',
            embarazos: '',
            embarazosTermino: '',
            menopausia: '',
            varonVidaSexualActiva: 'no',
            varonGrupoSanguineo: '',
            pathologicalTable: [],
            tabaquismo: { activo: false, inactivo: false, edadInicio: '', frecuencia: '', cantidad: '' },
            alcoholismo: { activo: false, inactivo: false, edadInicio: '', frecuencia: '', cantidad: '' },
            adiccionOtra: { activo: false, inactivo: false, edadInicio: '', frecuencia: '', cantidad: '' },
            anestesiaDental: 'no',
            anestesiaProblema: 'no',
            anestesiaEspecifique: '',
            transfundido: 'no',
            traumatismosRecientes: 'no',
            traumatismosEspecifique: '',
            ...(officialParsed.personalHistory || {})
          },
          systemsReview: {
            symptoms: {},
            ...(officialParsed.systemsReview || {})
          },
          physicalExam: {
            actitudPaciente: '',
            caraCuello: { frente: '', cejas: '', ojos: '', nariz: '', labios: '', mejillas: '', menton: '', cuello: '' },
            atmExploracion: '',
            musculos: {
              maseterosD: false, maseterosI: false,
              temporalesD: false, temporalesI: false,
              pterigoideoExtD: false, pterigoideoExtI: false,
              pterigoideoIntD: false, pterigoideoIntI: false,
              esternocleidomastoideoD: false, esternocleidomastoideoI: false,
              trapeciosD: false, trapeciosI: false
            },
            ...(officialParsed.physicalExam || {})
          },
          intrabucalExam: {
            tejidosBlandos: { labios: '', mucosaYugal: '', frenillos: '', encia: '', paladar: '', orofaringe: '', istmoFauces: '', uvula: '', amigdalas: '', lengua: '', pisoBoca: '' },
            ihos: {
              cita1: { fecha: '', d16_pdb: '', d16_cal: '', d11_pdb: '', d11_cal: '', d26_pdb: '', d26_cal: '', d46_pdb: '', d46_cal: '', d31_pdb: '', d31_cal: '', d36_pdb: '', d36_cal: '', interpretacion: 'Bajo' },
              mitadTx: { fecha: '', d16_pdb: '', d16_cal: '', d11_pdb: '', d11_cal: '', d26_pdb: '', d26_cal: '', d46_pdb: '', d46_cal: '', d31_pdb: '', d31_cal: '', d36_pdb: '', d36_cal: '', interpretacion: 'Bajo' },
              ultimaCita: { fecha: '', d16_pdb: '', d16_cal: '', d11_pdb: '', d11_cal: '', d26_pdb: '', d26_cal: '', d46_pdb: '', d46_cal: '', d31_pdb: '', d31_cal: '', d36_pdb: '', d36_cal: '', interpretacion: 'Bajo' }
            },
            ...(officialParsed.intrabucalExam || {})
          },
          consentimiento: {
            nombrePaciente: activePatient?.name || '',
            fechaPaciente: new Date().toISOString().split('T')[0],
            nombreTestigo: '',
            fechaTestigo: '',
            acepto: false,
            concluidoConformidad: false,
            conclusionNombrePaciente: activePatient?.name || '',
            conclusionFechaPaciente: '',
            conclusionNombreTestigo: '',
            conclusionFechaTestigo: '',
            ...(officialParsed.consentimiento || {})
          },
          diagnosticoPlan: {
            diagnosticoIntegral: '',
            planTxList: [],
            ...(officialParsed.diagnosticoPlan || {})
          },
          evolucionNotes: {
            notes: [],
            ...(officialParsed.evolucionNotes || {})
          }
        };

        setOfficialSectionsData(mergedOfficial);
        setIsDirty(false);
      })
      .catch(err => {
        console.error(err);
        if (showToast) {
          showToast('Error al cargar la historia clínica', 'error');
        }
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [selectedPatientId, showToast, activePatient]);

  const handleSaveMedicalHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveAllOfficial();
  };

  const handleSaveAllOfficial = async () => {
    if (!selectedPatientId || !officialSectionsData) return;

    setSavingHistory(true);
    try {
      const payload: any = {
        allergies: officialSectionsData.patientData?.alergias || null,
        officialSections: JSON.stringify(officialSectionsData)
      };

      const updated = await updateMedicalHistory(selectedPatientId, payload);
      setMedicalHistory(updated);
      
      let officialParsed: any = {};
      if (updated.officialSections) {
        try {
          officialParsed = JSON.parse(updated.officialSections);
        } catch (e) {
          console.error("Error parsing returned officialSections", e);
        }
      }
      
      setOfficialSectionsData(prev => ({
        ...prev,
        ...officialParsed
      }));
      setIsDirty(false);
      if (showToast) {
        showToast('Historia clínica guardada correctamente', 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Error al guardar la historia clínica', 'error');
      }
    } finally {
      setSavingHistory(false);
    }
  };

  const handleSaveActiveSection = async () => {
    if (!selectedPatientId || !officialSectionsData) return;

    setSavingHistory(true);
    try {
      let sectionKey = '';
      let sectionPayload: any = null;

      switch(activeSectionTab) {
        case 1:
          sectionKey = 'patientData';
          sectionPayload = officialSectionsData.patientData;
          break;
        case 2:
          sectionKey = 'systemicHealth';
          sectionPayload = officialSectionsData.systemicHealth;
          break;
        case 3:
          sectionKey = 'familyHistory';
          sectionPayload = officialSectionsData.familyHistory;
          break;
        case 4:
          sectionKey = 'personalHistory';
          sectionPayload = officialSectionsData.personalHistory;
          break;
        case 5:
          sectionKey = 'systemsReview';
          sectionPayload = officialSectionsData.systemsReview;
          break;
        case 6:
          sectionKey = 'physicalExam';
          sectionPayload = officialSectionsData.physicalExam;
          break;
        case 7:
          sectionKey = 'intrabucalExam';
          sectionPayload = officialSectionsData.intrabucalExam;
          break;
        case 9:
          sectionKey = 'consentimiento';
          sectionPayload = officialSectionsData.consentimiento;
          break;
        case 10:
          sectionKey = 'diagnosticoPlan';
          sectionPayload = officialSectionsData.diagnosticoPlan;
          break;
        case 11:
          sectionKey = 'evolucionNotes';
          sectionPayload = officialSectionsData.evolucionNotes;
          break;
      }

      if (sectionKey) {
        const payload: any = {};
        if (sectionKey === 'patientData') {
          payload.allergies = sectionPayload.alergias || null;
        }
        
        payload.officialSections = JSON.stringify({
          [sectionKey]: sectionPayload
        });

        const updated = await updateMedicalHistory(selectedPatientId, payload);
        setMedicalHistory(updated);
        
        let officialParsed: any = {};
        if (updated.officialSections) {
          try {
            officialParsed = JSON.parse(updated.officialSections);
          } catch (e) {
            console.error("Error parsing returned officialSections", e);
          }
        }
        
        setOfficialSectionsData(prev => ({
          ...prev,
          ...officialParsed
        }));
        
        setIsDirty(false);
        if (showToast) {
          showToast('Sección guardada correctamente', 'success');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Error al guardar la sección', 'error');
      }
    } finally {
      setSavingHistory(false);
    }
  };

  const formatLastUpdated = (dateStr?: string) => {
    if (!dateStr) return 'Sin registros previos';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Citas del paciente activo
  const activePatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments.filter(appt => {
      const patientId = appt.patient?.id || appt.patientId;
      return patientId === selectedPatientId;
    });
  }, [appointments, selectedPatientId]);

  // Próxima y última cita de cada paciente
  const patientCitasMap = useMemo(() => {
    const map: Record<string, { proxima?: Appointment; ultima?: Appointment }> = {};
    
    patients.forEach(p => {
      const pAppts = appointments.filter(appt => {
        const patientId = appt.patient?.id || appt.patientId;
        return patientId === p.id && appt.status !== 'Cancelada';
      });

      // Ordenar por fecha y hora de inicio
      const sorted = [...pAppts].sort((a, b) => {
        const valA = (a.date || '') + String(a.startHour).padStart(5, '0');
        const valB = (b.date || '') + String(b.startHour).padStart(5, '0');
        return valA.localeCompare(valB);
      });

      const proxima = sorted.find(a => (a.date || '') >= todayStr);
      
      const pasadas = sorted.filter(a => (a.date || '') < todayStr);
      const ultima = pasadas.length > 0 ? pasadas[pasadas.length - 1] : undefined;

      map[p.id] = { proxima, ultima };
    });

    return map;
  }, [patients, appointments, todayStr]);

  // Filtrado de pacientes
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // 1. Filtrar por sección alfabética
      const firstChar = getSortableChar(p.name);
      const inAlphabet = isInRange(firstChar, activeSection.start, activeSection.end);
      if (!inAlphabet) return false;

      // 2. Filtrar por búsqueda
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = p.phone.includes(searchQuery);
      const allergiesMatch = (p.allergies || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || idMatch || phoneMatch || allergiesMatch;

      if (!matchesSearch) return false;

      // 3. Filtrar por estado de archivero
      if (statusFilter === 'Todos') return true;
      if (statusFilter === 'Activo') return p.status === 'Activo';
      if (statusFilter === 'Inactivo') return p.status === 'Inactivo';
      if (statusFilter === 'Archivado') return p.status === 'Archivado';
      if (statusFilter === 'Con Alergias') return !!p.allergies && p.allergies.trim() !== '';
      if (statusFilter === 'Con Citas Futuras') {
        return !!patientCitasMap[p.id]?.proxima;
      }
      return true;
    });
  }, [patients, searchQuery, statusFilter, activeSection, patientCitasMap]);

  // Ordenamiento de pacientes
  const sortedPatients = useMemo(() => {
    const list = [...filteredPatients];
    return list.sort((a, b) => {
      if (sortBy === 'A-Z') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'proxima_cita') {
        const dateA = patientCitasMap[a.id]?.proxima?.date || '9999-12-31';
        const dateB = patientCitasMap[b.id]?.proxima?.date || '9999-12-31';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'ultima_cita') {
        const dateA = patientCitasMap[a.id]?.ultima?.date || '0000-01-01';
        const dateB = patientCitasMap[b.id]?.ultima?.date || '0000-01-01';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'fecha_registro') {
        const regA = a.id;
        const regB = b.id;
        return regB.localeCompare(regA);
      }
      if (sortBy === 'estado') {
        const scoreA = a.status === 'Activo' ? 0 : a.status === 'Inactivo' ? 1 : 2;
        const scoreB = b.status === 'Activo' ? 0 : b.status === 'Inactivo' ? 1 : 2;
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredPatients, sortBy, patientCitasMap]);

  // Paginación
  const ITEMS_PER_PAGE = 6;
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedPatients, currentPage]);

  const sidebarPatients = useMemo(() => {
    let list = [...patients];
    if (searchQuery) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sidebarSort === 'A-Z') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => {
        const dateA = patientCitasMap[a.id]?.proxima?.date || patientCitasMap[a.id]?.ultima?.date || '0000-01-01';
        const dateB = patientCitasMap[b.id]?.proxima?.date || patientCitasMap[b.id]?.ultima?.date || '0000-01-01';
        return dateB.localeCompare(dateA);
      });
    }
    return list;
  }, [patients, searchQuery, sidebarSort, patientCitasMap]);

  const getPatientActivityTime = (patientId: string) => {
    const times: Record<string, string> = {
      'PX-88291-LV': '2m ago',
      'PX-12345-JC': '4h ago',
      'PX-98765-DL': '2d ago',
      'PX-54321-EF': '3d ago',
      'PX-11111-CM': '5d ago',
      'PX-22222-SJ': '1w ago',
    };
    return times[patientId] || '1w ago';
  };

  const renderStatusDots = (patient: Patient) => {
    const dots = [];
    if (patient.status === 'Activo') {
      dots.push(<span key="status" className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>);
    }
    if (patient.riskLevel === 'Medio Riesgo') {
      dots.push(<span key="risk" className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>);
    } else if (patient.riskLevel === 'Alto Riesgo') {
      dots.push(<span key="risk" className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>);
    }
    if (patient.allergies) {
      dots.push(<span key="allergies" className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>);
    }
    return (
      <div className="flex items-center gap-1.5 mt-1">
        {dots}
      </div>
    );
  };

  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const toItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Presupuestos del paciente activo
  const activePatientBudgets = useMemo(() => {
    if (!selectedPatientId) return [];
    const saved = budgets.filter(b => {
      const patientId = (b as any).patientId || b.patientName; // fallback de vinculación
      return patientId === selectedPatientId || b.patientName === activePatient?.name;
    });

    if (liveItems && liveItems.length > 0) {
      const draftBudget: Budget = {
        id: 'DRAFT-TEMP',
        patientName: activePatient?.name || 'Paciente',
        status: 'Pendiente',
        discountPercent: 0,
        items: liveItems
      };
      return [draftBudget, ...saved];
    }

    return saved;
  }, [budgets, selectedPatientId, activePatient, liveItems]);

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'Activo':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30';
      case 'Inactivo':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border border-slate-700/30';
      case 'Archivado':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/30';
    }
  };

  const getRiskColor = (risk: Patient['riskLevel']) => {
    switch (risk) {
      case 'Alto Riesgo':
        return 'bg-red-50 text-red-750 dark:bg-red-950/30 dark:text-red-400 border border-red-200/30';
      case 'Medio Riesgo':
        return 'bg-amber-50 text-amber-805 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-250/30';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30';
    }
  };

  const calculateProgress = useMemo(() => {
    if (!officialSectionsData) return { completed: 0, total: 11 };
    
    let completed = 0;
    
    // 1. Datos del Paciente
    const pd = officialSectionsData.patientData || {};
    if (pd.sexo || pd.lugarNacimiento || pd.peso || pd.altura || pd.temperatura || pd.ta) completed++;
    
    // 2. Salud Sistémica
    const ss = officialSectionsData.systemicHealth || {};
    if ((ss.medications && ss.medications.length > 0) || (ss.systemicDiseases && ss.systemicDiseases.length > 0) || ss.motivoConsulta) completed++;
    
    // 3. Antecedentes Familiares
    const fh = officialSectionsData.familyHistory || {};
    const hasFamilyPathologies = fh.matrix && Object.keys(fh.matrix).some(k => Object.values(fh.matrix[k] || {}).some(v => v === true));
    if (hasFamilyPathologies || fh.alergiasDetalle || fh.infectocontagiosasDetalle || fh.otraEnfermedadDetalle) completed++;
    
    // 4. Antecedentes Personales
    const ph = officialSectionsData.personalHistory || {};
    const hasPathological = ph.pathologicalTable && ph.pathologicalTable.length > 0;
    if (ph.vivienda || ph.habitosHigienicos || ph.menarca || hasPathological || ph.anestesiaEspecifique || ph.traumatismosEspecifique) completed++;
    
    // 5. Interrogatorio
    const ir = officialSectionsData.systemsReview || {};
    const hasSymptoms = ir.symptoms && Object.keys(ir.symptoms).some(k => ir.symptoms[k]?.presenta === true);
    if (hasSymptoms) completed++;
    
    // 6. Exploración Física
    const pe = officialSectionsData.physicalExam || {};
    const hasMusculos = pe.musculos && Object.values(pe.musculos).some(v => v === true);
    if (pe.actitudPaciente || pe.atmExploracion || hasMusculos) completed++;
    
    // 7. Exploración Intrabucal
    const ie = officialSectionsData.intrabucalExam || {};
    const hasSoftTissues = ie.tejidosBlandos && Object.values(ie.tejidosBlandos).some(v => v !== '');
    if (hasSoftTissues || ie.ihos?.cita1?.fecha || ie.ihos?.mitadTx?.fecha) completed++;
    
    // 8. Odontograma
    completed++;
    
    // 9. Consentimiento
    const ci = officialSectionsData.consentimiento || {};
    if (ci.acepto) completed++;
    
    // 10. Diagnóstico
    const dp = officialSectionsData.diagnosticoPlan || {};
    if (dp.diagnosticoIntegral || (dp.planTxList && dp.planTxList.length > 0)) completed++;
    
    // 11. Notas de Evolución
    const en = officialSectionsData.evolucionNotes || {};
    if (en.notes && en.notes.length > 0) completed++;
    
    return { completed, total: 11 };
  }, [officialSectionsData]);

  const renderSection1 = () => {
    const data = officialSectionsData.patientData || {};
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        patientData: {
          ...(prev.patientData || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <User className="w-4.5 h-4.5" /> Datos del Paciente
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Fecha de Registro</label>
              <input type="date" value={data.fecha || ''} onChange={e => updateField('fecha', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Nombre Completo</label>
              <input type="text" value={data.nombre || ''} onChange={e => updateField('nombre', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Sexo</label>
              <select value={data.sexo || ''} onChange={e => updateField('sexo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600">
                <option value="">Seleccione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Fecha de Nacimiento</label>
              <input type="date" value={data.dob || ''} onChange={e => updateField('dob', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Edad</label>
              <input type="number" value={data.edad || ''} onChange={e => updateField('edad', parseInt(e.target.value) || 0)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Domicilio</label>
              <input type="text" value={data.domicilio || ''} onChange={e => updateField('domicilio', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Lugar de Nacimiento</label>
              <input type="text" value={data.lugarNacimiento || ''} onChange={e => updateField('lugarNacimiento', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Teléfono Fijo</label>
              <input type="text" value={data.telefono || ''} onChange={e => updateField('telefono', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Celular</label>
              <input type="text" value={data.celular || ''} onChange={e => updateField('celular', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Correo Electrónico</label>
              <input type="email" value={data.correo || ''} onChange={e => updateField('correo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Estado Civil</label>
              <input type="text" value={data.estadoCivil || ''} onChange={e => updateField('estadoCivil', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Religión</label>
              <input type="text" value={data.religion || ''} onChange={e => updateField('religion', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Escolaridad</label>
              <input type="text" value={data.escolaridad || ''} onChange={e => updateField('escolaridad', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Ocupación</label>
              <input type="text" value={data.ocupacion || ''} onChange={e => updateField('ocupacion', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Derechohabiente</span>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                  <input type="radio" checked={data.derechohabiente === 'si'} onChange={() => updateField('derechohabiente', 'si')} className="accent-blue-650" /> Sí
                </label>
                <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                  <input type="radio" checked={data.derechohabiente === 'no'} onChange={() => updateField('derechohabiente', 'no')} className="accent-blue-650" /> No
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Institución</label>
              <select value={data.institucion || 'Ninguna'} onChange={e => updateField('institucion', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none">
                <option value="Ninguna">Ninguna</option>
                <option value="ISSSTE">ISSSTE</option>
                <option value="IMSS">IMSS</option>
                <option value="Seguro Popular">Seguro Popular</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Grupo Sanguíneo</label>
              <input type="text" placeholder="Ej. O+" value={data.grupoSanguineo || ''} onChange={e => updateField('grupoSanguineo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-center focus:outline-none" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Alergias</label>
              <input type="text" placeholder="Ej. Penicilina" value={data.alergias || ''} onChange={e => updateField('alergias', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5" /> Signos Vitales
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">Peso (kg)</label>
              <input type="text" placeholder="0.0" value={data.peso || ''} onChange={e => updateField('peso', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">Altura (m)</label>
              <input type="text" placeholder="0.00" value={data.altura || ''} onChange={e => updateField('altura', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">Temp. (°C)</label>
              <input type="text" placeholder="36.5" value={data.temperatura || ''} onChange={e => updateField('temperatura', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">Pulso (ppm)</label>
              <input type="text" placeholder="70" value={data.pulso || ''} onChange={e => updateField('pulso', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">F.C. (lpm)</label>
              <input type="text" placeholder="70" value={data.fc || ''} onChange={e => updateField('fc', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">F.R. (rpm)</label>
              <input type="text" placeholder="16" value={data.fr || ''} onChange={e => updateField('fr', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center">T.A. (mmHg)</label>
              <input type="text" placeholder="120/80" value={data.ta || ''} onChange={e => updateField('ta', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 text-center" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection2 = () => {
    const sec = officialSectionsData.systemicHealth || { medications: [], systemicDiseases: [], systemicRisk: 'bajo' };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        systemicHealth: {
          ...(prev.systemicHealth || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const addMedication = () => {
      if (!medForm.farmaco) return;
      const list = [...(sec.medications || []), medForm];
      updateField('medications', list);
      setMedForm({ farmaco: '', frecuencia: '', motivo: '' });
    };

    const removeMedication = (index: number) => {
      const list = (sec.medications || []).filter((_: any, i: number) => i !== index);
      updateField('medications', list);
    };

    const addDisease = () => {
      if (!diseaseForm.diagnostico) return;
      const list = [...(sec.systemicDiseases || []), diseaseForm];
      updateField('systemicDiseases', list);
      setDiseaseForm({ diagnostico: '', tiempoEvolucion: '', observaciones: '' });
    };

    const removeDisease = (index: number) => {
      const list = (sec.systemicDiseases || []).filter((_: any, i: number) => i !== index);
      updateField('systemicDiseases', list);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Motivo de Consulta</label>
          <textarea rows={2} value={sec.motivoConsulta || ''} onChange={e => updateField('motivoConsulta', e.target.value)} placeholder="Ej. Dolor agudo en molar inferior, limpieza dental..." className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 resize-none" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Medicamentos Utilizados</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Fármaco</th>
                  <th className="py-2 px-2">Frecuencia de Uso</th>
                  <th className="py-2 px-2">Motivo de Uso</th>
                  <th className="py-2 pl-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(sec.medications || []).map((med: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="py-2 pr-2 font-medium">{med.farmaco}</td>
                    <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{med.frecuencia}</td>
                    <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{med.motivo}</td>
                    <td className="py-2 pl-2 text-right">
                      <button type="button" onClick={() => removeMedication(i)} className="text-red-500 hover:text-red-650 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-105/30 dark:bg-slate-900/30">
                  <td className="py-2 pr-2">
                    <input type="text" placeholder="Nombre fármaco" value={medForm.farmaco} onChange={e => setMedForm({ ...medForm, farmaco: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="Ej. Cada 8 horas" value={medForm.frecuencia} onChange={e => setMedForm({ ...medForm, frecuencia: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="Ej. Hipertensión" value={medForm.motivo} onChange={e => setMedForm({ ...medForm, motivo: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button type="button" onClick={addMedication} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ml-auto">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Salud Sistémica</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Diagnóstico</th>
                  <th className="py-2 px-2">Tiempo de Evolución</th>
                  <th className="py-2 px-2">Observaciones</th>
                  <th className="py-2 pl-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(sec.systemicDiseases || []).map((dis: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="py-2 pr-2 font-medium">{dis.diagnostico}</td>
                    <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{dis.tiempoEvolucion}</td>
                    <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{dis.observaciones}</td>
                    <td className="py-2 pl-2 text-right">
                      <button type="button" onClick={() => removeDisease(i)} className="text-red-500 hover:text-red-650 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-105/30 dark:bg-slate-900/30">
                  <td className="py-2 pr-2">
                    <input type="text" placeholder="Diagnóstico" value={diseaseForm.diagnostico} onChange={e => setDiseaseForm({ ...diseaseForm, diagnostico: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="Ej. 5 años" value={diseaseForm.tiempoEvolucion} onChange={e => setDiseaseForm({ ...diseaseForm, tiempoEvolucion: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="Observaciones" value={diseaseForm.observaciones} onChange={e => setDiseaseForm({ ...diseaseForm, observaciones: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button type="button" onClick={addDisease} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ml-auto">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h5 className="font-bold text-xs text-slate-850 dark:text-white">Riesgo Sistémico</h5>
            <p className="text-[10px] text-slate-400">Seleccione el nivel de riesgo clínico del paciente.</p>
          </div>
          <div className="flex gap-2.5">
            {[
              { id: 'bajo', label: 'Bajo', color: 'bg-green-105 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-200/50' },
              { id: 'medio', label: 'Medio', color: 'bg-amber-105 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-250/50' },
              { id: 'alto', label: 'Alto', color: 'bg-red-105 text-red-850 dark:bg-red-950/40 dark:text-red-400 border-red-200/50' }
            ].map(r => {
              const active = sec.systemicRisk === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateField('systemicRisk', r.id)}
                  className={`px-4 py-1.5 rounded-xl text-2xs font-bold border cursor-pointer transition-all ${
                    active ? `${r.color} ring-2 ring-blue-500 scale-105` : 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Datos del Informante <span className="text-[10px] font-normal text-slate-400">(Opcional: Pediátrico / Geriátrico)</span></h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Nombre del Informante</label>
              <input type="text" value={sec.informantName || ''} onChange={e => updateField('informantName', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Parentesco</label>
              <input type="text" value={sec.informantParentesco || ''} onChange={e => updateField('informantParentesco', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Domicilio</label>
              <input type="text" value={sec.informantDomicilio || ''} onChange={e => updateField('informantDomicilio', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Teléfono</label>
              <input type="text" value={sec.informantTelefono || ''} onChange={e => updateField('informantTelefono', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection3 = () => {
    const sec = officialSectionsData.familyHistory || { matrix: {}, alergiasDetalle: '', infectocontagiosasDetalle: '', adiccionesDetalle: '', otraEnfermedadDetalle: '' };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        familyHistory: {
          ...(prev.familyHistory || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const handleCheckChange = (pat: string, member: string, val: boolean) => {
      const currentMatrix = sec.matrix || {};
      const patObj = currentMatrix[pat] || {};
      const updatedMatrix = {
        ...currentMatrix,
        [pat]: {
          ...patObj,
          [member]: val
        }
      };
      updateField('matrix', updatedMatrix);
    };

    const patologias = [
      { id: 'infarto', label: 'Infarto y/o Angina de pecho' },
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
      { id: 'adicciones', label: 'Adicciones (Alcohol, Tabaco, Droga)' },
      { id: 'otra', label: 'Otra enfermedad' }
    ];

    const familiares = [
      { id: 'padre', label: 'Padre' },
      { id: 'madre', label: 'Madre' },
      { id: 'abueloPat', label: 'Abuelo Pat.' },
      { id: 'abuelaPat', label: 'Abuela Pat.' },
      { id: 'abueloMat', label: 'Abuelo Mat.' },
      { id: 'abuelaMat', label: 'Abuela Mat.' },
      { id: 'hijos', label: 'Hijos' },
      { id: 'hermanos', label: 'Hermanos' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Matriz de Patologías Heredofamiliares</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Patología / Familiar</th>
                  {familiares.map(f => (
                    <th key={f.id} className="py-2 px-1 text-center font-bold">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patologias.map(p => (
                  <tr key={p.id} className="border-b border-slate-105 dark:border-slate-800/50 hover:bg-slate-100/35 dark:hover:bg-slate-900/35">
                    <td className="py-2 pr-2 font-medium">{p.label}</td>
                    {familiares.map(f => {
                      const isChecked = !!(sec.matrix?.[p.id]?.[f.id]);
                      return (
                        <td key={f.id} className="py-2 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => handleCheckChange(p.id, f.id, e.target.checked)}
                            className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Especificar Detalles / Observaciones</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Detalle de Alergias Familiares</label>
              <input type="text" placeholder="Ej. Padre alérgico a la penicilina..." value={sec.alergiasDetalle || ''} onChange={e => updateField('alergiasDetalle', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Detalle de Enfermedades Infectocontagiosas</label>
              <input type="text" placeholder="Ej. Tuberculosis en rama materna..." value={sec.infectocontagiosasDetalle || ''} onChange={e => updateField('infectocontagiosasDetalle', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Detalle de Adicciones Familiares</label>
              <input type="text" placeholder="Ej. Alcoholismo abuelo materno..." value={sec.adiccionesDetalle || ''} onChange={e => updateField('adiccionesDetalle', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Detalle de Otra Enfermedad Familiar</label>
              <input type="text" placeholder="Especificar enfermedad y familiar..." value={sec.otraEnfermedadDetalle || ''} onChange={e => updateField('otraEnfermedadDetalle', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none focus:border-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection4 = () => {
    const sec = officialSectionsData.personalHistory || { vivienda: '', habitosHigienicos: '', habitosDieteticos: '', pathologicalTable: [], tabaquismo: {}, alcoholismo: {}, adiccionOtra: {} };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        personalHistory: {
          ...(prev.personalHistory || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const updateNestedField = (subObj: string, field: string, val: any) => {
      const current = sec[subObj] || {};
      updateField(subObj, {
        ...current,
        [field]: val
      });
    };

    const diseasesBase = [
      { id: 'diabetes', label: 'Diabetes Mellitus' },
      { id: 'hepatitis', label: 'Hepatitis' },
      { id: 'fa', label: 'Cuadros recurrentes de F.A.' },
      { id: 'vih', label: 'VIH' },
      { id: 'herpes', label: 'Herpes' },
      { id: 'tuberculosis', label: 'Tuberculosis' },
      { id: 'nefropatia', label: 'Nefropatía' },
      { id: 'gastropatia', label: 'Gastropatía' },
      { id: 'hipertension', label: 'Hipertensión' },
      { id: 'hipotension', label: 'Hipotensión' },
      { id: 'artritis', label: 'Artritis' },
      { id: 'anemia', label: 'Anemia' },
      { id: 'infarto', label: 'Infarto y/o Angina de pecho' },
      { id: 'asma', label: 'Asma' },
      { id: 'alergias', label: 'Alergias' },
      { id: 'otra', label: 'Otra enfermedad' }
    ];

    const handlePathologicalChange = (diseaseId: string, field: string, val: any) => {
      const currentTable = sec.pathologicalTable || [];
      const index = currentTable.findIndex((item: any) => item.enfermedad === diseaseId);
      let updatedTable = [...currentTable];

      if (index >= 0) {
        updatedTable[index] = {
          ...updatedTable[index],
          [field]: val
        };
      } else {
        updatedTable.push({
          enfermedad: diseaseId,
          presento: field === 'presento' ? val : false,
          edad: field === 'edad' ? val : '',
          control: field === 'control' ? val : 'no',
          complicacion: field === 'complicacion' ? val : ''
        });
      }
      updateField('pathologicalTable', updatedTable);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Antecedentes No Patológicos</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Vivienda</label>
              <textarea rows={2} value={sec.vivienda || ''} onChange={e => updateField('vivienda', e.target.value)} placeholder="Ej. Urbana, cuenta con todos los servicios básicos..." className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Hábitos Higiénicos</label>
              <textarea rows={2} value={sec.habitosHigienicos || ''} onChange={e => updateField('habitosHigienicos', e.target.value)} placeholder="Ej. Cepillado dental 3 veces al día, uso de hilo dental..." className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Hábitos Dietéticos</label>
              <textarea rows={2} value={sec.habitosDieteticos || ''} onChange={e => updateField('habitosDieteticos', e.target.value)} placeholder="Ej. Alta ingesta de carbohidratos, consumo de café..." className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
            <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Antecedentes Gineco-Obstétricos <span className="text-[10px] font-normal text-slate-400">(Mujeres)</span></h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Edad de Menarca</label>
                <input type="text" placeholder="Años" value={sec.menarca || ''} onChange={e => updateField('menarca', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
              <div className="space-y-1 flex flex-col justify-center">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Vida Sexual Activa</span>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                    <input type="radio" checked={sec.vidaSexualActiva === 'si'} onChange={() => updateField('vidaSexualActiva', 'si')} className="accent-blue-650" /> Sí
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                    <input type="radio" checked={sec.vidaSexualActiva === 'no'} onChange={() => updateField('vidaSexualActiva', 'no')} className="accent-blue-650" /> No
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Nº Embarazos</label>
                <input type="text" placeholder="Embarazos" value={sec.embarazos || ''} onChange={e => updateField('embarazos', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Embarazos a Término</label>
                <input type="text" placeholder="Partos" value={sec.embarazosTermino || ''} onChange={e => updateField('embarazosTermino', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Edad de Menopausia</label>
                <input type="text" placeholder="Años (Si aplica)" value={sec.menopausia || ''} onChange={e => updateField('menopausia', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
            <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Antecedentes Varones</h5>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1 flex flex-col justify-center">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Vida Sexual Activa</span>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                    <input type="radio" checked={sec.varonVidaSexualActiva === 'si'} onChange={() => updateField('varonVidaSexualActiva', 'si')} className="accent-blue-650" /> Sí
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-3xs font-medium cursor-pointer">
                    <input type="radio" checked={sec.varonVidaSexualActiva === 'no'} onChange={() => updateField('varonVidaSexualActiva', 'no')} className="accent-blue-650" /> No
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Grupo y Tipo Sanguíneo</label>
                <input type="text" placeholder="Ej. A+ / O-" value={sec.varonGrupoSanguineo || ''} onChange={e => updateField('varonGrupoSanguineo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Antecedentes Personales Patológicos</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2 w-1/4">Enfermedad</th>
                  <th className="py-2 px-2 text-center w-12">Presentó</th>
                  <th className="py-2 px-2 text-center w-20">Edad (Años)</th>
                  <th className="py-2 px-2 text-center w-24">Control Médico</th>
                  <th className="py-2 pl-2">Complicaciones / Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {diseasesBase.map(d => {
                  const entry = (sec.pathologicalTable || []).find((item: any) => item.enfermedad === d.id) || { presento: false, edad: '', control: 'no', complicacion: '' };
                  return (
                    <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/30 dark:hover:bg-slate-900/30">
                      <td className="py-2 pr-2 font-medium">{d.label}</td>
                      <td className="py-2 px-2 text-center">
                        <input type="checkbox" checked={entry.presento} onChange={e => handlePathologicalChange(d.id, 'presento', e.target.checked)} className="accent-blue-655" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" placeholder="Edad" value={entry.edad} onChange={e => handlePathologicalChange(d.id, 'edad', e.target.value)} className="w-full p-1 text-center bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input type="radio" name={`ctrl_${d.id}`} checked={entry.control === 'si'} onChange={() => handlePathologicalChange(d.id, 'control', 'si')} className="accent-blue-655" /> Sí
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input type="radio" name={`ctrl_${d.id}`} checked={entry.control === 'no'} onChange={() => handlePathologicalChange(d.id, 'control', 'no')} className="accent-blue-655" /> No
                          </label>
                        </div>
                      </td>
                      <td className="py-2 pl-2">
                        <input type="text" placeholder="Especificar..." value={entry.complicacion} onChange={e => handlePathologicalChange(d.id, 'complicacion', e.target.value)} className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Adicciones / Dependencias</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Adicción</th>
                  <th className="py-2 px-2 text-center w-16">Activo</th>
                  <th className="py-2 px-2 text-center w-16">Inactivo</th>
                  <th className="py-2 px-2 text-center w-24">Edad Inicio</th>
                  <th className="py-2 px-2 text-center w-32">Frecuencia</th>
                  <th className="py-2 pl-2">Cantidad Diaria / Notas</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'tabaquismo', label: 'Tabaquismo' },
                  { id: 'alcoholismo', label: 'Alcoholismo' },
                  { id: 'adiccionOtra', label: 'Otra sustancia' }
                ].map(ad => {
                  const entry = sec[ad.id] || { activo: false, inactivo: false, edadInicio: '', frecuencia: '', cantidad: '' };
                  return (
                    <tr key={ad.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/30">
                      <td className="py-2 pr-2 font-medium">{ad.label}</td>
                      <td className="py-2 px-2 text-center">
                        <input type="checkbox" checked={entry.activo} onChange={e => updateNestedField(ad.id, 'activo', e.target.checked)} className="accent-blue-655" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="checkbox" checked={entry.inactivo} onChange={e => updateNestedField(ad.id, 'inactivo', e.target.checked)} className="accent-blue-655" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="text" placeholder="Edad" value={entry.edadInicio || ''} onChange={e => updateNestedField(ad.id, 'edadInicio', e.target.value)} className="w-full p-1 text-center bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="text" placeholder="Frecuencia" value={entry.frecuencia || ''} onChange={e => updateNestedField(ad.id, 'frecuencia', e.target.value)} className="w-full p-1 text-center bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                      <td className="py-2 pl-2">
                        <input type="text" placeholder="Cantidad / Tipo" value={entry.cantidad || ''} onChange={e => updateNestedField(ad.id, 'cantidad', e.target.value)} className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Antecedentes de Anestesia y Traumatismos</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-3xs">
            <div className="space-y-1 flex flex-col justify-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">¿Ha recibido anestesia dental antes?</span>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.anestesiaDental === 'si'} onChange={() => updateField('anestesiaDental', 'si')} className="accent-blue-655" /> Sí
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.anestesiaDental === 'no'} onChange={() => updateField('anestesiaDental', 'no')} className="accent-blue-655" /> No
                </label>
              </div>
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">¿Ha presentado algún problema con la anestesia?</span>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.anestesiaProblema === 'si'} onChange={() => updateField('anestesiaProblema', 'si')} className="accent-blue-655" /> Sí
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.anestesiaProblema === 'no'} onChange={() => updateField('anestesiaProblema', 'no')} className="accent-blue-655" /> No
                </label>
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Especifique problemas de anestesia</label>
              <input type="text" placeholder="Ej. Taquicardia, alergias, hematomas..." value={sec.anestesiaEspecifique || ''} onChange={e => updateField('anestesiaEspecifique', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">¿Ha sido transfundido?</span>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.transfundido === 'si'} onChange={() => updateField('transfundido', 'si')} className="accent-blue-655" /> Sí
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.transfundido === 'no'} onChange={() => updateField('transfundido', 'no')} className="accent-blue-655" /> No
                </label>
              </div>
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">¿Ha sufrido traumatismos recientemente?</span>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.traumatismosRecientes === 'si'} onChange={() => updateField('traumatismosRecientes', 'si')} className="accent-blue-655" /> Sí
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sec.traumatismosRecientes === 'no'} onChange={() => updateField('traumatismosRecientes', 'no')} className="accent-blue-655" /> No
                </label>
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Especifique traumatismos</label>
              <input type="text" placeholder="Ej. Caída con golpe en maxilar superior hace 2 semanas..." value={sec.traumatismosEspecifique || ''} onChange={e => updateField('traumatismosEspecifique', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection5 = () => {
    const sec = officialSectionsData.systemsReview || { symptoms: {} };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        systemsReview: {
          ...(prev.systemsReview || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const handleSymptomChange = (sympId: string, field: string, val: any) => {
      const currentSymptoms = sec.symptoms || {};
      const sympObj = currentSymptoms[sympId] || {};
      const updatedSymptoms = {
        ...currentSymptoms,
        [sympId]: {
          ...sympObj,
          [field]: val
        }
      };
      updateField('symptoms', updatedSymptoms);
    };

    const symptomsBase = [
      { id: 'ansiedad', label: 'Ansiedad' },
      { id: 'depresion', label: 'Depresión' },
      { id: 'cefalea', label: 'Cefalea' },
      { id: 'neuralgia', label: 'Neuralgia' },
      { id: 'temblor', label: 'Temblor' },
      { id: 'acufenos', label: 'Acúfenos' },
      { id: 'fosfenos', label: 'Fosfenos' },
      { id: 'taquicardia', label: 'Taquicardia' },
      { id: 'mareos', label: 'Mareos' },
      { id: 'dolorPrecordial', label: 'Dolor Precordial' },
      { id: 'disnea', label: 'Disnea' },
      { id: 'astenia', label: 'Astenia' },
      { id: 'adinamia', label: 'Adinamia' },
      { id: 'edema', label: 'Edema' },
      { id: 'hematuria', label: 'Hematuria' },
      { id: 'respiracionBucal', label: 'Respiración bucal' },
      { id: 'anorexia', label: 'Anorexia' },
      { id: 'bulimia', label: 'Bulimia' },
      { id: 'xerostomia', label: 'Xerostomía' },
      { id: 'glosopirosis', label: 'Glosopirosis' },
      { id: 'glosodinea', label: 'Glosodinea' },
      { id: 'pirosis', label: 'Pirosis' },
      { id: 'nauseas', label: 'Náuseas' },
      { id: 'vomito', label: 'Vómito' },
      { id: 'hematemesis', label: 'Hematemesis' },
      { id: 'estrenimiento', label: 'Estreñimiento' },
      { id: 'diarrea', label: 'Diarrea' },
      { id: 'oliguria', label: 'Oliguria' },
      { id: 'poliuria', label: 'Poliuria' },
      { id: 'disuria', label: 'Disuria' },
      { id: 'polifagia', label: 'Polifagia' },
      { id: 'polidipsia', label: 'Polidipsia' },
      { id: 'perdidaPeso', label: 'Pérdida de peso' },
      { id: 'artralgia', label: 'Artralgia' },
      { id: 'artritis', label: 'Artritis' },
      { id: 'mialgia', label: 'Mialgia' },
      { id: 'calambres', label: 'Calambres' },
      { id: 'otros', label: 'Otros' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Interrogatorio por Aparatos y Sistemas</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2 w-1/3">Signo o Síntoma</th>
                  <th className="py-2 px-2 text-center w-20">Presenta</th>
                  <th className="py-2 px-2 w-1/4">Frecuencia</th>
                  <th className="py-2 pl-2">Tiempo de Evolución / Notas</th>
                </tr>
              </thead>
              <tbody>
                {symptomsBase.map(s => {
                  const entry = sec.symptoms?.[s.id] || { presenta: false, frecuencia: '', tiempo: '' };
                  return (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/30">
                      <td className="py-2 pr-2 font-medium text-slate-850 dark:text-slate-200">
                        {s.label}
                        {s.id === 'dolorPrecordial' && (
                          <div className="flex gap-2.5 mt-1 font-normal text-[8px] text-slate-400 uppercase">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input type="radio" checked={entry.frecuencia === 'Esfuerzo'} onChange={() => handleSymptomChange(s.id, 'frecuencia', 'Esfuerzo')} className="accent-blue-650" /> Esfuerzo
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input type="radio" checked={entry.frecuencia === 'Sin Esfuerzo'} onChange={() => handleSymptomChange(s.id, 'frecuencia', 'Sin Esfuerzo')} className="accent-blue-650" /> Sin esfuerzo
                            </label>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="checkbox" checked={entry.presenta} onChange={e => handleSymptomChange(s.id, 'presenta', e.target.checked)} className="accent-blue-655" />
                      </td>
                      <td className="py-2 px-2">
                        {s.id !== 'dolorPrecordial' && (
                          <input type="text" placeholder="Frecuencia" value={entry.frecuencia || ''} onChange={e => handleSymptomChange(s.id, 'frecuencia', e.target.value)} className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                        )}
                      </td>
                      <td className="py-2 pl-2">
                        <input type="text" placeholder="Ej. 3 meses" value={entry.tiempo || ''} onChange={e => handleSymptomChange(s.id, 'tiempo', e.target.value)} className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded text-3xs focus:outline-none" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSection6 = () => {
    const sec = officialSectionsData.physicalExam || { actitudPaciente: '', caraCuello: {}, atmExploracion: '', musculos: {} };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        physicalExam: {
          ...(prev.physicalExam || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const updateCaraCuello = (field: string, val: any) => {
      const cc = sec.caraCuello || {};
      updateField('caraCuello', {
        ...cc,
        [field]: val
      });
    };

    const updateMusculo = (field: string, val: boolean) => {
      const musc = sec.musculos || {};
      updateField('musculos', {
        ...musc,
        [field]: val
      });
    };

    const areas = [
      { id: 'frente', label: 'Frente' },
      { id: 'cejas', label: 'Cejas' },
      { id: 'ojos', label: 'Ojos' },
      { id: 'nariz', label: 'Nariz' },
      { id: 'labios', label: 'Labios' },
      { id: 'mejillas', label: 'Mejillas' },
      { id: 'menton', label: 'Mentón' },
      { id: 'cuello', label: 'Cuello' }
    ];

    const musculos = [
      { id: 'maseteros', label: 'Maseteros' },
      { id: 'temporales', label: 'Temporales' },
      { id: 'pterigoideoExt', label: 'Pterigoideo Externo' },
      { id: 'pterigoideoInt', label: 'Pterigoideo Interno' },
      { id: 'esternocleidomastoideo', label: 'Esternocleidomastoideo' },
      { id: 'trapecios', label: 'Trapecios' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Actitud del Paciente</label>
          <textarea rows={2} value={sec.actitudPaciente || ''} onChange={e => updateField('actitudPaciente', e.target.value)} placeholder="Ej. Cooperativo, ansioso, receptivo..." className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 resize-none" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Exploración de Cara y Cuello</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {areas.map(a => (
              <div key={a.id} className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">{a.label}</label>
                <input type="text" placeholder={`Observaciones de ${a.label.toLowerCase()}`} value={sec.caraCuello?.[a.id] || ''} onChange={e => updateCaraCuello(a.id, e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Exploración de ATM</label>
          <textarea rows={3} value={sec.atmExploracion || ''} onChange={e => updateField('atmExploracion', e.target.value)} placeholder="Desviación de apertura, ruidos articulares (chasquido, crepitación), dolor palpación..." className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none resize-none" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Palpación de Músculos Maseteros y del Cuello</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Músculo</th>
                  <th className="py-2 px-2 text-center w-32">Derecho (Dolor / Tensión)</th>
                  <th className="py-2 px-2 text-center w-32">Izquierdo (Dolor / Tensión)</th>
                </tr>
              </thead>
              <tbody>
                {musculos.map(m => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/35 dark:hover:bg-slate-900/35">
                    <td className="py-2 pr-2 font-medium">{m.label}</td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!sec.musculos?.[`${m.id}D`]}
                        onChange={e => updateMusculo(`${m.id}D`, e.target.checked)}
                        className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!sec.musculos?.[`${m.id}I`]}
                        onChange={e => updateMusculo(`${m.id}I`, e.target.checked)}
                        className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSection7 = () => {
    const sec = officialSectionsData.intrabucalExam || { tejidosBlandos: {}, ihos: { cita1: {}, mitadTx: {}, ultimaCita: {} } };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        intrabucalExam: {
          ...(prev.intrabucalExam || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const updateTejidoBlando = (field: string, val: any) => {
      const tb = sec.tejidosBlandos || {};
      updateField('tejidosBlandos', {
        ...tb,
        [field]: val
      });
    };

    const updateIhos = (citaId: string, field: string, val: any) => {
      const ih = sec.ihos || {};
      const citaObj = ih[citaId] || {};
      const updatedCita = {
        ...citaObj,
        [field]: val
      };
      
      const teethList = [
        { pdb: 'd16_pdb', cal: 'd16_cal' },
        { pdb: 'd11_pdb', cal: 'd11_cal' },
        { pdb: 'd26_pdb', cal: 'd26_cal' },
        { pdb: 'd46_pdb', cal: 'd46_cal' },
        { pdb: 'd31_pdb', cal: 'd31_cal' },
        { pdb: 'd36_pdb', cal: 'd36_cal' }
      ];
      
      let sumPdb = 0;
      let countPdb = 0;
      let sumCal = 0;
      let countCal = 0;
      
      teethList.forEach(t => {
        const valPdbStr = t.pdb === field ? val : citaObj[t.pdb];
        const valCalStr = t.cal === field ? val : citaObj[t.cal];
        
        if (valPdbStr !== undefined && valPdbStr !== '') {
          sumPdb += parseInt(valPdbStr) || 0;
          countPdb++;
        }
        if (valCalStr !== undefined && valCalStr !== '') {
          sumCal += parseInt(valCalStr) || 0;
          countCal++;
        }
      });
      
      const avgPdb = countPdb > 0 ? (sumPdb / countPdb) : 0;
      const avgCal = countCal > 0 ? (sumCal / countCal) : 0;
      const totalIhos = avgPdb + avgCal;
      
      let interp = 'Bajo';
      if (totalIhos > 1.2 && totalIhos <= 3.0) interp = 'Medio';
      else if (totalIhos > 3.0) interp = 'Alto';
      
      updatedCita.interpretacion = interp;
      
      updateField('ihos', {
        ...ih,
        [citaId]: updatedCita
      });
    };

    const tejidos = [
      { id: 'labios', label: 'Labios' },
      { id: 'mucosaYugal', label: 'Mucosa Yugal' },
      { id: 'frenillos', label: 'Frenillos' },
      { id: 'encia', label: 'Encía' },
      { id: 'paladar', label: 'Paladar' },
      { id: 'orofaringe', label: 'Orofaringe' },
      { id: 'istmoFauces', label: 'Istmo de las fauces' },
      { id: 'uvula', label: 'Úvula' },
      { id: 'amigdalas', label: 'Amígdalas' },
      { id: 'lengua', label: 'Lengua' },
      { id: 'pisoBoca', label: 'Piso de Boca' }
    ];

    const renderIhosCita = (citaId: string, title: string) => {
      const citaData = sec.ihos?.[citaId] || {};
      const teethCols = [
        { id: 'd16', label: '16' },
        { id: 'd11', label: '11 / 21' },
        { id: 'd26', label: '26' },
        { id: 'd46', label: '46' },
        { id: 'd31', label: '31 / 41' },
        { id: 'd36', label: '36' }
      ];

      return (
        <div className="bg-slate-100/40 dark:bg-slate-900/10 p-3 border border-slate-200/50 dark:border-slate-800/60 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h6 className="font-bold text-[11px] text-slate-700 dark:text-slate-200">{title}</h6>
            <div className="flex items-center gap-2 text-3xs">
              <label className="font-bold uppercase tracking-wider text-slate-400">Fecha:</label>
              <input type="date" value={citaData.fecha || ''} onChange={e => updateIhos(citaId, 'fecha', e.target.value)} className="p-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded focus:outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center">
            {teethCols.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-2 border border-slate-200/50 dark:border-slate-800 rounded-lg text-center space-y-1">
                <span className="block font-bold text-3xs text-blue-650 dark:text-blue-400">{t.label}</span>
                <div className="grid grid-cols-2 gap-1 text-[8px]">
                  <div>
                    <label className="block text-slate-450 font-bold">PDB</label>
                    <select value={citaData[`${t.id}_pdb`] ?? ''} onChange={e => updateIhos(citaId, `${t.id}_pdb`, e.target.value)} className="w-full p-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                      <option value="">-</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-450 font-bold">CAL</label>
                    <select value={citaData[`${t.id}_cal`] ?? ''} onChange={e => updateIhos(citaId, `${t.id}_cal`, e.target.value)} className="w-full p-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                      <option value="">-</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-blue-50/50 dark:bg-blue-950/10 p-2 border border-blue-200/30 dark:border-blue-800/40 rounded-lg text-center space-y-1 col-span-2 md:col-span-1">
              <span className="block font-bold text-[9px] uppercase tracking-wider text-slate-400">Interp.</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                citaData.interpretacion === 'Alto' ? 'bg-red-105 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                citaData.interpretacion === 'Medio' ? 'bg-amber-105 text-amber-850 dark:bg-amber-955/40 dark:text-amber-400' :
                'bg-green-105 text-green-800 dark:bg-green-955/40 dark:text-green-400'
              }`}>{citaData.interpretacion || 'Bajo'}</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Exploración de Tejidos Blandos</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tejidos.map(t => (
              <div key={t.id} className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.label}</label>
                <input type="text" placeholder={`Observaciones de ${t.label.toLowerCase()}`} value={sec.tejidosBlandos?.[t.id] || ''} onChange={e => updateTejidoBlando(t.id, e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <div>
            <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400">Índice de Higiene Oral Simplificado (IHOS)</h5>
            <p className="text-[10px] text-slate-400">Fichas de evaluación y códigos por diente (Placa de Detritos / Cálculo).</p>
          </div>
          <div className="space-y-4">
            {renderIhosCita('cita1', '1° Cita (Evaluación Inicial)')}
            {renderIhosCita('mitadTx', 'Mitad de Tratamiento')}
            {renderIhosCita('ultimaCita', 'Última Cita (Conclusión)')}
          </div>
          
          <div className="p-3 bg-blue-50/45 dark:bg-blue-950/10 border border-blue-200/25 dark:border-blue-800/30 rounded-xl text-[10px] leading-relaxed text-slate-500 space-y-1.5">
            <span className="font-bold text-blue-800 dark:text-blue-450 block">Guía de Códigos IHOS:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[9px]">
              <div><strong>0:</strong> Ausencia de PDB / Cálculo</div>
              <div><strong>1:</strong> PDB / Cálculo cubre hasta 1/3</div>
              <div><strong>2:</strong> PDB / Cálculo cubre entre 1/3 y 2/3</div>
              <div><strong>3:</strong> PDB / Cálculo cubre más de 2/3</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection8 = () => {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-6 text-center py-8">
        <div className="max-w-md mx-auto space-y-4">
          <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto animate-pulse" />
          <div>
            <h5 className="font-bold text-sm text-slate-850 dark:text-white">Odontograma del Paciente</h5>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              El odontograma se gestiona en su propia vista interactiva 2D dentro del expediente del paciente para registrar hallazgos y tratamientos específicos por diente.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-left text-3xs space-y-3 shadow-3xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[8px]">Resumen de Códigos Oficiales:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs">
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-red-500 rounded-md shrink-0" /> Rojo: Caries</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-red-500 rounded-md shrink-0 flex items-center justify-center text-white font-bold text-[10px] leading-none">/</span> Rojo con diagonal: Exodoncia</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-blue-500 rounded-md shrink-0 flex items-center justify-center text-white font-bold text-[10px] leading-none">/</span> Azul con diagonal: Diente Ausente</div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-blue-500 rounded-md shrink-0" /> Azul: Obturado</div>
              <div className="flex items-center gap-2 sm:col-span-2"><span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-850 dark:text-white text-3xs tracking-tighter">I---I---I</span> Cálculo Dental</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveExpedienteTab('odontograma');
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-2 mx-auto"
          >
            <Activity className="w-4 h-4" />
            Abrir Panel de Odontograma
          </button>
        </div>
      </div>
    );
  };

  const renderSection9 = () => {
    const sec = officialSectionsData.consentimiento || { nombrePaciente: '', fechaPaciente: '', nombreTestigo: '', fechaTestigo: '', acepto: false, concluidoConformidad: false };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        consentimiento: {
          ...(prev.consentimiento || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Documento de Consentimiento Informado</h5>
          
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl h-52 overflow-y-auto text-2xs leading-relaxed text-slate-700 dark:text-slate-350 space-y-3 font-sans shadow-3xs select-none">
            <p className="font-bold text-slate-800 dark:text-white text-center">CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOLÓGICO</p>
            <p>
              Declaro que los datos referidos son verdaderos y que en caso de haber omitido o falseado algo, puede haber complicaciones en mi tratamiento, o alterar la buena evolución de los procedimientos estomatológicos que aquí se aplican.
            </p>
            <p>
              Asimismo, se me ha explicado de manera clara y completa la alteración o enfermedad bucal que padezco, así como los tratamientos que pudieran realizarse, optando por los que se encuentran en la programación y plan de tratamiento, por sus posibles ventajas funcionales, estéticas y/o económicas.
            </p>
            <p>
              Acepto que fui informado de los posibles riesgos del tratamiento, de las posibles molestias y del beneficio esperado, además del costo que este representa. En el caso de no seguir las indicaciones que se me den después de los tratamientos, estoy consciente de las consecuencias que me puede generar en mi estado de salud.
            </p>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-blue-50/35 dark:bg-blue-950/10 border border-blue-200/20 dark:border-blue-900/30 rounded-xl">
            <input
              type="checkbox"
              id="chk_acepto"
              checked={sec.acepto}
              onChange={e => updateField('acepto', e.target.checked)}
              className="accent-blue-650 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk_acepto" className="text-2xs font-bold text-blue-800 dark:text-blue-450 cursor-pointer select-none">
              He leído y estoy enterado, conforme y acepto el tratamiento clínico propuesto.
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre del Paciente o Responsable</label>
              <input type="text" value={sec.nombrePaciente || ''} onChange={e => updateField('nombrePaciente', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Conformidad</label>
              <input type="date" value={sec.fechaPaciente || ''} onChange={e => updateField('fechaPaciente', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre de Testigo</label>
              <input type="text" value={sec.nombreTestigo || ''} onChange={e => updateField('nombreTestigo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Testigo</label>
              <input type="date" value={sec.fechaTestigo || ''} onChange={e => updateField('fechaTestigo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <SignaturePad
              label="Firma del Paciente o Responsable"
              value={sec.patientSignatureDataUrl}
              onChange={val => updateField('patientSignatureDataUrl', val)}
            />
            <SignaturePad
              label="Firma del Testigo"
              value={sec.witnessSignatureDataUrl}
              onChange={val => updateField('witnessSignatureDataUrl', val)}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-450 border-b border-slate-100 dark:border-slate-800/80 pb-2">Conformidad por Conclusión de Tratamiento y Liquidación del Adeudo</h5>
          
          <div className="p-3 bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-200/25 dark:border-emerald-900/30 rounded-xl">
            <label className="inline-flex items-center gap-2 text-2xs font-bold text-emerald-800 dark:text-emerald-455 cursor-pointer">
              <input
                type="checkbox"
                checked={sec.concluidoConformidad}
                onChange={e => updateField('concluidoConformidad', e.target.checked)}
                className="accent-emerald-650 w-4 h-4"
              />
              Firma de conformidad de haber concluido el tratamiento a entera satisfacción y liquidado todo el saldo económico.
            </label>
          </div>

          {sec.concluidoConformidad && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre del Paciente o Responsable</label>
                  <input type="text" value={sec.conclusionNombrePaciente || ''} onChange={e => updateField('conclusionNombrePaciente', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Conclusión</label>
                  <input type="date" value={sec.conclusionFechaPaciente || ''} onChange={e => updateField('conclusionFechaPaciente', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nombre de Testigo</label>
                  <input type="text" value={sec.conclusionNombreTestigo || ''} onChange={e => updateField('conclusionNombreTestigo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Testigo</label>
                  <input type="date" value={sec.conclusionFechaTestigo || ''} onChange={e => updateField('conclusionFechaTestigo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs focus:outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <SignaturePad
                  label="Firma de Conformidad del Paciente / Responsable"
                  value={sec.completionPatientSignatureDataUrl}
                  onChange={val => updateField('completionPatientSignatureDataUrl', val)}
                />
                <SignaturePad
                  label="Firma de Conformidad del Testigo"
                  value={sec.completionWitnessSignatureDataUrl}
                  onChange={val => updateField('completionWitnessSignatureDataUrl', val)}
                />
              </div>
            </>
          )}
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-4 text-center leading-relaxed">
          La firma digital capturada se guarda como parte del expediente clínico interno. La validación legal avanzada queda sujeta a políticas del consultorio.
        </p>
      </div>
    );
  };

  const renderSection10 = () => {
    const sec = officialSectionsData.diagnosticoPlan || { diagnosticoIntegral: '', planTxList: [] };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        diagnosticoPlan: {
          ...(prev.diagnosticoPlan || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const addPlanTx = () => {
      if (!pathTxForm.planCosto) return;
      const list = [...(sec.planTxList || []), pathTxForm];
      updateField('planTxList', list);
      setPathTxForm({ planCosto: '', txRealizado: '', costo: '', aCuenta: '', fecha: '', firma: '' });
    };

    const removePlanTx = (index: number) => {
      const list = (sec.planTxList || []).filter((_: any, i: number) => i !== index);
      updateField('planTxList', list);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Diagnóstico Integral</label>
          <textarea rows={4} value={sec.diagnosticoIntegral || ''} onChange={e => updateField('diagnosticoIntegral', e.target.value)} placeholder="Ej. Caries de segundo grado en O-D 16, 26. Periodontitis leve generalizada..." className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-3xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600 resize-none" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Programación y Plan de Tratamiento</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-3xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 pr-2">Plan de TX y Costo</th>
                  <th className="py-2 px-2">TX. Realizado</th>
                  <th className="py-2 px-2 text-center w-20">Costo</th>
                  <th className="py-2 px-2 text-center w-20">A Cuenta</th>
                  <th className="py-2 px-2 text-center w-24">Fecha</th>
                  <th className="py-2 px-2 w-28">Firma / Resp.</th>
                  <th className="py-2 pl-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(sec.planTxList || []).map((ptx: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="py-2 pr-2 font-medium">{ptx.planCosto}</td>
                    <td className="py-2 px-2 text-slate-550">{ptx.txRealizado}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold">${ptx.costo}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-500">${ptx.aCuenta}</td>
                    <td className="py-2 px-2 text-center text-slate-400 font-mono">{ptx.fecha}</td>
                    <td className="py-2 px-2 text-slate-550">{ptx.firma}</td>
                    <td className="py-2 pl-2 text-right">
                      <button type="button" onClick={() => removePlanTx(i)} className="text-red-500 hover:text-red-650 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-105/30 dark:bg-slate-900/30">
                  <td className="py-2 pr-2">
                    <input type="text" placeholder="Plan de TX" value={pathTxForm.planCosto} onChange={e => setPathTxForm({ ...pathTxForm, planCosto: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="TX. Realizado" value={pathTxForm.txRealizado} onChange={e => setPathTxForm({ ...pathTxForm, txRealizado: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="0.00" value={pathTxForm.costo} onChange={e => setPathTxForm({ ...pathTxForm, costo: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs text-center font-mono focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="0.00" value={pathTxForm.aCuenta} onChange={e => setPathTxForm({ ...pathTxForm, aCuenta: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs text-center font-mono focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="date" value={pathTxForm.fecha} onChange={e => setPathTxForm({ ...pathTxForm, fecha: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" placeholder="Responsable" value={pathTxForm.firma} onChange={e => setPathTxForm({ ...pathTxForm, firma: e.target.value })} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-3xs focus:outline-none" />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button type="button" onClick={addPlanTx} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ml-auto">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSection11 = () => {
    const sec = officialSectionsData.evolucionNotes || { notes: [] };
    
    const updateField = (field: string, val: any) => {
      setOfficialSectionsData((prev: any) => ({
        ...prev,
        evolucionNotes: {
          ...(prev.evolucionNotes || {}),
          [field]: val
        }
      }));
      setIsDirty(true);
    };

    const addNote = () => {
      if (!noteForm.nota) return;
      const list = [
        {
          id: Math.random().toString(36).substring(2, 9),
          ...noteForm
        },
        ...(sec.notes || [])
      ];
      updateField('notes', list);
      setNoteForm({ fecha: new Date().toISOString().split('T')[0], titulo: '', nota: '', doctor: '' });
    };

    const removeNote = (id: string) => {
      const list = (sec.notes || []).filter((n: any) => n.id !== id);
      updateField('notes', list);
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/10 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Agregar Nota de Evolución</h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-3xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Nota</label>
              <input type="date" value={noteForm.fecha} onChange={e => setNoteForm({ ...noteForm, fecha: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Título Breve</label>
              <input type="text" placeholder="Ej. Cambio de ligas / Resinas" value={noteForm.titulo} onChange={e => setNoteForm({ ...noteForm, titulo: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Doctor / Responsable</label>
              <input type="text" placeholder="Ej. Dr. Pérez" value={noteForm.doctor} onChange={e => setNoteForm({ ...noteForm, doctor: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Detalle de Evolución Clínica</label>
              <textarea rows={3} placeholder="Escribir nota detallada..." value={noteForm.nota} onChange={e => setNoteForm({ ...noteForm, nota: e.target.value })} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none resize-none" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Nota
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-xs text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2">Historial de Notas de Evolución</h5>
          {(sec.notes || []).length === 0 ? (
            <div className="p-8 text-center text-slate-450 border-2 border-dashed border-slate-200/50 dark:border-slate-800 rounded-2xl text-3xs">
              No hay notas de evolución registradas para este paciente.
            </div>
          ) : (
            <div className="space-y-3.5">
              {(sec.notes || []).map((n: any) => (
                <div key={n.id} className="p-4 bg-slate-50 dark:bg-slate-800/15 border border-slate-200/50 dark:border-slate-800 rounded-2xl space-y-2 relative group transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block text-[8px] bg-slate-205 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider mr-2">{n.fecha}</span>
                      <strong className="text-2xs font-bold text-slate-800 dark:text-white">{n.titulo || 'Sin título'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNote(n.id)}
                      className="text-red-500 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer absolute top-3 right-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-3xs text-slate-655 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">{n.nota}</p>
                  <div className="text-[9px] text-slate-400 border-t border-slate-200/30 pt-1.5">
                    Responsable: <span className="font-semibold">{n.doctor || 'No asignado'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailedHistoryQuestionnaire = () => {
    if (!activePatient) return null;
    if (isPrintMode) {
      return (
        <HistoriaClinicaPrintView
          patient={activePatient}
          medicalHistory={medicalHistory}
          onBack={() => setIsPrintMode(false)}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Header y estado de actualización */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div>
            <h4 className="font-sans font-bold text-sm text-[#181c1e] dark:text-white">Historia Clínica Oficial</h4>
            <p className="text-3xs text-[#444748] dark:text-slate-400 mt-0.5">
              Formulario oficial de 11 secciones para el expediente clínico.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintMode(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-855 hover:bg-slate-205 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-355 font-sans text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors no-print border border-slate-205 dark:border-slate-800"
            >
              <Printer className="w-3.5 h-3.5" />
              Vista de Impresión
            </button>
            <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium text-slate-500 dark:text-slate-400">
              Última actualización: <span className="font-mono font-bold">{formatLastUpdated(medicalHistory?.updatedAt)}</span>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-slate-450 dark:text-slate-500 space-y-2">
            <svg className="animate-spin h-6.5 w-6.5 mx-auto text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-sans text-xs">Cargando expediente médico...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Interno */}
            <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-slate-205 dark:border-slate-800 pb-4 lg:pb-0 lg:pr-6 gap-2">
              {[
                { id: 1, label: '1. Datos y Signos' },
                { id: 2, label: '2. Salud Sistémica' },
                { id: 3, label: '3. Ant. Familiares' },
                { id: 4, label: '4. Ant. Personales' },
                { id: 5, label: '5. Interrogatorio' },
                { id: 6, label: '6. Exploración Física' },
                { id: 7, label: '7. Exp. Intrabucal & IHOS' },
                { id: 8, label: '8. Odontograma' },
                { id: 9, label: '9. Consentimiento' },
                { id: 10, label: '10. Diagnóstico y Plan' },
                { id: 11, label: '11. Notas de Evolución' }
              ].map(sec => {
                const isTabActive = activeSectionTab === sec.id;
                const isSecCompleted = (() => {
                  if (!officialSectionsData) return false;
                  switch (sec.id) {
                    case 1:
                      const pd = officialSectionsData.patientData || {};
                      return !!(pd.sexo || pd.lugarNacimiento || pd.peso || pd.altura);
                    case 2:
                      const ss = officialSectionsData.systemicHealth || {};
                      return !!((ss.medications && ss.medications.length > 0) || (ss.systemicDiseases && ss.systemicDiseases.length > 0) || ss.motivoConsulta);
                    case 3:
                      const fh = officialSectionsData.familyHistory || {};
                      return !!(fh.alergiasDetalle || fh.infectocontagiosasDetalle || (fh.matrix && Object.keys(fh.matrix).some(k => Object.values(fh.matrix[k] || {}).some(v => v === true))));
                    case 4:
                      const ph = officialSectionsData.personalHistory || {};
                      return !!(ph.vivienda || ph.habitosHigienicos || ph.menarca || (ph.pathologicalTable && ph.pathologicalTable.length > 0));
                    case 5:
                      const ir = officialSectionsData.systemsReview || {};
                      return !!(ir.symptoms && Object.keys(ir.symptoms).some(k => ir.symptoms[k]?.presenta === true));
                    case 6:
                      const pe = officialSectionsData.physicalExam || {};
                      return !!(pe.actitudPaciente || pe.atmExploracion);
                    case 7:
                      const ie = officialSectionsData.intrabucalExam || {};
                      return !!(ie.ihos?.cita1?.fecha || (ie.tejidosBlandos && Object.values(ie.tejidosBlandos).some(v => v !== '')));
                    case 8:
                      return true;
                    case 9:
                      return !!officialSectionsData.consentimiento?.acepto;
                    case 10:
                      const dp = officialSectionsData.diagnosticoPlan || {};
                      return !!(dp.diagnosticoIntegral || (dp.planTxList && dp.planTxList.length > 0));
                    case 11:
                      const en = officialSectionsData.evolucionNotes || {};
                      return !!(en.notes && en.notes.length > 0);
                    default:
                      return false;
                  }
                })();

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionTab(sec.id)}
                    className={`px-3 py-2 rounded-xl text-3xs font-bold text-left transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal flex items-center justify-between gap-2 shrink-0 lg:w-full ${
                      isTabActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450 border-l-2 border-blue-600'
                        : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {isSecCompleted && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" title="Sección completada" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contenido de la Sección */}
            <div className="flex-1 space-y-6">
              
              {/* Barra de Progreso y Guardar Sección */}
              <div className="bg-slate-50 dark:bg-slate-800/35 p-3 rounded-2xl border border-slate-205 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Progreso General:
                  </div>
                  <div className="flex-1 sm:w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-355"
                      style={{ width: `${(calculateProgress.completed / calculateProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-2xs font-bold text-slate-750 dark:text-slate-355 font-mono">
                    {calculateProgress.completed} de {calculateProgress.total}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {isDirty && (
                    <span className="text-[10px] text-amber-605 dark:text-amber-400 font-bold flex items-center gap-1 mr-2 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" /> Cambios sin guardar
                    </span>
                  )}
                  {activeSectionTab !== 8 && (
                    <button
                      type="button"
                      disabled={savingHistory}
                      onClick={handleSaveActiveSection}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-sans text-3xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Guardar Sección
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={savingHistory}
                    onClick={handleSaveAllOfficial}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-3xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Guardar Todo
                  </button>
                </div>
              </div>

              {/* Secciones de formulario */}
              {activeSectionTab === 1 && renderSection1()}
              {activeSectionTab === 2 && renderSection2()}
              {activeSectionTab === 3 && renderSection3()}
              {activeSectionTab === 4 && renderSection4()}
              {activeSectionTab === 5 && renderSection5()}
              {activeSectionTab === 6 && renderSection6()}
              {activeSectionTab === 7 && renderSection7()}
              {activeSectionTab === 8 && renderSection8()}
              {activeSectionTab === 9 && renderSection9()}
              {activeSectionTab === 10 && renderSection10()}
              {activeSectionTab === 11 && renderSection11()}

            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAttachmentsSection = () => {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex justify-between items-center">
          <div>
            <h4 className="font-sans font-bold text-sm text-[#181c1e] dark:text-white">Adjuntos Clínicos</h4>
            <p className="text-3xs text-[#444748] dark:text-slate-400 mt-0.5 font-medium">Radiografías, documentos y archivos del expediente</p>
          </div>
          <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-3xs font-bold text-slate-650 dark:text-slate-350">
            {attachments.length} {attachments.length === 1 ? 'archivo' : 'archivos'}
          </div>
        </div>

        {/* Formulario de Subida */}
        <form onSubmit={handleUploadAttachment} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-205 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Archivo */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Seleccionar Archivo (Máx 10 MB)
              </label>
              <div className="relative border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-2.5 transition-colors flex items-center justify-center bg-white dark:bg-slate-900 cursor-pointer">
                <input
                  type="file"
                  id="clinical-file-input"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setAttachmentFile(selected);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <FileUp className="w-4.5 h-4.5 text-slate-405 dark:text-slate-555" />
                  <span className="text-3xs font-bold text-slate-600 dark:text-slate-355 truncate max-w-[180px]">
                    {attachmentFile ? attachmentFile.name : 'Elegir archivo JPG, PNG, WEBP, PDF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Categoría */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Categoría
              </label>
              <select
                value={attachmentCategory}
                onChange={(e) => setAttachmentCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-2xs text-[#181c1e] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="Radiografía">Radiografía</option>
                <option value="Fotografía clínica">Fotografía clínica</option>
                <option value="PDF / Documento">PDF / Documento</option>
                <option value="Consentimiento">Consentimiento</option>
                <option value="Receta">Receta</option>
                <option value="Laboratorio">Laboratorio</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Descripción / Notas
              </label>
              <input
                type="text"
                placeholder="Ej. Radiografía panorámica inicial"
                value={attachmentDescription}
                onChange={(e) => setAttachmentDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-2xs text-[#181c1e] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={uploadingAttachment || !attachmentFile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-3xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {uploadingAttachment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Subir archivo
                </>
              )}
            </button>
          </div>
        </form>

        {/* Listado de Adjuntos */}
        {loadingAttachments ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-3xs text-slate-400 font-bold uppercase">Cargando adjuntos...</span>
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-25/10">
            <Paperclip className="w-8 h-8 text-slate-350 dark:text-slate-650 mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Este paciente aún no tiene adjuntos clínicos.</p>
            <p className="text-3xs text-slate-405 dark:text-slate-500 mt-1">Sube radiografías, recetas o estudios clínicos en la parte superior.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((att) => {
              const isPdf = att.mimeType === 'application/pdf';
              const isImage = att.mimeType.startsWith('image/');
              const fileSizeFormatted = formatBytes(att.sizeBytes);
              const uploadDate = new Date(att.createdAt).toLocaleDateString([], {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div key={att.id} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 bg-white dark:bg-slate-900/60 shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-shadow">
                  <div className="space-y-2.5">
                    {/* Encabezado Tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 bg-slate-50 dark:bg-slate-855 rounded-xl">
                        {isImage && <Activity className="w-5 h-5 text-indigo-505 dark:text-indigo-455" />}
                        {isPdf && <FileText className="w-5 h-5 text-red-500 dark:text-red-455" />}
                        {!isImage && !isPdf && <Paperclip className="w-5 h-5 text-slate-400" />}
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 rounded-lg">
                        {att.category}
                      </span>
                    </div>

                    {/* Detalles */}
                    <div>
                      <h5 className="text-2xs font-bold text-slate-750 dark:text-slate-200 truncate" title={att.originalName}>
                        {att.originalName}
                      </h5>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        Subido el {uploadDate} • {fileSizeFormatted}
                      </p>
                      {att.description && (
                        <p className="text-3xs text-slate-600 dark:text-slate-455 bg-slate-50 dark:bg-slate-855 p-2 rounded-lg mt-2 font-medium">
                          {att.description}
                        </p>
                      )}
                      {att.uploadedBy && (
                        <p className="text-[8px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mt-1.5">
                          Por: {att.uploadedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-855 pt-3 mt-4">
                    {isImage && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = getToken();
                            const headers = new Headers();
                            if (token) headers.set('Authorization', `Bearer ${token}`);
                            const res = await fetch(att.url!, { headers });
                            if (!res.ok) throw new Error('No se pudo cargar la vista previa');
                            const blob = await res.blob();
                            if (previewImage) {
                              URL.revokeObjectURL(previewImage);
                            }
                            const objectUrl = URL.createObjectURL(blob);
                            setPreviewImage(objectUrl);
                            setPreviewTitle(att.originalName);
                          } catch (err: any) {
                            if (showToast) showToast('Error al cargar la imagen', 'error');
                          }
                        }}
                        className="px-2.5 py-1.5 text-3xs font-bold text-slate-655 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    )}
                    {isPdf && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = getToken();
                            const headers = new Headers();
                            if (token) headers.set('Authorization', `Bearer ${token}`);
                            const res = await fetch(att.url!, { headers });
                            if (!res.ok) throw new Error('No se pudo abrir el PDF');
                            const blob = await res.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            window.open(objectUrl, '_blank');
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
                          } catch (err: any) {
                            if (showToast) showToast('Error al abrir el PDF', 'error');
                          }
                        }}
                        className="px-2.5 py-1.5 text-3xs font-bold text-slate-655 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Abrir PDF
                      </button>
                    )}
                    {!isImage && !isPdf && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = getToken();
                            const headers = new Headers();
                            if (token) headers.set('Authorization', `Bearer ${token}`);
                            const res = await fetch(att.url!, { headers });
                            if (!res.ok) throw new Error('No se pudo descargar el archivo');
                            const blob = await res.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = objectUrl;
                            a.download = att.originalName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(objectUrl);
                          } catch (err: any) {
                            if (showToast) showToast('Error al descargar el archivo', 'error');
                          }
                        }}
                        className="px-2.5 py-1.5 text-3xs font-bold text-slate-655 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="px-2.5 py-1.5 text-3xs font-bold text-red-505 hover:text-red-750 hover:bg-red-55 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="archivero-view-root" className="p-6 overflow-y-auto space-y-6">
      
      {/* VISTA 1: ARCHIVERO DE EXPEDIENTES GENERAL */}
      {!activePatient ? (
        <div className="space-y-6 font-sans">
          
          {/* A. Encabezado Superior */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/35 border border-teal-200/30 flex items-center justify-center text-teal-600 dark:text-teal-450">
                <FolderOpen className="w-5.5 h-5.5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">Archivero</h2>
                <p className="text-3xs text-[#444748] dark:text-slate-400 mt-0.5">Expedientes organizados alfabéticamente</p>
              </div>
            </div>

            {/* Barra de Búsqueda y Botón de Filtros */}
            <div className="flex items-center gap-3 w-full md:w-auto relative">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente, expediente o teléfono..."
                  className="w-full pl-9.5 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-3xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botón de Filtros */}
              <div className="relative">
                <button 
                  onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                  className={`border rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-3xs transition-all ${
                    statusFilter !== 'Todos' || sortBy !== 'estado'
                      ? 'border-teal-500/40 bg-teal-50/20 text-teal-600 dark:text-teal-400'
                      : 'border-slate-205 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtros</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown de Filtros Flotante */}
                {showFiltersDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFiltersDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl z-20 space-y-4">
                      
                      {/* Estado */}
                      <div className="space-y-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Filtrar por Estado</label>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { value: 'Todos', label: 'Todos los pacientes' },
                            { value: 'Activo', label: 'Activos' },
                            { value: 'Inactivo', label: 'Inactivos' },
                            { value: 'Archivado', label: 'Archivados' },
                            { value: 'Con Alergias', label: 'Con Alergias' },
                            { value: 'Con Citas Futuras', label: 'Con Citas Futuras' }
                          ].map(f => (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => {
                                setStatusFilter(f.value as any);
                                setShowFiltersDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-colors ${
                                statusFilter === f.value
                                  ? 'bg-teal-500 text-white font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ordenar */}
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ordenar por</label>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { value: 'estado', label: 'Estado (Activos primero)' },
                            { value: 'A-Z', label: 'Nombre (Alfabético A-Z)' },
                            { value: 'proxima_cita', label: 'Fecha de próxima cita' },
                            { value: 'ultima_cita', label: 'Fecha de última cita' },
                            { value: 'fecha_registro', label: 'Fecha de registro' }
                          ].map(o => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => {
                                setSortBy(o.value as any);
                                setShowFiltersDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-colors ${
                                sortBy === o.value
                                  ? 'bg-teal-500 text-white font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* B. Tabs Alfabéticos Horizontales */}
          <div className="flex items-center w-full overflow-x-auto scrollbar-none border-b border-slate-200/60 dark:border-slate-800 pb-0.5 gap-1">
            {alphabetSections.map(sec => {
              const isActive = activeSection.label === sec.label;
              return (
                <button
                  key={sec.label}
                  onClick={() => setActiveSection(sec)}
                  className={`px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold bg-teal-50/10 dark:bg-teal-950/10' 
                      : 'border-transparent text-[#444748] dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* C. GABINETE / ARCHIVERO ÚNICO GRANDE */}
          <div className="bg-slate-200 dark:bg-slate-800/75 border-4 border-slate-300 dark:border-slate-700 rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden relative border-b-8">
            
            {/* Cabecera interna del cajón */}
            <div className="bg-slate-100/70 dark:bg-slate-900/50 p-4 px-6 border-b border-slate-300 dark:border-slate-750 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Archive className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="font-mono font-bold text-slate-800 dark:text-white text-base mr-2">{activeSection.label}</span>
                <span className="text-3xs text-[#444748] dark:text-slate-400 hidden sm:inline">
                  Pacientes con apellidos que inician con {activeSection.label}
                </span>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-teal-600 dark:text-teal-400">
                🗄️ {totalItems} {totalItems === 1 ? 'expediente' : 'expedientes'}
              </div>
            </div>

            {/* Interior del cajón con folders en grid */}
            <div className="bg-gradient-to-b from-slate-300/40 via-slate-100/25 to-slate-200/10 dark:from-slate-900/80 dark:to-slate-950/30 p-6 min-h-[460px] flex flex-col justify-between shadow-inner">
              
              {paginatedPatients.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-450 dark:text-slate-500">
                  <AlertCircle className="w-9 h-9 mb-2 text-slate-400 dark:text-slate-600" />
                  <p className="font-sans text-xs">
                    {searchQuery 
                      ? 'No se encontraron expedientes con esa búsqueda.' 
                      : `No hay expedientes en esta sección alfabética (${activeSection.label}).`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 pt-4">
                  {paginatedPatients.map(patient => {
                    const proxima = patientCitasMap[patient.id]?.proxima;
                    const ultima = patientCitasMap[patient.id]?.ultima;

                    return (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="bg-[#fefcf7] dark:bg-slate-800/95 border border-[#dfdac9] dark:border-slate-700/80 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl rounded-tl-none p-5 shadow-2xs cursor-pointer hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between min-h-[190px] border-l-2"
                      >
                        {/* Pestaña superior del Folder */}
                        <div className="absolute -top-[16px] left-0 w-32 h-[16px] bg-[#fefcf7] dark:bg-slate-800/95 border-t border-x border-[#dfdac9] dark:border-slate-700/80 rounded-t-lg transition-colors group-hover:bg-teal-50/15 dark:group-hover:bg-teal-950/15 flex items-center justify-center">
                          <span className="text-[8px] font-sans font-bold text-slate-450 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 uppercase tracking-widest truncate max-w-[110px]">
                            EXP-{patient.id.slice(-6)}
                          </span>
                        </div>

                        {/* Contenido Principal */}
                        <div className="space-y-3 pt-1">
                          
                          {/* Cabecera: Nombre y Estado */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200/50">
                                {patient.initials}
                              </div>
                              <h3 className="font-sans font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors text-xs line-clamp-1">
                                {patient.name}
                              </h3>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </span>
                          </div>

                          {/* Datos del Paciente */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans border-t border-b border-slate-100 dark:border-slate-800/60 py-2">
                            <div>
                              <span className="text-[8px] uppercase text-slate-400 block font-bold">Edad</span>
                              <span className="font-semibold text-slate-850 dark:text-slate-300">{patient.age} años</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase text-slate-400 block font-bold">Teléfono</span>
                              <span className="font-mono text-slate-850 dark:text-slate-300">{patient.phone}</span>
                            </div>
                          </div>

                          {/* Alergias / Riesgo */}
                          <div className="text-[10px] space-y-1 font-sans">
                            {patient.allergies ? (
                              <div className="flex items-center gap-1 text-red-500 font-bold">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                <span className="truncate max-w-[180px]">Alergia: {patient.allergies}</span>
                              </div>
                            ) : (
                              <div className="text-slate-450 dark:text-slate-500 flex items-center gap-1 font-medium">
                                <Check className="w-3 h-3 text-slate-400" /> Alergia: Ninguna conocida
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-bold text-[8px] uppercase">Riesgo:</span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${getRiskColor(patient.riskLevel)}`}>
                                {patient.riskLevel}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Visitas Historial */}
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-700/80 text-[10px] font-sans space-y-1 text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Última visita:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {ultima ? ultima.date : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Próxima cita:</span>
                            <span className={`font-mono font-semibold ${
                              proxima 
                                ? 'text-teal-600 dark:text-teal-400 font-bold' 
                                : 'text-slate-500'
                            }`}>
                              {proxima ? proxima.date : '—'}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* D. Frente del cajón metálico (Pie) */}
            <div className="bg-[#cbd5e1] dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 p-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-inner relative">
              
              {/* Contador lateral izquierdo */}
              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center sm:text-left">
                <div className="font-bold text-slate-800 dark:text-slate-300">{totalItems} expedientes</div>
                <div>Mostrando {fromItem}–{toItem} de {totalItems}</div>
              </div>

              {/* Manija Metálica Central con Etiqueta */}
              <div className="flex flex-col items-center shrink-0">
                {/* Etiqueta */}
                <div className="bg-[#f8fafc] dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600 rounded px-5 py-0.5 font-sans font-bold text-slate-800 dark:text-slate-200 tracking-wider shadow-inner text-xs uppercase">
                  {activeSection.label}
                </div>
                {/* Manija */}
                <div className="w-20 h-2.5 bg-gradient-to-r from-slate-400 via-slate-250 to-slate-400 dark:from-slate-650 dark:via-slate-550 dark:to-slate-650 rounded-b-lg border-x border-b border-slate-400 dark:border-slate-700 shadow flex items-center justify-center cursor-default">
                  <div className="w-12 h-0.5 bg-slate-250/20 rounded-full"></div>
                </div>
              </div>

              {/* Paginación a la derecha */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                <span className="px-3 py-1 bg-teal-500 text-white rounded-lg text-xs font-bold shadow-3xs font-mono">
                  {currentPage}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* VISTA 2: EXPEDIENTE INDIVIDUAL DEL PACIENTE ABIERTO */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Botón de Regresar al Archivero */}
          <div className="no-print">
            <button 
              onClick={() => setSelectedPatientId('')}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-sans font-bold text-xs uppercase tracking-wider cursor-pointer hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Archivero
            </button>
          </div>

          {/* Diseño de Panel Dividido (Carpeta a la izquierda, Cajoneras de Archivo a la derecha) */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            
            {/* Panel Principal (Izquierda): Carpeta del Expediente */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* Pestañas de archivador físico (slanted tabs) - Grupos de Letras */}
              <div className="flex flex-wrap items-end pl-2 sm:pl-4 -mb-[1px] relative z-10 select-none overflow-x-auto sm:overflow-x-visible no-print">
                {[
                  { label: 'A – E', start: 'A', end: 'E' },
                  { label: 'F – J', start: 'F', end: 'J' },
                  { label: 'K – O', start: 'K', end: 'O' },
                  { label: 'P – T', start: 'P', end: 'T' },
                  { label: 'U – Z', start: 'U', end: 'Z' }
                ].map((group, idx) => {
                  const groupPatients = patients.filter(p => {
                    const initial = getSortableChar(p.name);
                    return initial >= group.start && initial <= group.end;
                  });
                  const hasPatients = groupPatients.length > 0;
                  const activeLetter = getSortableChar(activePatient.name);
                  const isActive = activeLetter >= group.start && activeLetter <= group.end;
                  
                  // Theme styles mapping
                  let parentBg = 'bg-slate-200 dark:bg-slate-800/80';
                  let innerBg = 'bg-slate-100/35 dark:bg-slate-850/20 text-slate-400 dark:text-slate-650 cursor-not-allowed opacity-30';
                  
                  if (isActive) {
                    parentBg = 'bg-slate-350 dark:bg-slate-700';
                    innerBg = 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-extrabold cursor-pointer';
                  } else if (hasPatients) {
                    parentBg = 'bg-blue-150 dark:bg-blue-950/40';
                    innerBg = 'bg-blue-50/60 dark:bg-blue-900/15 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100/80 dark:hover:bg-blue-900/30 cursor-pointer';
                  }
                  
                  return (
                    <button
                      key={group.label}
                      disabled={!hasPatients}
                      onClick={() => {
                        if (!hasPatients) return;
                        // Cycle to next patient in this group if already active on this group
                        if (isActive && groupPatients.length > 1) {
                          const currentIndex = groupPatients.findIndex(p => p.id === activePatient.id);
                          const nextIndex = (currentIndex + 1) % groupPatients.length;
                          setSelectedPatientId(groupPatients[nextIndex].id);
                        } else {
                          setSelectedPatientId(groupPatients[0].id);
                        }
                      }}
                      className="group relative pb-[1px] focus:outline-none shrink-0"
                      style={{ 
                        minWidth: '100px',
                        smMinWidth: '130px',
                        zIndex: isActive ? 20 : 10 - idx,
                        marginRight: '-8px'
                      }}
                      title={hasPatients ? `${groupPatients.length} paciente(s) en la sección ${group.label}` : `Sin pacientes en la sección ${group.label}`}
                    >
                      {/* Parent border emulator */}
                      <div className={`p-[1px] folder-tab-clip ${parentBg} transition-all duration-150`}>
                        {/* Inner tab */}
                        <div className={`px-4 py-2 folder-tab-clip ${innerBg} transition-all duration-150 flex items-center justify-center text-xs font-bold`}>
                          {group.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cuerpo de la Carpeta (Contenido Principal) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-250/70 dark:border-slate-800 rounded-b-2xl rounded-tr-2xl sm:rounded-tl-none shadow-3xs p-6 flex-1 flex flex-col space-y-6">
                
                {/* Cabecera del Paciente (Dentro de la carpeta) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {activePatient.avatar ? (
                        <img 
                          src={activePatient.avatar} 
                          alt={activePatient.name} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg border border-blue-200">
                          {activePatient.initials}
                        </div>
                      )}
                      {/* Online dot at bottom right */}
                      {(activePatient.id === 'PX-88291-LV' || activePatient.id === 'PX-12345-JC') && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                          {activePatient.name}
                        </h3>
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 rounded-md text-[8px] font-bold uppercase tracking-wider">
                          {activePatient.status === 'Activo' ? 'ACTIVO' : activePatient.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-3xs font-medium text-slate-450 dark:text-slate-400">
                        <span className="font-mono">ID: {activePatient.id}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-405" />
                          {activePatient.dob}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <Droplet className="w-3.5 h-3.5 fill-current text-rose-500" />
                          {activePatient.id === 'PX-88291-LV' ? '0 Positive' : activePatient.id === 'PX-12345-JC' ? 'AB Negative' : 'O Positive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-amber-500 bg-amber-50/20 cursor-pointer" title="Favorito">
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-slate-450 dark:text-slate-400 cursor-pointer" title="Compartir">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-slate-450 dark:text-slate-400 cursor-pointer" title="Email">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contenido del Expediente */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Grid de Resumen y Alergias */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Resumen Clínico */}
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-205 dark:border-slate-800/80 rounded-2xl space-y-3.5">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                          RESUMEN CLÍNICO
                        </h5>
                        <div className="space-y-2 text-2xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Médico Encargado:</span>
                            <span className="font-bold text-slate-850 dark:text-slate-200">
                              {activePatient.id === 'PX-88291-LV' ? 'Dr. Aris Thorne' : 'Dr. Pérez'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Última Visita:</span>
                            <span className="font-bold text-slate-850 dark:text-slate-200">
                              {activePatient.id === 'PX-88291-LV' ? '2023-10-24' : '2026-06-16'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Riesgo Detectado:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {activePatient.id === 'PX-88291-LV' ? 'Moderate' : activePatient.riskLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Alergias y Contraindicaciones */}
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-205 dark:border-slate-800/80 rounded-2xl space-y-3.5">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                          ALERGIAS Y CONTRAINDICACIONES
                        </h5>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {activePatient.allergies ? (
                            activePatient.allergies.split(',').map(allergy => (
                              <span 
                                key={allergy}
                                className="px-3.5 py-1.5 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-full text-3xs font-extrabold tracking-wide font-sans shadow-4xs"
                              >
                                {allergy.trim() === 'Penicilina' ? 'Penicillin' : allergy.trim() === 'Látex' ? 'Latex (Mild)' : allergy.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-2xs font-medium">
                              Ninguna alergia reportada.
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Notas de Evolución Recientes */}
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <h4 className="font-sans font-bold text-xs text-[#181c1e] dark:text-white uppercase tracking-wider">
                          NOTAS DE EVOLUCIÓN RECIENTES
                        </h4>
                        <button 
                          onClick={() => setShowQuickNoteForm(!showQuickNoteForm)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-3xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" /> Anexar Nota
                        </button>
                      </div>

                      {/* Formulario rápido de nota */}
                      {showQuickNoteForm && (
                        <div className="p-4 bg-slate-55 dark:bg-slate-850 border border-blue-200 dark:border-blue-900/40 rounded-2xl space-y-3">
                          <h5 className="font-bold text-xs text-blue-600 dark:text-blue-400">Nueva Nota de Evolución</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-3xs">
                            <input 
                              type="text" 
                              placeholder="Título de la nota..." 
                              value={noteForm.titulo}
                              onChange={e => setNoteForm({ ...noteForm, titulo: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Doctor..." 
                              value={noteForm.doctor}
                              onChange={e => setNoteForm({ ...noteForm, doctor: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none"
                            />
                            <textarea 
                              rows={2} 
                              placeholder="Detalle clínico de evolución..." 
                              value={noteForm.nota}
                              onChange={e => setNoteForm({ ...noteForm, nota: e.target.value })}
                              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl sm:col-span-2 resize-none focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2 text-3xs">
                            <button 
                              onClick={() => setShowQuickNoteForm(false)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={handleSaveQuickNote}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                            >
                              Guardar Nota
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Listado de Notas */}
                      <div className="space-y-3.5">
                        {((officialSectionsData.evolucionNotes?.notes) || []).length === 0 ? (
                          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-2xs bg-slate-50/20">
                            No hay notas de evolución registradas para este paciente.
                          </div>
                        ) : (
                          (officialSectionsData.evolucionNotes?.notes || []).map((n: any) => (
                            <div key={n.id} className="p-4 bg-slate-50/40 dark:bg-slate-800/10 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 relative group transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="inline-block text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-450 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider mr-2">
                                    {n.fecha}
                                  </span>
                                  <strong className="text-2xs font-bold text-slate-800 dark:text-white">{n.titulo}</strong>
                                </div>
                                <button
                                  onClick={() => handleRemoveQuickNote(n.id)}
                                  className="text-red-500 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-3xs text-slate-600 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                                {n.nota}
                              </p>
                              <div className="text-[9px] text-slate-400 border-t border-slate-200/30 pt-1.5">
                                Responsable: <span className="font-semibold">{n.doctor || 'Dr. Aris Thorne'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cuestionario Detallado de Historia Clínica */}
                    <div className="border-t border-slate-200 dark:border-slate-850 pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                            Historia Clínica Detallada (11 Secciones)
                          </h5>
                          <p className="text-3xs text-slate-400 mt-0.5">Gestione el cuestionario completo oficial de salud dental.</p>
                        </div>
                        <button
                          onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-3xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors select-none"
                        >
                          <span>{showDetailedHistory ? 'Ocultar Cuestionario' : 'Mostrar Cuestionario'}</span>
                          {showDetailedHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {showDetailedHistory && (
                        <div className="p-4 bg-slate-50/20 dark:bg-slate-800/5 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-200">
                          {renderDetailedHistoryQuestionnaire()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Lateral (Derecha): Cajoneras de Archivo */}
            <div className="lg:w-80 w-full shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-4 flex flex-col shadow-3xs no-print h-max lg:h-[750px]">
              
              {/* Encabezado del listado lateral */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-405">
                  CAJONERAS DE ARCHIVO ({patients.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSidebarSort('A-Z')}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      sidebarSort === 'A-Z'
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Ordenar A-Z"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSidebarSort('recent')}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      sidebarSort === 'recent'
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Ordenar por Citas Recientes"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Listado vertical de pacientes (ficheros) */}
              <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 max-h-[500px] lg:max-h-none">
                {sidebarPatients.map(p => {
                  const isSelected = p.id === selectedPatientId;
                  const lastAppt = patientCitasMap[p.id]?.proxima || patientCitasMap[p.id]?.ultima;
                  const treatmentText = lastAppt ? lastAppt.treatment : 'Consulta general';
                  const timeText = getPatientActivityTime(p.id);
                  
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        // Restablecer a historial al cambiar de paciente
                        setActiveExpedienteTab('historial');
                      }}
                      className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-slate-205 border-l-4 border-l-blue-600 dark:border-slate-800 shadow-3xs'
                          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/45'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 select-none">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-800" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xs">
                            {p.initials}
                          </div>
                        )}
                        {/* Indicator dot */}
                        {(p.id === 'PX-88291-LV' || p.id === 'PX-12345-JC') && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className={`font-sans font-bold text-2xs truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {p.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 shrink-0 font-medium">{timeText}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{treatmentText}</p>
                        {/* Dots */}
                        {renderStatusDots(p)}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Modal de Previsualización de Imágenes */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden max-w-3xl w-full border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#181c1e] dark:text-white truncate max-w-[80%]">
                Vista Previa: {previewTitle}
              </h4>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewImage);
                  setPreviewImage(null);
                  setPreviewTitle('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-950/5 dark:bg-slate-950/20 flex-1 min-h-0">
              <img
                src={previewImage}
                alt={previewTitle}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewImage);
                  setPreviewImage(null);
                  setPreviewTitle('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#181c1e] dark:text-white text-3xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
