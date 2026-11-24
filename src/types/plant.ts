export type UserRole = 'admin' | 'ingreso' | 'produccion';

export type ShiftType = 'Mañana' | 'Tarde' | 'Noche';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  shift: ShiftType;
  avatarUrl: string;
  area: string;
  active: boolean;
}

export interface MaterialStock {
  id: string;
  name: string;
  code: string;
  category: 'Papel y Cartón' | 'Plásticos' | 'Metales' | 'Vidrio';
  accentColor: string;
  avgBaleWeightKg: number;
  targetDailyKg: number;
  stockBales: number;
  stockKg: number;
}

export type WeightStatus = 'pesado' | 'sin_pesar';
export type ClientSector = 'estado' | 'privado';

export interface IntakeRecord {
  id: string;
  timestamp: string;
  clientType: ClientSector;
  origin: string;
  truckId: string;
  driverName: string;
  materialHint: string;
  bagCount: number;
  weightKg: number | null;
  weightStatus: WeightStatus;
  processedBags: number;
  notes: string;
  operatorId: string;
  operatorName: string;
  shift: ShiftType;
}

export interface ProductionRecord {
  id: string;
  timestamp: string;
  materialId: string;
  materialName: string;
  baleCount: number;
  weightKg: number;
  pressName: string;
  sourceBagsUsed: number;
  notes: string;
  operatorId: string;
  operatorName: string;
  shift: ShiftType;
}

export interface DispatchRecord {
  id: string;
  timestamp: string;
  materialId: string;
  materialName: string;
  baleCount: number;
  weightKg: number;
  destination: string;
  operatorName: string;
}

export type IncidentCategory = 'faltante_bolsones' | 'falta_espacio' | 'maquinaria';
export type IncidentPriority = 'baja' | 'media' | 'critica';
export type IncidentStatus = 'abierta' | 'en_revision' | 'resuelta';

export interface IncidentRecord {
  id: string;
  timestamp: string;
  category: IncidentCategory;
  title: string;
  locationOrMachine: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  reportedById: string;
  reportedByName: string;
  resolvedAt?: string;
  adminNote?: string;
}

export type MachineStatus = 'operativa' | 'advertencia' | 'detenida';

export interface PlantMachine {
  id: string;
  name: string;
  zone: string;
  status: MachineStatus;
  lastCheck: string;
}

export interface PlantState {
  plantName: string;
  emptyBagsAvailable: number;
  yardCapacityPercent: number;
  activeUserId: string;
  users: DemoUser[];
  materials: MaterialStock[];
  intakes: IntakeRecord[];
  productions: ProductionRecord[];
  dispatches: DispatchRecord[];
  incidents: IncidentRecord[];
  machines: PlantMachine[];
  lastUpdated: string;
}
