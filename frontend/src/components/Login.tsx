import { useState } from 'react';

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardamos el token y el rol en la memoria del navegador
        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.usuario.rol);
        onLoginSuccess(); // Le avisamos a App.tsx que ya entró
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="w-full max-w-sm bg-[#1A1A1A] p-8 rounded-xl shadow-2xl border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-widest uppercase">
          Paulina <span className="text-[#D4AF37]">Ortega</span>
        </h2>
        <p className="text-gray-400 text-sm mt-2">Portal Clínico Exclusivo</p>
      </div>

      {error && <div className="bg-red-900/50 text-red-400 p-3 rounded mb-4 text-center text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Correo Electrónico</label>
          <input 
            type="email" name="email" value={credenciales.email} onChange={handleChange} required
            className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Contraseña</label>
          <input 
            type="password" name="password" value={credenciales.password} onChange={handleChange} required
            className="w-full bg-[#0A0A0A] text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-3 px-4 rounded mt-4 transition-colors">
          Ingresar
        </button>
      </form>
    </div>
  );
}