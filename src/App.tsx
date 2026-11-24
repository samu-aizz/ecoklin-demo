import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Layers,
  Menu,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { AdminPanelView } from './components/AdminPanelView';
import { Avatar } from './components/Avatar';
import { DailySummaryView } from './components/DailySummaryView';
import { EcoKlinLogo } from './components/EcoKlinLogo';
import { IncidentsView } from './components/IncidentsView';
import { IntakeView } from './components/IntakeView';
import { ProductionView } from './components/ProductionView';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { plantRepository } from './services/plantRepository';
import type {
  DemoUser,
  IncidentRecord,
  IncidentStatus,
  IntakeRecord,
  MachineStatus,
  PlantState,
  ProductionRecord,
} from './types/plant';
import { computeDailyMetrics } from './utils/formatters';

type TabKey = 'resumen' | 'ingresos' | 'produccion' | 'incidencias' | 'admin';

const NAV_ITEMS: { key: TabKey; label: string; mobileLabel: string; icon: typeof BarChart3 }[] = [
  { key: 'resumen', label: 'Resumen y Stock', mobileLabel: 'Resumen', icon: BarChart3 },
  { key: 'ingresos', label: 'Ingreso Bolsones', mobileLabel: 'Ingresos', icon: Truck },
  { key: 'produccion', label: 'Separación y Fardos', mobileLabel: 'Fardos', icon: Layers },
  { key: 'incidencias', label: 'Incidencias', mobileLabel: 'Alertas', icon: AlertTriangle },
  { key: 'admin', label: 'Administración', mobileLabel: 'Admin', icon: ShieldCheck },
];

export default function App() {
  const [state, setState] = useState<PlantState>(() => plantRepository.loadState());
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = plantRepository.subscribe((remoteState) => {
      setState(remoteState);
    });
    return unsubscribe;
  }, []);

  const updateState = (updater: (prev: PlantState) => PlantState) => {
    setState((prev) => {
      const next = updater(prev);
      plantRepository.saveState(next, true);
      return next;
    });
  };

  const activeUser =
    state.users.find((u) => u.id === state.activeUserId) ?? state.users[0];
  const isAdmin = activeUser.role === 'admin';

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => isAdmin || item.key !== 'admin'
  ).map((item) =>
    item.key === 'resumen' && !isAdmin
      ? { ...item, label: 'Mi Turno', mobileLabel: 'Mi Turno' }
      : item
  );

  const metrics = computeDailyMetrics(state);

  const handleSelectUser = (userId: string, preferredTab?: TabKey) => {
    const target = state.users.find((u) => u.id === userId);
    updateState((prev) => ({
      ...prev,
      activeUserId: userId,
    }));
    if (preferredTab) {
      setActiveTab(preferredTab);
      return;
    }
    if (target?.role !== 'admin' && activeTab === 'admin') {
      setActiveTab('resumen');
    } else if (target?.role === 'ingreso') {
      setActiveTab('ingresos');
    } else if (target?.role === 'produccion') {
      setActiveTab('produccion');
    }
  };

  const handleAddIntake = (
    entry: Omit<IntakeRecord, 'id' | 'timestamp' | 'processedBags'>
  ) => {
    const record: IntakeRecord = {
      ...entry,
      id: `ing-${Date.now()}`,
      timestamp: new Date().toISOString(),
      processedBags: 0,
    };
    updateState((prev) => ({
      ...prev,
      intakes: [record, ...prev.intakes],
    }));
  };

  const handleAssignWeight = (intakeId: string, weightKg: number) => {
    updateState((prev) => ({
      ...prev,
      intakes: prev.intakes.map((item) =>
        item.id === intakeId
          ? { ...item, weightKg, weightStatus: 'pesado' }
          : item
      ),
    }));
  };

  const handleAddProduction = (
    entry: Omit<ProductionRecord, 'id' | 'timestamp'>
  ) => {
    const record: ProductionRecord = {
      ...entry,
      id: `prod-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    updateState((prev) => {
      let remainingToConsume = entry.sourceBagsUsed;
      // Consumir bolsones en espera empezando por los lotes más antiguos
      const chronological = [...prev.intakes].reverse().map((intake) => {
        if (remainingToConsume <= 0) return intake;
        const available = Math.max(0, intake.bagCount - intake.processedBags);
        if (available === 0) return intake;
        const consume = Math.min(available, remainingToConsume);
        remainingToConsume -= consume;
        return {
          ...intake,
          processedBags: intake.processedBags + consume,
        };
      });

      return {
        ...prev,
        intakes: chronological.reverse(),
        productions: [record, ...prev.productions],
        materials: prev.materials.map((mat) =>
          mat.id === entry.materialId
            ? {
                ...mat,
                stockBales: mat.stockBales + entry.baleCount,
                stockKg: mat.stockKg + entry.weightKg,
              }
            : mat
        ),
      };
    });
  };

  const handleAddIncident = (
    entry: Omit<IncidentRecord, 'id' | 'timestamp' | 'status'>
  ) => {
    const record: IncidentRecord = {
      ...entry,
      id: `inc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'abierta',
    };
    updateState((prev) => ({
      ...prev,
      incidents: [record, ...prev.incidents],
    }));
  };

  const handleUpdateIncidentStatus = (
    incidentId: string,
    status: IncidentStatus,
    adminNote?: string
  ) => {
    updateState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status,
              adminNote: adminNote ?? inc.adminNote,
              resolvedAt: status === 'resuelta' ? new Date().toISOString() : inc.resolvedAt,
            }
          : inc
      ),
    }));
  };

  const handleAddUser = (newUser: Omit<DemoUser, 'id' | 'avatarUrl' | 'active'>) => {
    const created: DemoUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      avatarUrl: '',
      active: true,
    };
    updateState((prev) => ({
      ...prev,
      users: [...prev.users, created],
    }));
  };

  const handleUpdateMachineStatus = (machineId: string, status: MachineStatus) => {
    const nowLabel = `Hoy ${new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    updateState((prev) => ({
      ...prev,
      machines: prev.machines.map((m) =>
        m.id === machineId ? { ...m, status, lastCheck: nowLabel } : m
      ),
    }));
  };

  const handleUpdateEmptyBags = (delta: number) => {
    updateState((prev) => ({
      ...prev,
      emptyBagsAvailable: Math.max(0, prev.emptyBagsAvailable + delta),
    }));
  };

  const handleUpdateYardCapacity = (percent: number) => {
    updateState((prev) => ({
      ...prev,
      yardCapacityPercent: Math.min(100, Math.max(0, percent)),
    }));
  };

  const handleUpdateMaterialTarget = (materialId: string, targetDailyKg: number) => {
    updateState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, targetDailyKg } : m
      ),
    }));
  };

  const handleRegisterDispatch = (
    materialId: string,
    baleCount: number,
    weightKg: number,
    destination: string
  ) => {
    const mat = state.materials.find((m) => m.id === materialId);
    if (!mat) return;
    updateState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId
          ? {
              ...m,
              stockBales: Math.max(0, m.stockBales - baleCount),
              stockKg: Math.max(0, m.stockKg - weightKg),
            }
          : m
      ),
      dispatches: [
        {
          id: `desp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          materialId,
          materialName: mat.name,
          baleCount,
          weightKg,
          destination,
          operatorName: activeUser.name,
        },
        ...prev.dispatches,
      ],
    }));
  };

  const handleResetDemo = () => {
    const fresh = plantRepository.resetDemo();
    setState(fresh);
  };

  const shortRoleLabel =
    activeUser.role === 'admin'
      ? 'Admin'
      : activeUser.role === 'ingreso'
        ? 'Ingreso'
        : 'Prensa';

  return (
    <div className="min-h-screen bg-[#F4F7F4] text-[#0D2114] flex flex-col md:flex-row">
      {/* Sidebar Desktop con identidad EcoKlin */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0B3B1E] text-white border-r border-[#16512D] z-30 no-print">
        <div className="h-16 px-5 flex items-center border-b border-[#16512D]">
          <a
            href="#resumen"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('resumen');
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0"
          >
            <EcoKlinLogo size="md" />
            <span className="text-lg font-bold tracking-tight text-white font-display">
              EcoKlin Planta
            </span>
          </a>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegación principal">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            const badgeCount =
              item.key === 'incidencias' ? metrics.openIncidents.length : 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#175931] text-white'
                    : 'text-[#C6DEC9] hover:bg-[#124B28] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#8CC63F]' : 'text-[#9AC2A0]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#FDE047] shrink-0">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#16512D]">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="w-full p-2.5 rounded-xl hover:bg-[#124B28] transition-colors flex items-center gap-3 text-left"
          >
            <Avatar src={activeUser.avatarUrl} name={activeUser.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {activeUser.name}
              </p>
              <p className="text-[11px] text-[#A8CCA9] truncate">
                {shortRoleLabel} · Cambiar perfil
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#8CC63F] shrink-0" />
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Bar Mobile (56px) */}
        <header className="md:hidden sticky top-0 z-30 h-14 bg-[#0B3B1E] text-white border-b border-[#16512D] px-3 flex items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="min-h-[44px] px-2 py-1 rounded-xl hover:bg-[#124B28] transition-colors flex items-center gap-2.5 whitespace-nowrap shrink-0"
            aria-label="Abrir menú de EcoKlin Planta"
          >
            <Menu className="w-5 h-5 text-[#8CC63F] shrink-0" />
            <EcoKlinLogo size="sm" />
            <span className="text-base font-bold tracking-tight text-white font-display">
              EcoKlin Planta
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="min-h-[44px] pl-2 pr-2.5 py-1 rounded-xl hover:bg-[#124B28] transition-colors flex items-center gap-2 shrink-0"
            aria-label="Cambiar perfil de usuario"
          >
            <Avatar src={activeUser.avatarUrl} name={activeUser.name} size="sm" />
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {activeUser.name.split(' ')[0]} · {shortRoleLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8CC63F]" />
          </button>
        </header>

        {/* Top Bar Desktop (3 zonas limpias) */}
        <header className="hidden md:flex h-16 bg-white border-b border-[#DCE5DC] px-8 items-center justify-between gap-8 sticky top-0 z-20 no-print">
          <div className="text-sm font-medium text-[#35523D] truncate">
            {state.plantName}
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 whitespace-nowrap shrink-0">
            <span className="tabular-nums">
              {metrics.pendingBagsTotal} bolsones en playa
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="tabular-nums">
              {metrics.totalStockBales} fardos en depósito
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DCE5DC] bg-white hover:bg-[#F4F7F4] text-xs font-medium text-[#0D2114] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <Avatar src={activeUser.avatarUrl} name={activeUser.name} size="sm" />
            <span>
              {activeUser.name} ({shortRoleLabel})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#1E7332]" />
          </button>
        </header>

        {/* Área de Contenido */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-10 space-y-5">
          {/* Selector rápido de modo Demo: Operario vs Administrador */}
          <div className="bg-white border border-[#DCE5DC] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="text-xs text-slate-600">
              {isAdmin ? (
                <span>
                  Vista actual: <strong className="text-[#0D2114]">Administrador</strong> · Control de stock, reportes y planta
                </span>
              ) : (
                <span>
                  Vista actual: <strong className="text-[#0D2114]">Operario (sin Admin)</strong> · {activeUser.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  const firstOp =
                    state.users.find((u) => u.role !== 'admin' && u.active) ??
                    state.users[0];
                  if (firstOp) {
                    handleSelectUser(
                      firstOp.id,
                      activeTab === 'admin' ? 'resumen' : activeTab
                    );
                  }
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  !isAdmin
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0D2114]'
                }`}
              >
                Modo Operario
              </button>
              <button
                type="button"
                onClick={() => {
                  const adminUsr = state.users.find((u) => u.role === 'admin');
                  if (adminUsr) {
                    handleSelectUser(adminUsr.id, activeTab);
                  }
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  isAdmin
                    ? 'bg-[#0B3B1E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0D2114]'
                }`}
              >
                Modo Admin
              </button>
            </div>
          </div>

          {activeTab === 'resumen' && (
            <DailySummaryView
              state={state}
              activeUser={activeUser}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ingresos' && (
            <IntakeView
              intakes={state.intakes}
              activeUser={activeUser}
              onAddIntake={handleAddIntake}
              onAssignWeight={handleAssignWeight}
            />
          )}

          {activeTab === 'produccion' && (
            <ProductionView
              materials={state.materials}
              productions={state.productions}
              pendingBagsAvailable={metrics.pendingBagsTotal}
              activeUser={activeUser}
              onAddProduction={handleAddProduction}
            />
          )}

          {activeTab === 'incidencias' && (
            <IncidentsView
              incidents={state.incidents}
              machines={state.machines}
              activeUser={activeUser}
              onAddIncident={handleAddIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanelView
              state={state}
              activeUser={activeUser}
              onSelectUser={handleSelectUser}
              onAddUser={handleAddUser}
              onUpdateMachineStatus={handleUpdateMachineStatus}
              onUpdateEmptyBags={handleUpdateEmptyBags}
              onUpdateYardCapacity={handleUpdateYardCapacity}
              onUpdateMaterialTarget={handleUpdateMaterialTarget}
              onRegisterDispatch={handleRegisterDispatch}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      {/* Bottom Tab Bar Mobile (64px) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#DCE5DC] grid ${
          isAdmin ? 'grid-cols-5' : 'grid-cols-4'
        } items-center pb-safe no-print`}
        aria-label="Navegación móvil"
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          const openAlerts =
            item.key === 'incidencias' ? metrics.openIncidents.length : 0;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`relative min-h-[44px] h-full flex flex-col items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                active ? 'text-[#1E7332]' : 'text-slate-500 hover:text-[#0B3B1E]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {openAlerts > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {openAlerts}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium tracking-tight">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Drawer de Menú Móvil al clickear EcoKlin Planta */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-sm no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal móvil"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] h-full bg-[#0B3B1E] text-white flex flex-col border-r border-[#16512D] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#16512D]">
              <div className="flex items-center gap-2.5">
                <EcoKlinLogo size="md" />
                <span className="text-lg font-bold tracking-tight text-white font-display">
                  EcoKlin Planta
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C6DEC9] hover:bg-[#124B28] hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#16512D] text-xs text-[#C6DEC9]">
              <p className="font-medium text-white">{state.plantName}</p>
              <p className="mt-0.5 tabular-nums">
                {metrics.pendingBagsTotal} bolsones en playa · {metrics.totalStockBales} fardos
              </p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                const badgeCount =
                  item.key === 'incidencias' ? metrics.openIncidents.length : 0;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between gap-3 transition-colors ${
                      active
                        ? 'bg-[#175931] text-white'
                        : 'text-[#C6DEC9] hover:bg-[#124B28] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          active ? 'text-[#8CC63F]' : 'text-[#9AC2A0]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {badgeCount > 0 && (
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#FDE047] shrink-0">
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#16512D] space-y-3">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#082C16] rounded-xl border border-[#16512D]">
                <button
                  type="button"
                  onClick={() => {
                    const firstOp = state.users.find(
                      (u) => u.role !== 'admin' && u.active
                    );
                    if (firstOp) {
                      handleSelectUser(
                        firstOp.id,
                        activeTab === 'admin' ? 'resumen' : activeTab
                      );
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                    !isAdmin
                      ? 'bg-[#8CC63F] text-[#0B3B1E]'
                      : 'text-[#C6DEC9] hover:text-white'
                  }`}
                >
                  Modo Operario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const adminUsr = state.users.find((u) => u.role === 'admin');
                    if (adminUsr) {
                      handleSelectUser(adminUsr.id, activeTab);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                    isAdmin
                      ? 'bg-[#8CC63F] text-[#0B3B1E]'
                      : 'text-[#C6DEC9] hover:text-white'
                  }`}
                >
                  Modo Admin
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSwitcherOpen(true);
                }}
                className="w-full min-h-[48px] p-2.5 rounded-xl bg-[#124B28] hover:bg-[#175931] transition-colors flex items-center gap-3 text-left"
              >
                <Avatar src={activeUser.avatarUrl} name={activeUser.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {activeUser.name}
                  </p>
                  <p className="text-[11px] text-[#A8CCA9] truncate">
                    {shortRoleLabel} · Cambiar usuario
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#8CC63F] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio Rápido de Perfil Demo */}
      <UserSwitcherModal
        isOpen={isSwitcherOpen}
        users={state.users}
        activeUserId={state.activeUserId}
        onSelectUser={handleSelectUser}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </div>
  );
}
