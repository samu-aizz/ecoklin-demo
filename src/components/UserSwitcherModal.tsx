import { Check, ShieldCheck, Truck, Layers, X } from 'lucide-react';
import type { DemoUser, UserRole } from '../types/plant';
import { Avatar } from './Avatar';

interface UserSwitcherModalProps {
  isOpen: boolean;
  users: DemoUser[];
  activeUserId: string;
  onSelectUser: (userId: string) => void;
  onClose: () => void;
}

function getRoleHint(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Acceso completo: reportes, inventario, máquinas, usuarios y resolución de incidencias.';
    case 'ingreso':
      return 'Vista rápida para registrar bolsones en descarga, pesar lotes pendientes y reportar faltantes.';
    case 'produccion':
      return 'Vista rápida para cargar fardos producidos por prensa y reportar fallas en línea.';
  }
}

function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'admin') return <ShieldCheck className="w-4 h-4 text-[#1E7332]" />;
  if (role === 'ingreso') return <Truck className="w-4 h-4 text-slate-600" />;
  return <Layers className="w-4 h-4 text-slate-600" />;
}

export function UserSwitcherModal({
  isOpen,
  users,
  activeUserId,
  onSelectUser,
  onClose,
}: UserSwitcherModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switcher-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 id="switcher-title" className="text-lg font-semibold text-slate-900">
              Cambiar perfil de demostración
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulá cómo opera cada usuario desde su celular o PC
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Cerrar selector de usuario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {users
            .filter((u) => u.active)
            .map((user) => {
              const isSelected = user.id === activeUserId;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onSelectUser(user.id);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3.5 min-h-[64px] ${
                    isSelected
                      ? 'bg-[#EEF6EE] border-[#1E7332]'
                      : 'bg-white border-[#DCE5DC] hover:border-[#B8CEBA] hover:bg-[#F7FAF7]'
                  }`}
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0D2114] text-sm truncate">
                        {user.name}
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E7332] shrink-0">
                          <Check className="w-4 h-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 shrink-0">
                          Seleccionar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                      <RoleIcon role={user.role} />
                      <span>{user.roleLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Turno {user.shift}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {getRoleHint(user.role)}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          Los datos ingresados se guardan localmente en este dispositivo y se sincronizan al instante entre pestañas abiertas.
        </div>
      </div>
    </div>
  );
}
