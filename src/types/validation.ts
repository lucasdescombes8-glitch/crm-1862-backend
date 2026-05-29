import { z } from 'zod';

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis (min 6 caractÃ¨res)'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe min 8 caractÃ¨res'),
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'PrÃ©nom requis'),
  role: z.enum(['ADMIN', 'COMMERCIAL', 'RESPONSABLE']).default('COMMERCIAL'),
});

// ============================================================================
// CONTACTS
// ============================================================================

export const ContactCreateSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'PrÃ©nom requis'),
  email: z.string().email('Email invalide').optional(),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  type: z.enum(['prospect', 'client', 'fournisseur']),
  statut: z.enum(['actif', 'inactif', 'refuse']).default('actif'),
  notes: z.string().optional(),
});

export const ContactUpdateSchema = ContactCreateSchema.partial();

// ============================================================================
// INTERACTIONS
// ============================================================================

export const InteractionCreateSchema = z.object({
  contactId: z.string().uuid('ID contact invalide'),
  type: z.enum(['email', 'call', 'meeting', 'note']),
  contenu: z.string().min(1, 'Contenu requis'),
});

// ============================================================================
// EVENEMENTS
// ============================================================================

export const EvenementCreateSchema = z.object({
  titre: z.string().min(3, 'Titre requis'),
  type: z.string().min(3, 'Type requis'),
  clientId: z.string().uuid('Client requis'),
  paxEstime: z.number().int().positive('PAX invalide'),
  statut: z.enum(['proposition', 'confirme', 'refuse']).default('proposition'),
  notes: z.string().optional(),
});

export const EvenementUpdateSchema = EvenementCreateSchema.partial();

// ============================================================================
// OPTIONS
// ============================================================================

export const OptionCreateSchema = z.object({
  evenementId: z.string().uuid('Ã‰vÃ©nement requis'),
  heureDebugMontage: z.coerce.date(),
  heureOuverturePublic: z.coerce.date(),
  heureFermeturePublic: z.coerce.date(),
  heureFinDemolition: z.coerce.date(),
  paxEstime: z.number().int().positive('PAX invalide'),
  salleIds: z.array(z.string()),
  notes: z.string().optional(),
});

export const OptionUpdateSchema = OptionCreateSchema.partial();

// ============================================================================
// DEVIS
// ============================================================================

export const DevisCreateSchema = z.object({
  optionId: z.string().uuid('Option requise'),
  services: z.array(z.object({
    id: z.string(),
    label: z.string(),
    montantHT: z.number().nonnegative(),
  })),
  montantHT: z.number().nonnegative(),
  montantTTC: z.number().nonnegative(),
});

export const DevisUpdateSchema = z.object({
  statut: z.enum(['brouillon', 'envoye', 'accepte', 'refuse']).optional(),
  services: z.array(z.object({
    id: z.string(),
    label: z.string(),
    montantHT: z.number().nonnegative(),
  })).optional(),
  montantHT: z.number().nonnegative().optional(),
  montantTTC: z.number().nonnegative().optional(),
});

// ============================================================================
// FACTURES
// ============================================================================

export const FactureCreateSchema = z.object({
  devisId: z.string().uuid('Devis requis'),
  montantTTC: z.number().nonnegative(),
});

export const FactureUpdateSchema = z.object({
  montantRecu: z.number().nonnegative().optional(),
  statutPaiement: z.enum(['impayee', 'partiellement', 'payee']).optional(),
  datePaiement: z.coerce.date().optional(),
});

// ============================================================================
// TACHES
// ============================================================================

export const TacheCreateSchema = z.object({
  titre: z.string().min(3, 'Titre requis'),
  evenementId: z.string().uuid().optional(),
  statut: z.enum(['a_faire', 'en_cours', 'terminee']).default('a_faire'),
  priorite: z.enum(['haute', 'normale', 'basse']).default('normale'),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
});

export const TacheUpdateSchema = TacheCreateSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;
export type InteractionCreateInput = z.infer<typeof InteractionCreateSchema>;
export type EvenementCreateInput = z.infer<typeof EvenementCreateSchema>;
export type EvenementUpdateInput = z.infer<typeof EvenementUpdateSchema>;
export type OptionCreateInput = z.infer<typeof OptionCreateSchema>;
export type OptionUpdateInput = z.infer<typeof OptionUpdateSchema>;
export type DevisCreateInput = z.infer<typeof DevisCreateSchema>;
export type DevisUpdateInput = z.infer<typeof DevisUpdateSchema>;
export type FactureCreateInput = z.infer<typeof FactureCreateSchema>;
export type FactureUpdateInput = z.infer<typeof FactureUpdateSchema>;
export type TacheCreateInput = z.infer<typeof TacheCreateSchema>;
export type TacheUpdateInput = z.infer<typeof TacheUpdateSchema>;
