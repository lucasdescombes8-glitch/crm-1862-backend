// Mock Prisma for tests
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    contact: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    evenement: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    devis: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
    devisVersion: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    facture: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
    option: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    tache: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

// Mock Winston logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(30000);
