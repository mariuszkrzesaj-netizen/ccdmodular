import {
  TrailerConfig,
  ComplianceIssue,
  CostSummary,
  PlacedEquipment,
  PowerPhaseSummary,
  WeightSummary,
  TrailerSizeId,
} from "../types/trailer";
import { EQUIPMENT_CATALOG, TRAILER_PRESETS } from "../data/equipmentCatalog";

export interface PhaseLoadItem {
  name: string;
  powerKw: number;
}

export interface PhaseBalanceResult {
  l1Kw: number;
  l2Kw: number;
  l3Kw: number;
  totalKw: number;
  maxPhaseKw: number;
  isBalanced: boolean;
  deltaKw: number;
  itemsByPhase: {
    l1: PhaseLoadItem[];
    l2: PhaseLoadItem[];
    l3: PhaseLoadItem[];
    threePhase: PhaseLoadItem[];
  };
}

export interface ProfileCutItem {
  name: string;
  profileType: string;
  lengthCm: number;
  quantity: number;
  totalLengthM: number;
  weightKg: number;
}

export interface ProfileCutsSummary {
  items: ProfileCutItem[];
  totalLengthM: number;
  totalLengthWithWasteM: number;
  totalSteelWeightKg: number;
}

export interface WallPanelItem {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  areaM2: number;
  cutouts: string;
  material: string;
}

export interface WallCutsSummary {
  panels: WallPanelItem[];
  totalWallAreaM2: number;
  roofAreaM2: number;
  floorAreaM2: number;
  recommendedSandwichSheets: number;
}

export function calculatePhaseBalance(config: TrailerConfig): PhaseBalanceResult {
  const modelMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));
  let l1Kw = 0;
  let l2Kw = 0;
  let l3Kw = 0;
  const itemsByPhase: {
    l1: PhaseLoadItem[];
    l2: PhaseLoadItem[];
    l3: PhaseLoadItem[];
    threePhase: PhaseLoadItem[];
  } = {
    l1: [],
    l2: [],
    l3: [],
    threePhase: [],
  };
  const singlePhaseItems: PhaseLoadItem[] = [];

  for (const placed of config.placedItems) {
    const model = modelMap.get(placed.modelId);
    if (!model || model.powerKw <= 0) continue;
    if (model.voltage === 400) {
      const perPhase = model.powerKw / 3;
      l1Kw += perPhase;
      l2Kw += perPhase;
      l3Kw += perPhase;
      itemsByPhase.threePhase.push({
        name: model.name,
        powerKw: model.powerKw,
      });
    } else {
      singlePhaseItems.push({
        name: model.name,
        powerKw: model.powerKw,
      });
    }
  }

  singlePhaseItems.sort((a, b) => b.powerKw - a.powerKw);

  for (const item of singlePhaseItems) {
    if (l1Kw <= l2Kw && l1Kw <= l3Kw) {
      l1Kw += item.powerKw;
      itemsByPhase.l1.push(item);
    } else if (l2Kw <= l1Kw && l2Kw <= l3Kw) {
      l2Kw += item.powerKw;
      itemsByPhase.l2.push(item);
    } else {
      l3Kw += item.powerKw;
      itemsByPhase.l3.push(item);
    }
  }

  const maxPhaseKw = Number(Math.max(l1Kw, l2Kw, l3Kw).toFixed(2));
  const minPhaseKw = Number(Math.min(l1Kw, l2Kw, l3Kw).toFixed(2));
  const deltaKw = Number((maxPhaseKw - minPhaseKw).toFixed(2));
  const isBalanced = deltaKw <= 2.8;

  return {
    l1Kw: Number(l1Kw.toFixed(2)),
    l2Kw: Number(l2Kw.toFixed(2)),
    l3Kw: Number(l3Kw.toFixed(2)),
    totalKw: Number((l1Kw + l2Kw + l3Kw).toFixed(2)),
    maxPhaseKw,
    isBalanced,
    deltaKw,
    itemsByPhase,
  };
}

export function calculate1DProfileCuts(config: TrailerConfig): ProfileCutsSummary {
  const { length, width, height, hatchWidth, hatchHeight } = config.dimensions;
  const crossBeamsCount = Math.floor(length / 50) + 1;
  const wallStudsCount = Math.floor(length / 60) * 2 + 4;
  const items: ProfileCutItem[] = [
    {
      name: "Podłużnice główne ramy nośnej",
      profileType: "60x40x3 mm (Rama Nośna)",
      lengthCm: length,
      quantity: 2,
      totalLengthM: Number(((length * 2) / 100).toFixed(2)),
      weightKg: Number((((length * 2) / 100) * 4.3).toFixed(1)),
    },
    {
      name: "Poprzecznice wzmacniające podłogę",
      profileType: "60x40x3 mm (Rama Nośna)",
      lengthCm: width - 8,
      quantity: crossBeamsCount,
      totalLengthM: Number((((width - 8) * crossBeamsCount) / 100).toFixed(2)),
      weightKg: Number(((((width - 8) * crossBeamsCount) / 100) * 4.3).toFixed(1)),
    },
    {
      name: "Ramiona dyszla trójkątnego V",
      profileType: "60x40x3 mm (Rama Nośna)",
      lengthCm: 150,
      quantity: 2,
      totalLengthM: 3,
      weightKg: Number((3 * 4.3).toFixed(1)),
    },
    {
      name: "Słupki pionowe narożne ramy",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: height,
      quantity: 4,
      totalLengthM: Number(((height * 4) / 100).toFixed(2)),
      weightKg: Number((((height * 4) / 100) * 2.4).toFixed(1)),
    },
    {
      name: "Słupki pośrednie pionowe ścian",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: height,
      quantity: wallStudsCount,
      totalLengthM: Number(((height * wallStudsCount) / 100).toFixed(2)),
      weightKg: Number((((height * wallStudsCount) / 100) * 2.4).toFixed(1)),
    },
    {
      name: "Wieniec obwodowy dachu (podłużny)",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: length,
      quantity: 2,
      totalLengthM: Number(((length * 2) / 100).toFixed(2)),
      weightKg: Number((((length * 2) / 100) * 2.4).toFixed(1)),
    },
    {
      name: "Wieniec obwodowy dachu (poprzeczny)",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: width,
      quantity: 2,
      totalLengthM: Number(((width * 2) / 100).toFixed(2)),
      weightKg: Number((((width * 2) / 100) * 2.4).toFixed(1)),
    },
    {
      name: "Stelaż okna wydawczego (nadproże + parapet)",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: hatchWidth,
      quantity: 2,
      totalLengthM: Number(((hatchWidth * 2) / 100).toFixed(2)),
      weightKg: Number((((hatchWidth * 2) / 100) * 2.4).toFixed(1)),
    },
    {
      name: "Podkonstrukcja nośna okapu wyciągowego",
      profileType: "40x40x2 mm (Klatka/Wręgi)",
      lengthCm: 160,
      quantity: 2,
      totalLengthM: 3.2,
      weightKg: Number((3.2 * 2.4).toFixed(1)),
    },
  ];
  const totalLengthM = Number(items.reduce((sum, it) => sum + it.totalLengthM, 0).toFixed(2));
  return {
    items,
    totalLengthM,
    totalLengthWithWasteM: Number((totalLengthM * 1.07).toFixed(2)),
    totalSteelWeightKg: Number(items.reduce((sum, it) => sum + it.weightKg, 0).toFixed(1)),
  };
}

export function calculate2DWallCuts(config: TrailerConfig): WallCutsSummary {
  const { length, width, height, hatchWidth, hatchHeight } = config.dimensions;
  const panels: WallPanelItem[] = [
    {
      id: "wall_left",
      name: "Ściana Lewa (Bok Wejściowy)",
      widthCm: width,
      heightCm: height,
      areaM2: Number(((width * height) / 10000).toFixed(2)),
      cutouts: "Otwór drzwi technicznych 70 × 185 cm",
      material: "Płyta warstwowa PIR 40mm laminat/stal",
    },
    {
      id: "wall_right",
      name: "Ściana Prawa (Bok Zamknięty)",
      widthCm: width,
      heightCm: height,
      areaM2: Number(((width * height) / 10000).toFixed(2)),
      cutouts: "Brak (ściana pełna)",
      material: "Płyta warstwowa PIR 40mm laminat/stal",
    },
    {
      id: "wall_back",
      name: "Ściana Tylna (Ściana Technologiczna)",
      widthCm: length,
      heightCm: height,
      areaM2: Number(((length * height) / 10000).toFixed(2)),
      cutouts: "Wylot wentylacji fi 200mm pod okap",
      material: "Płyta warstwowa PIR 40mm + osłona INOX AISI 304",
    },
    {
      id: "wall_front",
      name: "Ściana Przednia (Ściana Wydawcza)",
      widthCm: length,
      heightCm: height,
      areaM2: Number(((length * height) / 10000).toFixed(2)),
      cutouts: `Otwór klapy sprzedażowej ${hatchWidth} × ${hatchHeight} cm`,
      material: "Płyta warstwowa PIR 40mm z klapą na siłownikach",
    },
    {
      id: "roof",
      name: "Płyta Dachowa (Monolityczna)",
      widthCm: length,
      heightCm: width,
      areaM2: Number(((length * width) / 10000).toFixed(2)),
      cutouts: "Przebicie kominowe wentylatora dachowego",
      material: "Płyta dachowa PIR 40mm bezspoinowa",
    },
    {
      id: "floor",
      name: "Podłoga Techniczna i Posadzka",
      widthCm: length,
      heightCm: width,
      areaM2: Number(((length * width) / 10000).toFixed(2)),
      cutouts: "Wpusty instalacji wod-kan i przepust kabla zasilania",
      material: "Sklejka wodoodporna 18mm + blacha ryflowana aluminiowa",
    },
  ];
  const totalWallAreaM2 = Number(
    panels
      .filter((p) => p.id.startsWith("wall_"))
      .reduce((sum, p) => sum + p.areaM2, 0)
      .toFixed(2)
  );
  const roofAreaM2 = Number(((length * width) / 10000).toFixed(2));
  return {
    panels,
    totalWallAreaM2,
    roofAreaM2,
    floorAreaM2: roofAreaM2,
    recommendedSandwichSheets: Math.ceil((totalWallAreaM2 + roofAreaM2) / 3.6),
  };
}

export function calculateSummaryAndCompliance(config: TrailerConfig): {
  issues: ComplianceIssue[];
  cost: CostSummary;
  powerByPhase: PowerPhaseSummary;
  weightSummary: WeightSummary;
  phaseBalance: PhaseBalanceResult;
  profileCuts: ProfileCutsSummary;
  wallCuts: WallCutsSummary;
  tongueWeightKg: number;
  sawStops: any;
} {
  const issues: ComplianceIssue[] = [];
  const modelMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));
  const preset = (TRAILER_PRESETS as Record<string, any>)[config.presetId];
  const basePrice = preset?.basePricePln || 45000;
  let equipmentPrice = 0;
  let equipmentWeightKg = 0;
  let totalPowerKw = 0;
  let hasSanepidUnit = false;
  let hasThermal = false;
  let hasExhaustHood = false;
  let hasCooling = false;
  let thermalItemsUnderHood = 0;
  let thermalTotal = 0;
  let has400V = false;

  for (const placed of config.placedItems) {
    const model = modelMap.get(placed.modelId);
    if (!model) continue;
    equipmentPrice += model.pricePln;
    equipmentWeightKg += model.weightKg;
    totalPowerKw += model.powerKw;
    if (model.voltage === 400) has400V = true;
    if (model.id === "sanitary_module_sanepid" || model.isSanepidRequired) hasSanepidUnit = true;
    if (model.category === "thermal") {
      hasThermal = true;
      thermalTotal++;
      if (
        config.placedItems.some((other) => {
          return (
            modelMap.get(other.modelId)?.category === "ventilation" &&
            Math.abs(other.x - placed.x) < 70
          );
        })
      ) {
        thermalItemsUnderHood++;
      }
    }
    if (model.category === "ventilation") hasExhaustHood = true;
    if (model.category === "cooling") hasCooling = true;
  }

  const installationsPrice = 4500 + (has400V ? 1800 : 0) + (hasSanepidUnit ? 1200 : 0);
  const furniturePrice = config.placedItems
    .filter((item) => modelMap.get(item.modelId)?.category === "furniture")
    .reduce((sum, item) => sum + (modelMap.get(item.modelId)?.pricePln || 0), 0);
  const totalNettoPln = basePrice + equipmentPrice + installationsPrice;
  const vatPln = Math.round(totalNettoPln * 0.23);
  const totalBruttoPln = totalNettoPln + vatPln;
  const curbWeightKg = config.dimensions.curbWeightKg;
  const payloadAllowanceKg = 180;
  const totalWeightKg = curbWeightKg + equipmentWeightKg + payloadAllowanceKg;
  const dmcKg = config.dimensions.dmcKg;
  const remainingPayloadKg = dmcKg - totalWeightKg;
  const isOverweight = remainingPayloadKg < 0;

  // Sanepid audit
  if (!hasSanepidUnit) {
    issues.push({
      id: "no_sanitary",
      level: "error",
      category: "sanepid",
      title: "Brak modułu sanitarnego Sanepid / HACCP",
      description: "Przepisy Sanepidu bezwzględnie wymagają dwukomorowego modułu z niezależną umywalką do mycia rąk i ciepłą wodą.",
      recommendation: "Dodaj Moduł Sanitarny Sanepid z katalogu wyposażenia.",
    });
  } else {
    issues.push({
      id: "sanitary_ok",
      level: "success",
      category: "sanepid",
      title: "Kącik sanitarny HACCP kompletny",
      description: "Projekt spełnia wymogi Sanepidu w zakresie wydzielonego punktu higienicznego.",
    });
  }

  // Ventilation check
  if (hasThermal && (!hasExhaustHood || thermalItemsUnderHood < thermalTotal)) {
    issues.push({
      id: "hood_missing",
      level: "error",
      category: "ventilation",
      title: "Brak okapu wyciągowego nad strefą termiczną",
      description: "Urządzenia grzewcze (grill, frytury, piec) muszą znajdować się bezpośrednio pod okapem z filtrami labiryntowymi ze stali AISI 304.",
      recommendation: "Zamontuj Okap Gastronomiczny INOX bezpośrednio nad ciągiem grzewczym.",
    });
  }

  // Weight check
  if (isOverweight) {
    issues.push({
      id: "dmc_exceeded",
      level: "error",
      category: "weight",
      title: `Przekroczono dopuszczalną masę całkowitą DMC o ${Math.abs(remainingPayloadKg)} kg!`,
      description: `Aktualna masa zestawu (${totalWeightKg} kg) przekracza DMC podwozia (${dmcKg} kg). Ryzyko utraty homologacji i mandatu drogowego.`,
      recommendation: "Zmień wariant podwozia na wyższy (np. Maxi 5.0m lub Gigant 6.0m) z większą ładownością lub zredukuj liczbę urządzeń.",
    });
  } else if (remainingPayloadKg < 100) {
    issues.push({
      id: "dmc_warning",
      level: "warning",
      category: "weight",
      title: `Niska rezerwa ładowności (${remainingPayloadKg} kg)`,
      description: "Pozostała rezerwa ładowności może być zbyt mała na zapasy towaru, napoje, surowce i wodę w zbiornikach (30-60 kg).",
      recommendation: "Zastanów się nad podwoziem tandem o DMC 2000-2700 kg.",
    });
  }

  // Electrical connection calculation
  let requiredConnection: "230V_16A" | "400V_16A" | "400V_32A" | "400V_63A" = "230V_16A";
  let fuseAmps = 16;
  let cableMm = "3x2.5 mm²";

  if (totalPowerKw > 22) {
    requiredConnection = "400V_63A";
    fuseAmps = 63;
    cableMm = "5x10 mm² H07RN-F";
  } else if (totalPowerKw > 11 || has400V) {
    requiredConnection = "400V_32A";
    fuseAmps = 32;
    cableMm = "5x6.0 mm² H07RN-F";
  } else if (totalPowerKw > 3.6) {
    requiredConnection = "400V_16A";
    fuseAmps = 16;
    cableMm = "5x2.5 mm² H07RN-F";
  }

  const phaseBalance = calculatePhaseBalance(config);
  const profileCuts = calculate1DProfileCuts(config);
  const wallCuts = calculate2DWallCuts(config);
  const tongueWeightKg = Math.round(totalWeightKg * 0.07);

  return {
    issues,
    cost: {
      trailerBasePrice: basePrice,
      furniturePrice,
      equipmentPrice,
      installationsPrice,
      totalNettoPln,
      vatPln,
      totalBruttoPln,
      totalWeightKg,
      remainingPayloadKg,
      totalPowerKw: Number(totalPowerKw.toFixed(1)),
    },
    powerByPhase: {
      totalKw: Number(totalPowerKw.toFixed(1)),
      requiredConnection,
      fuseAmps,
      cableMm,
    },
    weightSummary: {
      curbWeightKg,
      equipmentWeightKg,
      payloadKg: payloadAllowanceKg,
      dmcKg,
      isOverweight,
      totalWeightKg,
      remainingPayloadKg,
    },
    phaseBalance,
    profileCuts,
    wallCuts,
    tongueWeightKg,
    sawStops: null,
  };
}
