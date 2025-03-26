import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js';

describe('XSS Protection Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'securitytest@example.com',
        password: 'SecurePassword123!'
      });
    
    authToken = loginResponse.body.token;
  });
  
  
  it('should sanitize XSS payloads in transaction fields', async () => {
    const xssPayload = {
      type: 'expense',
      amount: 100,
      category: 'Food',
      description: '<script>alert("XSS")</script>',
      date: new Date(),
      tags: ['<img src="x" onerror="alert(1)">']
    };
    
    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(xssPayload);
    
    
    expect(response.status).to.equal(201);
    
    
    const transactionId = response.body.transaction._id;
    const getResponse = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    
    expect(getResponse.body.description).to.not.include('<script>');
    expect(getResponse.body.tags[0]).to.not.include('onerror');
  });
  
  
  it('should sanitize XSS payloads in user registration', async () => {
    const xssPayload = {
      name: '<script>alert("XSS")</script>User',
      email: 'xsstest@example.com',
      password: 'SecurePassword123!'
    };
    
    await request(app)
      .post('/api/auth/register')
      .send(xssPayload);
    
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com', 
        password: 'AdminPass123!'
      });
    
    const adminToken = adminLoginResponse.body.token;
    
    
    const usersResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    
    const testUser = usersResponse.body.find(user => user.email === 'xsstest@example.com');
    
    
    expect(testUser.name).to.not.include('<script>');
  });
});