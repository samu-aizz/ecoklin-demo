import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Wrench, PackageX, Maximize2 } from 'lucide-react';
import type {
  DemoUser,
  IncidentCategory,
  IncidentPriority,
  IncidentRecord,
  IncidentStatus,
  PlantMachine,
} from '../types/plant';
import { formatTime } from '../utils/formatters';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  machines: PlantMachine[];
  activeUser: DemoUser;
  onAddIncident: (
    entry: Omit<IncidentRecord, 'id' | 'timestamp' | 'status'>
  ) => void;
  onUpdateIncidentStatus: (
    incidentId: string,
    status: IncidentStatus,
    adminNote?: string
  ) => void;
}

const CATEGORY_META: Record<
  IncidentCategory,
  { label: string; shortLabel: string; defaultLocations: string[] }
> = {
  faltante_bolsones: {
    label: 'Faltante de bolsones / insumos',
    shortLabel: 'Falta bolsones',
    defaultLocations: [
      'Cinta de Clasificación · Sector B',
      'Playa de Descarga',
      'Depósito de Alambre y Fleje',
    ],
  },
  falta_espacio: {
    label: 'Falta de espacio en playa',
    shortLabel: 'Falta espacio',
    defaultLocations: [
      'Playa de Descarga Principal',
      'Playa Techada · Módulo Cartón',
      'Sector Acopio Plásticos PET',
    ],
  },
  maquinaria: {
    label: 'Incidencia con maquinaria',
    shortLabel: 'Maquinaria',
    defaultLocations: [],
  },
};

export function IncidentsView({
  incidents,
  machines,
  activeUser,
  onAddIncident,
  onUpdateIncidentStatus,
}: IncidentsViewProps) {
  const [category, setCategory] = useState<IncidentCategory>('faltante_bolsones');
  const [priority, setPriority] = useState<IncidentPriority>('media');
  const [title, setTitle] = useState('');
  const [locationOrMachine, setLocationOrMachine] = useState(
    CATEGORY_META.faltante_bolsones.defaultLocations[0]
  );
  const [description, setDescription] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'todas' | 'abiertas' | 'resueltas'>('todas');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const locationSuggestions =
    category === 'maquinaria'
      ? machines.map((m) => m.name)
      : CATEGORY_META[category].defaultLocations;

  const handleCategoryChange = (nextCat: IncidentCategory) => {
    setCategory(nextCat);
    const firstOpt =
      nextCat === 'maquinaria'
        ? machines[0]?.name ?? 'Prensa Hidráulica 1'
        : CATEGORY_META[nextCat].defaultLocations[0];
    setLocationOrMachine(firstOpt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddIncident({
      category,
      title: title.trim(),
      locationOrMachine: locationOrMachine.trim() || 'Planta General',
      description: description.trim() || 'Reportado desde puesto operativo.',
      priority,
      reportedById: activeUser.id,
      reportedByName: activeUser.name,
    });

    setTitle('');
    setDescription('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'abiertas') return inc.status !== 'resuelta';
    if (statusFilter === 'resueltas') return inc.status === 'resuelta';
    return true;
  });

  const openCount = incidents.filter((i) => i.status !== 'resuelta').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Incidencias y Faltantes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reportá al instante falta de bolsones, saturación de espacio o fallas en maquinaria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Reporte */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#0D2114]">Reportar novedad</h2>
            <span className="text-xs text-slate-500">{activeUser.name}</span>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Tipo de problema
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    id: 'faltante_bolsones',
                    icon: PackageX,
                    label: 'Faltante de bolsones o insumos',
                  },
                  {
                    id: 'falta_espacio',
                    icon: Maximize2,
                    label: 'Falta de espacio en playa / acopio',
                  },
                  {
                    id: 'maquinaria',
                    icon: Wrench,
                    label: 'Falla o incidencia con maquinaria',
                  },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleCategoryChange(opt.id)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                      active
                        ? 'bg-[#0B3B1E] border-[#0B3B1E] text-white'
                        : 'bg-white border-[#DCE5DC] text-slate-700 hover:bg-[#F4F7F4]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ubicación o Máquina */}
          <div>
            <label htmlFor="inc-location" className="block text-sm font-medium text-slate-800 mb-2">
              {category === 'maquinaria' ? 'Equipo afectado' : 'Sector o ubicación'}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {locationSuggestions.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationOrMachine(loc)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    locationOrMachine === loc
                      ? 'bg-[#EEF6EE] border-[#1E7332] text-[#0B3B1E]'
                      : 'bg-white border-[#DCE5DC] text-slate-700 hover:bg-[#F4F7F4]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <input
              id="inc-location"
              type="text"
              value={locationOrMachine}
              onChange={(e) => setLocationOrMachine(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Urgencia</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'baja', label: 'Baja' },
                  { id: 'media', label: 'Media' },
                  { id: 'critica', label: 'Crítica' },
                ] as const
              ).map((p) => {
                const active = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold transition-colors ${
                      active
                        ? p.id === 'critica'
                          ? 'bg-red-600 border-red-600 text-white'
                          : p.id === 'media'
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título y detalle */}
          <div>
            <label htmlFor="inc-title" className="block text-sm font-medium text-slate-800 mb-1.5">
              Resumen breve
            </label>
            <input
              id="inc-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'faltante_bolsones'
                  ? 'Ej. Faltan 20 bolsones Big-Bag en línea 1'
                  : category === 'falta_espacio'
                    ? 'Ej. Sector PET saturado, no entra otro fardo'
                    : 'Ej. Ruido anormal en pistón de Prensa 2'
              }
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label htmlFor="inc-desc" className="block text-sm font-medium text-slate-800 mb-1.5">
              Detalle adicional (opcional)
            </label>
            <textarea
              id="inc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí qué se necesita para resolverlo..."
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1E7332] text-white text-sm font-semibold hover:bg-[#165A26] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {savedNotice ? (
              <>
                <Check className="w-5 h-5" />
                Alerta enviada al tablero
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Enviar reporte de incidencia
              </>
            )}
          </button>
        </form>

        {/* Listado de Incidencias */}
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Registro de novedades ({filteredIncidents.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {openCount} abierta(s) pendientes de cierre
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('todas')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === 'todas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('abiertas')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === 'abiertas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Abiertas ({openCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resueltas')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === 'resueltas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Resueltas
              </button>
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay incidencias en esta categoría.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredIncidents.map((inc) => {
                const isAdmin = activeUser.role === 'admin';
                return (
                  <div key={inc.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          <span className="font-medium text-slate-700">
                            {CATEGORY_META[inc.category].shortLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{inc.locationOrMachine}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatTime(inc.timestamp)}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mt-1">
                          {inc.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            inc.status === 'resuelta'
                              ? 'text-emerald-700'
                              : inc.priority === 'critica'
                                ? 'text-red-600'
                                : inc.priority === 'media'
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                          }`}
                        >
                          {inc.status === 'resuelta' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resuelta
                            </>
                          ) : inc.status === 'en_revision' ? (
                            'En revisión'
                          ) : inc.priority === 'critica' ? (
                            'Crítica · Abierta'
                          ) : inc.priority === 'media' ? (
                            'Media · Abierta'
                          ) : (
                            'Baja · Abierta'
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="text-xs text-slate-500">
                      Reportado por {inc.reportedByName}
                      {inc.adminNote && (
                        <span className="block mt-1.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          Nota de administración: {inc.adminNote}
                        </span>
                      )}
                    </div>

                    {isAdmin && inc.status !== 'resuelta' && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={noteDrafts[inc.id] ?? ''}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [inc.id]: e.target.value,
                            }))
                          }
                          placeholder="Agregar nota de solución (opcional)..."
                          className="flex-1 min-h-[40px] px-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          {inc.status === 'abierta' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateIncidentStatus(
                                  inc.id,
                                  'en_revision',
                                  noteDrafts[inc.id]?.trim() || undefined
                                )
                              }
                              className="min-h-[40px] px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                            >
                              Marcar en revisión
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateIncidentStatus(
                                inc.id,
                                'resuelta',
                                noteDrafts[inc.id]?.trim() || 'Incidencia resuelta en planta.'
                              )
                            }
                            className="min-h-[40px] px-3.5 rounded-lg bg-[#1E7332] text-white text-xs font-medium hover:bg-[#165A26] whitespace-nowrap"
                          >
                            Resolver
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
