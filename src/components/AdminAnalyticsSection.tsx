import { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ArrowLeftRight,
} from 'lucide-react';
import type { PlantState } from '../types/plant';
import { formatKg } from '../utils/formatters';

interface AdminAnalyticsSectionProps {
  state: PlantState;
}

type Granularity = 'dia' | 'semana' | 'mes';
type CompareMode = 'dia' | 'semana' | 'mes' | 'personalizado';

function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function addDaysYMD(ymd: string, delta: number): string {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + delta);
  return toLocalYMD(d);
}

function getMondayYMD(ymd: string): string {
  const d = parseYMD(ymd);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalYMD(d);
}

function getMonthRange(year: number, monthIndex: number): { start: string; end: string } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { start: toLocalYMD(start), end: toLocalYMD(end) };
}

function formatShortYMD(ymd: string): string {
  const d = parseYMD(ymd);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
}

interface PeriodTotals {
  bagsEstado: number;
  bagsPrivado: number;
  bagsTotal: number;
  intakeKg: number;
  balesTotal: number;
  prodKgTotal: number;
  byMaterial: Record<string, { bales: number; kg: number }>;
}

function computeRangeTotals(
  state: PlantState,
  startYMD: string,
  endYMD: string
): PeriodTotals {
  const startMs = parseYMD(startYMD).getTime();
  const endDate = parseYMD(endYMD);
  endDate.setHours(23, 59, 59, 999);
  const endMs = endDate.getTime();

  let bagsEstado = 0;
  let bagsPrivado = 0;
  let intakeKg = 0;

  for (const ing of state.intakes) {
    const t = new Date(ing.timestamp).getTime();
    if (t >= startMs && t <= endMs) {
      if (ing.clientType === 'estado') bagsEstado += ing.bagCount;
      else bagsPrivado += ing.bagCount;
      intakeKg += ing.weightKg ?? 0;
    }
  }

  let balesTotal = 0;
  let prodKgTotal = 0;
  const byMaterial: Record<string, { bales: number; kg: number }> = {};

  for (const mat of state.materials) {
    byMaterial[mat.id] = { bales: 0, kg: 0 };
  }

  for (const prod of state.productions) {
    const t = new Date(prod.timestamp).getTime();
    if (t >= startMs && t <= endMs) {
      balesTotal += prod.baleCount;
      prodKgTotal += prod.weightKg;
      if (!byMaterial[prod.materialId]) {
        byMaterial[prod.materialId] = { bales: 0, kg: 0 };
      }
      byMaterial[prod.materialId].bales += prod.baleCount;
      byMaterial[prod.materialId].kg += prod.weightKg;
    }
  }

  return {
    bagsEstado,
    bagsPrivado,
    bagsTotal: bagsEstado + bagsPrivado,
    intakeKg,
    balesTotal,
    prodKgTotal,
    byMaterial,
  };
}

function calcDelta(a: number, b: number): { diff: number; pct: number | null } {
  const diff = a - b;
  if (b === 0) return { diff, pct: a > 0 ? 100 : null };
  return { diff, pct: Math.round((diff / b) * 100) };
}

export function AdminAnalyticsSection({ state }: AdminAnalyticsSectionProps) {
  const todayYMD = useMemo(() => toLocalYMD(new Date()), []);
  const yesterdayYMD = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    if (d.getDay() === 0) d.setDate(d.getDate() - 1);
    return toLocalYMD(d);
  }, []);

  // Estado de Gráficos Día / Semana / Mes
  const [granularity, setGranularity] = useState<Granularity>('dia');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('todos');
  const [activeBucketIdx, setActiveBucketIdx] = useState<number | null>(null);

  // Estado de Comparador y Calendario
  const [compareMode, setCompareMode] = useState<CompareMode>('semana');
  const [pickingTarget, setPickingTarget] = useState<'A' | 'B'>('A');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Rangos A y B
  const currentMonday = useMemo(() => getMondayYMD(todayYMD), [todayYMD]);
  const prevMonday = useMemo(() => addDaysYMD(currentMonday, -7), [currentMonday]);

  const [rangeA, setRangeA] = useState<{ start: string; end: string }>({
    start: currentMonday,
    end: addDaysYMD(currentMonday, 6),
  });
  const [rangeB, setRangeB] = useState<{ start: string; end: string }>({
    start: prevMonday,
    end: addDaysYMD(prevMonday, 6),
  });

  // Cambio rápido de modo de comparación
  const handleCompareModeChange = (mode: CompareMode) => {
    setCompareMode(mode);
    if (mode === 'dia') {
      setRangeA({ start: todayYMD, end: todayYMD });
      setRangeB({ start: yesterdayYMD, end: yesterdayYMD });
    } else if (mode === 'semana') {
      setRangeA({ start: currentMonday, end: addDaysYMD(currentMonday, 6) });
      setRangeB({ start: prevMonday, end: addDaysYMD(prevMonday, 6) });
    } else if (mode === 'mes') {
      const now = new Date();
      const curM = getMonthRange(now.getFullYear(), now.getMonth());
      const prevM = getMonthRange(now.getFullYear(), now.getMonth() - 1);
      setRangeA(curM);
      setRangeB(prevM);
    } else {
      setRangeA({ start: addDaysYMD(todayYMD, -6), end: todayYMD });
      setRangeB({ start: addDaysYMD(todayYMD, -13), end: addDaysYMD(todayYMD, -7) });
    }
  };

  // Agrupación de series para los gráficos (Día / Semana / Mes)
  const series = useMemo(() => {
    type Bucket = {
      key: string;
      label: string;
      bagsEstado: number;
      bagsPrivado: number;
      bagsTotal: number;
      intakeKg: number;
      prodByMat: Record<string, { kg: number; bales: number }>;
      totalProdKg: number;
      totalProdBales: number;
    };

    const bucketsMap = new Map<string, Bucket>();

    const ensureBucket = (key: string, label: string): Bucket => {
      let b = bucketsMap.get(key);
      if (!b) {
        const prodByMat: Record<string, { kg: number; bales: number }> = {};
        for (const m of state.materials) {
          prodByMat[m.id] = { kg: 0, bales: 0 };
        }
        b = {
          key,
          label,
          bagsEstado: 0,
          bagsPrivado: 0,
          bagsTotal: 0,
          intakeKg: 0,
          prodByMat,
          totalProdKg: 0,
          totalProdBales: 0,
        };
        bucketsMap.set(key, b);
      }
      return b;
    };

    const getBucketMeta = (iso: string): { key: string; label: string } => {
      const d = new Date(iso);
      const ymd = toLocalYMD(d);
      if (granularity === 'dia') {
        return { key: ymd, label: formatShortYMD(ymd) };
      }
      if (granularity === 'semana') {
        const mon = getMondayYMD(ymd);
        return { key: mon, label: `Sem ${formatShortYMD(mon)}` };
      }
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { key: ym, label: formatMonthLabel(ym) };
    };

    for (const ing of state.intakes) {
      const meta = getBucketMeta(ing.timestamp);
      const b = ensureBucket(meta.key, meta.label);
      if (ing.clientType === 'estado') b.bagsEstado += ing.bagCount;
      else b.bagsPrivado += ing.bagCount;
      b.bagsTotal += ing.bagCount;
      b.intakeKg += ing.weightKg ?? 0;
    }

    for (const prod of state.productions) {
      const meta = getBucketMeta(prod.timestamp);
      const b = ensureBucket(meta.key, meta.label);
      if (!b.prodByMat[prod.materialId]) {
        b.prodByMat[prod.materialId] = { kg: 0, bales: 0 };
      }
      b.prodByMat[prod.materialId].kg += prod.weightKg;
      b.prodByMat[prod.materialId].bales += prod.baleCount;
      b.totalProdKg += prod.weightKg;
      b.totalProdBales += prod.baleCount;
    }

    const sorted = Array.from(bucketsMap.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    const limit = granularity === 'dia' ? 14 : granularity === 'semana' ? 7 : 6;
    return sorted.slice(-limit);
  }, [state.intakes, state.productions, state.materials, granularity]);

  const seriesTotals = useMemo(() => {
    return series.reduce(
      (acc, item) => ({
        bagsTotal: acc.bagsTotal + item.bagsTotal,
        bagsEstado: acc.bagsEstado + item.bagsEstado,
        bagsPrivado: acc.bagsPrivado + item.bagsPrivado,
        intakeKg: acc.intakeKg + item.intakeKg,
        prodKg: acc.prodKg + item.totalProdKg,
        prodBales: acc.prodBales + item.totalProdBales,
      }),
      {
        bagsTotal: 0,
        bagsEstado: 0,
        bagsPrivado: 0,
        intakeKg: 0,
        prodKg: 0,
        prodBales: 0,
      }
    );
  }, [series]);

  const maxBagsInSeries = Math.max(
    10,
    ...series.map((s) => s.bagsTotal)
  );

  const getBucketProdKg = (b: (typeof series)[number]) =>
    selectedMaterialFilter === 'todos'
      ? b.totalProdKg
      : b.prodByMat[selectedMaterialFilter]?.kg ?? 0;

  const getBucketProdBales = (b: (typeof series)[number]) =>
    selectedMaterialFilter === 'todos'
      ? b.totalProdBales
      : b.prodByMat[selectedMaterialFilter]?.bales ?? 0;

  const maxProdKgInSeries = Math.max(
    500,
    ...series.map((s) => getBucketProdKg(s))
  );

  const inspectedBucket =
    activeBucketIdx !== null && series[activeBucketIdx]
      ? series[activeBucketIdx]
      : series[series.length - 1];

  // Mapa de actividad diaria para pintar el calendario visual
  const dailyActivityMap = useMemo(() => {
    const map = new Map<string, { bags: number; prodKg: number }>();
    for (const ing of state.intakes) {
      const ymd = toLocalYMD(new Date(ing.timestamp));
      const cur = map.get(ymd) ?? { bags: 0, prodKg: 0 };
      cur.bags += ing.bagCount;
      map.set(ymd, cur);
    }
    for (const prod of state.productions) {
      const ymd = toLocalYMD(new Date(prod.timestamp));
      const cur = map.get(ymd) ?? { bags: 0, prodKg: 0 };
      cur.prodKg += prod.weightKg;
      map.set(ymd, cur);
    }
    return map;
  }, [state.intakes, state.productions]);

  // Celdas del mes actual del calendario (Lunes a Domingo)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const daysInMonth = new Date(
      calendarMonth.year,
      calendarMonth.month + 1,
      0
    ).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Lunes = 0

    const cells: { ymd: string | null; dayNum: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ ymd: null, dayNum: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calendarMonth.year, calendarMonth.month, day);
      cells.push({ ymd: toLocalYMD(d), dayNum: day });
    }
    return cells;
  }, [calendarMonth]);

  const handleCalendarDayClick = (ymd: string) => {
    const assignRange = pickingTarget === 'A' ? setRangeA : setRangeB;
    if (compareMode === 'dia') {
      assignRange({ start: ymd, end: ymd });
    } else if (compareMode === 'semana') {
      const mon = getMondayYMD(ymd);
      assignRange({ start: mon, end: addDaysYMD(mon, 6) });
    } else if (compareMode === 'mes') {
      const d = parseYMD(ymd);
      assignRange(getMonthRange(d.getFullYear(), d.getMonth()));
    } else {
      // Personalizado: si hace clic, inicia o completa rango de 7 días o rango A/B
      const current = pickingTarget === 'A' ? rangeA : rangeB;
      if (current.start === current.end && ymd >= current.start) {
        assignRange({ start: current.start, end: ymd });
      } else {
        assignRange({ start: ymd, end: ymd });
      }
    }
  };

  const totalsA = useMemo(
    () => computeRangeTotals(state, rangeA.start, rangeA.end),
    [state, rangeA]
  );
  const totalsB = useMemo(
    () => computeRangeTotals(state, rangeB.start, rangeB.end),
    [state, rangeB]
  );

  const monthTitle = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* BLOQUE 1: Estadísticas y Gráficos Día / Semana / Mes */}
      <section className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#1E7332] shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-[#0D2114]">
                Estadísticas de ingresos y enfardado
              </h2>
              <p className="text-xs text-slate-500">
                Visualizá bolsones ingresados y materiales enfardados agrupados por día, semana o mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl self-start sm:self-auto shrink-0">
            {(
              [
                { id: 'dia', label: 'Por Día' },
                { id: 'semana', label: 'Por Semana' },
                { id: 'mes', label: 'Por Mes' },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGranularity(g.id);
                  setActiveBucketIdx(null);
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  granularity === g.id
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0D2114]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen rápido del rango graficado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
          <div className="bg-white p-4">
            <p className="text-[11px] font-medium text-slate-500">Bolsones en vista</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#0D2114] mt-1">
              {seriesTotals.bagsTotal} u.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              {seriesTotals.bagsEstado} Estado · {seriesTotals.bagsPrivado} Privados
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] font-medium text-slate-500">Peso ingresado</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#0D2114] mt-1">
              {formatKg(seriesTotals.intakeKg)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              En {series.length} {granularity === 'dia' ? 'días' : granularity === 'semana' ? 'semanas' : 'meses'}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] font-medium text-slate-500">Fardos realizados</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#1E7332] mt-1">
              {seriesTotals.prodBales} u.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Todos los materiales</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] font-medium text-slate-500">Kilos enfardados</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#1E7332] mt-1">
              {formatKg(seriesTotals.prodKg)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Recuperación total</p>
          </div>
        </div>

        {/* Barra de inspección interactiva (muestra el detalle del período tocado/seleccionado) */}
        {inspectedBucket && (
          <div className="px-5 py-3 bg-[#F4F7F4] border-b border-[#DCE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="font-semibold text-[#0D2114]">
              Detalle {inspectedBucket.label}:
              <span className="font-normal text-slate-600 ml-2 tabular-nums">
                {inspectedBucket.bagsTotal} bolsones ({inspectedBucket.bagsEstado} Estado /{' '}
                {inspectedBucket.bagsPrivado} Privados) ·{' '}
                {getBucketProdBales(inspectedBucket)} fardos ({formatKg(getBucketProdKg(inspectedBucket))})
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Tocá o pasá por una barra para ver el detalle exacto
            </span>
          </div>
        )}

        {/* Dos Gráficos Lado a Lado */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Bolsones Ingresados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0D2114]">
                Bolsones ingresados (Estado vs Privados)
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0B3B1E]" />
                  Estado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8CC63F]" />
                  Privados
                </span>
              </div>
            </div>

            <div className="border border-[#DCE5DC] rounded-xl p-3 bg-white">
              <svg
                viewBox="0 0 560 220"
                className="w-full h-52 overflow-visible"
                role="img"
                aria-label="Gráfico de bolsones ingresados"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 180 - ratio * 155;
                  const val = Math.round(maxBagsInSeries * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={34}
                        x2={550}
                        y1={y}
                        y2={y}
                        stroke="#E2EAE2"
                        strokeDasharray={ratio === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={28}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {series.map((b, idx) => {
                  const chartW = 510;
                  const colW = chartW / Math.max(1, series.length);
                  const barW = Math.min(34, Math.max(12, colW * 0.62));
                  const x = 38 + idx * colW + (colW - barW) / 2;

                  const totalH = (b.bagsTotal / maxBagsInSeries) * 155;
                  const estadoH = (b.bagsEstado / maxBagsInSeries) * 155;
                  const privadoH = Math.max(0, totalH - estadoH);
                  const isSelected = activeBucketIdx === idx;

                  return (
                    <g
                      key={b.key}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveBucketIdx(idx)}
                      onClick={() => setActiveBucketIdx(idx)}
                    >
                      {isSelected && (
                        <rect
                          x={x - 3}
                          y={20}
                          width={barW + 6}
                          height={162}
                          rx={4}
                          fill="#EEF6EE"
                        />
                      )}
                      {/* Privados arriba */}
                      {privadoH > 0 && (
                        <rect
                          x={x}
                          y={180 - totalH}
                          width={barW}
                          height={privadoH}
                          rx={estadoH === 0 ? 3 : 0}
                          fill="#8CC63F"
                        />
                      )}
                      {/* Estado abajo */}
                      {estadoH > 0 && (
                        <rect
                          x={x}
                          y={180 - estadoH}
                          width={barW}
                          height={estadoH}
                          fill="#0B3B1E"
                        />
                      )}
                      <text
                        x={x + barW / 2}
                        y={198}
                        textAnchor="middle"
                        className="fill-slate-500 text-[9px] font-mono"
                      >
                        {b.label.length > 7 ? b.label.slice(0, 6) : b.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Gráfico 2: Producción Enfardada por Material */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[#0D2114]">
                Producción enfardada (kg por material)
              </h3>
              <select
                value={selectedMaterialFilter}
                onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                className="min-h-[34px] px-2.5 rounded-lg border border-[#DCE5DC] bg-[#F4F7F4] text-xs font-medium text-[#0D2114]"
                aria-label="Filtrar material en gráfico"
              >
                <option value="todos">Todos los materiales</option>
                {state.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-[#DCE5DC] rounded-xl p-3 bg-white">
              <svg
                viewBox="0 0 560 220"
                className="w-full h-52 overflow-visible"
                role="img"
                aria-label="Gráfico de producción enfardada por material"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 180 - ratio * 155;
                  const val = Math.round(maxProdKgInSeries * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={42}
                        x2={550}
                        y1={y}
                        y2={y}
                        stroke="#E2EAE2"
                        strokeDasharray={ratio === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={36}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${val}`}
                      </text>
                    </g>
                  );
                })}

                {series.map((b, idx) => {
                  const chartW = 502;
                  const colW = chartW / Math.max(1, series.length);
                  const barW = Math.min(34, Math.max(12, colW * 0.62));
                  const x = 46 + idx * colW + (colW - barW) / 2;
                  const isSelected = activeBucketIdx === idx;

                  let accY = 180;
                  const matsToRender =
                    selectedMaterialFilter === 'todos'
                      ? state.materials
                      : state.materials.filter((m) => m.id === selectedMaterialFilter);

                  return (
                    <g
                      key={b.key}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveBucketIdx(idx)}
                      onClick={() => setActiveBucketIdx(idx)}
                    >
                      {isSelected && (
                        <rect
                          x={x - 3}
                          y={20}
                          width={barW + 6}
                          height={162}
                          rx={4}
                          fill="#EEF6EE"
                        />
                      )}
                      {matsToRender.map((mat) => {
                        const kg = b.prodByMat[mat.id]?.kg ?? 0;
                        const h = (kg / maxProdKgInSeries) * 155;
                        if (h <= 0) return null;
                        accY -= h;
                        return (
                          <rect
                            key={mat.id}
                            x={x}
                            y={accY}
                            width={barW}
                            height={h}
                            fill={mat.accentColor}
                          />
                        );
                      })}
                      <text
                        x={x + barW / 2}
                        y={198}
                        textAnchor="middle"
                        className="fill-slate-500 text-[9px] font-mono"
                      >
                        {b.label.length > 7 ? b.label.slice(0, 6) : b.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Leyenda interactiva de materiales */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
              {state.materials.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() =>
                    setSelectedMaterialFilter((cur) =>
                      cur === mat.id ? 'todos' : mat.id
                    )
                  }
                  className={`inline-flex items-center gap-1.5 transition-opacity ${
                    selectedMaterialFilter !== 'todos' &&
                    selectedMaterialFilter !== mat.id
                      ? 'opacity-40'
                      : 'opacity-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: mat.accentColor }}
                  />
                  <span>{mat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 2: Comparador y Analizador de Fechas con Calendario */}
      <section className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-[#1E7332] shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-[#0D2114]">
                Comparador de producción por calendario
              </h2>
              <p className="text-xs text-slate-500">
                Compará cualquier día, semana, mes o rango de fechas específico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {(
              [
                { id: 'dia', label: 'Día vs Día' },
                { id: 'semana', label: 'Semana vs Semana' },
                { id: 'mes', label: 'Mes vs Mes' },
                { id: 'personalizado', label: 'Rango libre' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleCompareModeChange(m.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  compareMode === m.id
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0D2114]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Izquierda: Calendario Visual + Selectores de Fecha */}
          <div className="lg:col-span-5 space-y-4">
            {/* Selector de qué período se edita al tocar el calendario */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPickingTarget('A')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  pickingTarget === 'A'
                    ? 'bg-[#0B3B1E] text-white border-[#0B3B1E]'
                    : 'bg-[#F4F7F4] text-[#0D2114] border-[#DCE5DC]'
                }`}
              >
                <span className="block text-[11px] font-medium opacity-80">
                  Período A (Principal)
                </span>
                <span className="block text-xs font-mono font-semibold mt-0.5 tabular-nums">
                  {rangeA.start === rangeA.end
                    ? formatShortYMD(rangeA.start)
                    : `${formatShortYMD(rangeA.start)} – ${formatShortYMD(rangeA.end)}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPickingTarget('B')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  pickingTarget === 'B'
                    ? 'bg-[#1E7332] text-white border-[#1E7332]'
                    : 'bg-[#F4F7F4] text-[#0D2114] border-[#DCE5DC]'
                }`}
              >
                <span className="block text-[11px] font-medium opacity-80">
                  Período B (Comparar)
                </span>
                <span className="block text-xs font-mono font-semibold mt-0.5 tabular-nums">
                  {rangeB.start === rangeB.end
                    ? formatShortYMD(rangeB.start)
                    : `${formatShortYMD(rangeB.start)} – ${formatShortYMD(rangeB.end)}`}
                </span>
              </button>
            </div>

            {/* Calendario Mensual Interactivo */}
            <div className="border border-[#DCE5DC] rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((prev) => {
                      const d = new Date(prev.year, prev.month - 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                  className="min-h-[38px] min-w-[38px] rounded-lg border border-[#DCE5DC] flex items-center justify-center hover:bg-[#F4F7F4]"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-[#0D2114] capitalize">
                  {monthTitle}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((prev) => {
                      const d = new Date(prev.year, prev.month + 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                  className="min-h-[38px] min-w-[38px] rounded-lg border border-[#DCE5DC] flex items-center justify-center hover:bg-[#F4F7F4]"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dow) => (
                  <span key={dow} className="text-[11px] font-medium text-slate-400 py-1">
                    {dow}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, i) => {
                  if (!cell.ymd || !cell.dayNum) {
                    return <div key={`empty-${i}`} className="h-10" />;
                  }
                  const ymd = cell.ymd;
                  const inA = ymd >= rangeA.start && ymd <= rangeA.end;
                  const inB = ymd >= rangeB.start && ymd <= rangeB.end;
                  const act = dailyActivityMap.get(ymd);
                  const hasData = Boolean(act && (act.bags > 0 || act.prodKg > 0));

                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => handleCalendarDayClick(ymd)}
                      className={`relative h-10 rounded-lg text-xs font-mono tabular-nums flex flex-col items-center justify-center transition-colors ${
                        inA && inB
                          ? 'bg-[#0B3B1E] text-white ring-2 ring-[#8CC63F]'
                          : inA
                            ? 'bg-[#0B3B1E] text-white font-semibold'
                            : inB
                              ? 'bg-[#1E7332] text-white font-semibold'
                              : hasData
                                ? 'bg-[#F4F7F4] text-[#0D2114] hover:bg-[#E2EDE2]'
                                : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cell.dayNum}</span>
                      {hasData && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            inA || inB ? 'bg-[#8CC63F]' : 'bg-[#1E7332]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Tocá un día en el calendario para asignar el <strong>Período {pickingTarget}</strong>.
              </p>
            </div>

            {/* Ajuste manual exacto con inputs de fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F4F7F4] border border-[#DCE5DC] space-y-2">
                <span className="font-semibold text-[#0B3B1E] block">Fechas Período A</span>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="date"
                    value={rangeA.start}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setRangeA((prev) => ({
                        start: val,
                        end: compareMode === 'dia' ? val : val > prev.end ? val : prev.end,
                      }));
                    }}
                    className="w-full min-h-[36px] px-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  />
                  {compareMode !== 'dia' && (
                    <input
                      type="date"
                      value={rangeA.end}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setRangeA((prev) => ({
                          start: val < prev.start ? val : prev.start,
                          end: val,
                        }));
                      }}
                      className="w-full min-h-[36px] px-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F7F4] border border-[#DCE5DC] space-y-2">
                <span className="font-semibold text-[#1E7332] block">Fechas Período B</span>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="date"
                    value={rangeB.start}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setRangeB((prev) => ({
                        start: val,
                        end: compareMode === 'dia' ? val : val > prev.end ? val : prev.end,
                      }));
                    }}
                    className="w-full min-h-[36px] px-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  />
                  {compareMode !== 'dia' && (
                    <input
                      type="date"
                      value={rangeB.end}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setRangeB((prev) => ({
                          start: val < prev.start ? val : prev.start,
                          end: val,
                        }));
                      }}
                      className="w-full min-h-[36px] px-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: Resultados Comparativos A vs B */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <ArrowLeftRight className="w-4 h-4 text-[#1E7332]" />
                <span>
                  Comparando <strong className="text-[#0B3B1E]">Período A</strong> frente a{' '}
                  <strong className="text-[#1E7332]">Período B</strong>
                </span>
              </div>
            </div>

            {/* 4 tarjetas comparativas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'Bolsones ingresados',
                  valA: `${totalsA.bagsTotal} u.`,
                  valB: `${totalsB.bagsTotal} u.`,
                  delta: calcDelta(totalsA.bagsTotal, totalsB.bagsTotal),
                  subA: `${totalsA.bagsEstado} Est. / ${totalsA.bagsPrivado} Priv.`,
                  subB: `${totalsB.bagsEstado} Est. / ${totalsB.bagsPrivado} Priv.`,
                },
                {
                  label: 'Peso ingresado pesado',
                  valA: formatKg(totalsA.intakeKg),
                  valB: formatKg(totalsB.intakeKg),
                  delta: calcDelta(totalsA.intakeKg, totalsB.intakeKg),
                  subA: 'Total báscula A',
                  subB: 'Total báscula B',
                },
                {
                  label: 'Fardos producidos',
                  valA: `${totalsA.balesTotal} fardos`,
                  valB: `${totalsB.balesTotal} fardos`,
                  delta: calcDelta(totalsA.balesTotal, totalsB.balesTotal),
                  subA: 'Línea prensa A',
                  subB: 'Línea prensa B',
                },
                {
                  label: 'Kilos totales enfardados',
                  valA: formatKg(totalsA.prodKgTotal),
                  valB: formatKg(totalsB.prodKgTotal),
                  delta: calcDelta(totalsA.prodKgTotal, totalsB.prodKgTotal),
                  subA: 'Producción A',
                  subB: 'Producción B',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="border border-[#DCE5DC] rounded-xl p-4 bg-white space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    {card.delta.pct !== null && (
                      <span
                        className={`text-xs font-mono font-semibold tabular-nums ${
                          card.delta.diff > 0
                            ? 'text-[#1E7332]'
                            : card.delta.diff < 0
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {card.delta.diff > 0 ? '+' : ''}
                        {card.delta.pct}%
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] font-semibold text-[#0B3B1E] block">
                        Período A
                      </span>
                      <span className="text-base font-bold font-mono tabular-nums text-[#0D2114]">
                        {card.valA}
                      </span>
                      <span className="block text-[11px] text-slate-400">{card.subA}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#1E7332] block">
                        Período B
                      </span>
                      <span className="text-base font-bold font-mono tabular-nums text-slate-700">
                        {card.valB}
                      </span>
                      <span className="block text-[11px] text-slate-400">{card.subB}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose comparativo por Material */}
            <div className="border border-[#DCE5DC] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#F4F7F4] border-b border-[#DCE5DC] flex items-center justify-between text-xs font-semibold text-[#0D2114]">
                <span>Comparativa de producción por material</span>
                <div className="flex items-center gap-4 text-[11px] font-normal text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2 rounded-sm bg-[#0B3B1E]" />
                    Período A
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2 rounded-sm bg-[#8CC63F]" />
                    Período B
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {state.materials.map((mat) => {
                  const a = totalsA.byMaterial[mat.id] ?? { bales: 0, kg: 0 };
                  const b = totalsB.byMaterial[mat.id] ?? { bales: 0, kg: 0 };
                  const maxMatKg = Math.max(100, a.kg, b.kg);
                  const delta = calcDelta(a.kg, b.kg);

                  return (
                    <div key={mat.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: mat.accentColor }}
                          />
                          <span className="font-medium text-[#0D2114] truncate">
                            {mat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-[11px]">
                          <span className="text-[#0B3B1E] font-semibold">
                            A: {formatKg(a.kg)} ({a.bales}f)
                          </span>
                          <span className="text-slate-500">
                            B: {formatKg(b.kg)} ({b.bales}f)
                          </span>
                          {delta.pct !== null && (
                            <span
                              className={`font-semibold w-11 text-right ${
                                delta.diff > 0
                                  ? 'text-[#1E7332]'
                                  : delta.diff < 0
                                    ? 'text-amber-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              {delta.diff > 0 ? '+' : ''}
                              {delta.pct}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0B3B1E] rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((a.kg / maxMatKg) * 100)}%` }}
                          />
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8CC63F] rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((b.kg / maxMatKg) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
