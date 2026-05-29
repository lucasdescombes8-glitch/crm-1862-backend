import request from 'supertest';
import express, { Application } from 'express';

export interface TestContext {
  app: Application;
  token: string;
}

export const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  return app;
};

export const makeAuthHeader = (token: string) => ({
  Authorization: Bearer {token},
});

export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
