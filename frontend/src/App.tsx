import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [estaLogueado, setEstaLogueado] = useState(false);

  // Verificamos si Paulina ya había iniciado sesión antes
  useEffect(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    if (token && rol === 'admin') {
      setEstaLogueado(true);
    }
  }, []);

  const manejarLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    setEstaLogueado(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center py-10 px-4 text-white">
      {estaLogueado ? (
        <Dashboard onLogout={manejarLogout} />
      ) : (
        <div className="flex-1 flex items-center justify-center w-full">
          <Login onLoginSuccess={() => setEstaLogueado(true)} />
        </div>
      )}
    </div>
  );
}

export default App;