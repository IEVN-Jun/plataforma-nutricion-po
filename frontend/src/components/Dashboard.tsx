import { useEffect, useState } from 'react';
import RegistroPaciente from './RegistroPaciente';
import ExpedientePaciente from './ExpedientePaciente';

// Definimos la estructura de los datos que esperamos del backend
interface Paciente {
  id: number;
  nombre: string;
  email: string;
  genero: string;
  fecha_nacimiento: string;
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<number | null>(null);

  // Función para pedir la lista al backend
  const cargarPacientes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/pacientes');
      if (response.ok) {
        const data = await response.json();
        setPacientes(data);
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    }
  };

  // Se ejecuta automáticamente al abrir el Dashboard
  useEffect(() => {
    cargarPacientes();
  }, []);

  return (
    <div className="w-full max-w-6xl">
      {/* LÓGICA PRINCIPAL: Si un paciente fue seleccionado, mostramos su expediente */}
      {pacienteSeleccionadoId ? (
        <ExpedientePaciente 
          pacienteId={pacienteSeleccionadoId} 
          onVolver={() => setPacienteSeleccionadoId(null)} 
        />
      ) : (
        /* SI NO HAY PACIENTE SELECCIONADO: Mostramos el Dashboard normal con la tabla */
        <>
          {/* Barra de Navegación del Dashboard */}
          <nav className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
              Panel <span className="text-[#D4AF37]">Administrativo</span>
            </h1>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setMostrarRegistro(!mostrarRegistro);
                  cargarPacientes(); // Recargamos la lista por si agregó a alguien nuevo
                }}
                className="bg-[#D4AF37] hover:bg-[#b5952f] text-black px-4 py-2 rounded font-semibold transition"
              >
                {mostrarRegistro ? 'Ver Pacientes' : '+ Nuevo Paciente'}
              </button>
              <button onClick={onLogout} className="border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded transition">
                Cerrar Sesión
              </button>
            </div>
          </nav>

          {/* Alternamos entre ver el formulario de registro o ver la tabla */}
          {mostrarRegistro ? (
            <div className="flex justify-center">
              <RegistroPaciente />
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-[#0A0A0A] border-b border-gray-800 text-[#D4AF37]">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Nombre Completo</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Género</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                      <td className="p-4">#{paciente.id}</td>
                      <td className="p-4 font-medium text-white">{paciente.nombre}</td>
                      <td className="p-4">{paciente.email}</td>
                      <td className="p-4">{paciente.genero}</td>
                      <td className="p-4">
                        {/* AQUÍ SE CONECTÓ EL BOTÓN: Al hacer clic, guarda el ID del paciente */}
                        <button 
                          onClick={() => setPacienteSeleccionadoId(paciente.id)}
                          className="text-[#D4AF37] hover:text-white text-sm underline font-semibold"
                        >
                          Ver Expediente
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pacientes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Aún no hay pacientes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}