import type { PlantState } from '../types/plant';

export function formatKg(kg: number): string {
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(kg)} kg`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date = new Date()): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function computeDailyMetrics(state: PlantState) {
  const todayIntakes = state.intakes.filter((i) => isToday(i.timestamp));
  const todayProductions = state.productions.filter((p) => isToday(p.timestamp));
  const todayDispatches = state.dispatches.filter((d) => isToday(d.timestamp));

  const bagsEnteredToday = todayIntakes.reduce((sum, r) => sum + r.bagCount, 0);
  const intakeKgToday = todayIntakes.reduce((sum, r) => sum + (r.weightKg ?? 0), 0);
  const unweighedBatches = state.intakes.filter((i) => i.weightStatus === 'sin_pesar');
  const pendingBagsTotal = state.intakes.reduce(
    (sum, r) => sum + Math.max(0, r.bagCount - r.processedBags),
    0
  );

  const balesProducedToday = todayProductions.reduce((sum, p) => sum + p.baleCount, 0);
  const productionKgToday = todayProductions.reduce((sum, p) => sum + p.weightKg, 0);

  const totalStockBales = state.materials.reduce((sum, m) => sum + m.stockBales, 0);
  const totalStockKg = state.materials.reduce((sum, m) => sum + m.stockKg, 0);

  const dispatchedKgToday = todayDispatches.reduce((sum, d) => sum + d.weightKg, 0);
  const openIncidents = state.incidents.filter((inc) => inc.status !== 'resuelta');
  const criticalIncidents = openIncidents.filter((inc) => inc.priority === 'critica');

  return {
    todayIntakes,
    todayProductions,
    todayDispatches,
    trucksEnteredToday: todayIntakes.length,
    bagsEnteredToday,
    intakeKgToday,
    unweighedBatches,
    pendingBagsTotal,
    balesProducedToday,
    productionKgToday,
    totalStockBales,
    totalStockKg,
    dispatchedKgToday,
    openIncidents,
    criticalIncidents,
  };
}

export function buildWhatsappReportText(state: PlantState): string {
  const m = computeDailyMetrics(state);
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const hora = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const materialLines = state.materials
    .map(
      (mat) =>
        `- ${mat.name}: ${mat.stockBales} fardos (${new Intl.NumberFormat('es-AR').format(mat.stockKg)} kg)`
    )
    .join('\n');

  const incidentLines =
    m.openIncidents.length === 0
      ? '- Sin incidencias abiertas'
      : m.openIncidents
          .map((inc) => `- [${inc.priority.toUpperCase()}] ${inc.title} (${inc.locationOrMachine})`)
          .join('\n');

  return [
    `REPORTE DIARIO DE PLANTA - ${state.plantName}`,
    `Fecha: ${fecha} · Corte: ${hora}`,
    ``,
    `1. INGRESO Y PLAYA`,
    `- Bolsones ingresados hoy: ${m.bagsEnteredToday} u. (${new Intl.NumberFormat('es-AR').format(m.intakeKgToday)} kg pesados)`,
    `- Lotes pendientes de pesaje: ${m.unweighedBatches.length}`,
    `- Bolsones en espera de separacion: ${m.pendingBagsTotal} u.`,
    `- Bolsones vacios disponibles: ${state.emptyBagsAvailable} u.`,
    ``,
    `2. PRODUCCION ENFARDADA HOY`,
    `- Total producido hoy: ${m.balesProducedToday} fardos · ${new Intl.NumberFormat('es-AR').format(m.productionKgToday)} kg`,
    ``,
    `3. STOCK DISPONIBLE EN DEPOSITO (${m.totalStockBales} fardos · ${new Intl.NumberFormat('es-AR').format(m.totalStockKg)} kg)`,
    materialLines,
    ``,
    `4. NOVEDADES E INCIDENCIAS ABIERTAS (${m.openIncidents.length})`,
    incidentLines,
  ].join('\n');
}

export function downloadStockCsv(state: PlantState): void {
  const m = computeDailyMetrics(state);
  const dateStr = new Date().toISOString().slice(0, 10);

  const rows: string[][] = [
    ['REPORTE DIARIO DE STOCK Y PRODUCCION', state.plantName, dateStr],
    [],
    ['RESUMEN DEL DIA', 'Valor'],
    ['Bolsones ingresados hoy', String(m.bagsEnteredToday)],
    ['Kilos ingresados pesados hoy (kg)', String(m.intakeKgToday)],
    ['Bolsones pendientes en playa', String(m.pendingBagsTotal)],
    ['Fardos producidos hoy', String(m.balesProducedToday)],
    ['Kilos enfardados hoy (kg)', String(m.productionKgToday)],
    ['Bolsones vacios en deposito', String(state.emptyBagsAvailable)],
    [],
    ['INVENTARIO POR MATERIAL', 'Codigo', 'Categoria', 'Fardos en Stock', 'Peso Stock (kg)', 'Meta Diaria (kg)'],
    ...state.materials.map((mat) => [
      mat.name,
      mat.code,
      mat.category,
      String(mat.stockBales),
      String(mat.stockKg),
      String(mat.targetDailyKg),
    ]),
  ];

  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EcoKlin_Planta_Stock_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
