# JILD

Réseau social communautaire pensé pour les artistes musicaux : chaque profil peut partager des morceaux, des playlists et échanger avec sa communauté.

## Aperçu

- **Accueil** — fil d'actualité avec posts, likes, lecteur de musique intégré
- **Musique** — bibliothèque personnelle, activités, morceaux enregistrés, artistes similaires
- **Profil** — vue publique et vue personnelle (modifier le profil, stats)
- **Messages** — liste de conversations + messagerie instantanée

## Stack

Site 100% statique — HTML / CSS / JavaScript vanilla, aucune dépendance ni build à installer.

- `index.html` — l'application (structure, styles, logique)
- `manifest.json` — configuration PWA (nom, icônes, couleurs)
- `sw.js` — service worker (cache offline, installabilité)
- `icon-192.png`, `icon-512.png` — icônes de l'application

## Lancer en local

Aucune installation nécessaire. Deux options :

```bash
# Option 1 — Python
python3 -m http.server 8000

# Option 2 — Node
npx serve .
```

Puis ouvrir `http://localhost:8000` dans le navigateur.

## Héberger sur GitHub Pages

1. Créer un dépôt GitHub et y pousser ce dossier.
2. Aller dans **Settings → Pages**.
3. Dans **Source**, choisir la branche `main` et le dossier `/ (root)`.
4. Sauvegarder — le site sera disponible sous `https://<ton-user>.github.io/<nom-du-repo>/`.

> Le PWA (installation sur l'écran d'accueil) fonctionne uniquement en HTTPS — GitHub Pages sert le site en HTTPS par défaut, donc pas de config supplémentaire à faire.

## État actuel

Ceci est un prototype front-end : les données (posts, messages, likes) sont en mémoire et se réinitialisent au rechargement de la page. Pas encore de comptes utilisateurs ni de stockage persistant — prochaine étape si le projet avance.

## Licence

Tous droits réservés — projet personnel.
