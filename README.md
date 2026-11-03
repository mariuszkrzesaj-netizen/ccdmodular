# PRO-FOODTRUCK BUILDER – Inteligentny Konfigurator i Generator Produkcyjny B2B

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

> **Uniwersalny generator technologiczny i system konfiguracji 3D / 2D CAD zabudowy przyczep gastronomicznych i food trucków dla fabryk i producentów (DEMO B2B).**  
> Zgodny z normami **Sanepid / HACCP / GHP**, przepisami drogowymi (DMC / kategorie prawa jazdy), rozkrojem profili 1D i płyt 2D oraz kartami warsztatowymi.

---

## 🌐 Demo na żywo

👉 **[Uruchom aplikację online](https://ais-pre-k6cdiin52ztxvne5ymouir-97378884096.europe-west3.run.app)**

---

## ✨ Główne funkcje systemu

### 1. Interaktywny model 3D (Three.js)
- Podwozia AL-KO / Knott (1- lub 2-osiowe tandem z dyszlem trójkątnym i kołem manewrowym) w 4 klasach długości: S (3,5 m), M (4,2 m), L (5,0 m), XL (5,5 m).
- Otwierana klapa sprzedażowa ze wspomaganiem siłownikami gazowymi i tablicą menu.
- Tryby przekrojów: pełna przyczepa, zdjęcie dachu (*Roof-Off*) oraz transparentne ściany (*X-Ray*).
- Zmiana kolorystyki poszycia z palety lakierów RAL.
- Emblemat modułowy z polem na logo producenta `[ TWOJE LOGO ]`.
- 4 perspektywy kamery: Izometria, Klient (okno wydawcze), Wnętrze technologiczne, Rzut z góry.

### 2. Rzut architektoniczny 2D (Floor Planner CAD)
- Skalowana siatka milimetrowa/centymetrowa z dokładnym pozycjonowaniem i obrotem modułów o 90°.
- **Wizualny wskaźnik ścieżki sanitarnej (Dirty-to-Clean)**: wektory przepływu od dostaw surowców przez zmywalnię, obróbkę termiczną, składanie dań po wydawkę.
- **Wykrywanie kolizji HACCP**: automatyczny alert i oznaczenie zakażenia krzyżowego w przypadku umieszczenia zlewu w linii lady wydawczej klienta.

### 3. Karty Warsztatowe i Rozkrój Technologiczny Produkcji
- **Karta 01: Elektryka i Bilans Faz L1-L3**: podział odbiorników na poszczególne fazy, dobór bezpieczników B16A–B63A i RCD 30mA, przekrój kabla H07RN-F.
- **Karta 02: Instalacja Wodno-Kanalizacyjna**: obieg wody czystej i szarej 2x30L/50L, pompa ciśnieniowa, podgrzewacz przepływowy.
- **Karta 03: Rozkrój Profili Stalowych 1D**: lista cięcia profili ramy nośnej (60x40x3 mm) i klatki nadwozia (40x40x2 mm) z naddatkiem +7% na odpady.
- **Karta 04: Cięcie Płyt Ściennych PIR 2D**: zestawienie płyt warstwowych 40mm ścian, dachu i podłogi wraz z wycięciami pod klapę, okap i drzwi.

### 4. Eksport 3D do formatów STL & GLTF / GLB
- **Format STL (`.stl`)**: gotowy do pocięcia w slicerach 3D (**Bambu Studio, PrusaSlicer, Cura**) do wydruku makiety fizycznej w skali 1:50 lub 1:25.
- **Format GLTF / GLB (`.glb`)**: zawiera geometrię i materiały dla oprogramowania inżynierskiego CAD (**Autodesk Fusion 360, SolidWorks, Blender, SketchUp**).

### 5. Oficjalne Raporty i Dokumentacja Techniczna PDF
- **Raport Techniczny PDF (Sanepid & Elektryka)**: pełna specyfikacja zamontowanego wyposażenia, bilans mocy (kW), lista kontrolna HACCP oraz pola na podpisy i pieczęcie odbiorcze.
- **Karty Warsztatowe PDF (Rozkrój 1D/2D)**: 4-stronicowy komplet dokumentacji montażowo-warsztatowej do druku na hali produkcyjnej.
- **Kosztorys B2B PDF**: zestawienie cenowe podwozia, zabudowy nierdzewnej AISI 304 i urządzeń pod leasing lub kredyt bankowy.

---

## 🛠️ Uruchomienie lokalne (Development)

Wymagane środowisko: **Node.js 18+** oraz **npm** (lub pnpm / yarn).

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/TWOJA_NAZWA/pro-foodtruck-builder.git
cd pro-foodtruck-builder

# 2. Zainstaluj zależności
npm install

# 3. Uruchom serwer deweloperski
npm run dev
```

Aplikacja otworzy się pod adresem: `http://localhost:3000`

---

## 📦 Budowanie wersji produkcyjnej

```bash
npm run build
```

---

## 📄 Licencja

Projekt udostępniony na licencji **Apache-2.0**.
