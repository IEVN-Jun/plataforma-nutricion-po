// MacronutrientesCard.tsx
// Componente para mostrar los macronutrientes calculados a partir de las
// calorias recomendadas y el peso del paciente.
// Formulas segun listado.docx:
//   Proteina  (40%): (calorias * 0.40) / 4
//   Carbs     (30%): (calorias * 0.30) / 4
//   Grasa     (30%): (calorias * 0.30) / 9
//   Agua            : peso_kg * 35 ml (adultos 18-55), mostrar en litros

interface Props {
  caloriasRecomendadas: number | string;
  pesoKg:               number | string;
}

// Barra de progreso visual para cada macro
const BarraMacro = ({ porcentaje, color }: { porcentaje: number; color: string }) => (
  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
    <div
      className={`h-1.5 rounded-full ${color}`}
      style={{ width: `${Math.min(porcentaje, 100)}%` }}
    />
  </div>
);

export default function MacronutrientesCard({ caloriasRecomendadas, pesoKg }: Props) {
  const kcal = parseFloat(String(caloriasRecomendadas)) || 0;
  const peso = parseFloat(String(pesoKg)) || 0;

  if (kcal <= 0) return null;

  const proteina = ((kcal * 0.40) / 4).toFixed(1);   // gramos
  const carbs    = ((kcal * 0.30) / 4).toFixed(1);   // gramos
  const grasa    = ((kcal * 0.30) / 9).toFixed(1);   // gramos
  const aguaL    = ((peso * 35) / 1000).toFixed(2);  // litros

  const macros = [
    {
      nombre: 'Proteina',
      gramos: proteina,
      porcentaje: 40,
      kcalAporte: (parseFloat(proteina) * 4).toFixed(0),
      color: 'bg-blue-500',
      colorTexto: 'text-blue-400',
      colorBg: 'bg-blue-900/20 border-blue-800/40',
      nota: '(40% kcal / 4 kcal/g)',
    },
    {
      nombre: 'Carbohidratos',
      gramos: carbs,
      porcentaje: 30,
      kcalAporte: (parseFloat(carbs) * 4).toFixed(0),
      color: 'bg-[#D4AF37]',
      colorTexto: 'text-[#D4AF37]',
      colorBg: 'bg-yellow-900/20 border-yellow-800/40',
      nota: '(30% kcal / 4 kcal/g)',
    },
    {
      nombre: 'Grasas',
      gramos: grasa,
      porcentaje: 30,
      kcalAporte: (parseFloat(grasa) * 9).toFixed(0),
      color: 'bg-orange-500',
      colorTexto: 'text-orange-400',
      colorBg: 'bg-orange-900/20 border-orange-800/40',
      nota: '(30% kcal / 9 kcal/g)',
    },
  ];

  return (
    <div className="bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
      <h3 className="text-[#D4AF37] font-semibold mb-4 border-b border-gray-800 pb-2">
        Distribucion de Macronutrientes
      </h3>

      {/* Tarjetas de macros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {macros.map(m => (
          <div key={m.nombre} className={`rounded-lg border p-4 ${m.colorBg}`}>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{m.nombre}</p>
            <p className={`text-2xl font-extrabold ${m.colorTexto}`}>
              {m.gramos} <span className="text-sm font-normal">g</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">{m.kcalAporte} kcal aportadas</p>
            <BarraMacro porcentaje={m.porcentaje} color={m.color} />
            <p className="text-gray-600 text-[10px] mt-1.5">{m.nota}</p>
          </div>
        ))}
      </div>

      {/* Agua */}
      <div className="flex items-center justify-between bg-blue-900/10 border border-blue-800/30 rounded-lg px-4 py-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Necesidad Hidrica Diaria</p>
          <p className="text-xs text-gray-600 mt-0.5">Formula: peso (kg) × 35 ml/kg (adultos 18-55 anos)</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-2xl font-extrabold text-blue-400">
            {aguaL} <span className="text-sm font-normal">L</span>
          </p>
          <p className="text-gray-500 text-xs">{(peso * 35).toFixed(0)} ml totales</p>
        </div>
      </div>

      {/* Nota de resumen */}
      <p className="text-gray-600 text-[10px] text-right mt-2">
        Base de calculo: {kcal.toFixed(0)} kcal recomendadas · {peso} kg
      </p>
    </div>
  );
}