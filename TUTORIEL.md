# TriPatient — Tutoriel de déploiement Vercel + Supabase

> Temps estimé : **30 à 45 minutes** — aucune compétence dev requise.

---

## Vue d'ensemble

```
Gmail ──► TriPatient (Vercel) ──► Supabase (base de données)
              │
              └── Vous accédez depuis n'importe quel navigateur
```

- **Vercel** héberge l'application (gratuit, URL publique en HTTPS)
- **Supabase** stocke les patients et l'historique des mails classifiés (gratuit jusqu'à 500 Mo)
- **Gmail API** lit vos mails en temps réel via OAuth sécurisé

---

## PARTIE 1 — Supabase (base de données)

### 1.1 Créer un compte Supabase

1. Allez sur **https://supabase.com** → **Start your project**
2. Connectez-vous avec GitHub (recommandé) ou créez un compte email
3. Cliquez **New project**
4. Remplissez :
   - **Name** : `tripatient`
   - **Database Password** : choisissez un mot de passe fort (notez-le)
   - **Region** : `West EU (Ireland)` (le plus proche de la France)
5. Cliquez **Create new project** — attendez ~2 minutes

---

### 1.2 Créer les tables

1. Dans le menu gauche → **SQL Editor**
2. Cliquez **New query**
3. Copiez-collez **tout le contenu** du fichier `supabase-schema.sql`
4. Cliquez **Run** (bouton vert en bas à droite)
5. Vérifiez que vous voyez `Success. No rows returned`

> ✅ Les tables `patients`, `mails` et `settings` sont créées avec les données de démo.

---

### 1.3 Récupérer vos clés Supabase

1. Menu gauche → **Project Settings** (icône engrenage)
2. Onglet **API**
3. Notez ces deux valeurs (vous en aurez besoin plus tard) :

| Valeur | Où la trouver | Ressemble à |
|--------|--------------|-------------|
| **Project URL** | Section "Project URL" | `https://abcdefgh.supabase.co` |
| **anon public key** | Section "Project API keys" → anon public | `eyJhbGciOiJIUzI1NiIsInR5c...` (très long) |

> ⚠️ Ne partagez jamais la clé `service_role`. Seule la clé `anon` est utilisée ici.

---

## PARTIE 2 — Google Cloud (accès Gmail)

### 2.1 Créer un projet Google Cloud

1. Allez sur **https://console.cloud.google.com**
2. En haut → cliquez sur le sélecteur de projet → **Nouveau projet**
3. Nom : `TriPatient` → **Créer**
4. Attendez quelques secondes puis sélectionnez ce projet

---

### 2.2 Activer l'API Gmail

1. Menu hamburger → **API et services** → **Bibliothèque**
2. Cherchez `Gmail API`
3. Cliquez dessus → **Activer**

---

### 2.3 Configurer l'écran de consentement OAuth

1. Menu → **API et services** → **Écran de consentement OAuth**
2. Type d'utilisateur : **Externe** → **Créer**
3. Remplissez :
   - **Nom de l'application** : `TriPatient`
   - **E-mail d'assistance** : `dr.achard.cohen@gmail.com`
   - **E-mail du développeur** : `dr.achard.cohen@gmail.com`
4. Cliquez **Enregistrer et continuer** (3 fois, sans rien remplir d'autre)
5. Sur la page **Utilisateurs test** → **+ Add users**
6. Ajoutez : `dr.achard.cohen@gmail.com` → **Enregistrer**

---

### 2.4 Créer les identifiants OAuth

1. Menu → **API et services** → **Identifiants**
2. **+ Créer des identifiants** → **ID client OAuth 2.0**
3. **Type d'application** : `Application Web`
4. **Nom** : `TriPatient Web`
5. Section **Origines JavaScript autorisées** → **+ Ajouter une URI** :
   ```
   https://votre-projet.vercel.app
   ```
   *(vous mettrez l'URL Vercel réelle à l'étape suivante — vous pouvez mettre `http://localhost:8080` pour l'instant)*
6. Cliquez **Créer**
7. Une popup affiche votre **Client ID** → copiez-le (format `XXXXX.apps.googleusercontent.com`)

---

## PARTIE 3 — Vercel (hébergement)

### 3.1 Créer un compte Vercel

1. Allez sur **https://vercel.com** → **Sign Up**
2. Connectez-vous avec **GitHub** (le plus simple)

---

### 3.2 Pousser le code sur GitHub

> Si vous n'avez pas Git installé, téléchargez **GitHub Desktop** sur https://desktop.github.com

#### Option A — GitHub Desktop (recommandé, sans ligne de commande)

1. Ouvrez **GitHub Desktop**
2. **File** → **Add Local Repository** → sélectionnez `C:\tripatient`
3. Si demandé, cliquez **Initialize Repository**
4. En bas à gauche : message de commit = `Initial commit` → **Commit to main**
5. **Publish repository** → nom : `tripatient` → décochez "Keep this code private" si vous voulez (ou laissez privé) → **Publish**

#### Option B — Ligne de commande (si Git est installé)

```powershell
cd C:\tripatient
git init
git add .
git commit -m "Initial commit"
# Créez d'abord un repo vide sur github.com, puis :
git remote add origin https://github.com/VOTRE_NOM/tripatient.git
git push -u origin main
```

---

### 3.3 Déployer sur Vercel

1. Sur **https://vercel.com/dashboard** → **Add New** → **Project**
2. **Import Git Repository** → sélectionnez `tripatient`
3. Laissez tous les paramètres par défaut
4. Ouvrez la section **Environment Variables** et ajoutez ces 3 variables :

| Variable | Valeur |
|----------|--------|
| `SUPABASE_URL` | Votre Project URL Supabase (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Votre clé anon Supabase |
| `GMAIL_CLIENT_ID` | Votre Client ID Google (`XXXXX.apps.googleusercontent.com`) |

5. Cliquez **Deploy** → attendez ~1 minute
6. Vercel vous donne une URL : `https://tripatient-xxxx.vercel.app` → **notez-la**

---

### 3.4 Mettre à jour l'origine Google OAuth

Maintenant que vous avez votre URL Vercel :

1. Retournez sur **https://console.cloud.google.com**
2. **API et services** → **Identifiants** → cliquez sur votre ID client
3. **Origines JavaScript autorisées** → **+ Ajouter une URI** :
   ```
   https://tripatient-xxxx.vercel.app
   ```
   *(remplacez par votre vraie URL)*
4. **Enregistrer**

> ⏱️ La propagation peut prendre 5 minutes.

---

## PARTIE 4 — Première connexion

1. Ouvrez **https://tripatient-xxxx.vercel.app** dans votre navigateur
2. L'app se charge avec les données de démo depuis Supabase
3. Cliquez **Connecter Gmail** en haut à droite
4. La fenêtre Google s'ouvre → connectez-vous avec `dr.achard.cohen@gmail.com`
5. Acceptez les permissions (lecture seule des mails)
6. Les mails non lus apparaissent, classifiés automatiquement ✅

---

## PARTIE 5 — Utilisation quotidienne

### Accès
- Ouvrez simplement l'URL Vercel dans votre navigateur
- Fonctionne sur ordinateur, tablette et mobile

### Workflow recommandé
1. Ouvrez l'app le matin
2. Cliquez **↻ Actualiser** pour charger les nouveaux mails
3. Traitez les 🔴 **Urgents** en premier
4. Cliquez sur une carte pour voir le dossier patient + le contenu complet
5. Cliquez **Marquer comme traité** une fois le mail répondu

### Ajouter un patient
Allez dans Supabase → **Table Editor** → `patients` → **Insert row**

### Consulter l'historique
Allez dans Supabase → **Table Editor** → `mails` — vous avez un historique complet de tous les mails classifiés.

---

## Résolution de problèmes fréquents

| Problème | Solution |
|----------|----------|
| "Accès bloqué" à la connexion Google | Vérifiez que `dr.achard.cohen@gmail.com` est bien dans les utilisateurs test de l'écran de consentement |
| L'URL Vercel n'est pas dans les origines autorisées | Ajoutez l'URL exacte dans Google Cloud → Identifiants |
| Mails ne s'affichent pas | Vérifiez les clés Supabase dans Vercel → Settings → Environment Variables |
| "Session expirée" Gmail | Cliquez Déconnecter puis reconnectez-vous |
| App vide sans données | Relancez le SQL du fichier `supabase-schema.sql` dans Supabase |

---

## Mettre à jour l'application

Quand vous modifiez `index.html` :

```powershell
# Avec GitHub Desktop : committez + Push origin
# Vercel redéploie automatiquement en ~30 secondes
```

---

## Sécurité (important pour données médicales)

> Pour une utilisation en cabinet médical, renforcez la sécurité :

1. **Supabase Auth** — Activez l'authentification par email/mot de passe pour protéger l'accès aux données
2. **RLS stricte** — Remplacez les politiques `USING (true)` par `USING (auth.uid() IS NOT NULL)` dans Supabase
3. **Domaine personnalisé Vercel** — Ajoutez votre propre domaine (ex: `mails.cabinet-cohen.fr`) dans Vercel → Settings → Domains
4. **HTTPS uniquement** — Vercel l'applique automatiquement ✅

---

*TriPatient v1.0 — Cabinet de Dermatologie*
