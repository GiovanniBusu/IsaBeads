# IsaBeads

Application web gratuite pour gérer un stock de perles **Miyuki Delica**,
consulter un catalogue de couleurs et de revendeurs, et créer des recettes de
projets (bracelets, colliers, boucles…) réutilisables.

- 100% gratuit, aucun serveur ni hébergement payant nécessaire
- Fonctionne hors-ligne, installable sur l'écran d'accueil du téléphone (PWA)
- Toutes les données restent **sur votre appareil** (IndexedDB) — export/import JSON pour sauvegarder ou changer de téléphone

## Démarrage

```bash
npm install
npm run dev       # serveur de développement (http://localhost:5173)
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build de production
npm run lint      # vérifie le code (oxlint)
```

Le build de production (`dist/`) est un site 100% statique : il peut être
déposé gratuitement sur n'importe quel hébergement statique (GitHub Pages,
Netlify, Cloudflare Pages, Vercel…) sans base de données ni backend.

## Installer sur smartphone (PWA)

1. Ouvrez l'application déployée dans le navigateur du téléphone (Chrome sur
   Android, Safari sur iOS).
2. Android/Chrome : menu ⋮ → "Ajouter à l'écran d'accueil" / "Installer
   l'application".
3. iOS/Safari : bouton Partager → "Sur l'écran d'accueil".
4. L'app s'ouvre ensuite en plein écran comme une app native et fonctionne
   hors connexion (les données restent stockées localement).

## Fonctionnalités

### 📦 Mon stock (inventaire)

- Référence Miyuki (code DB normalisé sur 4 chiffres, ex. `DB0010`), nom de
  couleur, taille, finition, fournisseur, lien produit, seuil d'alerte.
- Historique d'achats cumulable : chaque réapprovisionnement s'ajoute sans
  écraser l'historique ; le stock restant est recalculé automatiquement
  (grammes achetés − grammes consommés par les projets réalisés).
- Recherche, filtre par taille, tri (couleur / taille / stock restant),
  bascule "stock bas uniquement" (seuil configurable dans Réglages).

### 🎨 Catalogue Delica + revendeurs

- Recherche/filtre par couleur, taille et finition dans un référentiel de
  couleurs embarqué (voir plus bas pour l'importer/le mettre à jour).
- Fiche couleur → liste des revendeurs qui livrent en Suisse, avec lien
  direct vers leur site (les prix ne sont **pas** stockés localement car ils
  changent trop souvent — vérifiez toujours sur le site du revendeur).
- Bouton **"Ajouter à mon inventaire"** qui pré-remplit une nouvelle
  référence de stock avec le code/couleur/taille/finition.
- Page **Revendeurs** (depuis Catalogue → "Revendeurs") pré-remplie avec :
  Perles & Co, Perline Beads, i-Perlen.ch, Pandahall, Perlerie Nice —
  entièrement modifiable/complétable dans l'app (ajout, modification,
  suppression).

> ⚠️ Le catalogue livré avec l'app (`src/data/seed/miyukiDelicaCatalog.seed.json`)
> est un **jeu d'exemple** pour démontrer l'interface. Les codes/noms ne sont
> pas garantis conformes au référentiel officiel Miyuki. Importez la vraie
> charte de couleurs via le script décrit ci-dessous.

### 📿 Projets (recettes réutilisables)

- Nom, description, photo (optionnelle, redimensionnée et stockée
  localement), longueur de référence (cm), liste de perles nécessaires
  (par référence + taille, en **grammes ou en nombre de perles**).
- Table de conversion grammes ↔ perles par taille (réglable dans
  Réglages, car le poids réel varie selon les lots).
- **"Refaire ce projet"** : indiquez une nouvelle longueur (ex. 20 cm au lieu
  de 18) → les quantités sont recalculées proportionnellement et comparées
  au stock actuel (besoin / disponible / manque, en rouge si insuffisant).
- **"Valider la réalisation"** déduit automatiquement les grammes utilisés
  du stock et garde un historique des réalisations du projet.

### 💾 Sauvegarde (Réglages)

- **Exporter toutes mes données** → télécharge un fichier JSON complet
  (stock + historique d'achats, catalogue, revendeurs, projets et
  réalisations, réglages).
- **Importer une sauvegarde** → restaure ce fichier (remplace les données
  actuelles ; utile pour changer de téléphone ou faire une copie de
  secours régulière).

## Importer/mettre à jour le référentiel de couleurs Miyuki Delica

Le vrai catalogue Miyuki évolue (nouvelles couleurs). Plutôt que de dépendre
d'un scraping fragile d'un site revendeur, l'app charge un fichier JSON
embarqué généré depuis un **CSV** que vous fournissez (ex. exporté depuis une
charte officielle par tranches de 100 codes, ou un inventaire consolidé).

```bash
node scripts/import-catalog.mjs chemin/vers/charte.csv
# ou en fusionnant plusieurs fichiers (une charte par taille, par exemple) :
node scripts/import-catalog.mjs charte-11-0.csv charte-15-0.csv charte-8-0.csv
```

Colonnes attendues dans le CSV (en-têtes insensibles à la casse, ordre libre,
alias FR/EN acceptés) :

| Colonne     | Alias acceptés                          | Exemple           |
| ----------- | ---------------------------------------- | ----------------- |
| `dbCode`    | `code`, `db`, `référence`               | `DB10`, `DBS 7`   |
| `colorName` | `color`, `nom`, `couleur`                | `Noir opaque`     |
| `size`      | `taille` *(optionnel, déduit du préfixe)*| `11/0`            |
| `finish`    | `finition` *(optionnel)*                 | `Opaque`, `AB`…   |

Le script :

- normalise chaque code sur 4 chiffres après le préfixe (`DB1` → `DB0001`,
  `DBM7` → `DBM0007`) ;
- déduit la taille depuis le préfixe si la colonne `size` est absente
  (`DBS`=15/0, `DB`=11/0, `DBM`=10/0, `DBL`=8/0) ;
- fusionne/dédoublonne par paire (code, taille) si plusieurs fichiers sont
  passés ;
- écrit le résultat dans `src/data/seed/miyukiDelicaCatalog.seed.json`,
  chargé par l'app au premier lancement (tant que la table catalogue est
  vide côté appareil).

Un CSV d'exemple est fourni dans `scripts/sample-catalog.csv` pour tester la
commande. Relancez le script à chaque nouvelle sortie de couleurs Miyuki,
committez le JSON généré, puis redéployez l'app.

## Architecture

```
src/
  data/
    types.ts                 # modèles de domaine (perle, achat, projet…)
    db.ts                    # schéma Dexie (IndexedDB)
    seedLoader.ts             # peuple catalogue + revendeurs au 1er lancement
    seed/                     # JSON embarqués (catalogue, revendeurs)
    repositories/
      types.ts                # interfaces d'accès aux données (repository pattern)
      dexie*.ts                # implémentations 100% locales (IndexedDB)
      localRepositories.ts     # bundle d'implémentations locales
    RepositoriesContext.tsx    # React context, permet de brancher un autre backend plus tard
  features/
    inventory/                # Mon stock
    catalog/                  # Catalogue + revendeurs
    projects/                 # Recettes de projets
    settings/                 # Réglages, export/import
  components/
    layout/                   # AppShell, navigation basse
    ui/                       # Button, Card, Field, Modal, EmptyState…
scripts/
  import-catalog.mjs          # script d'import CSV -> JSON catalogue
```

### Pourquoi le "repository pattern" ?

Tous les écrans passent par les interfaces de `src/data/repositories/types.ts`
(`InventoryRepository`, `CatalogRepository`, `ProjectRepository`…), fournies
via `RepositoriesContext`. L'implémentation actuelle (`localRepositories.ts`)
est 100% IndexedDB/Dexie. Pour ajouter plus tard une synchronisation
multi-appareils (ex. Supabase, offre gratuite, avec login email), il suffit
d'écrire un nouveau bundle respectant les mêmes interfaces et de le fournir à
`<RepositoriesProvider repositories={...}>` — sans réécrire les écrans.

## Limites connues

- Les taux de conversion grammes ↔ perles sont des **estimations**
  (modifiables dans Réglages) : le poids réel varie selon les lots Miyuki.
- Les prix des revendeurs ne sont jamais stockés localement (ils changent
  trop souvent) — seul un lien direct vers le site est fourni.
- La sauvegarde/restauration est manuelle (fichier JSON) : il n'y a pas
  (encore) de synchronisation automatique entre appareils.
