import { useState } from 'react';
import { Check, Layers, Minus, Plus } from 'lucide-react';
import type { DemoUser, MaterialStock, ProductionRecord } from '../types/plant';
import { formatKg, formatTime } from '../utils/formatters';

interface ProductionViewProps {
  materials: MaterialStock[];
  productions: ProductionRecord[];
  pendingBagsAvailable: number;
  activeUser: DemoUser;
  onAddProduction: (entry: Omit<ProductionRecord, 'id' | 'timestamp'>) => void;
}

const PRESS_OPTIONS = [
  'Prensa Hidráulica 1',
  'Prensa Hidráulica 2',
  'Compactadora 3',
];

export function ProductionView({
  materials,
  productions,
  pendingBagsAvailable,
  activeUser,
  onAddProduction,
}: ProductionViewProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id ?? 'mat-carton');
  const [baleCount, setBaleCount] = useState(1);
  const selectedMaterial =
    materials.find((m) => m.id === selectedMaterialId) ?? materials[0];

  const [weightKg, setWeightKg] = useState(
    String(materials[0]?.avgBaleWeightKg ?? 320)
  );
  const [weightManuallyEdited, setWeightManuallyEdited] = useState(false);
  const [pressName, setPressName] = useState(PRESS_OPTIONS[0]);
  const [sourceBagsUsed, setSourceBagsUsed] = useState(2);
  const [notes, setNotes] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSelectMaterial = (mat: MaterialStock) => {
    setSelectedMaterialId(mat.id);
    if (!weightManuallyEdited) {
      setWeightKg(String(mat.avgBaleWeightKg * baleCount));
    }
  };

  const handleChangeBales = (nextCount: number) => {
    const safeCount = Math.max(1, nextCount);
    setBaleCount(safeCount);
    if (!weightManuallyEdited && selectedMaterial) {
      setWeightKg(String(selectedMaterial.avgBaleWeightKg * safeCount));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    const numericWeight = Math.max(1, Number(weightKg) || 0);
    if (numericWeight <= 0) return;

    onAddProduction({
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      baleCount,
      weightKg: numericWeight,
      pressName,
      sourceBagsUsed: Math.max(0, sourceBagsUsed),
      notes: notes.trim(),
      operatorId: activeUser.id,
      operatorName: activeUser.name,
      shift: activeUser.shift,
    });

    setNotes('');
    setWeightManuallyEdited(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Separación y Enfardado
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cargá los fardos terminados para actualizar el inventario y descontar bolsones de playa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Carga de Producción */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#0D2114]">Registrar producción</h2>
            <span className="text-xs text-slate-500 tabular-nums">
              En playa: {pendingBagsAvailable} bolsones
            </span>
          </div>

          {/* Selector de Material */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Material clasificado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {materials.map((mat) => {
                const active = mat.id === selectedMaterialId;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleSelectMaterial(mat)}
                    className={`min-h-[52px] px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'bg-[#EEF6EE] border-[#1E7332] text-[#0B3B1E]'
                        : 'bg-white border-[#DCE5DC] text-slate-700 hover:bg-[#F4F7F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: mat.accentColor }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold truncate">{mat.name}</span>
                    </div>
                    <span className="block text-[11px] font-mono tabular-nums text-slate-500 mt-0.5 pl-4">
                      ~{mat.avgBaleWeightKg} kg/fardo
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cantidad de Fardos */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Cantidad de fardos producidos
            </label>
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <button
                type="button"
                onClick={() => handleChangeBales(baleCount - 1)}
                className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                aria-label="Restar un fardo"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={baleCount}
                  onChange={(e) => handleChangeBales(Number(e.target.value) || 1)}
                  className="w-24 text-center text-3xl font-bold font-mono tabular-nums text-slate-900 bg-transparent focus:outline-none"
                  aria-label="Cantidad de fardos"
                />
                <span className="block text-xs text-slate-500 -mt-1">fardos</span>
              </div>

              <button
                type="button"
                onClick={() => handleChangeBales(baleCount + 1)}
                className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                aria-label="Sumar un fardo"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Peso total del lote de fardos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="prod-weight" className="text-sm font-medium text-slate-800">
                Peso total enfardado
              </label>
              {weightManuallyEdited && selectedMaterial && (
                <button
                  type="button"
                  onClick={() => {
                    setWeightManuallyEdited(false);
                    setWeightKg(String(selectedMaterial.avgBaleWeightKg * baleCount));
                  }}
                  className="text-xs text-emerald-700 font-medium hover:underline"
                >
                  Usar peso promedio
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="prod-weight"
                type="number"
                min={1}
                required
                value={weightKg}
                onChange={(e) => {
                  setWeightManuallyEdited(true);
                  setWeightKg(e.target.value);
                }}
                className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-slate-300 bg-white text-lg font-mono font-semibold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-500">
                kg
              </span>
            </div>
          </div>

          {/* Bolsones consumidos de playa + Prensa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Bolsones separados
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSourceBagsUsed((v) => Math.max(0, v - 1))}
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50"
                  aria-label="Restar bolsón procesado"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-mono font-semibold tabular-nums text-base text-slate-900">
                  {sourceBagsUsed} u.
                </span>
                <button
                  type="button"
                  onClick={() => setSourceBagsUsed((v) => v + 1)}
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50"
                  aria-label="Sumar bolsón procesado"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="prod-press" className="block text-sm font-medium text-slate-800 mb-1.5">
                Prensa utilizada
              </label>
              <select
                id="prod-press"
                value={pressName}
                onChange={(e) => setPressName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {PRESS_OPTIONS.map((press) => (
                  <option key={press} value={press}>
                    {press}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prod-notes" className="block text-sm font-medium text-slate-800 mb-1.5">
              Notas de calidad / atado (opcional)
            </label>
            <input
              id="prod-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Material limpio, 4 alambres, estiba módulo 2..."
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1E7332] text-white text-sm font-semibold hover:bg-[#165A26] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {savedNotice ? (
              <>
                <Check className="w-5 h-5" />
                Fardos sumados al stock
              </>
            ) : (
              <>
                <Layers className="w-5 h-5" />
                Guardar producción enfardada
              </>
            )}
          </button>
        </form>

        {/* Historial de Producción */}
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Historial de enfardado ({productions.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada registro suma automáticamente al stock listo para despacho
              </p>
            </div>
          </div>

          {productions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aún no se cargaron fardos en este turno.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(showAll ? productions : productions.slice(0, 10)).map((item) => (
                <div key={item.id} className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.materialName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-xs text-slate-600">{item.pressName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTime(item.timestamp)} · {item.operatorName} · Turno {item.shift}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-base font-bold font-mono tabular-nums text-[#1E7332]">
                        +{item.baleCount} fardos
                      </span>
                      <span className="block text-xs font-mono tabular-nums text-slate-700 font-medium">
                        {formatKg(item.weightKg)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="tabular-nums">
                      Bolsones procesados: {item.sourceBagsUsed} u.
                    </span>
                    {item.notes && <span className="truncate max-w-xs">{item.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {productions.length > 10 && (
            <div className="px-5 py-3 bg-[#F4F7F4] border-t border-[#DCE5DC] text-center">
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="text-xs font-semibold text-[#1E7332] hover:text-[#0B3B1E]"
              >
                {showAll
                  ? 'Mostrar solo últimos 10 registros'
                  : `Ver historial completo (${productions.length} registros)`}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
