import { useState } from 'react';

export default function RegistroPaciente() {
  const estadoInicial = {
    nombre: '', email: '', password: '', genero: '', fecha_nacimiento: '', telefono: '',
    objetivo: '', referencias_medicas: '', actividad_fisica: '', horarios_alimentacion: '', factor_actividad: '1.2'
  };
  
  const [formData, setFormData] = useState(estadoInicial);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const response = await fetch('http://localhost:3000/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setMensaje({ texto: `¡Paciente ${data.paciente.nombre} registrado con éxito!`, tipo: 'success' });
        setFormData(estadoInicial);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMensaje({ texto: data.error, tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-[#1A1A1A] p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-white">
          Apertura de <span className="text-[#D4AF37]">Expediente Clínico</span>
        </h2>
      </div>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded font-medium ${mensaje.tipo === 'success' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'} border text-center`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BLOQUE 1: Datos Personales */}
        <fieldset className="bg-[#0A0A0A] p-6 rounded-lg border border-gray-800">
          <legend className="text-[#D4AF37] font-semibold px-2">Datos de Contacto y Acceso</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Nombre Completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Teléfono (WhatsApp)</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Correo (Usuario)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Contraseña de acceso</label>
              <input type="text" name="password" value={formData.password} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Género Biológico</label>
              <select name="genero" value={formData.genero} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition">
                <option value="">Seleccionar...</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-gray-300 border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
          </div>
        </fieldset>

        {/* BLOQUE 2: Perfil Nutricional */}
        <fieldset className="bg-[#0A0A0A] p-6 rounded-lg border border-gray-800">
          <legend className="text-[#D4AF37] font-semibold px-2">Perfil Nutricional y Clínico</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Objetivo Inicial</label>
              <input type="text" name="objetivo" placeholder="Ej. Aumento de masa muscular magra" value={formData.objetivo} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Factor de Actividad (Multiplicador TMB)</label>
              <select name="factor_actividad" value={formData.factor_actividad} onChange={handleChange} required className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition">
                <option value="1.2">Sedentario (x 1.2)</option>
                <option value="1.375">Ligero - 1 a 3 días/sem (x 1.375)</option>
                <option value="1.55">Moderado - 3 a 5 días/sem (x 1.55)</option>
                <option value="1.725">Activo - 6 a 7 días/sem (x 1.725)</option>
                <option value="1.9">Muy Activo / Atleta (x 1.9)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Referencias Médicas (Lesiones, Alergias, Patologías)</label>
              <textarea name="referencias_medicas" value={formData.referencias_medicas} onChange={handleChange} className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" rows={2}></textarea>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Rutina Física Actual</label>
              <textarea name="actividad_fisica" placeholder="Ej. 5 días de Gym 5:00 a 7:00pm" value={formData.actividad_fisica} onChange={handleChange} className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" rows={2}></textarea>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Horarios de Alimentación</label>
              <textarea name="horarios_alimentacion" placeholder="Ej. 8:30am, 1:00pm, 7:00pm" value={formData.horarios_alimentacion} onChange={handleChange} className="w-full bg-[#1A1A1A] text-white border border-gray-700 rounded-md p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition" rows={2}></textarea>
            </div>
          </div>
        </fieldset>

        <button type="submit" disabled={cargando} className={`w-full ${cargando ? 'bg-gray-600' : 'bg-[#D4AF37] hover:bg-[#b5952f]'} text-black font-bold py-3.5 px-4 rounded-md shadow-lg transition-all text-lg`}>
          {cargando ? 'Guardando expediente...' : 'Crear Expediente del Paciente'}
        </button>
      </form>
    </div>
  );
}