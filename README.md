# 🇨🇲 GEO-Front — Géoportail Cameroun

> Interface cartographique de visualisation des données agricoles, d'élevage et de pêche au Cameroun.

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Données Disponibles](#-données-disponibles)
- [Fonctionnalités Actuelles](#-fonctionnalités-actuelles)
- [Fonctionnalités Planifiées](#-fonctionnalités-planifiées)
- [Architecture Technique](#-architecture-technique)
- [Installation & Développement](#-installation--développement)
- [Contribution](#-contribution)

---

## Vue d'ensemble

**GEO-Front** est un géoportail web moderne permettant de visualiser et analyser les données de production agricole, d'élevage et de pêche du Cameroun. L'application offre deux modes de visualisation :

1. **Vue Carte** : Analyse thématique choroplèthe sur fond de carte interactif
2. **Vue Tabulaire** : Matrice pivot avec données croisées années/zones

### Stack Technique

- **Frontend** : React 18 + TypeScript + Vite
- **Cartographie** : React-Leaflet + Leaflet
- **Styles** : Tailwind CSS 4.x (dark mode natif)
- **Animations** : Framer Motion

---

## 📊 Données Disponibles

### Matrice de Disponibilité

| Secteur         | Granularité       | Années      | Source       | État            |
| --------------- | ----------------- | ----------- | ------------ | --------------- |
| **Agriculture** | Département       | 1998 - 2022 | MINADER/DESA | ✅ Complet      |
| **Élevage**     | National          | 2015 - 2021 | MINEPIA      | ✅ Complet      |
| **Élevage**     | Régional          | 2020 - 2021 | MINEPIA      | ⚠️ Partiel      |
| **Élevage**     | Département       | -           | -            | ❌ Indisponible |
| **Pêche**       | National          | 2021        | MINEPIA      | ✅ Complet      |
| **Pêche**       | Régional (Infra.) | 2021        | MINEPIA      | ✅ Complet      |
| **Pêche**       | Département       | 2021        | MINEPIA      | ✅ Complet      |

### Filières Couvertes

**Agriculture (23 cultures)** :
Maïs, Manioc, Cacao, Café, Banane Plantain, Sorgho, Riz, Haricot, Arachide, Igname, Patate douce, Pomme de terre, Coton, Hévéa, Palmier à huile, Agrumes, Tomate, Oignon, Ail, Piment, Gombo, Ananas, Avocat

**Élevage (5 espèces)** :
Bovins, Ovins, Caprins, Porcins, Volailles

**Pêche (4 types + 6 infrastructures)** :

- Types : Pêche Artisanale Maritime, Pêche Continentale, Pêche Industrielle, Pisciculture
- Infrastructures : Débarcadères, Halls de vente, Fumoirs, Étangs actifs, Cages, Bacs

### Règles d'Affichage des Valeurs

| État de la donnée      | Affichage UI    | Couleur Carte             |
| ---------------------- | --------------- | ------------------------- |
| `null` (non collectée) | "Indisponible"  | Gris + bordure pointillée |
| `0` (zéro production)  | "0"             | Blanc/gris clair          |
| `> 0` (valeur)         | Valeur formatée | Gradient jaune → vert     |

---

## ✅ Fonctionnalités Actuelles

### Interface Générale

- [x] Responsive mobile-first (dock transformé en sheet overlay)
- [x] Thème sombre "True Black" (#000000)
- [x] Persistance localStorage (thème, basemap)
- [x] Animations fluides (Framer Motion)

### Sidebar / Panneau de Contrôle

- [x] Sélection du secteur (Agriculture / Élevage / Pêche)
- [x] Sélection du niveau administratif (Région / Département / Arrondissement)
- [x] Liste filtrée des filières avec recherche
- [x] Fermeture au clic extérieur (comportement modal)

### Vue Carte

- [x] 5 fonds de carte (Clair, Sombre, Satellite, Terrain, OSM)
- [x] Synchronisation basemap ↔ thème sombre
- [x] Choroplèthe dynamique basé sur les données
- [x] Panneau info au survol (région, valeur, année)
- [x] Légende de couleurs adaptative
- [x] Zoom control repositionné

### Vue Tabulaire

- [x] Pivot table (années en lignes OU départements en lignes)
- [x] Sélecteur de région avec dropdown élégant
- [x] Affichage différencié null / 0 / valeur
- [x] Tendances (↑ / ↓) basées sur l'année précédente
- [x] En-têtes et colonnes sticky

---

## 🔜 Fonctionnalités Planifiées

### Carte (Priorité Haute)

- [ ] **Propagation niveau admin** : Régions OU Départements selon sélection
- [ ] **Couche limites seule** : Afficher les frontières sans données (élégant)
- [ ] **Layer Control** : Superposition couches analyse + limites
- [ ] **Outils Leaflet** : Mesure distance, plein écran, impression
- [ ] **Zoom to extent** : Focus sur région sélectionnée
- [ ] **Animations de transition** : Smooth entre changements d'année

### Données (Priorité Haute)

- [ ] **Intégration GeoServer** : Connexion aux couches WMS/WFS
- [ ] **Fichiers GeoJSON réels** : Départements du Cameroun
- [ ] **API Backend** : Remplacement des données mock

### UX (Priorité Moyenne)

- [ ] **Export CSV** : Téléchargement des données tabulaires
- [ ] **Comparaison temporelle** : Sélection multi-années
- [ ] **Graphiques inline** : Mini-charts dans le panneau info
- [ ] **Tutoriel onboarding** : Guide utilisateur première visite

---

## 🏗️ Architecture Technique

### Structure des Dossiers

```
frontend/src/
├── main.tsx              # Point d'entrée React
├── App.tsx               # Routes et wrapper
├── index.css             # Tailwind + styles globaux
├── pages/
│   ├── Geoportal.tsx     # Vue principale (carte + contrôles)
│   ├── TabularView.tsx   # Vue tableau pivot
│   └── LandingPage.tsx   # Page d'accueil
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx   # Dock + panneau latéral
│   └── map/
│       └── MapContainer.tsx  # Composant Leaflet
├── data/
│   └── mockData.ts       # Générateur de données fictives
└── utils/
    └── dataProcessor.ts  # Fonctions de traitement
```

### Flux de Données

```
Sidebar (sélection)
    ↓
Geoportal.tsx (état global)
    ↓
├── MapContainer (choroplèthe)
└── TabularView (tableau pivot)
```

### Variables localStorage

| Clé                         | Valeurs                                            | Usage                           |
| --------------------------- | -------------------------------------------------- | ------------------------------- |
| `fox_theme`                 | `light` / `dark`                                   | Thème couleur                   |
| `fox_basemap`               | `light` / `dark` / `satellite` / `terrain` / `osm` | Fond de carte                   |
| `fox_basemap_user_override` | `true` / absent                                    | Empêche sync auto thème↔basemap |

---

## 🛠️ Installation & Développement

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
cd frontend
npm install
```

### Développement

```bash
npm run dev
```

Ouvre http://localhost:5173

### Build Production

```bash
npm run build
```

### Déploiement

Fichiers de config inclus :

- `vercel.json` : Fallback SPA pour Vercel
- `public/_redirects` : Fallback pour Netlify

---

## 🤝 Contribution

### Guidelines

1. **Mobile-first** : Tester sur petits écrans
2. **Dark mode** : Vérifier les deux thèmes
3. **Accessibilité** : Tailles tactiles min 44px
4. **Performance** : Éviter re-renders inutiles (`useMemo`, `useCallback`)

### Bonnes Pratiques CSS

- Préserver `@custom-variant dark` en tête de `index.css`
- Utiliser les classes utilitaires existantes (`.glass`, `.glass-panel`)
- Respecter la nomenclature Tailwind

### Problèmes Connus

- Bundles JS volumineuses (> 500kb) — code-splitting recommandé
- Linter CSS signale `@apply` / `@theme` comme inconnus (faux positifs Tailwind 4)

---

## 📞 Contact

- **Repository** : [GitHub - geo-front](https://github.com/Tiger-Foxx/geo-front)
- **Équipe** : FOX Mapping Team

---

_Documentation mise à jour : Janvier 2026_
