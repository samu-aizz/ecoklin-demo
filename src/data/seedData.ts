import type {
  ClientSector,
  IntakeRecord,
  PlantState,
  ProductionRecord,
} from '../types/plant';

function todayAt(hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  if (d.getTime() > Date.now()) {
    d.setMinutes(Math.max(0, new Date().getMinutes() - 15));
  }
  return d.toISOString();
}

function daysAgoAt(daysAgo: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const HISTORICAL_MATERIALS = [
  { id: 'mat-carton', name: 'Cartón Corrugado', avgKg: 320, baseBales: 4 },
  { id: 'mat-pet-cristal', name: 'PET Cristal', avgKg: 190, baseBales: 3 },
  { id: 'mat-pet-color', name: 'PET Verde / Color', avgKg: 185, baseBales: 2 },
  { id: 'mat-pead', name: 'PEAD Soplado', avgKg: 210, baseBales: 2 },
  { id: 'mat-film', name: 'Film Stretch / Nylon', avgKg: 230, baseBales: 2 },
  { id: 'mat-aluminio', name: 'Latas de Aluminio', avgKg: 140, baseBales: 1 },
];

const HIST_ORIGINS: { sector: ClientSector; origin: string; truck: string; driver: string }[] = [
  {
    sector: 'estado',
    origin: 'Municipalidad · Recolección Ruta Norte',
    truck: 'Camión #04 · Iveco AF-412',
    driver: 'Juan Rodríguez',
  },
  {
    sector: 'estado',
    origin: 'Municipalidad · Zona Centro',
    truck: 'Camión #04 · Iveco AF-412',
    driver: 'Juan Rodríguez',
  },
  {
    sector: 'privado',
    origin: 'Supermercados Centro S.A.',
    truck: 'Camión #07 · Mercedes AB-891',
    driver: 'Darío Acosta',
  },
  {
    sector: 'privado',
    origin: 'Logística Parque Industrial',
    truck: 'Camión #12 · Ford Cargo AE-309',
    driver: 'Héctor López',
  },
];

function generateHistoricalRecords(): {
  intakes: IntakeRecord[];
  productions: ProductionRecord[];
} {
  const intakes: IntakeRecord[] = [];
  const productions: ProductionRecord[] = [];

  for (let d = 1; d <= 44; d++) {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() - d);
    const dayOfWeek = refDate.getDay(); // 0 domingo, 6 sábado

    if (dayOfWeek === 0) continue; // Planta cerrada domingos

    const isSaturday = dayOfWeek === 6;
    const batchesCount = isSaturday ? 2 : 3;

    for (let b = 0; b < batchesCount; b++) {
      const template = HIST_ORIGINS[(d + b) % HIST_ORIGINS.length];
      const bagCount = isSaturday
        ? 7 + ((d + b) % 5)
        : 10 + ((d * 3 + b * 5) % 9);
      const weightKg = bagCount * (145 + ((d + b) % 3) * 12);

      intakes.push({
        id: `ing-hist-${d}-${b}`,
        timestamp: daysAgoAt(d, 8 + b * 3, 15 + ((d * 7) % 35)),
        clientType: template.sector,
        origin: template.origin,
        truckId: template.truck,
        driverName: template.driver,
        materialHint:
          template.sector === 'privado' ? 'Cartón y Plásticos' : 'Mezcla RSU Seco',
        bagCount,
        weightKg,
        weightStatus: 'pesado',
        processedBags: bagCount,
        notes: '',
        operatorId: 'usr-ingreso',
        operatorName: 'Mateo Silva',
        shift: b < 2 ? 'Mañana' : 'Tarde',
      });
    }

    // Producción histórica diaria por materiales
    const matsToday = isSaturday ? 3 : 5;
    for (let m = 0; m < matsToday; m++) {
      const mat = HISTORICAL_MATERIALS[(d + m) % HISTORICAL_MATERIALS.length];
      const variation = ((d * 5 + m * 3) % 3) - 1; // -1, 0, +1
      const baleCount = Math.max(1, mat.baseBales + variation - (isSaturday ? 1 : 0));
      const weightKg = baleCount * mat.avgKg + ((d * 11 + m * 7) % 35) - 15;

      productions.push({
        id: `prod-hist-${d}-${m}`,
        timestamp: daysAgoAt(d, 9 + m * 2, 10 + ((d * 3) % 40)),
        materialId: mat.id,
        materialName: mat.name,
        baleCount,
        weightKg,
        pressName:
          m % 3 === 0
            ? 'Prensa Hidráulica 1'
            : m % 3 === 1
              ? 'Prensa Hidráulica 2'
              : 'Compactadora 3',
        sourceBagsUsed: baleCount * 2,
        notes: '',
        operatorId: 'usr-produccion',
        operatorName: 'Sofía Gómez',
        shift: m < 3 ? 'Mañana' : 'Tarde',
      });
    }
  }

  return { intakes, productions };
}

export function createSeedState(): PlantState {
  const historical = generateHistoricalRecords();

  const todayIntakes: IntakeRecord[] = [
    {
      id: 'ing-101',
      timestamp: todayAt(7, 35),
      clientType: 'estado',
      origin: 'Municipalidad · Recolección Ruta Norte',
      truckId: 'Camión #04 · Iveco AF-412',
      driverName: 'Juan Rodríguez',
      materialHint: 'Mezcla RSU Seco',
      bagCount: 16,
      weightKg: 2480,
      weightStatus: 'pesado',
      processedBags: 12,
      notes: 'Material seco en buen estado.',
      operatorId: 'usr-ingreso',
      operatorName: 'Mateo Silva',
      shift: 'Mañana',
    },
    {
      id: 'ing-102',
      timestamp: todayAt(9, 10),
      clientType: 'privado',
      origin: 'Supermercados Centro S.A.',
      truckId: 'Camión #07 · Mercedes AB-891',
      driverName: 'Darío Acosta',
      materialHint: 'Cartón y Film',
      bagCount: 12,
      weightKg: 1940,
      weightStatus: 'pesado',
      processedBags: 8,
      notes: 'Bolsones grandes compactos, prioridad en prensa 1.',
      operatorId: 'usr-ingreso',
      operatorName: 'Mateo Silva',
      shift: 'Mañana',
    },
    {
      id: 'ing-103',
      timestamp: todayAt(10, 45),
      clientType: 'privado',
      origin: 'Logística Parque Industrial',
      truckId: 'Camión #12 · Ford Cargo AE-309',
      driverName: 'Héctor López',
      materialHint: 'Plásticos PET / PEAD',
      bagCount: 9,
      weightKg: null,
      weightStatus: 'sin_pesar',
      processedBags: 0,
      notes: 'Descarga rápida por ocupación de báscula. Pendiente de pesaje.',
      operatorId: 'usr-ingreso',
      operatorName: 'Mateo Silva',
      shift: 'Mañana',
    },
  ];

  const todayProductions: ProductionRecord[] = [
    {
      id: 'prod-201',
      timestamp: todayAt(8, 50),
      materialId: 'mat-carton',
      materialName: 'Cartón Corrugado',
      baleCount: 5,
      weightKg: 1610,
      pressName: 'Prensa Hidráulica 1',
      sourceBagsUsed: 10,
      notes: 'Fardos atados con 4 alambres, humedad normal.',
      operatorId: 'usr-produccion',
      operatorName: 'Sofía Gómez',
      shift: 'Mañana',
    },
    {
      id: 'prod-202',
      timestamp: todayAt(10, 15),
      materialId: 'mat-pet-cristal',
      materialName: 'PET Cristal',
      baleCount: 4,
      weightKg: 765,
      pressName: 'Prensa Hidráulica 2',
      sourceBagsUsed: 6,
      notes: 'Separación limpia sin tapas ni etiquetas PVC.',
      operatorId: 'usr-produccion',
      operatorName: 'Sofía Gómez',
      shift: 'Mañana',
    },
    {
      id: 'prod-203',
      timestamp: todayAt(11, 40),
      materialId: 'mat-film',
      materialName: 'Film Stretch / Nylon',
      baleCount: 2,
      weightKg: 460,
      pressName: 'Compactadora 3',
      sourceBagsUsed: 4,
      notes: 'Film transparente recuperado de supermercados.',
      operatorId: 'usr-produccion',
      operatorName: 'Sofía Gómez',
      shift: 'Mañana',
    },
  ];

  return {
    plantName: 'EcoKlin · Planta de Reciclaje',
    emptyBagsAvailable: 34,
    yardCapacityPercent: 72,
    activeUserId: 'usr-admin',
    lastUpdated: new Date().toISOString(),
    users: [
      {
        id: 'usr-admin',
        name: 'Carlos Méndez',
        role: 'admin',
        roleLabel: 'Jefe de Planta · Administrador',
        shift: 'Mañana',
        area: 'Administración y Control',
        avatarUrl: '/src/assets/images/avatar_carlos_admin_1795556646872.jpg',
        active: true,
      },
      {
        id: 'usr-ingreso',
        name: 'Mateo Silva',
        role: 'ingreso',
        roleLabel: 'Operario de Báscula e Ingreso',
        shift: 'Mañana',
        area: 'Playa de Descarga',
        avatarUrl: '/src/assets/images/avatar_mateo_operario_1795556647526.jpg',
        active: true,
      },
      {
        id: 'usr-produccion',
        name: 'Sofía Gómez',
        role: 'produccion',
        roleLabel: 'Técnica de Separación y Prensa',
        shift: 'Mañana',
        area: 'Línea de Enfardado',
        avatarUrl: '/src/assets/images/avatar_lucia_prensa_1795556646538.jpg',
        active: true,
      },
    ],
    materials: [
      {
        id: 'mat-carton',
        name: 'Cartón Corrugado',
        code: 'CAR-01',
        category: 'Papel y Cartón',
        accentColor: '#B45309',
        avgBaleWeightKg: 320,
        targetDailyKg: 2500,
        stockBales: 14,
        stockKg: 4480,
      },
      {
        id: 'mat-pet-cristal',
        name: 'PET Cristal',
        code: 'PET-CR',
        category: 'Plásticos',
        accentColor: '#0284C7',
        avgBaleWeightKg: 190,
        targetDailyKg: 1200,
        stockBales: 9,
        stockKg: 1715,
      },
      {
        id: 'mat-pet-color',
        name: 'PET Verde / Color',
        code: 'PET-CL',
        category: 'Plásticos',
        accentColor: '#1E7332',
        avgBaleWeightKg: 185,
        targetDailyKg: 800,
        stockBales: 5,
        stockKg: 920,
      },
      {
        id: 'mat-pead',
        name: 'PEAD Soplado',
        code: 'PEAD-02',
        category: 'Plásticos',
        accentColor: '#4F46E5',
        avgBaleWeightKg: 210,
        targetDailyKg: 900,
        stockBales: 6,
        stockKg: 1260,
      },
      {
        id: 'mat-film',
        name: 'Film Stretch / Nylon',
        code: 'FLM-04',
        category: 'Plásticos',
        accentColor: '#64748B',
        avgBaleWeightKg: 230,
        targetDailyKg: 700,
        stockBales: 4,
        stockKg: 910,
      },
      {
        id: 'mat-aluminio',
        name: 'Latas de Aluminio',
        code: 'ALU-01',
        category: 'Metales',
        accentColor: '#334155',
        avgBaleWeightKg: 140,
        targetDailyKg: 450,
        stockBales: 3,
        stockKg: 425,
      },
    ],
    intakes: [...todayIntakes, ...historical.intakes],
    productions: [...todayProductions, ...historical.productions],
    dispatches: [
      {
        id: 'desp-301',
        timestamp: todayAt(8, 10),
        materialId: 'mat-carton',
        materialName: 'Cartón Corrugado',
        baleCount: 6,
        weightKg: 1920,
        destination: 'Papelera del Sur S.A.',
        operatorName: 'Carlos Méndez',
      },
    ],
    incidents: [
      {
        id: 'inc-401',
        timestamp: todayAt(9, 25),
        category: 'maquinaria',
        title: 'Transpiración leve en manguera hidráulica',
        locationOrMachine: 'Prensa Hidráulica 1',
        description:
          'Se nota pérdida menor de aceite en el acople superior al llegar a presión máxima. Sigue operativa pero requiere revisión al cierre del turno.',
        priority: 'media',
        status: 'en_revision',
        reportedById: 'usr-produccion',
        reportedByName: 'Sofía Gómez',
        adminNote: 'Mantenimiento programado para las 14:30 entre turnos.',
      },
      {
        id: 'inc-402',
        timestamp: todayAt(10, 55),
        category: 'faltante_bolsones',
        title: 'Stock bajo de bolsones Big-Bag vacíos en línea 2',
        locationOrMachine: 'Cinta de Clasificación · Sector B',
        description:
          'Quedan menos de 15 bolsones vacíos para clasificar PET Color y Aluminio. Necesitamos reposición antes del ingreso de la tarde.',
        priority: 'critica',
        status: 'abierta',
        reportedById: 'usr-ingreso',
        reportedByName: 'Mateo Silva',
      },
      {
        id: 'inc-403',
        timestamp: todayAt(8, 20),
        category: 'falta_espacio',
        title: 'Sector de acopio de Cartón casi completo',
        locationOrMachine: 'Playa Techada · Módulo 3',
        description:
          'Con el despacho de la mañana se liberaron 6 posiciones, pero si entran dos camiones más por la tarde habrá que estibar a 3 niveles.',
        priority: 'baja',
        status: 'resuelta',
        reportedById: 'usr-admin',
        reportedByName: 'Carlos Méndez',
        resolvedAt: todayAt(9, 0),
        adminNote: 'Se despejó pasillo lateral tras el retiro de Papelera del Sur.',
      },
    ],
    machines: [
      {
        id: 'maq-1',
        name: 'Prensa Hidráulica 1',
        zone: 'Nave Central · Cartón',
        status: 'advertencia',
        lastCheck: 'Hoy 09:25',
      },
      {
        id: 'maq-2',
        name: 'Prensa Hidráulica 2',
        zone: 'Nave Central · PET',
        status: 'operativa',
        lastCheck: 'Hoy 07:00',
      },
      {
        id: 'maq-3',
        name: 'Compactadora 3',
        zone: 'Sector Plásticos Film',
        status: 'operativa',
        lastCheck: 'Hoy 07:00',
      },
      {
        id: 'maq-4',
        name: 'Cinta Clasificadora Principal',
        zone: 'Playa de Separación',
        status: 'operativa',
        lastCheck: 'Hoy 07:00',
      },
      {
        id: 'maq-5',
        name: 'Báscula Plataforma 3000 kg',
        zone: 'Acceso Descarga',
        status: 'operativa',
        lastCheck: 'Hoy 07:15',
      },
      {
        id: 'maq-6',
        name: 'Autoelevador Linde 2.5T',
        zone: 'Estiba y Despacho',
        status: 'operativa',
        lastCheck: 'Hoy 08:00',
      },
    ],
  };
}
