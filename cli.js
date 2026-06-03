const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PATIENTS_FILE = path.join(__dirname, "data/patients.json");
const MAILS_FILE = path.join(__dirname, "data/mails.json");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function ajouterMail() {
  console.log("\n── Ajout d'un nouveau mail ──────────────────────────");
  const email = await ask("Email expéditeur : ");
  const sujet = await ask("Sujet : ");
  const corps = await ask("Contenu du mail : ");

  const mails = JSON.parse(fs.readFileSync(MAILS_FILE, "utf8"));
  const newId = `M${String(mails.length + 1).padStart(3, "0")}`;

  mails.push({
    id: newId,
    emailExpediteur: email,
    dateReception: new Date().toISOString(),
    sujet,
    corps,
  });

  fs.writeFileSync(MAILS_FILE, JSON.stringify(mails, null, 2));
  console.log(`\n✓ Mail ${newId} ajouté. Relancez 'npm start' pour voir le classement mis à jour.`);
  rl.close();
}

async function ajouterPatient() {
  console.log("\n── Ajout d'un nouveau patient ───────────────────────");
  const patients = JSON.parse(fs.readFileSync(PATIENTS_FILE, "utf8"));
  const newId = `P${String(patients.length + 1).padStart(3, "0")}`;

  const nom = await ask("Nom : ");
  const prenom = await ask("Prénom : ");
  const dateNaissance = await ask("Date de naissance (YYYY-MM-DD) : ");
  const email = await ask("Email : ");
  const antecedentsStr = await ask("Antécédents (séparés par des virgules) : ");
  const traitement = await ask("Traitement en cours (ou vide) : ");
  const risque = await ask("Niveau de risque (faible/modéré/élevé/très élevé) : ");

  patients.push({
    id: newId,
    nom,
    prenom,
    dateNaissance,
    email,
    antecedents: antecedentsStr ? antecedentsStr.split(",").map((s) => s.trim()) : [],
    traitementEnCours: traitement || null,
    dernierRDV: null,
    prochainRDV: null,
    risque,
  });

  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(patients, null, 2));
  console.log(`\n✓ Patient ${newId} (${prenom} ${nom}) ajouté.`);
  rl.close();
}

const cmd = process.argv[2];
if (cmd === "add-mail") ajouterMail();
else if (cmd === "add-patient") ajouterPatient();
else {
  console.log("Usage: node cli.js add-mail | add-patient");
  rl.close();
}
