import { createSeedState } from '../data/seedData';
import type { PlantState } from '../types/plant';

const STORAGE_KEY = 'ecoklin_planta_demo_v3';
const SYNC_CHANNEL_NAME = 'ecoklin_planta_realtime_sync';

/**
 * Repositorio local para la versión DEMO.
 * Arquitectura desacoplada: cuando el proyecto pase a producción online,
 * solo se reemplazan loadState / saveState por llamadas a Firestore o API REST
 * manteniendo intactos los componentes de interfaz.
 */
class LocalPlantRepository {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
  }

  loadState(): PlantState {
    if (typeof window === 'undefined') {
      return createSeedState();
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = createSeedState();
        this.saveState(seed, false);
        return seed;
      }
      const parsed = JSON.parse(raw) as PlantState;
      if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.materials)) {
        const seed = createSeedState();
        this.saveState(seed, false);
        return seed;
      }
      return parsed;
    } catch {
      const seed = createSeedState();
      return seed;
    }
  }

  saveState(state: PlantState, broadcast = true): void {
    if (typeof window === 'undefined') return;
    try {
      const next: PlantState = {
        ...state,
        lastUpdated: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (broadcast && this.channel) {
        this.channel.postMessage({ type: 'STATE_UPDATED', payload: next });
      }
    } catch {
      // Ignorar errores de cuota en modo privado
    }
  }

  resetDemo(): PlantState {
    const fresh = createSeedState();
    this.saveState(fresh, true);
    return fresh;
  }

  subscribe(onRemoteUpdate: (state: PlantState) => void): () => void {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          onRemoteUpdate(JSON.parse(e.newValue) as PlantState);
        } catch {
          // noop
        }
      }
    };

    const handleChannel = (e: MessageEvent) => {
      if (e.data?.type === 'STATE_UPDATED' && e.data?.payload) {
        onRemoteUpdate(e.data.payload as PlantState);
      }
    };

    window.addEventListener('storage', handleStorage);
    this.channel?.addEventListener('message', handleChannel);

    return () => {
      window.removeEventListener('storage', handleStorage);
      this.channel?.removeEventListener('message', handleChannel);
    };
  }
}

export const plantRepository = new LocalPlantRepository();
