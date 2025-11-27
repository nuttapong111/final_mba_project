import { describe, it, expect, beforeAll } from 'vitest';

// API Test Examples
// Run with: npm test

describe('API Tests', () => {
  const baseUrl = 'http://localhost:3001/api';
  let authToken: string;

  beforeAll(async () => {
    // Login to get token
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    if (data.success) {
      authToken = data.data.token;
    }
  });

  it('should return health check', async () => {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should get courses', async () => {
    const response = await fetch(`${baseUrl}/courses`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should get users', async () => {
    const response = await fetch(`${baseUrl}/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});


