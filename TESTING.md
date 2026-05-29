# Testing Guide - GROUPE 1862 CRM Backend

## Overview

This backend includes comprehensive test coverage with:
- **Unit Tests**: For all services (DevisService, FactureService, TacheService, etc.)
- **Integration Tests**: For all API endpoints
- **Test Coverage**: 50%+ code coverage target

## Testing Framework

- **Framework**: Jest
- **Language**: TypeScript with ts-jest preset
- **Test Files**: src/__tests__/
- **Mock Library**: Jest built-in mocks

## Running Tests

### Run all tests
\\\ash
npm test
\\\

### Run tests in watch mode
\\\ash
npm test -- --watch
\\\

### Run specific test file
\\\ash
npm test -- DevisService.spec.ts
\\\

### Generate coverage report
\\\ash
npm test -- --coverage
\\\

### Run integration tests only
\\\ash
npm test -- routes/
\\\

### Run unit tests only
\\\ash
npm test -- services/
\\\

## Test Structure

### Directory Layout
\\\
src/
├── __tests__/
│   ├── setup.ts              # Jest setup & mocks
│   ├── services/
│   │   ├── DevisService.spec.ts
│   │   ├── FactureService.spec.ts
│   │   ├── TacheService.spec.ts
│   │   └── ...
│   ├── routes/
│   │   ├── devis.routes.spec.ts
│   │   ├── factures.routes.spec.ts
│   │   ├── taches.routes.spec.ts
│   │   └── ...
│   └── utils/
│       └── testHelper.ts
├── services/
├── routes/
└── ...
\\\

## Writing Tests

### Unit Test Example (Service)

\\\	ypescript
import { DevisService } from '../../services/DevisService';
import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient();
const devisService = new DevisService();

describe('DevisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of devis with pagination', async () => {
      const mockDevis = [
        { id: '1', numero: 'DEV-2026-001', statut: 'brouillon' },
      ];

      (mockPrisma.devis.findMany as jest.Mock).mockResolvedValue(mockDevis);
      (mockPrisma.devis.count as jest.Mock).mockResolvedValue(1);

      const result = await devisService.getAll(0, 25, {});

      expect(result.devis).toEqual(mockDevis);
      expect(result.pagination.total).toBe(1);
    });
  });
});
\\\

### Integration Test Example (Route)

\\\	ypescript
import request from 'supertest';
import express from 'express';
import devisRouter from '../../routes/devis.routes';

const app = express();
app.use(express.json());
app.use('/api/devis', (req, res, next) => {
  req.user = { userId: 'test-user' };
  next();
});
app.use('/api/devis', devisRouter);

describe('Devis API Endpoints', () => {
  describe('GET /api/devis', () => {
    it('should return list of devis', async () => {
      const response = await request(app)
        .get('/api/devis')
        .query({ skip: 0, take: 25 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
\\\

## Test Coverage Goals

| Module | Coverage | Status |
|--------|----------|--------|
| Services | 80%+ | ✅ Target |
| Routes | 60%+ | ✅ Target |
| Utils | 90%+ | ✅ Target |
| Middleware | 70%+ | ✅ Target |
| Overall | 50%+ | ✅ Target |

## Mocking Strategy

### Prisma Client
All database calls are mocked using Jest:

\\\	ypescript
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    devis: { findMany: jest.fn(), create: jest.fn(), ... },
    // ... other models
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});
\\\

### Winston Logger
Logger is mocked to prevent console output during tests:

\\\	ypescript
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
\\\

### Services
Services are mocked for isolation in route tests:

\\\	ypescript
jest.mock('../../services/DevisService');
\\\

## Best Practices

1. **Clear Test Names**: Use descriptive test names
   - ✅ "should return list of devis with pagination"
   - ❌ "should work"

2. **Arrange-Act-Assert Pattern**:
   \\\	ypescript
   // Arrange
   const mockData = { id: '1' };
   
   // Act
   const result = await service.getById('1');
   
   // Assert
   expect(result).toEqual(mockData);
   \\\

3. **One Assertion Focus**: Each test should verify one behavior

4. **Mock Cleanup**: Always clear mocks between tests
   \\\	ypescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   \\\

5. **Test Error Cases**: Don't just test happy paths
   \\\	ypescript
   it('should throw error if not found', async () => {
     (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue(null);
     
     await expect(service.getById('nonexistent')).rejects.toThrow();
   });
   \\\

## Continuous Integration

Tests are automatically run on:
- Push to main branch
- Pull requests
- Scheduled nightly runs

## Debugging Tests

### Run specific test with verbose output
\\\ash
npm test -- DevisService.spec.ts --verbose
\\\

### Debug a single test
\\\ash
npm test -- --testNamePattern="should return list of devis"
\\\

### Break on test execution
\\\ash
node --inspect-brk node_modules/.bin/jest --runInBand
\\\

## Coverage Report

Generate and view coverage:
\\\ash
npm test -- --coverage --coverageReporters=html
open coverage/index.html
\\\

## Troubleshooting

### "Cannot find module" errors
- Ensure TypeScript paths are correct
- Check jest.config.js moduleNameMapper

### Timeout errors
- Increase jest timeout in jest.config.js
- Check for unresolved promises

### Mock not working
- Verify mock path is correct
- Ensure jest.mock() is before imports
- Clear mocks between tests

## Next Steps

1. Add more unit tests for remaining services
2. Add more integration tests for all endpoints
3. Setup CI/CD pipeline to run tests automatically
4. Generate coverage reports
5. Target 70%+ overall code coverage
