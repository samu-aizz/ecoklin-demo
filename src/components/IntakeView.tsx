import { useState } from 'react';
import { Check, Minus, Plus, Scale, Truck } from 'lucide-react';
import type { ClientSector, DemoUser, IntakeRecord, WeightStatus } from '../types/plant';
import { formatKg, formatTime } from '../utils/formatters';

interface IntakeViewProps {
  intakes: IntakeRecord[];
  activeUser: DemoUser;
  onAddIntake: (entry: Omit<IntakeRecord, 'id' | 'timestamp' | 'processedBags'>) => void;
  onAssignWeight: (intakeId: string, weightKg: number) => void;
}

const ORIGIN_PRESETS: Record<ClientSector, string[]> = {
  estado: [
    'Municipalidad · Ruta Norte',
    'Municipalidad · Zona Centro',
    'Punto Verde Municipal',
    'Organismo Público / Hospital',
  ],
  privado: [
    'Supermercados Centro S.A.',
    'Logística Parque Industrial',
    'Fábrica / Industria Privada',
    'Centro Comercial / Shopping',
  ],
};

const TRUCK_PRESETS = [
  'Camión #04 · Iveco AF-412',
  'Camión #07 · Mercedes AB-891',
  'Camión #12 · Ford Cargo AE-309',
  'Camión Externo / Flete',
];

const DRIVER_PRESETS = ['Juan Rodríguez', 'Darío Acosta', 'Héctor López'];

const MATERIAL_HINTS = [
  'Mezcla RSU Seco',
  'Cartón y Papel',
  'Plásticos PET / PEAD',
  'Industrial Limpio',
];

export function IntakeView({
  intakes,
  activeUser,
  onAddIntake,
  onAssignWeight,
}: IntakeViewProps) {
  const [clientType, setClientType] = useState<ClientSector>('estado');
  const [origin, setOrigin] = useState(ORIGIN_PRESETS.estado[0]);
  const [truckId, setTruckId] = useState(TRUCK_PRESETS[0]);
  const [driverName, setDriverName] = useState(DRIVER_PRESETS[0]);
  const [bagCount, setBagCount] = useState(8);
  const [weightMode, setWeightMode] = useState<WeightStatus>('pesado');
  const [weightInput, setWeightInput] = useState('1250');
  const [materialHint, setMaterialHint] = useState(MATERIAL_HINTS[0]);
  const [notes, setNotes] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const [filter, setFilter] = useState<'todos' | 'estado' | 'privado' | 'sin_pesar'>('todos');
  const [showAll, setShowAll] = useState(false);
  const [weighingId, setWeighingId] = useState<string | null>(null);
  const [lateWeightValue, setLateWeightValue] = useState('');

  const handleSectorChange = (sector: ClientSector) => {
    setClientType(sector);
    setOrigin(ORIGIN_PRESETS[sector][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bagCount <= 0) return;

    const parsedWeight =
      weightMode === 'pesado' ? Math.max(1, Number(weightInput) || 0) : null;

    if (weightMode === 'pesado' && (!parsedWeight || parsedWeight <= 0)) {
      return;
    }

    onAddIntake({
      clientType,
      origin: origin.trim() || 'Procedencia sin especificar',
      truckId: truckId.trim() || 'Camión sin identificar',
      driverName: driverName.trim() || 'Chofer sin registrar',
      materialHint,
      bagCount,
      weightKg: parsedWeight,
      weightStatus: weightMode,
      notes: notes.trim(),
      operatorId: activeUser.id,
      operatorName: activeUser.name,
      shift: activeUser.shift,
    });

    setNotes('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const filteredIntakes = intakes.filter((item) => {
    if (filter === 'sin_pesar') return item.weightStatus === 'sin_pesar';
    if (filter === 'estado') return item.clientType === 'estado';
    if (filter === 'privado') return item.clientType === 'privado';
    return true;
  });

  const unweighedCount = intakes.filter((i) => i.weightStatus === 'sin_pesar').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0D2114]">
          Ingreso de Bolsones y Camiones
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registrá el camión, chofer, origen (Estado o privado) y cantidad de bolsones con o sin peso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario Mobile-First de Carga Rápida */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#0D2114]">Nuevo ingreso a playa</h2>
            <span className="text-xs text-slate-500">
              {activeUser.name} · {activeUser.shift}
            </span>
          </div>

          {/* Sector: Estado vs Privado */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Tipo de cliente / procedencia
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleSectorChange('estado')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  clientType === 'estado'
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Estado / Municipal
              </button>
              <button
                type="button"
                onClick={() => handleSectorChange('privado')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  clientType === 'privado'
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Empresa / Privado
              </button>
            </div>
          </div>

          {/* De dónde entró la carga */}
          <div>
            <label htmlFor="intake-origin" className="block text-sm font-medium text-slate-800 mb-2">
              De dónde ingresó la carga
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ORIGIN_PRESETS[clientType].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOrigin(preset)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    origin === preset
                      ? 'bg-[#EEF6EE] border-[#1E7332] text-[#0B3B1E]'
                      : 'bg-white text-slate-700 border-[#DCE5DC] hover:bg-[#F4F7F4]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              id="intake-origin"
              type="text"
              required
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej. Municipalidad Ruta 2 o Empresa..."
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
            />
          </div>

          {/* Camión específico y Chofer */}
          <div className="space-y-4">
            <div>
              <label htmlFor="intake-truck" className="block text-sm font-medium text-slate-800 mb-2">
                Camión que ingresó
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TRUCK_PRESETS.map((truck) => (
                  <button
                    key={truck}
                    type="button"
                    onClick={() => setTruckId(truck)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      truckId === truck
                        ? 'bg-[#0B3B1E] text-white border-[#0B3B1E]'
                        : 'bg-white text-slate-700 border-[#DCE5DC] hover:bg-[#F4F7F4]'
                    }`}
                  >
                    {truck}
                  </button>
                ))}
              </div>
              <input
                id="intake-truck"
                type="text"
                required
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
                placeholder="Ej. Camión #04 · Patente AF-412"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
              />
            </div>

            <div>
              <label htmlFor="intake-driver" className="block text-sm font-medium text-slate-800 mb-2">
                Chofer
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DRIVER_PRESETS.map((driver) => (
                  <button
                    key={driver}
                    type="button"
                    onClick={() => setDriverName(driver)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      driverName === driver
                        ? 'bg-[#EEF6EE] border-[#1E7332] text-[#0B3B1E]'
                        : 'bg-white text-slate-700 border-[#DCE5DC] hover:bg-[#F4F7F4]'
                    }`}
                  >
                    {driver}
                  </button>
                ))}
              </div>
              <input
                id="intake-driver"
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Nombre y apellido del chofer"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
              />
            </div>
          </div>

          {/* Cantidad de bolsones */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Cantidad de bolsones
            </label>
            <div className="flex items-center justify-between gap-3 bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl p-2">
              <button
                type="button"
                onClick={() => setBagCount((c) => Math.max(1, c - 1))}
                className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-[#DCE5DC] text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
                aria-label="Restar un bolsón"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={bagCount}
                  onChange={(e) => setBagCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 text-center text-3xl font-bold font-mono tabular-nums text-[#0D2114] bg-transparent focus:outline-none"
                  aria-label="Cantidad de bolsones"
                />
                <span className="block text-xs text-slate-500 -mt-1">bolsones</span>
              </div>

              <button
                type="button"
                onClick={() => setBagCount((c) => c + 1)}
                className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-[#DCE5DC] text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
                aria-label="Sumar un bolsón"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 5, 10].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setBagCount((c) => c + step)}
                  className="min-h-[44px] rounded-lg border border-[#DCE5DC] bg-white text-xs font-mono font-medium text-slate-700 hover:bg-[#F4F7F4] transition-colors"
                >
                  +{step} bolsones
                </button>
              ))}
            </div>
          </div>

          {/* Control de Peso */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Peso del lote
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setWeightMode('pesado')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  weightMode === 'pesado'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Con peso en báscula
              </button>
              <button
                type="button"
                onClick={() => setWeightMode('sin_pesar')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  weightMode === 'sin_pesar'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sin pesar (cargar luego)
              </button>
            </div>

            {weightMode === 'pesado' ? (
              <div className="mt-2.5">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step="1"
                    required
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="Ej. 1450"
                    className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-slate-300 bg-white text-lg font-mono font-semibold tabular-nums text-[#0D2114] focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-500">
                    kg
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                El lote quedará marcado como pendiente de pesaje para completar cuando se libere la báscula.
              </p>
            )}
          </div>

          {/* Material predominante */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Tipo de carga estimada
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MATERIAL_HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setMaterialHint(hint)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border text-left transition-colors ${
                    materialHint === hint
                      ? 'bg-[#EEF6EE] border-[#1E7332] text-[#0B3B1E]'
                      : 'bg-white border-[#DCE5DC] text-slate-700 hover:bg-[#F4F7F4]'
                  }`}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="intake-notes" className="block text-sm font-medium text-slate-800 mb-1.5">
              Observaciones (opcional)
            </label>
            <input
              id="intake-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Humedad, remito o sector de descarga..."
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1E7332] text-white text-sm font-semibold hover:bg-[#165A26] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {savedNotice ? (
              <>
                <Check className="w-5 h-5" />
                Camión y bolsones guardados
              </>
            ) : (
              <>
                <Truck className="w-5 h-5" />
                Registrar ingreso a planta
              </>
            )}
          </button>
        </form>

        {/* Listado de Ingresos */}
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0D2114]">
                Camiones e ingresos registrados ({filteredIntakes.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {unweighedCount > 0
                  ? `${unweighedCount} lote pendiente de asignar peso en báscula`
                  : 'Todos los ingresos están pesados'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'estado', label: 'Estado' },
                  { id: 'privado', label: 'Privados' },
                  { id: 'sin_pesar', label: `Sin pesar (${unweighedCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredIntakes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay ingresos en este filtro.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(showAll ? filteredIntakes : filteredIntakes.slice(0, 10)).map((item) => {
                const pendingToSort = Math.max(0, item.bagCount - item.processedBags);
                const isEditingWeight = weighingId === item.id;

                return (
                  <div key={item.id} className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold ${
                              item.clientType === 'estado'
                                ? 'text-sky-700'
                                : 'text-[#1E7332]'
                            }`}
                          >
                            {item.clientType === 'estado' ? 'Estado' : 'Privado'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-sm font-semibold text-[#0D2114]">
                            {item.origin}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-1">
                          {item.truckId} · Chofer: {item.driverName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.materialHint} · {formatTime(item.timestamp)} · Cargado por{' '}
                          {item.operatorName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-base font-bold font-mono tabular-nums text-[#0D2114]">
                          {item.bagCount} bolsones
                        </span>
                        {item.weightStatus === 'pesado' && item.weightKg !== null ? (
                          <span className="block text-xs font-mono tabular-nums text-[#1E7332] font-medium">
                            {formatKg(item.weightKg)}
                          </span>
                        ) : (
                          <span className="block text-xs font-medium text-amber-700">
                            Sin pesar
                          </span>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-600 bg-[#F4F7F4] rounded-lg px-3 py-2">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-slate-500 tabular-nums">
                        {pendingToSort === 0
                          ? 'Lote completamente separado'
                          : `${pendingToSort} de ${item.bagCount} bolsones en espera de cinta`}
                      </span>

                      {item.weightStatus === 'sin_pesar' && !isEditingWeight && (
                        <button
                          type="button"
                          onClick={() => {
                            setWeighingId(item.id);
                            setLateWeightValue(String(item.bagCount * 140));
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          Asignar peso
                        </button>
                      )}
                    </div>

                    {isEditingWeight && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min={1}
                          value={lateWeightValue}
                          onChange={(e) => setLateWeightValue(e.target.value)}
                          placeholder="Peso en kg"
                          className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1E7332]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const kg = Number(lateWeightValue);
                            if (kg > 0) {
                              onAssignWeight(item.id, kg);
                              setWeighingId(null);
                            }
                          }}
                          className="min-h-[44px] px-4 rounded-xl bg-[#1E7332] text-white text-xs font-semibold hover:bg-[#165A26] whitespace-nowrap shrink-0"
                        >
                          Guardar kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeighingId(null)}
                          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {filteredIntakes.length > 10 && (
            <div className="px-5 py-3 bg-[#F4F7F4] border-t border-[#DCE5DC] text-center">
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="text-xs font-semibold text-[#1E7332] hover:text-[#0B3B1E]"
              >
                {showAll
                  ? 'Mostrar solo últimos 10 ingresos'
                  : `Ver historial completo (${filteredIntakes.length} registros)`}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
