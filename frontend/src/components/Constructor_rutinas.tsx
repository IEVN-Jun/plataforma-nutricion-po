import { useState, useEffect, useMemo } from 'react';

// ============================================================
// TIPOS
// ============================================================
interface EjercicioCatalogo {
  id: number;
  grupo_muscular: string;
  nombre_ejercicio: string;
}

interface EjercicioRow {
  id?: number;
  ejercicio_id: number | null;
  nombre_ejercicio_custom: string;
  tipo_agrupacion: string;
  grupo_agrupacion: string;
  series_total: number | string;
  repeticiones: string;
  tecnica_especial: string;
  detalle_tecnica: string;
  link_youtube: string;
  notas: string;
  tipo_agarre: string;
  orden: number;
  // Solo UI
  _nombre_display?: string;
}

interface DiaRutina {
  id?: number;
  numero_dia: number;
  nombre_dia: string;
  cardio_min: number | string;
  link_cardio: string;
  orden: number;
  ejercicios: EjercicioRow[];
}

interface Rutina {
  id?: number;
  nombre: string;
  objetivo: string;
  tipo_entrenamiento: string;
  sistemas_trabajo: string;
  recomendaciones: string;
  activa: boolean;
  dias: DiaRutina[];
}

interface Paciente {
  id: number;
  nombre: string;
}

// ============================================================
// CONSTANTES
// ============================================================
const API = 'http://localhost:3000/api';

const TIPOS_AGRUPACION = [
  { valor: 'unica',      etiqueta: 'Serie Unica' },
  { valor: 'biserie',    etiqueta: 'Biserie' },
  { valor: 'triserie',   etiqueta: 'Triserie' },
  { valor: 'superserie', etiqueta: 'Super Serie' },
  { valor: 'circuito',   etiqueta: 'Circuito' },
  { valor: 'gigante',    etiqueta: 'Serie Gigante' },
];

const TECNICAS = [
  { valor: 'ninguna',          etiqueta: 'Ninguna' },
  { valor: 'rest_pause',       etiqueta: 'Rest Pause' },
  { valor: 'drop_set',         etiqueta: 'Drop Set' },
  { valor: 'piramidal_asc',    etiqueta: 'Piramidal Ascendente' },
  { valor: 'piramidal_desc',   etiqueta: 'Piramidal Descendente' },
  { valor: 'carga_progresiva', etiqueta: 'Carga Progresiva' },
  { valor: 'carga_regresiva',  etiqueta: 'Carga Regresiva' },
  { valor: 'excentrico',       etiqueta: 'Excentrico' },
  { valor: 'concentrico',      etiqueta: 'Concentrico' },
  { valor: 'escalera',         etiqueta: 'Escalera' },
];

const COLOR_AGRUPACION: Record<string, string> = {
  unica:      'border-gray-700',
  biserie:    'border-blue-600',
  triserie:   'border-purple-600',
  superserie: 'border-orange-600',
  circuito:   'border-green-600',
  gigante:    'border-pink-600',
};

const BADGE_AGRUPACION: Record<string, string> = {
  unica:      'bg-gray-800 text-gray-400',
  biserie:    'bg-blue-900/40 text-blue-400',
  triserie:   'bg-purple-900/40 text-purple-400',
  superserie: 'bg-orange-900/40 text-orange-400',
  circuito:   'bg-green-900/40 text-green-400',
  gigante:    'bg-pink-900/40 text-pink-400',
};

const ejVacio = (): EjercicioRow => ({
  ejercicio_id: null, nombre_ejercicio_custom: '', tipo_agrupacion: 'unica',
  grupo_agrupacion: '', series_total: '', repeticiones: '', tecnica_especial: 'ninguna',
  detalle_tecnica: '', link_youtube: '', notas: '', tipo_agarre: '', orden: 0,
});

const diaVacio = (n: number): DiaRutina => ({
  numero_dia: n, nombre_dia: '', cardio_min: 0, link_cardio: '', orden: n - 1,
  ejercicios: [ejVacio()],
});

const rutinaVacia = (): Rutina => ({
  nombre: '', objetivo: '', tipo_entrenamiento: 'Avanzado',
  sistemas_trabajo: '', recomendaciones: '', activa: true,
  dias: [diaVacio(1)],
});

// ============================================================
// ICONOS
// ============================================================
const IconoMas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconoBasura = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconoLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

// Select de ejercicio con busqueda live
const SelectorEjercicio = ({
  catalogo, value, onChange,
}: { catalogo: EjercicioCatalogo[]; value: number | null; onChange: (id: number | null, nombre: string) => void; }) => {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto]   = useState(false);

  const nombreSeleccionado = useMemo(() => {
    if (!value) return '';
    return catalogo.find(e => e.id === value)?.nombre_ejercicio || '';
  }, [value, catalogo]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return q ? catalogo.filter(e =>
      e.nombre_ejercicio.toLowerCase().includes(q) ||
      e.grupo_muscular.toLowerCase().includes(q)
    ) : catalogo;
  }, [busqueda, catalogo]);

  // Agrupamos para mostrar el encabezado de grupo
  const agrupados = useMemo(() => {
    const map: Record<string, EjercicioCatalogo[]> = {};
    filtrados.forEach(e => {
      if (!map[e.grupo_muscular]) map[e.grupo_muscular] = [];
      map[e.grupo_muscular].push(e);
    });
    return map;
  }, [filtrados]);

  return (
    <div className="relative">
      <div
        className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm cursor-pointer focus:border-[#D4AF37] flex justify-between items-center"
        onClick={() => setAbierto(!abierto)}
      >
        <span className={nombreSeleccionado ? 'text-white' : 'text-gray-600'}>
          {nombreSeleccionado || 'Selecciona un ejercicio...'}
        </span>
        <span className="text-gray-500 text-xs">{abierto ? '▲' : '▼'}</span>
      </div>

      {abierto && (
        <div className="absolute z-50 w-full mt-1 bg-[#1A1A1A] border border-gray-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
          <div className="p-2 border-b border-gray-700 sticky top-0 bg-[#1A1A1A]">
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Filtrar ejercicios..."
              className="w-full bg-[#0A0A0A] text-white text-xs border border-gray-700 rounded p-1.5 outline-none focus:border-[#D4AF37]"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          </div>
          {Object.entries(agrupados).map(([grupo, items]) => (
            <div key={grupo}>
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest px-3 pt-2 pb-1 bg-[#0A0A0A]/60">
                {grupo}
              </p>
              {items.map(ej => (
                <div
                  key={ej.id}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                    value === ej.id ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => { onChange(ej.id, ej.nombre_ejercicio); setBusqueda(''); setAbierto(false); }}
                >
                  {ej.nombre_ejercicio}
                </div>
              ))}
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-4">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
};

// Tarjeta de un ejercicio dentro de un dia
const TarjetaEjercicio = ({
  ej, idx, catalogo, onChange, onEliminar,
}: {
  ej: EjercicioRow;
  idx: number;
  catalogo: EjercicioCatalogo[];
  onChange: (field: string, val: string | number | null) => void;
  onEliminar: () => void;
}) => {
  const [expandido, setExpandido] = useState(true);
  const borderColor = COLOR_AGRUPACION[ej.tipo_agrupacion] || 'border-gray-700';
  const badge       = BADGE_AGRUPACION[ej.tipo_agrupacion] || 'bg-gray-800 text-gray-400';
  const etiqueta    = TIPOS_AGRUPACION.find(t => t.valor === ej.tipo_agrupacion)?.etiqueta || '';

  return (
    <div className={`bg-[#0A0A0A] rounded-lg border-l-4 ${borderColor} mb-3`}>
      {/* Encabezado de la tarjeta */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-gray-600 text-xs font-mono w-5 shrink-0">#{idx + 1}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
            {etiqueta}
          </span>
          <span className="text-sm text-white truncate font-medium">
            {ej._nombre_display || ej.nombre_ejercicio_custom || 'Ejercicio sin nombre'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded border border-gray-700 transition"
          >
            {expandido ? 'Colapsar' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={onEliminar}
            className="text-red-500 hover:text-white hover:bg-red-700 p-1.5 rounded border border-gray-700 transition"
          >
            <IconoBasura />
          </button>
        </div>
      </div>

      {/* Cuerpo expandido */}
      {expandido && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-3">

          {/* Selector de ejercicio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Ejercicio del Catalogo</label>
              <SelectorEjercicio
                catalogo={catalogo}
                value={ej.ejercicio_id}
                onChange={(id, nombre) => {
                  onChange('ejercicio_id', id);
                  onChange('_nombre_display', nombre);
                  onChange('nombre_ejercicio_custom', '');
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">O nombre personalizado</label>
              <input
                type="text"
                value={ej.nombre_ejercicio_custom}
                onChange={e => { onChange('nombre_ejercicio_custom', e.target.value); onChange('ejercicio_id', null); onChange('_nombre_display', ''); }}
                placeholder="Ej. Prensa con pausa 3seg"
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Agrupacion, series, reps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tipo de Serie</label>
              <select
                value={ej.tipo_agrupacion}
                onChange={e => onChange('tipo_agrupacion', e.target.value)}
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              >
                {TIPOS_AGRUPACION.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
              </select>
            </div>

            {/* Letra de grupo para biserie / triserie */}
            {['biserie', 'triserie', 'superserie', 'circuito', 'gigante'].includes(ej.tipo_agrupacion) && (
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Grupo (A/B/C...)</label>
                <input
                  type="text"
                  value={ej.grupo_agrupacion}
                  onChange={e => onChange('grupo_agrupacion', e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="A"
                  className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37] text-center uppercase font-bold"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Series (X rondas)</label>
              <input
                type="number"
                value={ej.series_total}
                onChange={e => onChange('series_total', e.target.value)}
                placeholder="3"
                min={1}
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Repeticiones</label>
              <input
                type="text"
                value={ej.repeticiones}
                onChange={e => onChange('repeticiones', e.target.value)}
                placeholder="15, 12, 10"
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Tecnica especial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tecnica Especial</label>
              <select
                value={ej.tecnica_especial}
                onChange={e => onChange('tecnica_especial', e.target.value)}
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              >
                {TECNICAS.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
              </select>
            </div>

            {ej.tecnica_especial !== 'ninguna' && (
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Detalle de la Tecnica</label>
                <input
                  type="text"
                  value={ej.detalle_tecnica}
                  onChange={e => onChange('detalle_tecnica', e.target.value)}
                  placeholder="ej. 8reps descanso 8seg, 4 cambios de peso"
                  className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}
          </div>

          {/* Agarre, link YouTube, notas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tipo de Agarre</label>
              <input
                type="text"
                value={ej.tipo_agarre}
                onChange={e => onChange('tipo_agarre', e.target.value)}
                placeholder="ej. abierto prono, cerrado neutro"
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <IconoLink /> Link YouTube
              </label>
              <input
                type="url"
                value={ej.link_youtube}
                onChange={e => onChange('link_youtube', e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Notas</label>
              <input
                type="text"
                value={ej.notas}
                onChange={e => onChange('notas', e.target.value)}
                placeholder="Indicaciones adicionales"
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ConstructorRutinas({ pacientes }: { pacientes: Paciente[] }) {
  const [catalogo, setCatalogo]         = useState<EjercicioCatalogo[]>([]);
  const [pacienteId, setPacienteId]     = useState<number | ''>('');
  const [rutina, setRutina]             = useState<Rutina>(rutinaVacia());
  const [diaActivo, setDiaActivo]       = useState<number>(0);
  const [guardando, setGuardando]       = useState(false);
  const [exito, setExito]               = useState('');
  const [error, setError]               = useState('');

  // Carga del catalogo al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${API}/ejercicios`);
        if (res.ok) setCatalogo(await res.json());
      } catch { /* el catalogo seguira vacio, el usuario puede usar nombre custom */ }
    };
    cargar();
  }, []);

  // ---- Handlers de rutina (cabecera) ----
  const setRutinaField = (field: string, val: string | boolean) => {
    setRutina(prev => ({ ...prev, [field]: val }));
  };

  // ---- Handlers de dias ----
  const agregarDia = () => {
    setRutina(prev => ({
      ...prev,
      dias: [...prev.dias, diaVacio(prev.dias.length + 1)],
    }));
    setDiaActivo(rutina.dias.length);
  };

  const eliminarDia = (idx: number) => {
    if (rutina.dias.length === 1) return;
    setRutina(prev => {
      const dias = prev.dias.filter((_, i) => i !== idx);
      return { ...prev, dias };
    });
    setDiaActivo(Math.max(0, diaActivo - 1));
  };

  const setDiaField = (diaIdx: number, field: string, val: string | number) => {
    setRutina(prev => {
      const dias = [...prev.dias];
      dias[diaIdx] = { ...dias[diaIdx], [field]: val };
      return { ...prev, dias };
    });
  };

  // ---- Handlers de ejercicios dentro de un dia ----
  const agregarEjercicio = (diaIdx: number) => {
    setRutina(prev => {
      const dias = [...prev.dias];
      dias[diaIdx] = {
        ...dias[diaIdx],
        ejercicios: [...dias[diaIdx].ejercicios, ejVacio()],
      };
      return { ...prev, dias };
    });
  };

  const eliminarEjercicio = (diaIdx: number, ejIdx: number) => {
    setRutina(prev => {
      const dias = [...prev.dias];
      const ejercicios = dias[diaIdx].ejercicios.filter((_, i) => i !== ejIdx);
      dias[diaIdx] = { ...dias[diaIdx], ejercicios };
      return { ...prev, dias };
    });
  };

  const setEjercicioField = (diaIdx: number, ejIdx: number, field: string, val: string | number | null) => {
    setRutina(prev => {
      const dias = [...prev.dias];
      const ejercicios = [...dias[diaIdx].ejercicios];
      ejercicios[ejIdx] = { ...ejercicios[ejIdx], [field]: val };
      dias[diaIdx] = { ...dias[diaIdx], ejercicios };
      return { ...prev, dias };
    });
  };

  // ---- Guardar rutina completa en cascada ----
  const guardarRutina = async () => {
    if (!pacienteId) { setError('Selecciona un paciente primero.'); return; }
    if (!rutina.nombre.trim()) { setError('La rutina necesita un nombre.'); return; }
    setGuardando(true); setError(''); setExito('');

    try {
      // 1. Crear cabecera de rutina
      const resRutina = await fetch(`${API}/pacientes/${pacienteId}/rutinas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: rutina.nombre, objetivo: rutina.objetivo,
          tipo_entrenamiento: rutina.tipo_entrenamiento,
          sistemas_trabajo: rutina.sistemas_trabajo,
          recomendaciones: rutina.recomendaciones,
        }),
      });
      if (!resRutina.ok) throw new Error('Error al crear la rutina.');
      const { rutina: rutinaCreada } = await resRutina.json();

      // 2. Crear dias en secuencia
      for (const [diaIdx, dia] of rutina.dias.entries()) {
        const resDia = await fetch(`${API}/rutinas/${rutinaCreada.id}/dias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero_dia: dia.numero_dia,
            nombre_dia: dia.nombre_dia,
            cardio_min: Number(dia.cardio_min) || 0,
            link_cardio: dia.link_cardio,
            orden: diaIdx,
          }),
        });
        if (!resDia.ok) throw new Error(`Error al crear el Dia ${diaIdx + 1}.`);
        const { dia: diaCreado } = await resDia.json();

        // 3. Agregar ejercicios del dia
        for (const [ejIdx, ej] of dia.ejercicios.entries()) {
          await fetch(`${API}/dias/${diaCreado.id}/ejercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ejercicio_id:           ej.ejercicio_id,
              nombre_ejercicio_custom: ej.nombre_ejercicio_custom,
              tipo_agrupacion:        ej.tipo_agrupacion,
              grupo_agrupacion:       ej.grupo_agrupacion,
              series_total:           Number(ej.series_total) || null,
              repeticiones:           ej.repeticiones,
              tecnica_especial:       ej.tecnica_especial,
              detalle_tecnica:        ej.detalle_tecnica,
              link_youtube:           ej.link_youtube,
              notas:                  ej.notas,
              tipo_agarre:            ej.tipo_agarre,
              orden:                  ejIdx,
            }),
          });
        }
      }

      setExito(`Rutina "${rutina.nombre}" guardada correctamente.`);
      setRutina(rutinaVacia());
      setDiaActivo(0);
    } catch (err: any) {
      setError(err.message || 'Error desconocido al guardar.');
    }
    setGuardando(false);
  };

  const diaActualData = rutina.dias[diaActivo];

  return (
    <div className="w-full max-w-6xl text-gray-200">

      {/* ===== CABECERA ===== */}
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
          Constructor de <span className="text-[#D4AF37]">Rutinas</span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Diseña el programa de entrenamiento semanal del paciente con biseries, triseries, tecnicas avanzadas y links de referencia.
        </p>
      </div>

      {/* Mensajes de estado */}
      {error  && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}
      {exito  && <div className="bg-green-900/30 border border-green-700 text-green-400 rounded-lg p-3 mb-4 text-sm">{exito}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* ===== PANEL IZQUIERDO: Configuracion General ===== */}
        <div className="xl:col-span-1 space-y-5">

          {/* Paciente */}
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-5">
            <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">Paciente</h3>
            <select
              value={pacienteId}
              onChange={e => setPacienteId(Number(e.target.value))}
              className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2.5 text-sm outline-none focus:border-[#D4AF37]"
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Datos de la rutina */}
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Datos de la Rutina</h3>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Nombre de la Rutina</label>
              <input type="text" value={rutina.nombre}
                onChange={e => setRutinaField('nombre', e.target.value)}
                placeholder="ej. Programa de Volumen Fase 1"
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Objetivo</label>
              <input type="text" value={rutina.objetivo}
                onChange={e => setRutinaField('objetivo', e.target.value)}
                placeholder="Aumento de masa muscular"
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tipo de Entrenamiento</label>
              <select value={rutina.tipo_entrenamiento}
                onChange={e => setRutinaField('tipo_entrenamiento', e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              >
                <option value="Basico">Basico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Sistemas de Trabajo</label>
              <input type="text" value={rutina.sistemas_trabajo}
                onChange={e => setRutinaField('sistemas_trabajo', e.target.value)}
                placeholder="Biseries, Superseries, Drop sets"
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Recomendaciones Generales</label>
              <textarea value={rutina.recomendaciones}
                onChange={e => setRutinaField('recomendaciones', e.target.value)}
                rows={3}
                placeholder="Calentamiento 5-10min, enfriamiento..."
                className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2 text-sm outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>
          </div>

          {/* Dias (pestanas) */}
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Dias</h3>
              <button type="button" onClick={agregarDia}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] px-2 py-1 rounded border border-gray-700 transition font-bold">
                <IconoMas /> Agregar dia
              </button>
            </div>
            <div className="space-y-1">
              {rutina.dias.map((dia, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDiaActivo(idx)}
                    className={`flex-1 text-left text-sm px-3 py-2 rounded-md border transition ${
                      diaActivo === idx
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] font-bold'
                        : 'bg-[#0A0A0A] border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    Dia {idx + 1}{dia.nombre_dia ? `: ${dia.nombre_dia.slice(0, 16)}` : ''}
                  </button>
                  {rutina.dias.length > 1 && (
                    <button type="button" onClick={() => eliminarDia(idx)}
                      className="text-red-500 hover:text-white hover:bg-red-700 p-1.5 rounded border border-gray-700 transition shrink-0">
                      <IconoBasura />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boton guardar */}
          <button
            type="button"
            onClick={guardarRutina}
            disabled={guardando}
            className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-extrabold py-3.5 rounded-xl transition uppercase text-sm tracking-widest shadow-lg"
          >
            {guardando ? 'Guardando Rutina...' : 'Guardar Rutina Completa'}
          </button>
        </div>

        {/* ===== PANEL DERECHO: Editor del dia activo ===== */}
        <div className="xl:col-span-3">
          {diaActualData && (
            <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6">

              {/* Encabezado del dia */}
              <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white">
                  Dia {diaActivo + 1}
                </h3>
              </div>

              {/* Datos del dia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Nombre del Dia</label>
                  <input
                    type="text"
                    value={diaActualData.nombre_dia}
                    onChange={e => setDiaField(diaActivo, 'nombre_dia', e.target.value)}
                    placeholder="ej. Cuadriceps y Pantorrilla"
                    className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2.5 text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Cardio (min)</label>
                  <input
                    type="number"
                    value={diaActualData.cardio_min}
                    onChange={e => setDiaField(diaActivo, 'cardio_min', e.target.value)}
                    placeholder="30"
                    min={0}
                    className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2.5 text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <IconoLink /> Link YouTube (calentamiento / cardio / hipopresivos)
                  </label>
                  <input
                    type="url"
                    value={diaActualData.link_cardio}
                    onChange={e => setDiaField(diaActivo, 'link_cardio', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded-md p-2.5 text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Leyenda de colores */}
              <div className="flex flex-wrap gap-2 mb-4">
                {TIPOS_AGRUPACION.filter(t => t.valor !== 'unica').map(t => (
                  <span key={t.valor} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_AGRUPACION[t.valor]}`}>
                    {t.etiqueta}
                  </span>
                ))}
              </div>

              {/* Lista de ejercicios */}
              <div className="space-y-2 mb-4">
                {diaActualData.ejercicios.map((ej, ejIdx) => (
                  <TarjetaEjercicio
                    key={ejIdx}
                    ej={ej}
                    idx={ejIdx}
                    catalogo={catalogo}
                    onChange={(field, val) => setEjercicioField(diaActivo, ejIdx, field, val)}
                    onEliminar={() => eliminarEjercicio(diaActivo, ejIdx)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => agregarEjercicio(diaActivo)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-600 hover:border-[#D4AF37] text-gray-500 hover:text-[#D4AF37] rounded-lg py-3 text-sm font-semibold transition"
              >
                <IconoMas /> Agregar Ejercicio al Dia {diaActivo + 1}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}