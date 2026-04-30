import { useEffect, useState, useMemo } from 'react';
import RegistroPaciente from './RegistroPaciente';
import ExpedientePaciente from './ExpedientePaciente';

interface Paciente {
  id: number;
  nombre: string;
  email: string;
  genero: string;
  fecha_nacimiento: string;
  telefono: string;
  objetivo: string;
  ultima_consulta: string | null;
  total_sesiones: number;
}

type OrdenCampo = 'ultima_consulta_desc' | 'ultima_consulta_asc' | 'nombre_az' | 'nombre_za' | 'sesiones_desc' | 'sesiones_asc' | 'id_desc';
type FiltroGenero = 'Todos' | 'Hombre' | 'Mujer';

// --- Iconos SVG inline ---
const IconoBuscar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);
const IconoLimpiar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconoPacientes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconoReloj = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconoSesiones = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconoOrden = ({ activo, desc }: { activo: boolean; desc: boolean }) => (
  <span className={`ml-1 inline-flex flex-col leading-none transition-opacity ${activo ? 'opacity-100' : 'opacity-30'}`}>
    <span className={`text-[8px] ${activo && !desc ? 'text-[#D4AF37]' : 'text-gray-500'}`}>▲</span>
    <span className={`text-[8px] ${activo && desc  ? 'text-[#D4AF37]' : 'text-gray-500'}`}>▼</span>
  </span>
);

// --- Utilidades de formato ---
const formatearFecha = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const diasDesde = (iso: string | null): number | null => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
};

const BadgeConsulta = ({ fecha }: { fecha: string | null }) => {
  const dias = diasDesde(fecha);
  if (dias === null) return <span className="text-gray-600 text-xs italic">Sin consultas</span>;

  let color = 'bg-green-900/40 text-green-400 border-green-800/50';
  if (dias > 60) color = 'bg-red-900/40 text-red-400 border-red-800/50';
  else if (dias > 30) color = 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50';

  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      Hace {dias}d
    </span>
  );
};

// --- Lógica de ordenamiento ---
const OPCIONES_ORDEN: { valor: OrdenCampo; etiqueta: string }[] = [
  { valor: 'ultima_consulta_desc', etiqueta: 'Consulta más reciente' },
  { valor: 'ultima_consulta_asc',  etiqueta: 'Consulta más antigua' },
  { valor: 'nombre_az',            etiqueta: 'Nombre A → Z' },
  { valor: 'nombre_za',            etiqueta: 'Nombre Z → A' },
  { valor: 'sesiones_desc',        etiqueta: 'Más sesiones' },
  { valor: 'sesiones_asc',         etiqueta: 'Menos sesiones' },
  { valor: 'id_desc',              etiqueta: 'Registro más nuevo' },
];

const ordenarPacientes = (lista: Paciente[], orden: OrdenCampo): Paciente[] => {
  return [...lista].sort((a, b) => {
    switch (orden) {
      case 'ultima_consulta_desc':
        // Sin consulta va al final
        if (!a.ultima_consulta && !b.ultima_consulta) return 0;
        if (!a.ultima_consulta) return 1;
        if (!b.ultima_consulta) return -1;
        return new Date(b.ultima_consulta).getTime() - new Date(a.ultima_consulta).getTime();
      case 'ultima_consulta_asc':
        if (!a.ultima_consulta && !b.ultima_consulta) return 0;
        if (!a.ultima_consulta) return 1;
        if (!b.ultima_consulta) return -1;
        return new Date(a.ultima_consulta).getTime() - new Date(b.ultima_consulta).getTime();
      case 'nombre_az':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'nombre_za':
        return b.nombre.localeCompare(a.nombre, 'es');
      case 'sesiones_desc':
        return (b.total_sesiones ?? 0) - (a.total_sesiones ?? 0);
      case 'sesiones_asc':
        return (a.total_sesiones ?? 0) - (b.total_sesiones ?? 0);
      case 'id_desc':
        return b.id - a.id;
      default:
        return 0;
    }
  });
};

// --- Cabecera de columna con ordenamiento al clic ---
type ColumnSortKey = 'nombre' | 'sesiones' | 'ultima_consulta';
const columnaAOrdenes: Record<ColumnSortKey, [OrdenCampo, OrdenCampo]> = {
  nombre:          ['nombre_az',           'nombre_za'],
  sesiones:        ['sesiones_desc',        'sesiones_asc'],
  ultima_consulta: ['ultima_consulta_desc', 'ultima_consulta_asc'],
};

const CabeceraSortable = ({
  label, columna, ordenActual, onOrdenar,
}: {
  label: string;
  columna: ColumnSortKey;
  ordenActual: OrdenCampo;
  onOrdenar: (o: OrdenCampo) => void;
}) => {
  const [asc, desc] = columnaAOrdenes[columna];
  const activo = ordenActual === asc || ordenActual === desc;
  const esDesc = ordenActual === desc;

  const toggle = () => onOrdenar(activo && !esDesc ? desc : asc);

  return (
    <th
      className="p-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors"
      onClick={toggle}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <IconoOrden activo={activo} desc={esDesc} />
      </span>
    </th>
  );
};

// =============================================================================
export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [pacientes, setPacientes]                 = useState<Paciente[]>([]);
  const [mostrarRegistro, setMostrarRegistro]     = useState(false);
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<number | null>(null);
  const [cargando, setCargando]                   = useState(true);

  // Filtros y orden
  const [busqueda, setBusqueda]       = useState('');
  const [filtroGenero, setFiltroGenero] = useState<FiltroGenero>('Todos');
  const [orden, setOrden]             = useState<OrdenCampo>('ultima_consulta_desc');

  const cargarPacientes = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/pacientes');
      if (res.ok) setPacientes(await res.json());
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, []);

  // ---- Filtrado + ordenamiento reactivo — 0 requests extra ----
  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    const filtrados = pacientes.filter(p => {
      const coincideBusqueda =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.telefono ?? '').toLowerCase().includes(q) ||
        String(p.id) === q;

      const coincideGenero = filtroGenero === 'Todos' || p.genero === filtroGenero;
      return coincideBusqueda && coincideGenero;
    });

    return ordenarPacientes(filtrados, orden);
  }, [pacientes, busqueda, filtroGenero, orden]);

  // ---- Estadísticas ----
  const stats = useMemo(() => {
    const totalSesiones = pacientes.reduce((acc, p) => acc + (p.total_sesiones ?? 0), 0);
    const ultimaConsultaMs = pacientes
      .filter(p => p.ultima_consulta)
      .map(p => new Date(p.ultima_consulta!).getTime())
      .sort((a, b) => b - a)[0] ?? null;
    return { totalSesiones, ultimaConsultaMs };
  }, [pacientes]);

  const hayFiltros = busqueda !== '' || filtroGenero !== 'Todos';

  // Si hay expediente abierto, renderizamos ese componente
  if (pacienteSeleccionadoId) {
    return (
      <ExpedientePaciente
        pacienteId={pacienteSeleccionadoId}
        onVolver={() => setPacienteSeleccionadoId(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl">

      {/* ===== NAV ===== */}
      <nav className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
          Panel <span className="text-[#D4AF37]">Administrativo</span>
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setMostrarRegistro(!mostrarRegistro); cargarPacientes(); }}
            className="bg-[#D4AF37] hover:bg-[#b5952f] text-black px-4 py-2 rounded font-semibold transition text-sm"
          >
            {mostrarRegistro ? 'Ver Pacientes' : '+ Nuevo Paciente'}
          </button>
          <button
            onClick={onLogout}
            className="border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded transition text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {mostrarRegistro ? (
        <div className="flex justify-center">
          <RegistroPaciente />
        </div>
      ) : (
        <>
          {/* ===== ESTADÍSTICAS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <IconoPacientes />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Pacientes</p>
                <p className="text-2xl font-extrabold text-white">{pacientes.length}</p>
              </div>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400">
                <IconoSesiones />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Sesiones</p>
                <p className="text-2xl font-extrabold text-white">{stats.totalSesiones}</p>
              </div>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center text-green-400">
                <IconoReloj />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Última Actividad</p>
                <p className="text-sm font-bold text-white">
                  {stats.ultimaConsultaMs
                    ? formatearFecha(new Date(stats.ultimaConsultaMs).toISOString())
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ===== BARRA DE BÚSQUEDA, FILTROS Y ORDEN ===== */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">

            {/* Búsqueda */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
                <IconoBuscar />
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, correo, teléfono o #ID exacto..."
                className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none focus:border-[#D4AF37] transition placeholder-gray-600"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white transition"
                >
                  <IconoLimpiar />
                </button>
              )}
            </div>

            {/* Filtro género */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-gray-700 rounded-lg p-1 shrink-0">
              {(['Todos', 'Hombre', 'Mujer'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setFiltroGenero(g)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    filtroGenero === g ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Selector de orden */}
            <select
              value={orden}
              onChange={e => setOrden(e.target.value as OrdenCampo)}
              className="bg-[#1A1A1A] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#D4AF37] transition cursor-pointer shrink-0"
            >
              {OPCIONES_ORDEN.map(o => (
                <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
              ))}
            </select>

            {/* Recargar */}
            <button
              onClick={cargarPacientes}
              title="Recargar lista"
              className="px-3 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition text-xs shrink-0"
            >
              ↻
            </button>
          </div>

          {/* Contador de resultados + criterios activos */}
          {hayFiltros && (
            <p className="text-xs text-gray-500 mb-3">
              Mostrando{' '}
              <span className="text-white font-semibold">{pacientesFiltrados.length}</span>{' '}
              de{' '}
              <span className="text-white font-semibold">{pacientes.length}</span>{' '}
              pacientes
              {busqueda && (
                <> · búsqueda: <span className="text-[#D4AF37]">"{busqueda}"</span></>
              )}
              {filtroGenero !== 'Todos' && (
                <> · género: <span className="text-[#D4AF37]">{filtroGenero}</span></>
              )}
            </p>
          )}

          {/* ===== TABLA ===== */}
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
            {cargando ? (
              <div className="p-12 text-center text-[#D4AF37] font-semibold animate-pulse">
                Cargando pacientes...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300 min-w-[720px]">
                  <thead className="bg-[#0A0A0A] border-b border-gray-800 text-[#D4AF37]">
                    <tr>
                      {/* ID — orden fijo */}
                      <th
                        className="p-4 text-[11px] font-semibold uppercase tracking-wider w-14 cursor-pointer hover:text-white transition-colors select-none"
                        onClick={() => setOrden('id_desc')}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          ID
                          <IconoOrden activo={orden === 'id_desc'} desc={false} />
                        </span>
                      </th>

                      {/* Columnas sortables */}
                      <CabeceraSortable label="Nombre"         columna="nombre"          ordenActual={orden} onOrdenar={setOrden} />
                      <th className="p-4 text-[11px] font-semibold uppercase tracking-wider">Correo</th>
                      <th className="p-4 text-[11px] font-semibold uppercase tracking-wider">Género</th>
                      <CabeceraSortable label="Sesiones"       columna="sesiones"        ordenActual={orden} onOrdenar={setOrden} />
                      <CabeceraSortable label="Última Consulta" columna="ultima_consulta" ordenActual={orden} onOrdenar={setOrden} />
                      <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.map(paciente => (
                      <tr
                        key={paciente.id}
                        className="border-b border-gray-800 hover:bg-gray-900/60 transition"
                      >
                        {/* ID */}
                        <td className="p-4">
                          <span className="text-xs font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                            #{paciente.id}
                          </span>
                        </td>

                        {/* Nombre + objetivo como subtexto */}
                        <td className="p-4">
                          <p className="font-semibold text-white leading-tight">{paciente.nombre}</p>
                          {paciente.objetivo && (
                            <p className="text-[10px] text-gray-500 mt-0.5 max-w-[180px] truncate" title={paciente.objetivo}>
                              {paciente.objetivo}
                            </p>
                          )}
                        </td>

                        {/* Email */}
                        <td className="p-4 text-sm text-gray-400">{paciente.email}</td>

                        {/* Género */}
                        <td className="p-4">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            paciente.genero === 'Hombre'
                              ? 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                              : 'bg-pink-900/30 text-pink-400 border-pink-800/50'
                          }`}>
                            {paciente.genero}
                          </span>
                        </td>

                        {/* Sesiones */}
                        <td className="p-4 text-center">
                          {paciente.total_sesiones > 0 ? (
                            <span className="text-sm font-bold text-[#D4AF37]">
                              {paciente.total_sesiones}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Última consulta */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">
                              {formatearFecha(paciente.ultima_consulta)}
                            </span>
                            <BadgeConsulta fecha={paciente.ultima_consulta} />
                          </div>
                        </td>

                        {/* Acción */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setPacienteSeleccionadoId(paciente.id)}
                            className="bg-gray-800 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black text-xs font-bold px-3 py-1.5 rounded-md border border-gray-700 hover:border-[#D4AF37] transition-all"
                          >
                            Ver Expediente
                          </button>
                        </td>
                      </tr>
                    ))}

                    {pacientesFiltrados.length === 0 && !cargando && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-500">
                          {pacientes.length === 0
                            ? 'Aún no hay pacientes registrados.'
                            : 'No se encontraron pacientes con ese criterio de búsqueda.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}