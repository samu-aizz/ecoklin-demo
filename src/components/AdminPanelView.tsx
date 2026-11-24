import { useState } from 'react';
import {
  Check,
  Database,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserPlus,
  Wrench,
} from 'lucide-react';
import type {
  DemoUser,
  MachineStatus,
  PlantState,
  ShiftType,
  UserRole,
} from '../types/plant';
import { formatKg } from '../utils/formatters';
import { AdminAnalyticsSection } from './AdminAnalyticsSection';
import { Avatar } from './Avatar';

interface AdminPanelViewProps {
  state: PlantState;
  activeUser: DemoUser;
  onSelectUser: (userId: string) => void;
  onAddUser: (user: Omit<DemoUser, 'id' | 'avatarUrl' | 'active'>) => void;
  onUpdateMachineStatus: (machineId: string, status: MachineStatus) => void;
  onUpdateEmptyBags: (delta: number) => void;
  onUpdateYardCapacity: (percent: number) => void;
  onUpdateMaterialTarget: (materialId: string, targetDailyKg: number) => void;
  onRegisterDispatch: (
    materialId: string,
    baleCount: number,
    weightKg: number,
    destination: string
  ) => void;
  onResetDemo: () => void;
}

export function AdminPanelView({
  state,
  activeUser,
  onSelectUser,
  onAddUser,
  onUpdateMachineStatus,
  onUpdateEmptyBags,
  onUpdateYardCapacity,
  onUpdateMaterialTarget,
  onRegisterDispatch,
  onResetDemo,
}: AdminPanelViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [adminSubTab, setAdminSubTab] = useState<'estadisticas' | 'gestion'>('estadisticas');

  // Form estado de Despacho
  const [dispatchMaterialId, setDispatchMaterialId] = useState(
    state.materials[0]?.id ?? 'mat-carton'
  );
  const [dispatchBales, setDispatchBales] = useState(4);
  const [dispatchWeight, setDispatchWeight] = useState('1280');
  const [dispatchDest, setDispatchDest] = useState('Papelera del Sur S.A.');
  const [dispatchSaved, setDispatchSaved] = useState(false);

  // Form alta de usuario demo
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('ingreso');
  const [newUserShift, setNewUserShift] = useState<ShiftType>('Tarde');

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = state.materials.find((m) => m.id === dispatchMaterialId);
    if (!mat || dispatchBales <= 0) return;
    const safeBales = Math.min(dispatchBales, mat.stockBales);
    if (safeBales <= 0) return;

    onRegisterDispatch(
      mat.id,
      safeBales,
      Math.max(1, Number(dispatchWeight) || safeBales * mat.avgBaleWeightKg),
      dispatchDest.trim() || 'Cliente Retiro en Planta'
    );
    setDispatchSaved(true);
    setTimeout(() => setDispatchSaved(false), 2200);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const roleLabel =
      newUserRole === 'admin'
        ? 'Supervisor · Administrador'
        : newUserRole === 'ingreso'
          ? 'Operario de Báscula e Ingreso'
          : 'Técnico de Separación y Prensa';
    const area =
      newUserRole === 'admin'
        ? 'Administración y Control'
        : newUserRole === 'ingreso'
          ? 'Playa de Descarga'
          : 'Línea de Enfardado';

    onAddUser({
      name: newUserName.trim(),
      role: newUserRole,
      roleLabel,
      shift: newUserShift,
      area,
    });
    setNewUserName('');
  };

  if (!isAdmin) {
    const adminUser = state.users.find((u) => u.role === 'admin');
    return (
      <div className="max-w-xl mx-auto bg-white border border-[#DCE5DC] rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF6EE] text-[#1E7332] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0D2114]">
          Panel exclusivo de Administración
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Actualmente estás navegando como <strong>{activeUser.name}</strong> ({activeUser.roleLabel}).
          Para gestionar usuarios, despachos, maquinaria y metas de planta, cambiá al perfil de Administrador.
        </p>
        {adminUser && (
          <button
            type="button"
            onClick={() => onSelectUser(adminUser.id)}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-[#1E7332] text-white text-sm font-semibold hover:bg-[#165A26] transition-colors inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Entrar como {adminUser.name} (Admin)
          </button>
        )}
      </div>
    );
  }

  const selectedDispatchMat = state.materials.find((m) => m.id === dispatchMaterialId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Panel de Administración
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Control de capacidad en playa, maquinaria, despachos, usuarios y metas diarias.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#DCE5DC] rounded-xl">
            <button
              type="button"
              onClick={() => setAdminSubTab('estadisticas')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                adminSubTab === 'estadisticas'
                  ? 'bg-[#0B3B1E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0D2114]'
              }`}
            >
              Estadísticas y Calendario
            </button>
            <button
              type="button"
              onClick={() => setAdminSubTab('gestion')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                adminSubTab === 'gestion'
                  ? 'bg-[#0B3B1E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0D2114]'
              }`}
            >
              Gestión y Usuarios
            </button>
          </div>

          <button
            type="button"
            onClick={onResetDemo}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer demo
          </button>
        </div>
      </div>

      {adminSubTab === 'estadisticas' ? (
        <AdminAnalyticsSection state={state} />
      ) : (
        <>
          {/* Bloque 1: Capacidad de Insumos/Playa + Despacho de Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#0D2114] pb-3 border-b border-slate-100">
            Capacidad operativa y bolsones vacíos
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#0D2114]">Bolsones Big-Bag vacíos</p>
              <p className="text-xs text-slate-500">Disponibles para reposición en línea</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateEmptyBags(-5)}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-[#DCE5DC] bg-white flex items-center justify-center hover:bg-[#F4F7F4]"
                aria-label="Restar 5 bolsones vacíos"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-16 text-center text-xl font-bold font-mono tabular-nums text-[#0D2114]">
                {state.emptyBagsAvailable}
              </span>
              <button
                type="button"
                onClick={() => onUpdateEmptyBags(5)}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-[#DCE5DC] bg-white flex items-center justify-center hover:bg-[#F4F7F4]"
                aria-label="Sumar 5 bolsones vacíos"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="yard-slider" className="font-medium text-[#0D2114]">
                Ocupación estimada de playa de acopio
              </label>
              <span className="font-mono font-bold tabular-nums text-[#0D2114]">
                {state.yardCapacityPercent}%
              </span>
            </div>
            <input
              id="yard-slider"
              type="range"
              min={10}
              max={100}
              step={2}
              value={state.yardCapacityPercent}
              onChange={(e) => onUpdateYardCapacity(Number(e.target.value))}
              className="w-full accent-[#1E7332] h-2 bg-[#DCE5DC] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Playa despejada</span>
              <span>Capacidad crítica (90%+)</span>
            </div>
          </div>
        </section>

        {/* Registrar Despacho / Salida */}
        <form
          onSubmit={handleDispatchSubmit}
          className="lg:col-span-6 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Despacho / Salida de fardos
            </h2>
            <Truck className="w-4 h-4 text-slate-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disp-mat" className="block text-xs font-medium text-slate-700 mb-1">
                Material a despachar
              </label>
              <select
                id="disp-mat"
                value={dispatchMaterialId}
                onChange={(e) => {
                  const id = e.target.value;
                  setDispatchMaterialId(id);
                  const mat = state.materials.find((m) => m.id === id);
                  if (mat) {
                    setDispatchWeight(String(mat.avgBaleWeightKg * dispatchBales));
                  }
                }}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
              >
                {state.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.stockBales} disp.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="disp-bales" className="block text-xs font-medium text-slate-700 mb-1">
                Fardos a retirar (máx. {selectedDispatchMat?.stockBales ?? 0})
              </label>
              <input
                id="disp-bales"
                type="number"
                min={1}
                max={Math.max(1, selectedDispatchMat?.stockBales ?? 1)}
                value={dispatchBales}
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value) || 1);
                  setDispatchBales(n);
                  if (selectedDispatchMat) {
                    setDispatchWeight(String(selectedDispatchMat.avgBaleWeightKg * n));
                  }
                }}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono text-sm tabular-nums text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disp-kg" className="block text-xs font-medium text-slate-700 mb-1">
                Peso remito (kg)
              </label>
              <input
                id="disp-kg"
                type="number"
                min={1}
                value={dispatchWeight}
                onChange={(e) => setDispatchWeight(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono text-sm tabular-nums text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="disp-dest" className="block text-xs font-medium text-slate-700 mb-1">
                Cliente / Destino
              </label>
              <input
                id="disp-dest"
                type="text"
                value={dispatchDest}
                onChange={(e) => setDispatchDest(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedDispatchMat || selectedDispatchMat.stockBales === 0}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B3B1E] text-white text-sm font-medium hover:bg-[#124D29] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {dispatchSaved ? (
              <>
                <Check className="w-4 h-4 text-[#8CC63F]" />
                Despacho descontado del stock
              </>
            ) : (
              'Registrar salida y descontar stock'
            )}
          </button>
        </form>
      </div>

      {/* Bloque 2: Estado de Maquinaria + Usuarios de Planta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0D2114]">
              Estado de maquinaria en planta
            </h2>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="divide-y divide-slate-100">
            {state.machines.map((machine) => (
              <div
                key={machine.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#0D2114]">{machine.name}</p>
                  <p className="text-xs text-slate-500">
                    {machine.zone} · Último chequeo: {machine.lastCheck}
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                  {(
                    [
                      { id: 'operativa', label: 'Operativa' },
                      { id: 'advertencia', label: 'Revisión' },
                      { id: 'detenida', label: 'Detenida' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onUpdateMachineStatus(machine.id, st.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        machine.status === st.id
                          ? st.id === 'detenida'
                            ? 'bg-red-600 text-white'
                            : st.id === 'advertencia'
                              ? 'bg-amber-500 text-white'
                              : 'bg-[#1E7332] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipo y Usuarios Demo */}
        <section className="lg:col-span-6 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Usuarios y roles de planta
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cambiá de usuario o agregá operarios de ejemplo
              </p>
            </div>
            <UserPlus className="w-4 h-4 text-slate-500" />
          </div>

          <div className="divide-y divide-slate-100">
            {state.users.map((user) => {
              const isCurrent = user.id === activeUser.id;
              return (
                <div
                  key={user.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.avatarUrl} name={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.roleLabel} · Turno {user.shift}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectUser(user.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isCurrent
                        ? 'bg-[#EEF6EE] text-[#1E7332] border border-[#B8CEBA]'
                        : 'border border-[#DCE5DC] text-slate-700 hover:bg-[#F4F7F4]'
                    }`}
                  >
                    {isCurrent ? 'Sesión activa' : 'Usar perfil'}
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleCreateUser}
            className="p-4 bg-[#F4F7F4] border-t border-slate-100 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Nuevo operario (ej. Martín Pérez)"
              className="flex-1 min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="min-h-[42px] px-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
            >
              <option value="ingreso">Ingreso / Báscula</option>
              <option value="produccion">Prensa / Separación</option>
              <option value="admin">Administrador</option>
            </select>
            <select
              value={newUserShift}
              onChange={(e) => setNewUserShift(e.target.value as ShiftType)}
              className="min-h-[42px] px-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
            <button
              type="submit"
              className="min-h-[42px] px-4 rounded-xl bg-[#0B3B1E] text-white text-xs font-medium hover:bg-[#124D29] whitespace-nowrap shrink-0"
            >
              Agregar
            </button>
          </form>
        </section>
      </div>

      {/* Bloque 3: Metas Diarias + Escalabilidad a Nube */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-[#0D2114]">
              Metas diarias por material
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajustá el objetivo diario en kg para medir el avance en el resumen
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {state.materials.map((mat) => (
              <div
                key={mat.id}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0D2114]">{mat.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Stock actual: {mat.stockBales} fardos ({formatKg(mat.stockKg)})
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={mat.targetDailyKg}
                    onChange={(e) =>
                      onUpdateMaterialTarget(mat.id, Math.max(100, Number(e.target.value) || 100))
                    }
                    className="w-24 min-h-[40px] px-2.5 rounded-lg border border-slate-300 font-mono text-sm text-right tabular-nums"
                    aria-label={`Meta diaria de ${mat.name}`}
                  />
                  <span className="text-xs font-mono text-slate-500">kg/día</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-[#DCE5DC] rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#1E7332] shrink-0" />
            <h2 className="text-base font-semibold text-[#0D2114]">
              Arquitectura lista para producción
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Esta versión <strong>DEMO</strong> funciona sin servidor externo guardando los datos en el dispositivo y sincronizando en tiempo real entre pestañas abiertas del navegador.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Para pasar a operación online multi-dispositivo (celulares de operarios + PC de administración en simultáneo), solo se conecta la capa de repositorio actual a una base en tiempo real como <strong>Firebase Firestore</strong> o <strong>PostgreSQL</strong> con acceso web seguro.
          </p>
        </section>
      </div>
        </>
      )}
    </div>
  );
}
