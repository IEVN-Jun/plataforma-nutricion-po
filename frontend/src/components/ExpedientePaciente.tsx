import { useState, useEffect } from 'react';
import MacronutrientesCard from './Macronutrientes_card';

// --- Constantes de configuración de API ---
const API = 'http://localhost:3000/api';

// --- Iconos SVG inline ---
const IconoOjo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconoBasura = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconoLapiz = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500 hover:text-[#D4AF37] cursor-help transition-colors inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// --- Componente reutilizable para inputs numéricos con tooltip ---
const InputConTooltip = ({ label, name, value, onChange, tooltip, requerido = false }: {
  label: string; name: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string; requerido?: boolean;
}) => (
  <div className="relative group">
    <div className="flex items-center mb-1">
      <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
        {label}{requerido && <span className="text-[#D4AF37]">*</span>}
      </label>
      {tooltip && <InfoIcon />}
    </div>
    <input
      type="number" step="0.1" name={name} value={value || ''} onChange={onChange} required={requerido}
      className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
    />
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[10px] p-2 rounded shadow-xl w-56 z-50 text-center leading-tight pointer-events-none border border-gray-600">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    )}
  </div>
);

// --- Selector de ajuste calórico reutilizable ---
const TIPOS_AJUSTE = [
  { valor: '-500', etiqueta: 'Déficit (-500 kcal)' },
  { valor: '500',  etiqueta: 'Superávit (+500 kcal)' },
  { valor: '0',    etiqueta: 'Mantenimiento (0 kcal)' },
  { valor: 'manual', etiqueta: 'Ajuste manual...' },
];
const PRESET_AJUSTES = ['-500', '500', '0'];

const SelectorAjuste = ({
  tipoAjuste, ajusteCalorico,
  onTipoChange, onManualChange,
}: {
  tipoAjuste: string; ajusteCalorico: string;
  onTipoChange: (v: string) => void; onManualChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="bg-green-900/10 p-4 rounded-lg border border-green-900/30">
    <label className="block text-xs font-semibold text-green-500 mb-2 uppercase tracking-wider">Metas de la Dieta</label>
    <select
      value={tipoAjuste}
      onChange={e => onTipoChange(e.target.value)}
      className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md mb-3 outline-none text-sm focus:border-green-500"
    >
      {TIPOS_AJUSTE.map(t => (
        <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
      ))}
    </select>
    {tipoAjuste === 'manual' && (
      <div className="flex items-center mt-2">
        <span className="text-gray-400 mr-3 text-sm font-semibold">Kcal:</span>
        <input
          type="number"
          name="ajuste_calorico"
          value={ajusteCalorico}
          onChange={onManualChange}
          required
          placeholder="ej. -750"
          className="w-full bg-[#1A1A1A] text-white border border-gray-700 p-2.5 rounded-md outline-none focus:border-green-500 font-bold"
        />
      </div>
    )}
  </div>
);

// --- Secciones de pliegues y circunferencias reutilizables ---
const ZONAS_CIRC = ['cuello', 'brazo', 'cintura', 'abdomen', 'cadera', 'pierna', 'pantorrilla'] as const;

// --- Utilidades ---
const calcularEdad = (fecha: string): string | number => {
  if (!fecha) return 'N/A';
  const hoy = new Date(), cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  if (hoy.getMonth() < cumple.getMonth() || (hoy.getMonth() === cumple.getMonth() && hoy.getDate() < cumple.getDate())) edad--;
  return edad;
};

const FACTOR_ETIQUETAS: Record<string, string> = {
  '1.2':   'Sedentario (x 1.2)',
  '1.375': 'Ligero — 1 a 3 días/sem (x 1.375)',
  '1.55':  'Moderado — 3 a 5 días/sem (x 1.55)',
  '1.725': 'Activo — 6 a 7 días/sem (x 1.725)',
  '1.9':   'Muy Activo / Atleta (x 1.9)',
};

// =============================================================================
const ESTADO_MEDIDAS_INICIAL = {
  peso_kg: '', talla_cm: '',
  pliegue_triceps: '', pliegue_biceps: '', pliegue_subescapular: '', pliegue_suprailiaco: '',
  pliegue_abdominal: '', pliegue_muslo: '', pliegue_pantorrilla: '',
  circ_cuello: '', circ_brazo: '', circ_cintura: '', circ_abdomen: '', circ_cadera: '', circ_pierna: '', circ_pantorrilla: '',
  ajuste_calorico: '-500', notas_clinicas: '',
};

export default function ExpedientePaciente({ pacienteId, onVolver }: { pacienteId: number; onVolver: () => void }) {
  const [paciente, setPaciente]   = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Modal de detalles / edición de sesión
  const [medidaSeleccionada, setMedidaSeleccionada] = useState<any>(null);
  const [editandoMedida, setEditandoMedida]         = useState(false);
  const [datosMedida, setDatosMedida]               = useState<any>({});
  const [tipoAjusteEdicion, setTipoAjusteEdicion]   = useState('-500');
  const [guardandoEdicion, setGuardandoEdicion]     = useState(false);

  // Eliminación
  const [confirmarEliminacion, setConfirmarEliminacion] = useState<number | null>(null);
  const [eliminando, setEliminando]                     = useState(false);

  // Formulario nueva sesión
  const [medidas, setMedidas]       = useState(ESTADO_MEDIDAS_INICIAL);
  const [tipoAjuste, setTipoAjuste] = useState('-500');

  // Edición de perfil del paciente
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [datosPerfil, setDatosPerfil]       = useState<any>({});

  // ---- Carga de datos ----
  const cargarExpediente = async () => {
    try {
      const res = await fetch(`${API}/pacientes/${pacienteId}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setPaciente(data.paciente);
        setHistorial(data.historial);
      }
    } catch (err) {
      console.error('Error al cargar expediente:', err);
    }
  };

  useEffect(() => { cargarExpediente(); }, [pacienteId]);

  // ---- Handlers: nueva sesión ----
  const handleMedidaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMedidas(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTipoAjusteChange = (valor: string) => {
    setTipoAjuste(valor);
    if (valor !== 'manual') setMedidas(prev => ({ ...prev, ajuste_calorico: valor }));
    else setMedidas(prev => ({ ...prev, ajuste_calorico: '' }));
  };

  const guardarNuevaSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch(`${API}/pacientes/${pacienteId}/medidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medidas),
      });
      if (res.ok) {
        setMedidas(ESTADO_MEDIDAS_INICIAL);
        setTipoAjuste('-500');
        cargarExpediente();
      } else {
        alert('Error al guardar la sesión.');
      }
    } catch {
      alert('Error de conexión.');
    }
    setGuardando(false);
  };

  // ---- Handlers: edición de perfil ----
  const abrirEdicionPerfil = () => {
    setDatosPerfil({
      nombre:           paciente.nombre || '',
      email:            paciente.email || '',
      telefono:         paciente.telefono || '',
      genero:           paciente.genero || '',
      fecha_nacimiento: paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toISOString().split('T')[0] : '',
      objetivo:         paciente.objetivo || '',
      factor_actividad: paciente.factor_actividad || '1.2',
    });
    setEditandoPerfil(true);
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPerfil),
      });
      if (res.ok) { setEditandoPerfil(false); cargarExpediente(); }
      else alert('Error al actualizar el perfil.');
    } catch { alert('Error de conexión.'); }
  };

  // ---- Handlers: edición de medida ----
  const abrirEdicionMedida = () => {
    const m = medidaSeleccionada;
    const ajusteStr = String(Number(m.ajuste_calorico));
    setTipoAjusteEdicion(PRESET_AJUSTES.includes(ajusteStr) ? ajusteStr : 'manual');
    setDatosMedida({
      peso_kg: m.peso_kg || '', talla_cm: m.talla_cm || '',
      pliegue_triceps: m.pliegue_triceps || '', pliegue_biceps: m.pliegue_biceps || '',
      pliegue_subescapular: m.pliegue_subescapular || '', pliegue_suprailiaco: m.pliegue_suprailiaco || '',
      pliegue_abdominal: m.pliegue_abdominal || '', pliegue_muslo: m.pliegue_muslo || '',
      pliegue_pantorrilla: m.pliegue_pantorrilla || '',
      circ_cuello: m.circ_cuello || '', circ_brazo: m.circ_brazo || '',
      circ_cintura: m.circ_cintura || '', circ_abdomen: m.circ_abdomen || '',
      circ_cadera: m.circ_cadera || '', circ_pierna: m.circ_pierna || '',
      circ_pantorrilla: m.circ_pantorrilla || '',
      ajuste_calorico: ajusteStr, notas_clinicas: m.notas_clinicas || '',
    });
    setEditandoMedida(true);
  };

  const handleTipoAjusteEdicionChange = (valor: string) => {
    setTipoAjusteEdicion(valor);
    if (valor !== 'manual') setDatosMedida((prev: any) => ({ ...prev, ajuste_calorico: valor }));
    else setDatosMedida((prev: any) => ({ ...prev, ajuste_calorico: '' }));
  };

  const guardarEdicionMedida = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoEdicion(true);
    try {
      // Endpoint del nuevo backend: PUT /api/pacientes/:pacienteId/medidas/:medidaId
      const res = await fetch(`${API}/pacientes/${pacienteId}/medidas/${medidaSeleccionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosMedida),
      });
      if (res.ok) {
        setEditandoMedida(false);
        setMedidaSeleccionada(null);
        cargarExpediente();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al actualizar el registro.');
      }
    } catch { alert('Error de conexión.'); }
    setGuardandoEdicion(false);
  };

  // ---- Handlers: eliminación ----
  const ejecutarEliminacion = async () => {
    if (!confirmarEliminacion) return;
    setEliminando(true);
    try {
      // Endpoint del nuevo backend: DELETE /api/medidas/:medidaId
      const res = await fetch(`${API}/medidas/${confirmarEliminacion}`, { method: 'DELETE' });
      if (res.ok) { setConfirmarEliminacion(null); cargarExpediente(); }
      else alert('Error al eliminar el registro.');
    } catch { alert('Error de conexión.'); }
    setEliminando(false);
  };

  if (!paciente) return (
    <div className="text-[#D4AF37] p-10 text-center font-bold text-xl animate-pulse">
      Cargando expediente clínico...
    </div>
  );

  return (
    <div className="w-full max-w-7xl animate-fade-in relative text-gray-200">

      {/* ===== MODAL: CONFIRMACIÓN ELIMINACIÓN ===== */}
      {confirmarEliminacion !== null && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1A1A1A] p-8 rounded-xl border border-red-500/50 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
              <IconoBasura />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Eliminar Registro</h3>
            <p className="text-gray-400 text-sm mb-6">
              ¿Estás seguro de borrar este registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarEliminacion(null)} disabled={eliminando}
                className="flex-1 bg-gray-800 text-white font-bold py-2.5 rounded-md border border-gray-600 hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button onClick={ejecutarEliminacion} disabled={eliminando}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-md transition">
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETALLE / EDICIÓN DE SESIÓN ===== */}
      {medidaSeleccionada && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37] w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            {/* Encabezado */}
            <div className="flex justify-between items-center border-b border-gray-700 p-6 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editandoMedida ? 'Editar Registro de Sesión' : 'Detalle de Sesión'}
              </h2>
              <span className="bg-[#D4AF37] text-black font-bold px-3 py-1 rounded text-sm">
                {new Date(medidaSeleccionada.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* ---- Vista: solo lectura ---- */}
            {!editandoMedida && (
              <div className="p-6 space-y-5">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Peso',        valor: `${medidaSeleccionada.peso_kg} kg`,        color: 'text-white' },
                    { label: '% Grasa',     valor: `${medidaSeleccionada.porcentaje_grasa}%`, color: 'text-red-400' },
                    { label: 'Masa Musc.',  valor: `${medidaSeleccionada.masa_muscular_kg} kg`, color: 'text-blue-400' },
                    { label: 'Meta Calórica', valor: `${medidaSeleccionada.calorias_recomendadas}`, color: 'text-green-400' },
                  ].map(k => (
                    <div key={k.label} className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
                      <p className="text-gray-400 text-xs mb-1">{k.label}</p>
                      <p className={`text-xl font-bold ${k.color}`}>{k.valor}</p>
                    </div>
                  ))}
                </div>

                {/* Pliegues + Circunferencias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
                    <h3 className="text-[#D4AF37] font-semibold mb-3 border-b border-gray-800 pb-2">Pliegues (mm)</h3>
                    <ul className="text-sm space-y-1.5 text-gray-300">
                      {[['Tríceps', 'pliegue_triceps'], ['Bíceps', 'pliegue_biceps'], ['Subescapular', 'pliegue_subescapular'],
                        ['Suprailiaco', 'pliegue_suprailiaco'], ['Abdominal', 'pliegue_abdominal'],
                        ['Muslo', 'pliegue_muslo'], ['Pantorrilla', 'pliegue_pantorrilla']].map(([label, key]) => (
                        <li key={key} className="flex justify-between">
                          <span>{label}:</span>
                          <span className="font-medium text-white">{medidaSeleccionada[key] || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
                    <h3 className="text-[#D4AF37] font-semibold mb-3 border-b border-gray-800 pb-2">Circunferencias (cm)</h3>
                    <ul className="text-sm space-y-1.5 text-gray-300">
                      {ZONAS_CIRC.map(zona => (
                        <li key={zona} className="flex justify-between capitalize">
                          <span>{zona}:</span>
                          <span className="font-medium text-white">{medidaSeleccionada[`circ_${zona}`] || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cálculos energéticos */}
                <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
                  <h3 className="text-[#D4AF37] font-semibold mb-3 border-b border-gray-800 pb-2">Cálculos Energéticos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Talla',            valor: `${medidaSeleccionada.talla_cm} cm`,              color: 'text-white' },
                      { label: 'Metabolismo Basal', valor: `${medidaSeleccionada.metabolismo_basal} kcal`,   color: 'text-white' },
                      { label: 'Gasto Total',       valor: `${medidaSeleccionada.gasto_energetico_total} kcal`, color: 'text-orange-400' },
                      { label: 'Ajuste',            valor: `${Number(medidaSeleccionada.ajuste_calorico) > 0 ? '+' : ''}${medidaSeleccionada.ajuste_calorico} kcal`, color: Number(medidaSeleccionada.ajuste_calorico) < 0 ? 'text-red-400' : 'text-green-400' },
                      { label: 'Meta Final',        valor: `${medidaSeleccionada.calorias_recomendadas} kcal`, color: 'text-green-400 text-base font-extrabold' },
                      { label: 'Masa Grasa',        valor: `${medidaSeleccionada.masa_grasa_kg} kg`,         color: 'text-red-400' },
                    ].map(k => (
                      <div key={k.label}>
                        <span className="block text-gray-500 text-xs mb-0.5">{k.label}</span>
                        <span className={`font-medium ${k.color}`}>{k.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <MacronutrientesCard
                  caloriasRecomendadas={medidaSeleccionada.calorias_recomendadas}
                        pesoKg={medidaSeleccionada.peso_kg}
                        />

                {/* Notas */}
                {medidaSeleccionada.notas_clinicas && (
                  <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
                    <h3 className="text-[#D4AF37] font-semibold mb-2">Notas Médicas</h3>
                    <p className="text-gray-300 text-sm italic">{medidaSeleccionada.notas_clinicas}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={abrirEdicionMedida}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-3 rounded-md transition">
                    <IconoLapiz /> Editar Registro
                  </button>
                  <button onClick={() => { setMedidaSeleccionada(null); setEditandoMedida(false); }}
                    className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition">
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* ---- Vista: formulario edición ---- */}
            {editandoMedida && (
              <form onSubmit={guardarEdicionMedida} className="p-6 space-y-5">
                <p className="text-xs text-gray-500 bg-blue-900/20 border border-blue-800/30 rounded-md p-3">
                  Corrige los datos y presiona "Guardar Cambios". Los cálculos se recalcularán automáticamente.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <InputConTooltip label="Peso (kg)" name="peso_kg" value={datosMedida.peso_kg} onChange={e => setDatosMedida((p: any) => ({ ...p, [e.target.name]: e.target.value }))} requerido tooltip="Peso en báscula." />
                  <InputConTooltip label="Talla (cm)" name="talla_cm" value={datosMedida.talla_cm} onChange={e => setDatosMedida((p: any) => ({ ...p, [e.target.name]: e.target.value }))} requerido tooltip="Estatura." />
                </div>

                <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
                  <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Pliegues Cutáneos (mm)</legend>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                      { label: 'Tríceps',       name: 'pliegue_triceps',      req: true,  tip: 'Posterior del brazo.' },
                      { label: 'Bíceps',        name: 'pliegue_biceps',       req: true,  tip: 'Anterior del brazo.' },
                      { label: 'Subesc.',       name: 'pliegue_subescapular', req: true,  tip: 'Debajo de la escápula.' },
                      { label: 'Suprail.',      name: 'pliegue_suprailiaco',  req: true,  tip: 'Cresta ilíaca.' },
                      { label: 'Abdom.',        name: 'pliegue_abdominal',    req: false, tip: 'Zona del ombligo.' },
                      { label: 'Muslo',         name: 'pliegue_muslo',        req: false, tip: 'Pierna frontal.' },
                    ].map(f => (
                      <InputConTooltip key={f.name} label={f.label} name={f.name} value={datosMedida[f.name]}
                        onChange={e => setDatosMedida((p: any) => ({ ...p, [e.target.name]: e.target.value }))}
                        requerido={f.req} tooltip={f.tip} />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
                  <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Circunferencias (cm)</legend>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {ZONAS_CIRC.map(zona => (
                      <InputConTooltip key={zona} label={zona} name={`circ_${zona}`} value={datosMedida[`circ_${zona}`]}
                        onChange={e => setDatosMedida((p: any) => ({ ...p, [e.target.name]: e.target.value }))}
                        tooltip={`Medición de ${zona}.`} />
                    ))}
                  </div>
                </fieldset>

                <SelectorAjuste
                  tipoAjuste={tipoAjusteEdicion}
                  ajusteCalorico={datosMedida.ajuste_calorico}
                  onTipoChange={handleTipoAjusteEdicionChange}
                  onManualChange={e => setDatosMedida((p: any) => ({ ...p, ajuste_calorico: e.target.value }))}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Notas Médicas</label>
                  <textarea name="notas_clinicas" value={datosMedida.notas_clinicas}
                    onChange={e => setDatosMedida((p: any) => ({ ...p, notas_clinicas: e.target.value }))}
                    rows={2} placeholder="Notas de la sesión..."
                    className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md outline-none resize-none focus:border-[#D4AF37]" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={guardandoEdicion}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-extrabold py-3 rounded-md transition uppercase text-sm tracking-widest">
                    {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button type="button" onClick={() => setEditandoMedida(false)} disabled={guardandoEdicion}
                    className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL: EDICIÓN DE PERFIL ===== */}
      {editandoPerfil && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardarPerfil} className="bg-[#1A1A1A] p-8 rounded-xl border border-[#D4AF37] w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
              Editar Información del Paciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre',   name: 'nombre',   type: 'text' },
                { label: 'Email',    name: 'email',    type: 'email' },
                { label: 'Teléfono', name: 'telefono', type: 'text' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
                  <input type={f.type} name={f.name} value={datosPerfil[f.name]}
                    onChange={e => setDatosPerfil((p: any) => ({ ...p, [e.target.name]: e.target.value }))}
                    className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700 outline-none focus:border-[#D4AF37] text-white" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={datosPerfil.fecha_nacimiento}
                  onChange={e => setDatosPerfil((p: any) => ({ ...p, fecha_nacimiento: e.target.value }))}
                  className="w-full bg-[#0A0A0A] text-gray-300 p-2 rounded border border-gray-700 outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Género</label>
                <select name="genero" value={datosPerfil.genero}
                  onChange={e => setDatosPerfil((p: any) => ({ ...p, genero: e.target.value }))}
                  className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700 outline-none focus:border-[#D4AF37] text-white">
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Factor de Actividad</label>
                <select name="factor_actividad" value={datosPerfil.factor_actividad}
                  onChange={e => setDatosPerfil((p: any) => ({ ...p, factor_actividad: e.target.value }))}
                  className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700 outline-none focus:border-[#D4AF37] text-white">
                  {Object.entries(FACTOR_ETIQUETAS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 block mb-1">Objetivo</label>
                <input type="text" name="objetivo" value={datosPerfil.objetivo}
                  onChange={e => setDatosPerfil((p: any) => ({ ...p, objetivo: e.target.value }))}
                  className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700 outline-none focus:border-[#D4AF37] text-white" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-md hover:bg-[#b5952f] transition">
                Guardar Cambios
              </button>
              <button type="button" onClick={() => setEditandoPerfil(false)}
                className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== CABECERA DEL PACIENTE ===== */}
      <div className="bg-[#0A0A0A] border-l-4 border-[#D4AF37] rounded-r-xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="w-full md:w-3/4">
            <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase mb-4">
              {paciente.nombre}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <p className="text-xs text-gray-400"><strong className="text-white block uppercase tracking-wider mb-1">Email</strong>{paciente.email || 'N/A'}</p>
              <p className="text-xs text-gray-400"><strong className="text-white block uppercase tracking-wider mb-1">Teléfono</strong>{paciente.telefono || 'N/A'}</p>
              <p className="text-xs text-gray-400"><strong className="text-[#D4AF37] block uppercase tracking-wider mb-1">Objetivo</strong>{paciente.objetivo || 'N/A'}</p>
              <p className="text-xs text-gray-400"><strong className="text-white block uppercase tracking-wider mb-1">Edad</strong>{calcularEdad(paciente.fecha_nacimiento)} años · {paciente.genero}</p>
              <p className="text-xs text-gray-400 md:col-span-2"><strong className="text-[#D4AF37] block uppercase tracking-wider mb-1">Factor de Actividad</strong>{FACTOR_ETIQUETAS[paciente.factor_actividad] || 'No definido'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            <button onClick={abrirEdicionPerfil}
              className="bg-gray-800 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] px-4 py-2 rounded-md font-bold text-xs transition-all border border-[#D4AF37]/30 text-center">
              Editar Datos del Paciente
            </button>
            <button onClick={onVolver}
              className="bg-transparent border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded-md text-xs font-medium transition text-center">
              Regresar al Listado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ===== FORMULARIO NUEVA SESIÓN ===== */}
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 xl:col-span-1 shadow-lg">
          <h3 className="text-xl font-bold text-[#D4AF37] mb-5 border-b border-gray-800 pb-2">
            Registrar Sesión
          </h3>
          <form onSubmit={guardarNuevaSesion} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputConTooltip label="Peso (kg)" name="peso_kg" value={medidas.peso_kg} onChange={handleMedidaChange} requerido tooltip="Peso en báscula calibrada." />
              <InputConTooltip label="Talla (cm)" name="talla_cm" value={medidas.talla_cm} onChange={handleMedidaChange} requerido tooltip="Estatura libre de calzado." />
            </div>

            <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
              <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Pliegues Cutáneos (mm)</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {[
                  { label: 'Tríceps',  name: 'pliegue_triceps',      req: true,  tip: 'Línea media posterior del brazo.' },
                  { label: 'Bíceps',   name: 'pliegue_biceps',       req: true,  tip: 'Cara anterior del brazo.' },
                  { label: 'Subesc.',  name: 'pliegue_subescapular', req: true,  tip: 'Diagonal, 2cm debajo de la escápula.' },
                  { label: 'Suprail.', name: 'pliegue_suprailiaco',  req: true,  tip: 'Diagonal sobre la cresta ilíaca.' },
                  { label: 'Abdom.',   name: 'pliegue_abdominal',    req: false, tip: 'Vertical, 5cm a la derecha del ombligo.' },
                  { label: 'Muslo',    name: 'pliegue_muslo',        req: false, tip: 'Anterior, entre ingle y rótula.' },
                ].map(f => (
                  <InputConTooltip key={f.name} label={f.label} name={f.name} value={(medidas as any)[f.name]}
                    onChange={handleMedidaChange} requerido={f.req} tooltip={f.tip} />
                ))}
              </div>
            </fieldset>

            <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
              <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Circunferencias (cm)</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {ZONAS_CIRC.map(zona => (
                  <InputConTooltip key={zona} label={zona} name={`circ_${zona}`}
                    value={(medidas as any)[`circ_${zona}`]} onChange={handleMedidaChange}
                    tooltip={`Medición horizontal de ${zona}.`} />
                ))}
              </div>
            </fieldset>

            <SelectorAjuste
              tipoAjuste={tipoAjuste}
              ajusteCalorico={medidas.ajuste_calorico}
              onTipoChange={handleTipoAjusteChange}
              onManualChange={handleMedidaChange}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Notas Médicas</label>
              <textarea name="notas_clinicas" value={medidas.notas_clinicas} onChange={handleMedidaChange}
                rows={2} placeholder="Reporte de sesión..."
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md outline-none resize-none focus:border-[#D4AF37]" />
            </div>

            <button type="submit" disabled={guardando}
              className="w-full bg-[#D4AF37] text-black font-extrabold py-3.5 rounded-md hover:bg-[#b5952f] transition shadow-lg uppercase text-sm tracking-widest">
              {guardando ? 'Procesando...' : 'Calcular y Guardar Sesión'}
            </button>
          </form>
        </div>

        {/* ===== HISTORIAL ===== */}
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 xl:col-span-2 shadow-lg flex flex-col min-h-[600px]">
          <h3 className="text-xl font-bold text-white mb-5 border-b border-gray-800 pb-2">
            Historial de Evaluaciones
            {historial.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({historial.length} {historial.length === 1 ? 'sesión' : 'sesiones'})
              </span>
            )}
          </h3>

          {historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
              <p>No hay datos registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full text-left text-sm whitespace-nowrap text-gray-300 min-w-max">
                <thead className="bg-[#0A0A0A] text-[#D4AF37] border-y border-gray-700">
                  <tr>
                    <th className="p-3 font-semibold uppercase text-[10px]">Fecha</th>
                    <th className="p-3 font-semibold uppercase text-[10px]">Peso</th>
                    <th className="p-3 font-semibold uppercase text-[10px]">% Grasa</th>
                    <th className="p-3 font-semibold uppercase text-[10px]">Masa Musc.</th>
                    <th className="p-3 font-semibold border-l border-gray-700 pl-4 text-orange-400 uppercase text-[10px]">Gasto Total</th>
                    <th className="p-3 font-semibold text-green-400 bg-green-900/10 text-center uppercase text-[10px]">Ajuste</th>
                    <th className="p-3 font-semibold text-white bg-green-900/30 text-center uppercase text-[10px]">Meta Final</th>
                    <th className="p-3 font-semibold border-l border-gray-700 pl-4 text-center uppercase text-[10px]">Opciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((m, idx) => (
                    <tr key={m.id ?? idx} className="border-b border-gray-800 hover:bg-gray-800/80 transition">
                      <td className="p-3 font-medium text-white">
                        {new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">{m.peso_kg} kg</td>
                      <td className="p-3 text-red-400 font-bold">{m.porcentaje_grasa}%</td>
                      <td className="p-3 text-blue-400 font-bold">{m.masa_muscular_kg} kg</td>
                      <td className="p-3 border-l border-gray-700 pl-4">{m.gasto_energetico_total}</td>
                      <td className={`p-3 font-bold bg-green-900/5 text-center ${Number(m.ajuste_calorico) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {Number(m.ajuste_calorico) > 0 ? '+' : ''}{m.ajuste_calorico}
                      </td>
                      <td className="p-3 text-white font-extrabold bg-green-900/20 text-center">
                        {m.calorias_recomendadas}
                      </td>
                      <td className="p-3 border-l border-gray-700 pl-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => { setMedidaSeleccionada(m); setEditandoMedida(false); }}
                            title="Ver detalles"
                            className="flex items-center justify-center w-8 h-8 rounded bg-gray-800 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black border border-gray-600 hover:border-[#D4AF37] transition-all">
                            <IconoOjo />
                          </button>
                          <button onClick={() => setConfirmarEliminacion(m.id)}
                            title="Eliminar registro"
                            className="flex items-center justify-center w-8 h-8 rounded bg-gray-800 hover:bg-red-700 text-red-400 hover:text-white border border-gray-600 hover:border-red-600 transition-all">
                            <IconoBasura />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}