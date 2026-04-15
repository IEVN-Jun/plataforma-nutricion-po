import { useState, useEffect } from 'react';

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500 hover:text-[#D4AF37] cursor-help transition-colors inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InputConTooltip = ({ label, name, value, onChange, tooltip, requerido = false }: any) => (
  <div className="relative group">
    <div className="flex items-center mb-1">
      <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}{requerido && '*'}</label>
      {tooltip && <InfoIcon />}
    </div>
    <input 
      type="number" step="0.1" name={name} value={value || ''} onChange={onChange} required={requerido}
      className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all" 
    />
    {tooltip && (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[10px] p-2 rounded shadow-xl w-56 z-50 text-center leading-tight pointer-events-none border border-gray-600">
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    )}
  </div>
);

export default function ExpedientePaciente({ pacienteId, onVolver }: { pacienteId: number, onVolver: () => void }) {
  const [paciente, setPaciente] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState<any>(null);
  const [tipoAjuste, setTipoAjuste] = useState("-500");
  
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState<any>({});

  const estadoMedidas = {
    peso_kg: '', talla_cm: '', 
    pliegue_triceps: '', pliegue_biceps: '', pliegue_subescapular: '', pliegue_suprailiaco: '',
    pliegue_abdominal: '', pliegue_muslo: '', pliegue_pantorrilla: '', 
    circ_cuello: '', circ_brazo: '', circ_cintura: '', circ_abdomen: '', circ_cadera: '', circ_pierna: '', circ_pantorrilla: '',
    ajuste_calorico: '-500', notas_clinicas: ''
  };
  const [medidas, setMedidas] = useState(estadoMedidas);

  const cargarExpediente = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}?t=${new Date().getTime()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setPaciente(data.paciente);
        setHistorial(data.historial);
      }
    } catch (error) {
      console.error("Error al cargar expediente:", error);
    }
  };

  useEffect(() => { cargarExpediente(); }, [pacienteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMedidas({ ...medidas, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDatosEdicion({ ...datosEdicion, [e.target.name]: e.target.value });
  };

  const abrirEdicion = () => {
    setDatosEdicion({
      nombre: paciente.nombre || '',
      email: paciente.email || '',
      telefono: paciente.telefono || '',
      genero: paciente.genero || '',
      fecha_nacimiento: paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toISOString().split('T') : '',
      objetivo: paciente.objetivo || '',
      factor_actividad: paciente.factor_actividad || '1.2'
    });
    setEditandoPerfil(true);
  };

  const guardarCambiosPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEdicion)
      });
      if (res.ok) {
        setEditandoPerfil(false);
        cargarExpediente();
      } else {
        alert("Error al actualizar perfil.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTipoAjusteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setTipoAjuste(valor);
    if (valor !== 'manual') {
      setMedidas({ ...medidas, ajuste_calorico: valor });
    } else {
      setMedidas({ ...medidas, ajuste_calorico: '' });
    }
  };

  const calcularGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}/medidas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medidas)
    });

    if (res.ok) {
      setMedidas(estadoMedidas); 
      setTipoAjuste("-500");
      cargarExpediente(); 
    } else {
      alert("Error al guardar evaluacion.");
    }
    setCargando(false);
  };

  const calcularEdad = (fecha: string) => {
    if (!fecha) return 'N/A';
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return edad;
  };

  if (!paciente) return <div className="text-[#D4AF37] p-10 text-center font-bold text-xl animate-pulse">Cargando expediente clinico...</div>;

  return (
    <div className="w-full max-w-7xl animate-fade-in relative text-gray-200">
      
      {medidaSeleccionada && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] p-8 rounded-xl border border-[#D4AF37] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Detalle de Sesion</h2>
              <span className="bg-[#D4AF37] text-black font-bold px-3 py-1 rounded text-sm">{new Date(medidaSeleccionada.fecha).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800"><p className="text-gray-400 text-xs">Peso</p><p className="text-xl font-bold text-white">{medidaSeleccionada.peso_kg} kg</p></div>
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800"><p className="text-gray-400 text-xs">% Grasa</p><p className="text-xl font-bold text-red-400">{medidaSeleccionada.porcentaje_grasa}%</p></div>
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800"><p className="text-gray-400 text-xs">Masa Musc.</p><p className="text-xl font-bold text-blue-400">{medidaSeleccionada.masa_muscular_kg} kg</p></div>
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800"><p className="text-gray-400 text-xs">Meta Calorica</p><p className="text-xl font-bold text-green-400">{medidaSeleccionada.calorias_recomendadas}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
                <h3 className="text-[#D4AF37] font-semibold mb-3 border-b border-gray-800">Pliegues (mm)</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li className="flex justify-between"><span>Triceps:</span> <span>{medidaSeleccionada.pliegue_triceps}</span></li>
                  <li className="flex justify-between"><span>Biceps:</span> <span>{medidaSeleccionada.pliegue_biceps}</span></li>
                  <li className="flex justify-between"><span>Subescapular:</span> <span>{medidaSeleccionada.pliegue_subescapular}</span></li>
                  <li className="flex justify-between"><span>Suprailiaco:</span> <span>{medidaSeleccionada.pliegue_suprailiaco}</span></li>
                  <li className="flex justify-between"><span>Abdominal:</span> <span>{medidaSeleccionada.pliegue_abdominal || '-'}</span></li>
                  <li className="flex justify-between"><span>Muslo:</span> <span>{medidaSeleccionada.pliegue_muslo || '-'}</span></li>
                  <li className="flex justify-between"><span>Pantorrilla:</span> <span>{medidaSeleccionada.pliegue_pantorrilla || '-'}</span></li>
                </ul>
              </div>
              <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
                <h3 className="text-[#D4AF37] font-semibold mb-3 border-b border-gray-800">Circunferencias (cm)</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li className="flex justify-between"><span>Cuello:</span> <span>{medidaSeleccionada.circ_cuello || '-'}</span></li>
                  <li className="flex justify-between"><span>Brazo:</span> <span>{medidaSeleccionada.circ_brazo || '-'}</span></li>
                  <li className="flex justify-between"><span>Cintura:</span> <span>{medidaSeleccionada.circ_cintura || '-'}</span></li>
                  <li className="flex justify-between"><span>Abdomen:</span> <span>{medidaSeleccionada.circ_abdomen || '-'}</span></li>
                  <li className="flex justify-between"><span>Cadera:</span> <span>{medidaSeleccionada.circ_cadera || '-'}</span></li>
                  <li className="flex justify-between"><span>Pierna:</span> <span>{medidaSeleccionada.circ_pierna || '-'}</span></li>
                  <li className="flex justify-between"><span>Pantorrilla:</span> <span>{medidaSeleccionada.circ_pantorrilla || '-'}</span></li>
                </ul>
              </div>
            </div>
            {medidaSeleccionada.notas_clinicas && (
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800 mb-6">
                <h3 className="text-[#D4AF37] font-semibold mb-2">Notas Medicas</h3>
                <p className="text-gray-300 text-sm italic">{medidaSeleccionada.notas_clinicas}</p>
              </div>
            )}
            <button onClick={() => setMedidaSeleccionada(null)} className="w-full bg-gray-800 text-white font-bold py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition">Cerrar</button>
          </div>
        </div>
      )}

      {editandoPerfil && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardarCambiosPerfil} className="bg-[#1A1A1A] p-8 rounded-xl border border-[#D4AF37] w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Editar Informacion del Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-400">Nombre</label><input type="text" name="nombre" value={datosEdicion.nombre} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700" /></div>
              <div><label className="text-xs text-gray-400">Email</label><input type="email" name="email" value={datosEdicion.email} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700" /></div>
              <div><label className="text-xs text-gray-400">Telefono</label><input type="text" name="telefono" value={datosEdicion.telefono} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700" /></div>
              <div><label className="text-xs text-gray-400">Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento" value={datosEdicion.fecha_nacimiento} onChange={handleEditChange} className="w-full bg-[#0A0A0A] text-gray-300 p-2 rounded border border-gray-700" /></div>
              <div>
                <label className="text-xs text-gray-400">Genero</label>
                <select name="genero" value={datosEdicion.genero} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700">
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Factor Actividad</label>
                <select name="factor_actividad" value={datosEdicion.factor_actividad} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700">
                  <option value="1.2">Sedentario (1.2)</option>
                  <option value="1.375">Ligero (1.375)</option>
                  <option value="1.55">Moderado (1.55)</option>
                  <option value="1.725">Activo (1.725)</option>
                  <option value="1.9">Muy Activo (1.9)</option>
                </select>
              </div>
              <div className="md:col-span-2"><label className="text-xs text-gray-400">Objetivo</label><input type="text" name="objetivo" value={datosEdicion.objetivo} onChange={handleEditChange} className="w-full bg-[#0A0A0A] p-2 rounded border border-gray-700" /></div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-md hover:bg-[#b5952f] transition">Guardar Cambios</button>
              <button type="button" onClick={() => setEditandoPerfil(false)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#0A0A0A] border-l-4 border-[#D4AF37] rounded-r-xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase">{paciente.nombre}</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6">
              <p className="text-xs text-gray-400"><strong className="text-white block">Email:</strong> {paciente.email}</p>
              <p className="text-xs text-gray-400"><strong className="text-white block">Telefono:</strong> {paciente.telefono}</p>
              <p className="text-xs text-gray-400"><strong className="text-white block">Edad / Gen:</strong> {calcularEdad(paciente.fecha_nacimiento)} anos / {paciente.genero}</p>
              <p className="text-xs text-gray-400"><strong className="text-[#D4AF37] block">Objetivo:</strong> {paciente.objetivo}</p>
              <p className="text-xs text-gray-400 sm:col-span-2 md:col-span-1"><strong className="text-white block">Factor Actividad:</strong> {paciente.factor_actividad}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6 md:mt-0">
            <button onClick={abrirEdicion} className="bg-gray-800 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] px-4 py-2 rounded-md font-bold text-xs transition-all border border-[#D4AF37]/30">
              Editar Datos
            </button>
            <button onClick={onVolver} className="bg-transparent border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded-md text-xs font-medium transition">
              Volver al Panel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 xl:col-span-1 shadow-lg">
          <h3 className="text-xl font-bold text-[#D4AF37] mb-5 border-b border-gray-800 pb-2">Registrar Sesion</h3>
          <form onSubmit={calcularGuardar} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputConTooltip label="Peso (kg)" name="peso_kg" value={medidas.peso_kg} onChange={handleChange} requerido tooltip="Peso en bascula calibrada." />
              <InputConTooltip label="Talla (cm)" name="talla_cm" value={medidas.talla_cm} onChange={handleChange} requerido tooltip="Estatura libre de calzado." />
            </div>

            <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
              <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Pliegues (mm)</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                <InputConTooltip label="Triceps" name="pliegue_triceps" value={medidas.pliegue_triceps} onChange={handleChange} requerido tooltip="Linea media posterior del brazo." />
                <InputConTooltip label="Biceps" name="pliegue_biceps" value={medidas.pliegue_biceps} onChange={handleChange} requerido tooltip="Cara anterior del brazo." />
                <InputConTooltip label="Subesc." name="pliegue_subescapular" value={medidas.pliegue_subescapular} onChange={handleChange} requerido tooltip="Diagonal, 2cm debajo de la escapula." />
                <InputConTooltip label="Suprail." name="pliegue_suprailiaco" value={medidas.pliegue_suprailiaco} onChange={handleChange} requerido tooltip="Diagonal sobre la cresta iliaca." />
                <InputConTooltip label="Abdom." name="pliegue_abdominal" value={medidas.pliegue_abdominal} onChange={handleChange} tooltip="Vertical, 5cm a la derecha del ombligo." />
                <InputConTooltip label="Muslo" name="pliegue_muslo" value={medidas.pliegue_muslo} onChange={handleChange} tooltip="Anterior, entre ingle y rotula." />
              </div>
            </fieldset>

            <fieldset className="bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
              <legend className="text-sm font-semibold text-[#D4AF37] px-2 uppercase tracking-tighter">Circunferencias (cm)</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {['cuello', 'brazo', 'cintura', 'abdomen', 'cadera', 'pierna', 'pantorrilla'].map(zona => (
                  <InputConTooltip key={zona} label={zona} name={`circ_${zona}`} value={(medidas as any)[`circ_${zona}`]} onChange={handleChange} tooltip={`Medicion horizontal de ${zona}.`} />
                ))}
              </div>
            </fieldset>

            <div className="bg-green-900/10 p-4 rounded-lg border border-green-900/30">
              <label className="block text-xs font-semibold text-green-500 mb-2 uppercase tracking-wider">Ajuste Calorico</label>
              <select value={tipoAjuste} onChange={handleTipoAjusteChange} className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md mb-3 outline-none focus:border-green-500 text-sm">
                <option value="-500">Deficit Estandar (-500 kcal)</option>
                <option value="500">Superavit Estandar (+500 kcal)</option>
                <option value="0">Mantenimiento (0 kcal)</option>
                <option value="manual">Ajuste Manual...</option>
              </select>
              {tipoAjuste === 'manual' && (
                <div className="flex items-center mt-2 animate-fade-in">
                  <span className="text-gray-400 mr-3 text-sm font-semibold">Kcal:</span>
                  <input type="number" name="ajuste_calorico" value={medidas.ajuste_calorico} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 p-2.5 rounded-md outline-none focus:border-green-500 font-bold" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Notas Medicas</label>
              <textarea name="notas_clinicas" value={medidas.notas_clinicas} onChange={handleChange} rows={2} placeholder="Reporte de sesion..." className="w-full bg-[#0A0A0A] text-white border border-gray-700 p-2.5 rounded-md outline-none resize-none focus:border-[#D4AF37]"></textarea>
            </div>

            <button type="submit" disabled={cargando} className="w-full bg-[#D4AF37] text-black font-extrabold py-3.5 rounded-md hover:bg-[#b5952f] transition shadow-lg uppercase text-sm tracking-widest mt-4">
              {cargando ? 'Procesando...' : 'Calcular y Guardar'}
            </button>
          </form>
        </div>

        {/* HISTORIAL CLINICO */}
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 xl:col-span-2 shadow-lg flex flex-col h-full min-h-[600px]">
          <h3 className="text-xl font-bold text-white mb-5 border-b border-gray-800 pb-2">Historial de Evaluaciones</h3>
          {historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-500"><p>No hay datos registrados aun.</p></div>
          ) : (
            <div className="overflow-x-auto w-full pb-4 custom-scrollbar">
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
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/80 transition">
                      <td className="p-3 font-medium text-white">{new Date(m.fecha).toLocaleDateString()}</td>
                      <td className="p-3">{m.peso_kg}kg</td>
                      <td className="p-3 text-red-400 font-bold">{m.porcentaje_grasa}%</td>
                      <td className="p-3 text-blue-400 font-bold">{m.masa_muscular_kg}kg</td>
                      <td className="p-3 border-l border-gray-700 pl-4">{m.gasto_energetico_total}</td>
                      <td className={`p-3 font-bold bg-green-900/5 text-center ${Number(m.ajuste_calorico) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {Number(m.ajuste_calorico) > 0 ? '+' : ''}{m.ajuste_calorico}
                      </td>
                      <td className="p-3 text-white font-extrabold bg-green-900/20 text-center">{m.calorias_recomendadas}</td>
                      <td className="p-3 border-l border-gray-700 pl-4 text-center">
                        <button onClick={() => setMedidaSeleccionada(m)} className="bg-gray-800 hover:bg-gray-700 text-[#D4AF37] px-3 py-1.5 rounded text-[10px] font-bold transition border border-gray-600">
                          Detalles
                        </button>
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