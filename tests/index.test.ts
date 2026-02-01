import request from 'supertest';
import { app } from '../src/index';

describe('Health Endpoint', () => {
  it('should return status 200 and success message', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
  });
});

describe('Info Endpoint', () => {
  it('should return user and hostname information', async () => {
    const response = await request(app).get('/info');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('hostname');
    expect(typeof response.body.user).toBe('string');
    expect(typeof response.body.hostname).toBe('string');
    expect(response.body.user.length).toBeGreaterThan(0);
    expect(response.body.hostname.length).toBeGreaterThan(0);
  });
});
