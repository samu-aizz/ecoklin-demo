import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  PackageCheck,
  Printer,
  AlertTriangle,
  Scale,
  Layers,
  Truck,
} from 'lucide-react';
import type { DemoUser, PlantState } from '../types/plant';
import {
  buildWhatsappReportText,
  computeDailyMetrics,
  downloadStockCsv,
  formatKg,
  formatShortDate,
  formatTime,
} from '../utils/formatters';

interface DailySummaryViewProps {
  state: PlantState;
  activeUser: DemoUser;
  onNavigate: (tab: 'resumen' | 'ingresos' | 'produccion' | 'incidencias' | 'admin') => void;
}

export function DailySummaryView({
  state,
  activeUser,
  onNavigate,
}: DailySummaryViewProps) {
  const [copied, setCopied] = useState(false);
  const metrics = computeDailyMetrics(state);
  const reportText = buildWhatsappReportText(state);
  const isAdmin = activeUser.role === 'admin';

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // Vista simplificada de Operario (sin funciones de administración ni reportes ejecutivos)
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-slate-500 capitalize">
            {formatShortDate()} · Turno {activeUser.shift}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0D2114] mt-1">
            Mi Turno en Planta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vista operativa para {activeUser.name}. Cargá ingresos de camiones, fardos realizados o alertas.
          </p>
        </div>

        {/* 3 Accesos Directos Grandes para el Celular del Operario */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('ingresos')}
            className="text-left bg-[#0B3B1E] text-white rounded-2xl p-5 hover:bg-[#124D29] transition-colors flex flex-col justify-between gap-4 min-h-[124px]"
          >
            <div className="flex items-center justify-between">
              <Truck className="w-6 h-6 text-[#8CC63F]" />
              <ArrowRight className="w-4 h-4 text-[#A8CCA9]" />
            </div>
            <div>
              <p className="text-base font-semibold">Ingresar camión y bolsones</p>
              <p className="text-xs text-[#C6DEC9] mt-1">
                Chofer, origen Estado/Privado y peso
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('produccion')}
            className="text-left bg-[#1E7332] text-white rounded-2xl p-5 hover:bg-[#165A26] transition-colors flex flex-col justify-between gap-4 min-h-[124px]"
          >
            <div className="flex items-center justify-between">
              <Layers className="w-6 h-6 text-white" />
              <ArrowRight className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <p className="text-base font-semibold">Cargar fardo realizado</p>
              <p className="text-xs text-emerald-100 mt-1">
                Material, kilos pesados y prensa
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('incidencias')}
            className="text-left bg-white border border-[#DCE5DC] text-[#0D2114] rounded-2xl p-5 hover:border-[#B6C8B8] transition-colors flex flex-col justify-between gap-4 min-h-[124px]"
          >
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-semibold">Reportar faltante o falla</p>
              <p className="text-xs text-slate-500 mt-1">
                Bolsones vacíos, espacio o máquinas
              </p>
            </div>
          </button>
        </div>

        {/* Métricas del turno */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Camiones recibidos hoy</p>
            <span className="mt-2 block text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0D2114]">
              {metrics.trucksEnteredToday}
            </span>
          </div>

          <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Bolsones ingresados hoy</p>
            <span className="mt-2 block text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0D2114]">
              {metrics.bagsEnteredToday}
            </span>
          </div>

          <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Fardos realizados hoy</p>
            <span className="mt-2 block text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#1E7332]">
              {metrics.balesProducedToday}
            </span>
          </div>

          <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Kilos enfardados hoy</p>
            <span className="mt-2 block text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0D2114]">
              {new Intl.NumberFormat('es-AR').format(metrics.productionKgToday)} kg
            </span>
          </div>
        </div>

        {/* Últimos camiones y fardos del turno */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0D2114]">
                Últimos camiones ingresados
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('ingresos')}
                className="text-xs font-medium text-[#1E7332] hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {state.intakes.slice(0, 4).map((ing) => (
                <div key={ing.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0D2114] truncate">
                      {ing.truckId} · {ing.origin}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {ing.clientType === 'estado' ? 'Estado' : 'Privado'} · Chofer: {ing.driverName} · {formatTime(ing.timestamp)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-sm font-bold font-mono tabular-nums text-[#0D2114]">
                      {ing.bagCount} u.
                    </span>
                    <span className="block text-xs font-mono tabular-nums text-slate-500">
                      {ing.weightKg !== null ? formatKg(ing.weightKg) : 'Sin pesar'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0D2114]">
                Últimos fardos realizados
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('produccion')}
                className="text-xs font-medium text-[#1E7332] hover:underline"
              >
                Cargar fardo
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {state.productions.slice(0, 4).map((prod) => (
                <div key={prod.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0D2114] truncate">
                      {prod.materialName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {prod.pressName} · {prod.operatorName} · {formatTime(prod.timestamp)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-sm font-bold font-mono tabular-nums text-[#1E7332]">
                      +{prod.baleCount} fardos
                    </span>
                    <span className="block text-xs font-mono tabular-nums text-slate-600">
                      {formatKg(prod.weightKg)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Producción de hoy agrupada por material (Vista Administrador)
  const producedTodayByMaterial = state.productions.reduce<Record<string, number>>((acc, item) => {
    acc[item.materialId] = (acc[item.materialId] ?? 0) + item.weightKg;
    return acc;
  }, {});

  // Feed unificado de actividad reciente
  const recentMovements = [
    ...state.intakes.map((i) => ({
      id: i.id,
      timestamp: i.timestamp,
      kind: 'Ingreso' as const,
      title: `${i.bagCount} bolsones · ${i.origin}`,
      detail: `${i.clientType === 'estado' ? 'Estado' : 'Privado'} · ${i.truckId} (${i.driverName}) · ${
        i.weightStatus === 'pesado' && i.weightKg !== null
          ? formatKg(i.weightKg)
          : 'Sin pesar'
      }`,
      who: i.operatorName,
    })),
    ...state.productions.map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      kind: 'Producción' as const,
      title: `${p.baleCount} fardos de ${p.materialName}`,
      detail: `${formatKg(p.weightKg)} · ${p.pressName}`,
      who: p.operatorName,
    })),
    ...state.dispatches.map((d) => ({
      id: d.id,
      timestamp: d.timestamp,
      kind: 'Despacho' as const,
      title: `Salida ${d.baleCount} fardos · ${d.materialName}`,
      detail: `${formatKg(d.weightKg)} · ${d.destination}`,
      who: d.operatorName,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Encabezado contextual */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 capitalize">{formatShortDate()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0D2114] mt-1">
            Resumen y Stock Diario
          </h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('ingresos')}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#C6D4C7] bg-white text-[#0D2114] text-sm font-medium hover:bg-[#F4F7F4] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-[#35523D]" />
            Registrar bolsones
          </button>
          <button
            type="button"
            onClick={() => onNavigate('produccion')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E7332] text-white text-sm font-medium hover:bg-[#165A26] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Cargar fardos
          </button>
        </div>
      </div>

      {/* Franja de 4 KPIs operativos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">Bolsones ingresados hoy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0D2114]">
              {metrics.bagsEnteredToday}
            </span>
            <span className="text-xs text-slate-500">unidades</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 tabular-nums">
            {metrics.trucksEnteredToday} camiones · {formatKg(metrics.intakeKgToday)}
            {metrics.unweighedBatches.length > 0 && (
              <span className="text-amber-700 font-medium">
                {' '}
                · {metrics.unweighedBatches.length} sin pesar
              </span>
            )}
          </p>
        </div>

        <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">Bolsones en espera (playa)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0D2114]">
              {metrics.pendingBagsTotal}
            </span>
            <span className="text-xs text-slate-500">sin separar</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 tabular-nums">
            Playa al {state.yardCapacityPercent}% · {state.emptyBagsAvailable} vacíos
          </p>
        </div>

        <div className="bg-white border border-[#DCE5DC] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">Producción enfardada hoy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#1E7332]">
              {metrics.balesProducedToday}
            </span>
            <span className="text-xs text-slate-500">fardos</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 tabular-nums">
            {formatKg(metrics.productionKgToday)} recuperados hoy
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('incidencias')}
          className="text-left bg-white border border-[#DCE5DC] hover:border-[#B6C8B8] rounded-2xl p-4 sm:p-5 transition-colors"
        >
          <p className="text-xs font-medium text-slate-500">Novedades e incidencias</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                metrics.criticalIncidents.length > 0 ? 'text-red-600' : 'text-[#0D2114]'
              }`}
            >
              {metrics.openIncidents.length}
            </span>
            <span className="text-xs text-slate-500">abiertas</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 flex items-center justify-between gap-1">
            <span>
              {metrics.criticalIncidents.length > 0
                ? `${metrics.criticalIncidents.length} prioridad crítica`
                : 'Sin alertas críticas'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </p>
        </button>
      </div>

      {/* Grilla principal: Stock por material + Reporte Automático */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inventario en Depósito */}
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0D2114]">
                Stock actual en depósito por material
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Total listo para despacho: {metrics.totalStockBales} fardos ·{' '}
                {formatKg(metrics.totalStockKg)}
              </p>
            </div>
            <PackageCheck className="w-5 h-5 text-[#1E7332] shrink-0" />
          </div>

          <div className="divide-y divide-slate-100">
            {state.materials.map((mat) => {
              const todayKg = producedTodayByMaterial[mat.id] ?? 0;
              const pct = Math.min(100, Math.round((todayKg / Math.max(1, mat.targetDailyKg)) * 100));
              return (
                <div
                  key={mat.id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7FAF7] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: mat.accentColor }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-sm text-[#0D2114] truncate">
                        {mat.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono shrink-0">{mat.code}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                      <span>{mat.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Hoy: {formatKg(todayKg)} / {formatKg(mat.targetDailyKg)} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 w-full max-w-xs h-1.5 bg-[#E7EFE7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: mat.accentColor,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-base font-bold font-mono tabular-nums text-[#0D2114]">
                      {mat.stockBales} fardos
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-600">
                      {formatKg(mat.stockKg)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reporte Diario Automático */}
        <section className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0D2114]">
                Reporte diario automático
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Se actualiza solo con cada ingreso y fardo cargado
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <pre className="bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl p-3.5 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto tabular-nums">
              {reportText}
            </pre>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 no-print">
              <button
                type="button"
                onClick={handleCopyReport}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B3B1E] text-white text-sm font-medium hover:bg-[#124D29] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#8CC63F]" />
                    Copiado para enviar
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar resumen
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => downloadStockCsv(state)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C6D4C7] bg-white text-[#0D2114] text-sm font-medium hover:bg-[#F4F7F4] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Descargar CSV
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 no-print"
            >
              <Printer className="w-4 h-4" />
              Imprimir parte diario o guardar en PDF
            </button>
          </div>
        </section>
      </div>

      {/* Últimos Movimientos y Alertas abiertas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#0D2114]">
              Actividad reciente de planta
            </h2>
          </div>
          {recentMovements.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Todavía no hay movimientos registrados hoy.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentMovements.map((mov) => (
                <div
                  key={mov.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          mov.kind === 'Ingreso'
                            ? 'text-sky-700'
                            : mov.kind === 'Producción'
                              ? 'text-[#1E7332]'
                              : 'text-amber-700'
                        }`}
                      >
                        {mov.kind}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-sm font-medium text-[#0D2114] truncate">
                        {mov.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {mov.detail} · {mov.who}
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {formatTime(mov.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#0D2114]">
              Alertas operativas activas
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('incidencias')}
              className="text-xs font-medium text-[#1E7332] hover:text-[#0B3B1E] whitespace-nowrap shrink-0"
            >
              Ver todas
            </button>
          </div>
          {metrics.openIncidents.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Planta sin novedades abiertas en este momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.openIncidents.slice(0, 4).map((inc) => (
                <div key={inc.id} className="px-5 py-3.5 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          inc.priority === 'critica'
                            ? 'text-red-600'
                            : inc.priority === 'media'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }`}
                      />
                      <span className="text-sm font-medium text-[#0D2114] truncate">
                        {inc.title}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium shrink-0 ${
                        inc.priority === 'critica'
                          ? 'text-red-700'
                          : inc.priority === 'media'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                      }`}
                    >
                      {inc.priority === 'critica'
                        ? 'Crítica'
                        : inc.priority === 'media'
                          ? 'Media'
                          : 'Baja'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {inc.locationOrMachine} · {inc.reportedByName} · {formatTime(inc.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
