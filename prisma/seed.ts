import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Seeding database...');

  // ============================================================================
  // USERS
  // ============================================================================

  console.log('Creating users...');

  const adminPassword = await bcryptjs.hash('Admin@123', 12);
  const userPassword = await bcryptjs.hash('User@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@groupe1862.com' },
    update: {},
    create: {
      email: 'admin@groupe1862.com',
      password: adminPassword,
      nom: 'DESCOMBES',
      prenom: 'Lucas',
      role: 'ADMIN',
      statut: 'actif',
    },
  });

  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@groupe1862.com' },
    update: {},
    create: {
      email: 'commercial@groupe1862.com',
      password: userPassword,
      nom: 'MARTIN',
      prenom: 'Sophie',
      role: 'COMMERCIAL',
      statut: 'actif',
    },
  });

  const responsable = await prisma.user.upsert({
    where: { email: 'responsable@groupe1862.com' },
    update: {},
    create: {
      email: 'responsable@groupe1862.com',
      password: userPassword,
      nom: 'BERNARD',
      prenom: 'FranÃ§ois',
      role: 'RESPONSABLE',
      statut: 'actif',
    },
  });

  console.log(`âœ“ Created ${3} users`);

  // ============================================================================
  // CONTACTS
  // ============================================================================

  console.log('Creating contacts...');

  const contact1 = await prisma.contact.upsert({
    where: { email: 'jean.dupont@example.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      telephone: '04 72 40 58 79',
      entreprise: 'Agence Ã‰vÃ©nementielle XYZ',
      type: 'client',
      statut: 'actif',
      notes: 'Client VIP - contacter directement',
    },
  });

  const contact2 = await prisma.contact.upsert({
    where: { email: 'marie.martin@corp.fr' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@corp.fr',
      telephone: '06 12 34 56 78',
      entreprise: 'Groupe Innovation Plus',
      type: 'prospect',
      statut: 'actif',
      notes: 'Lead chaud - follow-up semaine prochaine',
    },
  });

  const contact3 = await prisma.contact.upsert({
    where: { email: 'franÃ§ois.bernard@services.com' },
    update: {},
    create: {
      nom: 'Bernard',
      prenom: 'FranÃ§ois',
      email: 'franÃ§ois.bernard@services.com',
      telephone: '04 78 12 34 56',
      entreprise: 'Services Professionnels SA',
      type: 'client',
      statut: 'actif',
      notes: 'RÃ©current - bon payeur',
    },
  });

  console.log(`âœ“ Created ${3} contacts`);

  // ============================================================================
  // EVENEMENTS
  // ============================================================================

  console.log('Creating events...');

  const event1 = await prisma.evenement.create({
    data: {
      titre: 'ConfÃ©rence Innovation 2026',
      type: 'ConfÃ©rence',
      clientId: contact1.id,
      paxEstime: 150,
      statut: 'confirme',
      notes: 'Salle LumiÃ¨re, demande de rÃ©gisseur + technique son',
    },
  });

  const event2 = await prisma.evenement.create({
    data: {
      titre: 'RÃ©union StratÃ©gique Q3',
      type: 'RÃ©union',
      clientId: contact2.id,
      paxEstime: 45,
      statut: 'proposition',
      notes: 'Date Ã  confirmer',
    },
  });

  const event3 = await prisma.evenement.create({
    data: {
      titre: 'Gala de Fin d\'AnnÃ©e',
      type: 'Gala',
      clientId: contact3.id,
      paxEstime: 250,
      statut: 'confirme',
      notes: 'DÃ©jÃ  plusieurs options reÃ§ues',
    },
  });

  console.log(`âœ“ Created ${3} events`);

  // ============================================================================
  // OPTIONS
  // ============================================================================

  console.log('Creating options...');

  const option1 = await prisma.option.create({
    data: {
      evenementId: event1.id,
      heureDebugMontage: new Date('2026-06-15T08:00:00'),
      heureOuverturePublic: new Date('2026-06-15T10:00:00'),
      heureFermeturePublic: new Date('2026-06-15T17:00:00'),
      heureFinDemolition: new Date('2026-06-15T18:30:00'),
      paxEstime: 150,
      salleIds: JSON.stringify(['lumiere', 'ampere']),
    },
  });

  console.log(`âœ“ Created ${1} option`);

  // ============================================================================
  // DEVIS
  // ============================================================================

  console.log('Creating quotes...');

  const devis1 = await prisma.devis.create({
    data: {
      numero: `DEV-2026-001`,
      optionId: option1.id,
      services: JSON.stringify([
        { id: 'espace', label: 'Location d\'espace', montantHT: 2500 },
        { id: 'regisseur', label: 'RÃ©gisseur', montantHT: 800 },
        { id: 'technique', label: 'Technique (Son/LumiÃ¨re)', montantHT: 1200 },
      ]),
      montantHT: 4500,
      montantTTC: 5400,
      statut: 'envoye',
    },
  });

  const devis2 = await prisma.devis.create({
    data: {
      numero: `DEV-2026-002`,
      optionId: option1.id,
      services: JSON.stringify([
        { id: 'espace', label: 'Location d\'espace', montantHT: 2500 },
      ]),
      montantHT: 2500,
      montantTTC: 3000,
      statut: 'brouillon',
    },
  });

  console.log(`âœ“ Created ${2} quotes`);

  // ============================================================================
  // FACTURES
  // ============================================================================

  console.log('Creating invoices...');

  const facture1 = await prisma.facture.create({
    data: {
      numero: `FACT-2026-001`,
      devisId: devis1.id,
      montantTTC: 5400,
      montantRecu: 5400,
      datePaiement: new Date('2026-05-28T12:00:00'),
      statutPaiement: 'payee',
    },
  });

  console.log(`âœ“ Created ${1} invoice`);

  // ============================================================================
  // TACHES
  // ============================================================================

  console.log('Creating tasks...');

  const tache1 = await prisma.tache.create({
    data: {
      titre: 'Confirmation salles avec client',
      evenementId: event1.id,
      priorite: 'haute',
      statut: 'a_faire',
      dueDate: new Date('2026-06-01T17:00:00'),
      assigneeId: commercial.id,
    },
  });

  const tache2 = await prisma.tache.create({
    data: {
      titre: 'RÃ©ceptionner devis catering',
      evenementId: event1.id,
      priorite: 'normale',
      statut: 'en_cours',
      dueDate: new Date('2026-06-05T17:00:00'),
      assigneeId: commercial.id,
    },
  });

  const tache3 = await prisma.tache.create({
    data: {
      titre: 'Envoyer facture au client',
      evenementId: event1.id,
      priorite: 'basse',
      statut: 'terminee',
      dueDate: new Date('2026-05-28T17:00:00'),
      assigneeId: responsable.id,
    },
  });

  console.log(`âœ“ Created ${3} tasks`);

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  console.log('Creating configuration...');

  await prisma.salle.deleteMany();

  const salles = await Promise.all([
    prisma.salle.create({
      data: {
        nom: 'LumiÃ¨re',
        zone: '1er Ã‰tage',
        capacite: 100,
        superficie: 180,
        active: true,
      },
    }),
    prisma.salle.create({
      data: {
        nom: 'AmpÃ¨re',
        zone: '1er Ã‰tage',
        capacite: 120,
        superficie: 200,
        active: true,
      },
    }),
    prisma.salle.create({
      data: {
        nom: 'Corbeille',
        zone: 'RDC',
        capacite: 200,
        superficie: 350,
        active: true,
      },
    }),
  ]);

  console.log(`âœ“ Created ${3} rooms`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\nâœ… Seeding completed!');
  console.log(`
ðŸ“Š Database populated with:
  â€¢ 3 Users (admin, commercial, responsable)
  â€¢ 3 Contacts (prospect, 2x clients)
  â€¢ 3 Events (confirmed, proposed, confirmed)
  â€¢ 1 Option
  â€¢ 2 Quotes (sent, draft)
  â€¢ 1 Invoice (paid)
  â€¢ 3 Tasks (todo, in progress, done)
  â€¢ 3 Rooms

ðŸ” Test Credentials:
  Admin:       admin@groupe1862.com / Admin@123
  Commercial: commercial@groupe1862.com / User@123
  Responsable: responsable@groupe1862.com / User@123
  `);
}

main()
  .catch((e) => {
    console.error('âŒ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
