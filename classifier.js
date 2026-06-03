const fs = require("fs");
const path = require("path");

// ─── Données ────────────────────────────────────────────────────────────────

const patients = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/patients.json"), "utf8")
);
const mails = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/mails.json"), "utf8")
);

// ─── Constantes de scoring ───────────────────────────────────────────────────

const RISQUE_SCORE = {
  "très élevé": 40,
  élevé: 30,
  modéré: 15,
  faible: 0,
};

const MOTS_URGENCE = [
  { mots: ["melanome", "mélanome", "cancer", "lymphome", "carcinome", "tumeur", "métastase"], score: 35 },
  { mots: ["saign", "hémorrag", "sang"], score: 30 },
  { mots: ["grandit", "grossit", "évolue", "s'étend", "rapidement", "soudain", "brutalement"], score: 25 },
  { mots: ["asymétrique", "irrégulier", "bord irrégulier", "bords irréguliers"], score: 25 },
  { mots: ["urgent", "urgence", "URGENT"], score: 20 },
  { mots: ["inquiet", "inquiète", "angoiss", "peur", "effrayé"], score: 10 },
  { mots: ["nouvelle", "nouveau", "apparu", "apparue", "apparition"], score: 15 },
  { mots: ["lésion", "plaque", "tache", "nodule", "bosse", "ulcère"], score: 10 },
  { mots: ["maux de tête", "mal de tête", "céphalée", "douleur"], score: 15 },
  { mots: ["demangeaison", "démangeaison", "démange", "gratte"], score: 8 },
  { mots: ["renouvellement", "ordonnance", "médicament"], score: -10 },
  { mots: ["routine", "bilan général", "contrôle habituel", "rien d'urgent"], score: -20 },
];

const ANTECEDENTS_CRITIQUES = [
  "mélanome",
  "carcinome",
  "lymphome",
  "cancer",
  "basocellulaire",
  "spinocellulaire",
];

const TRAITEMENTS_SURVEILLANCE = [
  "isotrétinoïne",
  "méthotrexate",
  "photothérapie",
  "immunosuppresseur",
  "biothérapie",
];

// ─── Fonctions de scoring ────────────────────────────────────────────────────

function scoreRisquePatient(patient) {
  let score = RISQUE_SCORE[patient.risque] ?? 0;

  // Bonus antécédents oncologiques
  const antecedentsText = patient.antecedents.join(" ").toLowerCase();
  if (ANTECEDENTS_CRITIQUES.some((a) => antecedentsText.includes(a))) {
    score += 15;
  }

  // Bonus traitement à risque
  const traitement = (patient.traitementEnCours || "").toLowerCase();
  if (TRAITEMENTS_SURVEILLANCE.some((t) => traitement.includes(t))) {
    score += 10;
  }

  return score;
}

function scoreContenuMail(mail) {
  const texte = (mail.sujet + " " + mail.corps).toLowerCase();
  let score = 0;

  for (const { mots, score: s } of MOTS_URGENCE) {
    if (mots.some((m) => texte.includes(m.toLowerCase()))) {
      score += s;
    }
  }

  return score;
}

function scoreFraicheur(mail) {
  const now = new Date("2026-05-29T12:00:00");
  const reception = new Date(mail.dateReception);
  const heures = (now - reception) / 3600000;
  // Plus c'est récent, plus c'est prioritaire (max 10 pts pour < 1h)
  return Math.max(0, 10 - Math.floor(heures));
}

function determinerNiveau(score) {
  if (score >= 70) return { niveau: "CRITIQUE", emoji: "🔴", couleur: "rouge" };
  if (score >= 45) return { niveau: "URGENT", emoji: "🟠", couleur: "orange" };
  if (score >= 20) return { niveau: "MODÉRÉ", emoji: "🟡", couleur: "jaune" };
  return { niveau: "ROUTINE", emoji: "🟢", couleur: "vert" };
}

function genererResume(patient, mail, scores) {
  const lignes = [];

  // Contexte médical clé
  if (patient.antecedents.length > 0) {
    lignes.push(`Antécédents : ${patient.antecedents.join(", ")}`);
  }
  if (patient.traitementEnCours) {
    lignes.push(`Traitement : ${patient.traitementEnCours}`);
  }
  if (patient.prochainRDV) {
    lignes.push(`Prochain RDV prévu : ${patient.prochainRDV}`);
  }

  // Raison de la priorité
  const raisonsUrgence = [];
  const texte = (mail.sujet + " " + mail.corps).toLowerCase();

  if (texte.includes("saign")) raisonsUrgence.push("lésion saignante signalée");
  if (texte.includes("grandit") || texte.includes("évolue") || texte.includes("rapidement"))
    raisonsUrgence.push("évolution rapide de la lésion");
  if (texte.includes("asymétrique") || texte.includes("irrégulier"))
    raisonsUrgence.push("critères ABCDE évocateurs");
  if (texte.includes("maux de tête") || texte.includes("céphalée"))
    raisonsUrgence.push("symptômes systémiques sous traitement");
  if (texte.includes("nouvelle") || texte.includes("apparue"))
    raisonsUrgence.push("nouvelle lésion signalée");

  if (raisonsUrgence.length > 0) {
    lignes.push(`⚠️  Motif d'alerte : ${raisonsUrgence.join(", ")}`);
  }

  lignes.push(
    `Score total : ${scores.total} (patient: ${scores.patient}, mail: ${scores.mail}, fraîcheur: ${scores.fraicheur})`
  );

  return lignes.join("\n     ");
}

// ─── Classification ──────────────────────────────────────────────────────────

function classerMails() {
  const patientMap = Object.fromEntries(patients.map((p) => [p.email, p]));

  const resultats = mails.map((mail) => {
    const patient = patientMap[mail.emailExpediteur];

    if (!patient) {
      return {
        mail,
        patient: null,
        scores: { patient: 0, mail: scoreContenuMail(mail), fraicheur: scoreFraicheur(mail), total: 0 },
        niveau: determinerNiveau(scoreContenuMail(mail) + scoreFraicheur(mail)),
        resume: "Patient non identifié dans le système",
      };
    }

    const scorePatient = scoreRisquePatient(patient);
    const scoreMail = scoreContenuMail(mail);
    const fraicheur = scoreFraicheur(mail);
    const total = scorePatient + scoreMail + fraicheur;
    const scores = { patient: scorePatient, mail: scoreMail, fraicheur, total };

    return {
      mail,
      patient,
      scores,
      niveau: determinerNiveau(total),
      resume: genererResume(patient, mail, scores),
    };
  });

  // Tri par score décroissant
  return resultats.sort((a, b) => b.scores.total - a.scores.total);
}

// ─── Affichage ───────────────────────────────────────────────────────────────

function afficherTableauDeBord() {
  const classes = classerMails();
  const now = new Date("2026-05-29T12:00:00");

  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║          TABLEAU DE BORD — MAILS PATIENTS EN ATTENTE                ║");
  console.log(`║          Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}                        ║`);
  console.log("╚══════════════════════════════════════════════════════════════════════╝");
  console.log();

  classes.forEach((item, idx) => {
    const { mail, patient, niveau, resume } = item;
    const rang = String(idx + 1).padStart(2, "0");
    const heure = new Date(mail.dateReception).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nomPatient = patient
      ? `${patient.prenom} ${patient.nom} (${patient.id})`
      : "Expéditeur inconnu";

    console.log(`┌─ #${rang} ${niveau.emoji} ${niveau.niveau.padEnd(8)} ────────────────────────────────────────────┐`);
    console.log(`│  Patient  : ${nomPatient}`);
    console.log(`│  Reçu à   : ${heure} — Sujet : "${mail.sujet}"`);
    console.log(`│  Contexte : ${resume.split("\n").join("\n│  ")}`);
    console.log(`│  Extrait  : "${mail.corps.substring(0, 100)}..."`);
    console.log("└──────────────────────────────────────────────────────────────────────┘");
    console.log();
  });

  // Résumé statistique
  const stats = { CRITIQUE: 0, URGENT: 0, MODÉRÉ: 0, ROUTINE: 0 };
  classes.forEach((c) => stats[c.niveau.niveau]++);

  console.log("━━━ RÉSUMÉ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `🔴 Critique: ${stats.CRITIQUE}  🟠 Urgent: ${stats.URGENT}  🟡 Modéré: ${stats["MODÉRÉ"]}  🟢 Routine: ${stats.ROUTINE}`
  );
  console.log(`Total mails traités : ${classes.length}`);
}

afficherTableauDeBord();
