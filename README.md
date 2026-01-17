# GEO-Front — Frontend

Résumé complet du projet frontend (état actuel)

## Vue d'ensemble
- Projet: application web de webmapping (Geoportal) orientée données agricoles et territoriales.
- Stack principal: React + Vite + TypeScript + Tailwind CSS 4.x.
- Objectif: interface cartographique avec panneau latéral, sélecteurs de couches, vue tabulaire et contrôles thématiques.

## Structure importante (dossier `frontend/src`)
- `main.tsx` — point d'entrée React.
- `App.tsx` — wrapper d'application et routes.
- `pages/`
  - `Geoportal.tsx` — vue principale carte + contrôles flottants, basemap, légende.
  - `LandingPage.tsx` — page d'accueil responsive.
  - `TabularView.tsx` — matrice/tabulaire (pivot table) interactive.
- `components/`
  - `layout/Sidebar.tsx` — dock utilitaire et panneau latéral (mobile + desktop).
  - `map/MapContainer.tsx` — wrapper Leaflet, TileLayer, couches, popups.
- `data/mockData.ts` — données de démonstration générées.
- `utils/dataProcessor.ts` — helpers de traitement.
- `index.css` — Tailwind + variantes custom (dark variant), styles globaux et scrollbar.

## Comportement et décisions techniques clés

- Thème sombre "True Black":
  - `index.css` contient `@custom-variant dark (&:where(.dark, .dark *));` pour Tailwind 4.
  - Les couleurs sombres utilisent `black` et `neutral-950/900` pour obtenir un noir véritable (#000 / #050505 selon contexte).
  - Thème persisté via `localStorage` key `fox_theme` (valeurs `light` / `dark`).

- Basemap auto-sync et override:
  - Basemap stocké dans `localStorage` sous `fox_basemap`.
  - Si l'utilisateur change manuellement la basemap, on inscrit `fox_basemap_user_override=true` pour éviter les overrides automatiques lors du changement de thème.

- Scrollbar:
  - Les scrollbars des panneaux sont fines et discrètes par défaut (transparentes), visibles au survol (pour rester minimalistes tout en restant utilisables).
  - Classe utilitaire: `.custom-scrollbar` dans `index.css`.

- Réactivité / Mobile:
  - Sidebar: hamburger visible sur mobile; panneau latéral transformé en sheet overlay.
  - Widgets (recherche, date, basemap) repositionnés pour éviter chevauchement sur petits écrans.
  - Légende masquée sur mobile pour gagner de l'espace.

- Accessibilité / UX:
  - Taille tactile améliorée pour les contrôles sur mobile.
  - Scrollbars accessibles au survol / interaction tactile.

## Composants principaux (résumé rapide)

- `Sidebar.tsx`:
  - Dock d'icônes (vue, thématiques) + panneau de contenu. Gère l'état `isMobileSidebarOpen` et `activePanel`.
  - Actions: `onViewChange`, `onThemeChange`, `onTogglePanel`.

- `MapContainer.tsx`:
  - Intègre `react-leaflet` et `TileLayer` selon `basemap`.
  - Écoute l'événement global `theme-change` pour resynchroniser la basemap si aucun override utilisateur.

- `TabularView.tsx`:
  - Vue pivot/tableau avec barre d'outils, sélection de région, sélection de produit et table scrollable.
  - En-têtes collants (`sticky`) et colonne gauche fixe.

## Déploiement
- Fichiers de config: `vercel.json` et `public/_redirects` fournis pour fallback SPA (routes client-side).

## Scripts utiles
Depuis `frontend`:

```bash
npm install
npm run dev    # développement
npm run build  # build de production
``` 

`npm run build` lance `tsc -b` puis `vite build`.

## Bonnes pratiques pour contribution
- Respecter l'approche mobile-first et garder les utilitaires Tailwind.
- Préserver la variable `fox_basemap_user_override` pour éviter de perturber le choix utilisateur.
- Quand vous modifiez `index.css`, veillez à conserver `@custom-variant dark` en tête.

## Problèmes connus & améliorations suggérées
- Certaines bundles JS sont volumineuses (>500kb); envisager du code-splitting dynamique.
- Test réel sur appareils mobiles (iOS/Android) recommandé pour valider interactions tactiles.
- Ajouter tests unitaires pour `dataProcessor` et composants critiques.

## Contact & suivi
- Repo distant: `https://github.com/Tiger-Foxx/geo-front` (pushs récents effectués depuis `frontend`).
- Pour une map précise des composants: lisez les fichiers dans `src/components` et `src/pages`.

---

Fichier généré automatiquement par un assistant — décrit l'état actuel du frontend au moment de la création.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
