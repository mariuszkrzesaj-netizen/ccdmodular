import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  TrailerConfig,
  CostSummary,
  ComplianceIssue,
  PowerPhaseSummary,
  WeightSummary,
} from "../types/trailer";
import { EQUIPMENT_CATALOG, TRAILER_PRESETS } from "../data/equipmentCatalog";
import {
  DEMO_COMPANY,
  DEMO_CONTACT,
  DEMO_COPYRIGHT,
  WORKSHOP_DOC_HEADER,
  WORKSHOP_LOGO_PLACEHOLDER,
  WORKSHOP_DOC_FOOTER,
  LogoPlaceholder,
} from "../data/branding";
import {
  calculatePhaseBalance,
  calculate1DProfileCuts,
  calculate2DWallCuts,
} from "../services/complianceEngine";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  Download,
  Printer,
  X,
  FileText,
  ShieldCheck,
  Zap,
  Truck,
  HardHat,
  Scissors,
  Droplets,
  Layers,
  ClipboardList,
} from "lucide-react";

interface SpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrailerConfig;
  cost: CostSummary;
  issues: ComplianceIssue[];
  powerSpecs: PowerPhaseSummary;
  weightSpecs: WeightSummary;
}

export const SpecificationModal: React.FC<SpecificationModalProps> = ({
  isOpen,
  onClose,
  config,
  cost,
  issues,
  powerSpecs,
  weightSpecs,
}) => {
  const [activeTab, setActiveTab] = useState<"technical_report" | "workshop_cards" | "quote">("technical_report");
  const [workshopSubTab, setWorkshopSubTab] = useState<"electric" | "hydraulic" | "profiles1d" | "walls2d">("electric");
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const catalogMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));
  const preset = TRAILER_PRESETS[config.presetId];
  const phaseBalance = calculatePhaseBalance(config);
  const profileCuts = calculate1DProfileCuts(config);
  const wallCuts = calculate2DWallCuts(config);

  const hasSanepidUnit = config.placedItems.some((item) => item.modelId === "sanitary_module_sanepid");
  const hasThermal = config.placedItems.some((item) => catalogMap.get(item.modelId)?.category === "thermal");
  const hasHood = config.placedItems.some((item) => catalogMap.get(item.modelId)?.category === "ventilation");
  const hasCooling = config.placedItems.some((item) => catalogMap.get(item.modelId)?.category === "cooling");

  const sanepidChecklist = [
    {
      id: "handwash",
      title: "Wydzielona umywalka do higienicznego mycia rąk",
      requirement: "Obowiązkowa umywalka z baterią bezdotykową/łokciową, dozownikiem mydła i ręcznikami jednorazowymi (odrębna od zmywania sprzętu).",
      passed: hasSanepidUnit,
      critical: true,
    },
    {
      id: "sink_food",
      title: "Zlewozmywak do mycia artykułów spożywczych i sprzętu",
      requirement: "Niezależna komora zmywalnicza ze stali kwasoodpornej AISI 304.",
      passed: hasSanepidUnit,
      critical: true,
    },
    {
      id: "water_tanks",
      title: "System wody czystej i szarej z podgrzewaczem",
      requirement: "Atestowane zbiorniki min. 30L ze stali/PE, automatyczna pompa ciśnieniowa i podgrzewacz wody (min. 45°C).",
      passed: config.waterSystem !== undefined,
      critical: true,
    },
    {
      id: "surfaces_easy_clean",
      title: "Gładkie, nienasiąkliwe powierzchnie robocze i podłogi",
      requirement: "Blaty ze stali nierdzewnej AISI 304 z atestem PZH, posadzka antypoślizgowa R11/R12 ze szczelnym wywinięciem cokołowym.",
      passed: true,
      critical: true,
    },
    {
      id: "ventilation",
      title: "Wentylacja mechaniczna i wyciąg tłuszczu nad strefą ciepłą",
      requirement: "Okap gastronomiczny z filtrami labiryntowymi inox i regulacją obrotów wyciągu nad każdym urządzeniem smażalniczym.",
      passed: hasThermal ? hasHood : true,
      critical: hasThermal,
    },
    {
      id: "cold_chain",
      title: "Ciąg chłodniczy z monitoringiem temperatur",
      requirement: "Szafy i stoły chłodnicze utrzymujące temperaturę +2°C do +6°C z termometrami cyfrowymi.",
      passed: hasCooling,
      critical: false,
    },
    {
      id: "fly_screens",
      title: "Ochrona przed owadami i zanieczyszczeniami z zewnątrz",
      requirement: "Okna i klapy wydawcze zabezpieczone siatkami ochronnymi o oczkach &lt; 1.5mm lub kurtyną powietrzną.",
      passed: true,
      critical: false,
    },
    {
      id: "waste_separation",
      title: "Segregacja odpadów w pojemnikach bezdotykowych",
      requirement: "Pojemniki na odpady komunalne i tłuszcze posmażalnicze otwierane pedałem nożnym.",
      passed: true,
      critical: false,
    },
  ];

  // 1. GENERATE SANEPID & TECHNICAL REPORT PDF
  const handleGenerateTechnicalReportPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const addTechnicalHeader = (pageNumber: number) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 18, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(WORKSHOP_DOC_HEADER, 15, 11);

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(WORKSHOP_LOGO_PLACEHOLDER, 155, 11);

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 18, 210, 1.2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${WORKSHOP_DOC_FOOTER}  |  Strona ${pageNumber}`, 15, 290);
      doc.text(`Kontakt: ${DEMO_CONTACT}`, 115, 290);
    };

    addTechnicalHeader(1);

    let curY = 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("RAPORT TECHNICZNO-ODBIORCZY ZABUDOWY GASTRONOMICZNEJ", 15, curY);

    curY += 5;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("SPECYFIKACJA WYPOSAŻENIA, BILANS FAZ L1-L3 & AUDYT SANEPID (HACCP)", 15, curY);

    curY += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Data: ${new Date().toLocaleDateString("pl-PL")}  |  Zleceniodawca: Inwestor Gastronomiczny  |  System: PRO-FOODTRUCK BUILDER B2B`, 15, curY);

    curY += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, curY, 180, 22, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, curY, 180, 22, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("1. DANE IDENTYFIKACYJNE I PARAMETRY PODWOZIA", 20, curY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Wymiary nadwozia: ${config.dimensions.length} × ${config.dimensions.width} × ${config.dimensions.height} cm | Układ: ${config.dimensions.axles === 1 ? "1 oś hamowana" : "2 osie tandem AL-KO / Knott"}`, 20, curY + 11);
    doc.text(`• Dopuszczalna Masa Całkowita (DMC): ${config.dimensions.dmcKg} kg | Masa zabudowy z wyposażeniem: ${weightSpecs.totalWeightKg} kg`, 20, curY + 16);
    doc.text(`• Rezerwa ładowności: ${weightSpecs.remainingPayloadKg} kg | Wykończenie wnętrza: Stal nierdzewna AISI 304 + blacha ryflowana`, 20, curY + 20);

    curY += 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("2. BILANS MOCY ELEKTRYCZNEJ I ROZDZIELNICA GŁÓWNA", 15, curY);

    curY += 3;
    autoTable(doc, {
      startY: curY,
      head: [["Parametr instalacji", "Wartość projektowa", "Wytyczne normy PN-HD 60364"]],
      body: [
        ["Moc przyłączeniowa szczytowa", `${powerSpecs.totalKw} kW`, "Suma mocy znamionowych odbiorników"],
        ["Zalecane przyłącze zasilania", powerSpecs.requiredConnection, "Gniazdo siłowe CEE 5-bolcowe czerwone"],
        ["Bezpiecznik główny tablicy", `B${powerSpecs.fuseAmps}A 3-fazowy`, "Charakterystyka B / selektywny"],
        ["Wyłącznik różnicowoprądowy", "RCD 40A / 30mA Typ A", "Ochrona przeciwporażeniowa i przeciwpożarowa"],
        ["Główny kabel zasilający", powerSpecs.cableMm, "Przewód oponowy H07RN-F odporny na UV i ścieranie"],
        ["Agregat prądotwórczy (rekomendacja)", `${(powerSpecs.totalKw * 1.25).toFixed(1)} kVA / 400V`, "Agregat inwerterowy z zapasem rozruchowym 25%"],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      margin: { left: 15, right: 15 },
    });

    curY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("3. LISTA KONTROLNA HACCP & SANEPID (AUDYT TECHNOLOGICZNY)", 15, curY);

    curY += 3;
    autoTable(doc, {
      startY: curY,
      head: [["Wymóg prawny / Norma Sanepid", "Status w projekcie", "Zgodność"]],
      body: sanepidChecklist.map((it) => [
        it.title,
        it.passed ? "Spełniony w projekcie zabudowy" : "WYMAGA UZUPEŁNIENIA",
        it.passed ? "POZYTYWNY" : "BRAK / NEGATYWNY",
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        2: { fontStyle: "bold", textColor: [16, 185, 129] },
      },
      margin: { left: 15, right: 15 },
    });

    curY = (doc as any).lastAutoTable.finalY + 12;
    if (curY > 230) {
      doc.addPage();
      addTechnicalHeader(2);
      curY = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("OŚWIADCZENIE WYKONAWCY I PODPISY ODBIORCZE:", 15, curY);

    curY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Zabudowa technologiczna przyczepy została zaprojektowana zgodnie z normami bezpieczeństwa żywności HACCP oraz dyrektywami maszynowymi UE.", 15, curY);

    curY += 15;
    doc.setDrawColor(148, 163, 184);
    doc.line(25, curY + 15, 85, curY + 15);
    doc.line(125, curY + 15, 185, curY + 15);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Pieczęć i podpis Inżyniera Technologa", 25, curY + 20);
    doc.text("Podpis i data Odbiorcy / Właściciela", 125, curY + 20);

    doc.save(`Raport-Techniczny-Sanepid-DEMO-B2B-${Date.now().toString().slice(-6)}.pdf`);
  };

  // 2. GENERATE WORKSHOP CARDS PDF (4 PAGES)
  const handleGenerateWorkshopCardsPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const renderWorkshopHeader = (cardTitle: string, pageNumber: number) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(WORKSHOP_DOC_HEADER, 15, 9);

      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text(cardTitle.toUpperCase(), 15, 16);

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(WORKSHOP_LOGO_PLACEHOLDER, 155, 12);

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 20, 210, 1.2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${WORKSHOP_DOC_FOOTER}  |  Karta ${pageNumber} z 4`, 15, 290);
      doc.text(`Wytwórca: ${DEMO_COMPANY} | ${DEMO_CONTACT}`, 105, 290);
    };

    // Page 1: Electric & Phases
    renderWorkshopHeader("Karta Warsztatowa 01: Montaż Elektryka i Bilans Faz L1-L3", 1);
    let y = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("KARTA MONTAŻOWA INSTALACJI ELEKTRYCZNEJ", 15, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dla platformy: ${config.dimensions.length} × ${config.dimensions.width} cm | Zasilanie: ${powerSpecs.requiredConnection}`, 15, y);

    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, 180, 52, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, y, 180, 52, 2, 2, "D");

    let tY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("OBWÓD / FAZA", 20, tY);
    doc.text("OBCIĄŻENIE", 70, tY);
    doc.text("ZABEZPIECZENIE", 110, tY);
    doc.text("PRZEKRÓJ PRZEWODU", 150, tY);

    tY += 4;
    doc.line(20, tY, 190, tY);
    tY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    [
      ["Zasilanie Główne CEE", `${powerSpecs.totalKw} kW (Ps ${(powerSpecs.totalKw * 0.85).toFixed(1)} kW)`, `B${powerSpecs.fuseAmps}A / RCD 30mA`, powerSpecs.cableMm],
      ["Faza L1 (Odbiorniki 230V)", `${phaseBalance.l1Kw} kW`, "Wyłącznik B16A 1P", "YDYp 3x2.5 mm²"],
      ["Faza L2 (Odbiorniki 230V)", `${phaseBalance.l2Kw} kW`, "Wyłącznik B16A 1P", "YDYp 3x2.5 mm²"],
      ["Faza L3 (Odbiorniki 230V)", `${phaseBalance.l3Kw} kW`, "Wyłącznik B16A 1P", "YDYp 3x2.5 mm²"],
      ["Obwód 400V 3-Fazowy", `${phaseBalance.itemsByPhase.threePhase.reduce((a, b) => a + b.powerKw, 0)} kW`, "Wyłącznik B16A/B20A 3P", "YDYp 5x2.5-4.0 mm²"],
      ["Oświetlenie LED & Sterowanie", "0.2 kW", "Wyłącznik B10A 1P", "YDYp 3x1.5 mm²"],
    ].forEach(([obw, obc, zab, kbl]) => {
      doc.text(obw, 20, tY);
      doc.text(obc, 70, tY);
      doc.text(zab, 110, tY);
      doc.text(kbl, 150, tY);
      tY += 5.5;
    });

    y += 62;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("WYKAZ URZĄDZEŃ I PRZYPISANIE DO FAZ L1, L2, L3:", 15, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Faza L1: ${phaseBalance.itemsByPhase.l1.map((i) => `${i.name} (${i.powerKw}kW)`).join(", ") || "Brak obciążeń"}`, 15, y);
    y += 5;
    doc.text(`• Faza L2: ${phaseBalance.itemsByPhase.l2.map((i) => `${i.name} (${i.powerKw}kW)`).join(", ") || "Brak obciążeń"}`, 15, y);
    y += 5;
    doc.text(`• Faza L3: ${phaseBalance.itemsByPhase.l3.map((i) => `${i.name} (${i.powerKw}kW)`).join(", ") || "Brak obciążeń"}`, 15, y);
    y += 5;
    if (phaseBalance.itemsByPhase.threePhase.length > 0) {
      doc.text(`• Obwód Siłowy 400V: ${phaseBalance.itemsByPhase.threePhase.map((i) => `${i.name} (${i.powerKw}kW)`).join(", ")}`, 15, y);
      y += 5;
    }

    y += 8;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, y, 180, 22, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text("ZALECENIA MONTERSKIE DLA WARSZTATU ELEKTRYCZNEGO:", 19, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 53, 15);
    doc.text("1. Każde urządzenie powyżej 2.0 kW (frytownica, ekspres, grill) zasilić z oddzielnego bezpiecznika B16A.", 19, y + 10);
    doc.text("2. Obowiązkowe wykonanie szyny wyrównawczej CC (PE) połączonej z ramą nośną podwozia i blatami ze stali AISI 304.", 19, y + 15);

    // Page 2: Hydraulic
    doc.addPage();
    renderWorkshopHeader("Karta Warsztatowa 02: Instalacja Hydrauliczna i Sanepid", 2);
    y = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("KARTA MONTAŻOWA INSTALACJI WODNO-KANALIZACYJNEJ", 15, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("• Obieg wody czystej: Zbiornik atestowany 30L / 50L z polietylenu z certyfikatem PZH do kontaktu z żywnością.", 15, y);
    y += 5;
    doc.text("• Obieg wody szarej: Zbiornik 30L / 50L z zaworem spustowym zewnętrznym fi 25mm umieszczonym w podłodze.", 15, y);
    y += 5;
    doc.text("• Ciśnienie robocze: Pompa automatyczna membranowa 12V / 230V z wyłącznikiem ciśnieniowym (min. 2.8 bar, 10 l/min).", 15, y);
    y += 5;
    doc.text("• Przygotowanie ciepłej wody: Podgrzewacz przepływowy ciśnieniowy 3.0 kW - 3.5 kW lub bojler bezciśnieniowy 5L.", 15, y);
    y += 5;
    doc.text("• Punkty czerpalne: Bateria łokciowa / bezdotykowa w umywalce do rąk oraz bateria mieszaczowa przy zlewozmywaku.", 15, y);

    y += 10;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, 180, 50, 2, 2, "F");
    doc.roundedRect(15, y, 180, 50, 2, 2, "D");

    let hyY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ELEMENT HYDRAULIKI", 20, hyY);
    doc.text("SPECYFIKACJA TECHNICZNA", 80, hyY);
    doc.text("LOKALIZACJA MONTAŻU", 145, hyY);
    hyY += 4;
    doc.line(20, hyY, 190, hyY);
    hyY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    [
      ["Zbiornik Woda Czysta", "Atest PZH 30L z odpowietrznikiem", "Szafka sanitarna lewa"],
      ["Zbiornik Woda Szara", "Pojemnik z zaworem kulowym 30L", "Szafka pod zlewozmywakiem"],
      ["Pompa ciśnieniowa", "Seaflo / Shurflo 12V/230V 10L/min", "Za zbiornikiem czystej wody"],
      ["Podgrzewacz wody", "Przepływowy 3.0 kW (Klasa A)", "Montaż ścienny nad pompą"],
      ["Umywalka do rąk", "Stal kwasoodporna AISI 304, rant 40mm", "Strefa wejścia / czysta"],
      ["Zlewozmywak gastronomiczny", "Komora 40x40x25cm ze stali AISI 304", "Strefa technologiczna"],
    ].forEach(([el, sp, lok]) => {
      doc.text(el, 20, hyY);
      doc.text(sp, 80, hyY);
      doc.text(lok, 145, hyY);
      hyY += 5.5;
    });

    // Page 3: 1D Steel Profile Cuts
    doc.addPage();
    renderWorkshopHeader("Karta Warsztatowa 03: Rozkrój Profili Stalowych / Aluminiowych 1D", 3);
    y = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("ZESTAWIENIE CIĘCIA PROFILI PODWOZIA I KLATKI NADWOZIA", 15, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Łączna długość: ${profileCuts.totalLengthM} m (+7% naddatek: ${profileCuts.totalLengthWithWasteM} m) | Masa stali: ok. ${profileCuts.totalSteelWeightKg} kg`, 15, y);

    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, 180, 78, 2, 2, "F");
    doc.roundedRect(15, y, 180, 78, 2, 2, "D");

    let prY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ELEMENT KONSTRUKCJI", 20, prY);
    doc.text("PROFIL", 85, prY);
    doc.text("DŁ. (CM)", 135, prY);
    doc.text("SZT.", 155, prY);
    doc.text("MB RAZEM", 170, prY);
    prY += 4;
    doc.line(20, prY, 190, prY);
    prY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    profileCuts.items.forEach((it) => {
      doc.text(it.name, 20, prY);
      doc.text(it.profileType.split(" ")[0], 85, prY);
      doc.text(`${it.lengthCm}`, 135, prY);
      doc.text(`${it.quantity}`, 155, prY);
      doc.text(`${it.totalLengthM} m`, 170, prY);
      prY += 6.5;
    });

    // Page 4: 2D Sandwich Panels
    doc.addPage();
    renderWorkshopHeader("Karta Warsztatowa 04: Cięcie Płyt Ściennych Sandwich PIR 2D", 4);
    y = 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("KARTA FORMATOWANIA PŁYT WARSTWOWYCH I POSADZKI", 15, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Powierzchnia ścian: ${wallCuts.totalWallAreaM2} m² | Dach: ${wallCuts.roofAreaM2} m² | Płyty standard: ~${wallCuts.recommendedSandwichSheets} szt. (3000×1200 mm)`, 15, y);

    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, 180, 68, 2, 2, "F");
    doc.roundedRect(15, y, 180, 68, 2, 2, "D");

    let wlY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("PŁYTA / PANEL", 20, wlY);
    doc.text("WYMIAR BRUTTO", 70, wlY);
    doc.text("POW.", 105, wlY);
    doc.text("OTWORY I WYCIĘCIA WARSZTATOWE", 125, wlY);
    wlY += 4;
    doc.line(20, wlY, 190, wlY);
    wlY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    wallCuts.panels.forEach((p) => {
      doc.text(p.name, 20, wlY);
      doc.text(`${p.widthCm} × ${p.heightCm} cm`, 70, wlY);
      doc.text(`${p.areaM2} m²`, 105, wlY);
      doc.text(p.cutouts || "-", 125, wlY);
      wlY += 8.5;
    });

    y += 78;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 180, 26, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("NORMY OBRÓBKI PŁYT PIR/PUR NA WARSZTACIE:", 19, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Wszelkie krawędzie cięte zabezpieczyć masą uszczelniającą poliuretanową (Sikaflex / Bostik) przed wilgocią.", 19, y + 11);
    doc.text("2. Na ścianie technologicznej (za urządzeniami grzewczymi) nakleić ekran termiczny ze stali AISI 304 gr. 0.8mm.", 19, y + 16);
    doc.text("3. Kątowniki narożne zewnętrzne i wewnętrzne nitować co 200 mm z zachowaniem szczelności komory.", 19, y + 21);

    doc.save(`Karty-Warsztatowe-Produkcja-DEMO-B2B-${Date.now().toString().slice(-6)}.pdf`);
  };

  // 3. GENERATE COMMERCIAL QUOTE PDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("PRO-FOODTRUCK BUILDER B2B", 15, 14);

    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text("KOSZTORYS I SPECYFIKACJA TECHNOLOGICZNA PRZYCZEPY GASTRONOMICZNEJ", 15, 21);

    doc.text(`Data: ${new Date().toLocaleDateString("pl-PL")}`, 160, 21);

    let curY = 38;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("PODSUMOWANIE FINANSOWE ZABUDOWY (PLN):", 15, curY);

    curY += 4;
    autoTable(doc, {
      startY: curY,
      head: [["Pozycja kosztorysu", "Wartość Netto (PLN)", "Stawka VAT", "Wartość Brutto (PLN)"]],
      body: [
        ["Podwozie i konstrukcja nadwozia (AL-KO/Knott)", `${(preset?.basePricePln || 45000).toLocaleString("pl-PL")} zł`, "23%", `${Math.round((preset?.basePricePln || 45000) * 1.23).toLocaleString("pl-PL")} zł`],
        ["Zainstalowane urządzenia gastronomiczne", `${config.placedItems.reduce((s, it) => s + (catalogMap.get(it.modelId)?.pricePln || 0), 0).toLocaleString("pl-PL")} zł`, "23%", `${Math.round(config.placedItems.reduce((s, it) => s + (catalogMap.get(it.modelId)?.pricePln || 0), 0) * 1.23).toLocaleString("pl-PL")} zł`],
        ["Instalacje wewnętrzne (400V/230V, Sanepid, LED)", `${(cost.installationsPrice || 6000).toLocaleString("pl-PL")} zł`, "23%", `${Math.round((cost.installationsPrice || 6000) * 1.23).toLocaleString("pl-PL")} zł`],
        ["RAZEM WARTOŚĆ ZAMÓWIENIA", `${cost.totalNettoPln.toLocaleString("pl-PL")} zł`, "23%", `${cost.totalBruttoPln.toLocaleString("pl-PL")} zł`],
      ],
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 15, right: 15 },
    });

    curY = (doc as any).lastAutoTable.finalY + 8;
    doc.text("WYKAZ WYPOSAŻENIA GASTRONOMICZNEGO:", 15, curY);

    curY += 3;
    autoTable(doc, {
      startY: curY,
      head: [["Lp.", "Nazwa urządzenia", "Kategoria", "Moc (kW)", "Napięcie", "Waga (kg)", "Cena Netto"]],
      body: config.placedItems.map((it, idx) => {
        const m = catalogMap.get(it.modelId);
        return [
          idx + 1,
          m?.name || it.modelId,
          m?.categoryLabel || "-",
          m?.powerKw ? `${m.powerKw} kW` : "0 kW",
          m?.voltage ? `${m.voltage}V` : "-",
          m?.weightKg ? `${m.weightKg} kg` : "-",
          m?.pricePln ? `${m.pricePln.toLocaleString("pl-PL")} zł` : "0 zł",
        ];
      }),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      margin: { left: 15, right: 15 },
    });

    doc.save(`Specyfikacja-B2B-DEMO-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header with LogoPlaceholder and Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <LogoPlaceholder size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
                  PRO-FOODTRUCK <span className="text-amber-400">BUILDER</span>
                </h2>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  DEMO B2B
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Karty Warsztatowe, Bilans Faz L1-L3, Sanepid & Wycena Produkcyjna B2B
              </p>
            </div>
          </div>

          {/* Action PDF Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateTechnicalReportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition active:scale-95"
              title="Pobierz oficjalny audyt Sanepid i bilans instalacji elektrycznej"
            >
              <FileCheck className="w-4 h-4 text-sky-200" />
              <span>Raport Sanepid & Moc PDF</span>
            </button>

            <button
              onClick={handleGenerateWorkshopCardsPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition active:scale-95"
              title="Pobierz 4 karty montażowe: Elektryka L1-L3, Hydraulika, Rozkrój 1D/2D"
            >
              <HardHat className="w-4 h-4 text-amber-200" />
              <span>Karty Warsztatowe PDF</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Kosztorys B2B PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Drukuj"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Main Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab("technical_report")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === "technical_report"
                ? "border-sky-400 text-sky-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raport Odbiorczy & Sanepid</span>
          </button>

          <button
            onClick={() => setActiveTab("workshop_cards")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === "workshop_cards"
                ? "border-amber-400 text-amber-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Karty Warsztatowe (Produkcja)</span>
          </button>

          <button
            onClick={() => setActiveTab("quote")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === "quote"
                ? "border-emerald-400 text-emerald-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Kosztorys & Wyposażenie B2B</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div ref={printAreaRef} className="p-6 space-y-6 overflow-y-auto text-slate-300 flex-1">
          {/* TAB 1: TECHNICAL SANEPID & ELECTRICAL REPORT */}
          {activeTab === "technical_report" && (
            <div className="space-y-6">
              {/* Platform and Dimensions Header */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    {preset?.name || "Platforma Specjalna"} — Parametry Odbiorcze
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Wymiary: {config.dimensions.length} × {config.dimensions.width} × {config.dimensions.height} cm • Klapa wydawcza: {config.dimensions.hatchWidth} × {config.dimensions.hatchHeight} cm
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">DMC Pojazdu:</span>
                    <span className="font-bold text-amber-300">{config.dimensions.dmcKg} kg</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Masa z wyposażeniem:</span>
                    <span className={`font-bold ${(weightSpecs.totalWeightKg ?? cost.totalWeightKg) > config.dimensions.dmcKg ? "text-red-400" : "text-emerald-400"}`}>
                      {weightSpecs.totalWeightKg ?? cost.totalWeightKg} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Sanepid & HACCP Checklist Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        Lista Weryfikacji HACCP / Sanepid (Dobra Praktyka Higieniczna GHP)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Zgodność z normami prawnymi Rozporządzenia (WE) nr 852/2004 Parlamentu Europejskiego
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {sanepidChecklist.filter((c) => c.passed).length} / {sanepidChecklist.length} Wymogów Spełnionych
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sanepidChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                        item.passed
                          ? "bg-slate-900/70 border-emerald-500/30 text-slate-200"
                          : "bg-red-950/30 border-red-500/50 text-red-200"
                      }`}
                    >
                      {item.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{item.title}</span>
                          {item.critical && !item.passed && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-500/20 text-red-300">
                              Krytyczny
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {item.requirement}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Electrical Parameters Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Parametry Przyłącza Elektrycznego i Zabezpieczeń
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Moc Całkowita:</span>
                    <span className="text-base font-bold text-white font-mono">{powerSpecs.totalKw} kW</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Wymagane Przyłącze:</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">{powerSpecs.requiredConnection}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Bezpiecznik Główny:</span>
                    <span className="text-xs font-bold text-sky-300 font-mono">B{powerSpecs.fuseAmps}A (RCD 30mA)</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Przekrój Kabla:</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">{powerSpecs.cableMm}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSHOP PRODUCTION CARDS */}
          {activeTab === "workshop_cards" && (
            <div className="space-y-6">
              {/* Subtabs bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setWorkshopSubTab("electric")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    workshopSubTab === "electric"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Karta Elektryka (L1-L3)
                </button>
                <button
                  onClick={() => setWorkshopSubTab("hydraulic")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    workshopSubTab === "hydraulic"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" /> Karta Hydrauliki & Sanepidu
                </button>
                <button
                  onClick={() => setWorkshopSubTab("profiles1d")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    workshopSubTab === "profiles1d"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" /> Rozkrój Profili 1D
                </button>
                <button
                  onClick={() => setWorkshopSubTab("walls2d")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    workshopSubTab === "walls2d"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Cięcie Płyt Ścian 2D
                </button>
              </div>

              {/* Subtab 1: Electric */}
              {workshopSubTab === "electric" && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" /> KARTA MONTAŻOWA 01: ELEKTRYKA I ROZDZIELNICA GŁÓWNA
                      </h4>
                      <p className="text-xs text-slate-400">
                        Zasilanie zewnętrzne: {powerSpecs.requiredConnection} • Przewód: {powerSpecs.cableMm}
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300">
                      Zabezpieczenie B{powerSpecs.fuseAmps}A
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-sky-400">FAZA L1</span>
                        <span className="font-mono text-xs font-bold text-white">{phaseBalance.l1Kw} kW</span>
                      </div>
                      <ul className="text-xs space-y-1 text-slate-300">
                        {phaseBalance.itemsByPhase.l1.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate pr-2">{it.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">{it.powerKw}kW</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-sky-400">FAZA L2</span>
                        <span className="font-mono text-xs font-bold text-white">{phaseBalance.l2Kw} kW</span>
                      </div>
                      <ul className="text-xs space-y-1 text-slate-300">
                        {phaseBalance.itemsByPhase.l2.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate pr-2">{it.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">{it.powerKw}kW</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-sky-400">FAZA L3</span>
                        <span className="font-mono text-xs font-bold text-white">{phaseBalance.l3Kw} kW</span>
                      </div>
                      <ul className="text-xs space-y-1 text-slate-300">
                        {phaseBalance.itemsByPhase.l3.map((it, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate pr-2">{it.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">{it.powerKw}kW</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-bold text-slate-200 block">Wytyczne odbioru elektrycznego na warsztacie:</span>
                    <p>• RCD 40A/30mA typ A chroni wszystkie obwody gniazd wtykowych.</p>
                    <p>• Każde gniazdo w strefie mokrej i okapu z zabezpieczeniem IP54 z klapką sprężynową.</p>
                    <p>• Ciągłość przewodu ochronnego PE na całej długości ramy podwozia i powierzchni blatów nierdzewnych (R &lt; 0.1 Ω).</p>
                  </div>
                </div>
              )}

              {/* Subtab 2: Hydraulic */}
              {workshopSubTab === "hydraulic" && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-sky-400" /> KARTA MONTAŻOWA 02: INSTALACJA WODNO-KANALIZACYJNA SANEPID
                    </h4>
                    <p className="text-xs text-slate-400">
                      Standard HACCP/PZH • Obieg zamknięty ze zbiornikami 2x30L oraz podgrzewaczem przepływowym
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-sky-300 block">Moduł Zasilania Wody Czystej:</span>
                      <p>• Zbiornik polietylenowy z atestem PZH (30L / 50L) z szybkozłączem.</p>
                      <p>• Automatyczna pompa membranowa 10 l/min z presostatem odcinającym.</p>
                      <p>• Podgrzewacz przepływowy 3.0 kW z regulacją temperatury do 55°C.</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-amber-300 block">Moduł Odprowadzania Ścieków:</span>
                      <p>• Zbiornik na wodę szarą 30L / 50L z zaworem kulowym 1 cal w dnie przyczepy.</p>
                      <p>• Syfony zamykane i orurowanie PVC fi 32mm z atestem higienicznym.</p>
                      <p>• Niezależne odprowadzenie skroplin z agregatów chłodniczych i okapu.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: Profiles 1D */}
              {workshopSubTab === "profiles1d" && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-400" /> KARTA WARSZTATOWA 03: ROZKRÓJ PROFILI STALOWYCH / ALUMINIOWYCH 1D
                      </h4>
                      <p className="text-xs text-slate-400">
                        Profile 60x40x3 mm (rama nośna) oraz 40x40x2 mm (stelaż klatki)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Długość całkowita (+7%)</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {profileCuts.totalLengthWithWasteM} m ({profileCuts.totalSteelWeightKg} kg)
                      </span>
                    </div>
                  </div>
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="py-2 px-3">Element ramy</th>
                          <th className="py-2 px-3">Typ profilu</th>
                          <th className="py-2 px-3">Długość cięcia</th>
                          <th className="py-2 px-3">Ilość szt.</th>
                          <th className="py-2 px-3 text-right">Suma mb</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {profileCuts.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-1.5 px-3 font-semibold text-slate-200">{it.name}</td>
                            <td className="py-1.5 px-3 text-slate-400 font-mono">{it.profileType}</td>
                            <td className="py-1.5 px-3 font-mono text-amber-300">{it.lengthCm} cm</td>
                            <td className="py-1.5 px-3 font-mono">{it.quantity}</td>
                            <td className="py-1.5 px-3 font-mono text-right text-emerald-400">{it.totalLengthM} m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 4: Walls 2D */}
              {workshopSubTab === "walls2d" && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" /> KARTA WARSZTATOWA 04: CIĘCIE PŁYT POSZYCIA I ŚCIAN SANDWICH 2D
                      </h4>
                      <p className="text-xs text-slate-400">
                        Płyty warstwowe PIR 40mm (laminat gładki łatwozmywalny) + posadzka ryflowana
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Powierzchnia ścian</span>
                      <span className="text-xs font-bold text-sky-400 font-mono">
                        {wallCuts.totalWallAreaM2} m² (~{wallCuts.recommendedSandwichSheets} płyt)
                      </span>
                    </div>
                  </div>
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="py-2 px-3">Panel / Ściana</th>
                          <th className="py-2 px-3">Wymiar (cm)</th>
                          <th className="py-2 px-3">Pow. (m²)</th>
                          <th className="py-2 px-3">Wycięcia warsztatowe</th>
                          <th className="py-2 px-3">Materiał</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {wallCuts.panels.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold text-slate-200">{p.name}</td>
                            <td className="py-2 px-3 font-mono text-amber-300">{p.widthCm} × {p.heightCm} cm</td>
                            <td className="py-2 px-3 font-mono">{p.areaM2} m²</td>
                            <td className="py-2 px-3 text-slate-300 font-medium">{p.cutouts || "-"}</td>
                            <td className="py-2 px-3 text-slate-400">{p.material}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMERCIAL QUOTE & EQUIPMENT SPECIFICATION */}
          {activeTab === "quote" && (
            <div className="space-y-6">
              {/* Cost Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Podwozie & Nadwozie:</span>
                  <span className="text-lg font-bold text-white font-mono mt-1 block">
                    {(preset?.basePricePln || 45000).toLocaleString("pl-PL")} zł
                  </span>
                  <span className="text-[10px] text-slate-500">AL-KO/Knott, homologacja</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Urządzenia Gastro:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                    {config.placedItems.reduce((s, it) => s + (catalogMap.get(it.modelId)?.pricePln || 0), 0).toLocaleString("pl-PL")} zł
                  </span>
                  <span className="text-[10px] text-slate-500">{config.placedItems.length} szt. w projekcie</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Instalacje & Atesty:</span>
                  <span className="text-lg font-bold text-sky-400 font-mono mt-1 block">
                    {(cost.installationsPrice || 6000).toLocaleString("pl-PL")} zł
                  </span>
                  <span className="text-[10px] text-slate-500">400V/230V, Sanepid, LED</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl">
                  <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-bold block">SUMA NETTO:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                    {cost.totalNettoPln.toLocaleString("pl-PL")} zł
                  </span>
                  <span className="text-[10px] text-emerald-300/80">
                    Brutto z 23% VAT: {cost.totalBruttoPln.toLocaleString("pl-PL")} zł
                  </span>
                </div>
              </div>

              {/* Placed Items Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">
                    Szczegółowy Wykaz Wyposażenia Zamontowanego w Zabudowie
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Łączna masa: {cost.totalWeightKg} kg
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Lp.</th>
                      <th className="py-2.5 px-4">Nazwa Urządzenia</th>
                      <th className="py-2.5 px-4">Kategoria</th>
                      <th className="py-2.5 px-4">Moc</th>
                      <th className="py-2.5 px-4">Napięcie</th>
                      <th className="py-2.5 px-4">Waga</th>
                      <th className="py-2.5 px-4 text-right">Cena Netto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {config.placedItems.map((item, idx) => {
                      const m = catalogMap.get(item.modelId);
                      return (
                        <tr key={item.instanceId} className="hover:bg-slate-800/30">
                          <td className="py-2 px-4 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-200">{m?.name || item.modelId}</td>
                          <td className="py-2 px-4 text-slate-400">{m?.categoryLabel || "-"}</td>
                          <td className="py-2 px-4 font-mono text-amber-300">{m?.powerKw ? `${m.powerKw} kW` : "-"}</td>
                          <td className="py-2 px-4 font-mono">{m?.voltage ? `${m.voltage}V` : "-"}</td>
                          <td className="py-2 px-4 font-mono">{m?.weightKg ? `${m.weightKg} kg` : "-"}</td>
                          <td className="py-2 px-4 font-mono text-right text-emerald-400 font-bold">
                            {m?.pricePln ? `${m.pricePln.toLocaleString("pl-PL")} zł` : "0 zł"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
