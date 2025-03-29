import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js'; // Adjust the path to your server file
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

describe('NoSQL Injection Security Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    
    const testUser = {
      name: 'Security Tester',
      email: 'securitytest@example.com',
      password: 'SecurePassword123!'
    };
    
    
    const existingUser = await User.findOne({ email: testUser.email });
    if (!existingUser) {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    }
    
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    authToken = loginResponse.body.token;
  });
  
  
  it('should prevent NoSQL injection in login route', async () => {
    const maliciousPayload = {
      email: { $ne: null },
      password: { $ne: null }
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload);
    
    // Should receive 400 Bad Request, not 200 OK
    expect(response.status).to.equal(400);
    expect(response.body).to.not.have.property('token');
  });
  
  
  it('should prevent NoSQL injection in user lookup', async () => {
    const maliciousId = { $ne: null };
    
    const response = await request(app)
      .get(`/api/admin/users/${maliciousId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).to.not.equal(200);
  });
  
  
  it('should prevent NoSQL operator injection in transaction queries', async () => {
    const response = await request(app)
      .get('/api/transactions/category/$where=1==1')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).to.not.equal(200);
    
    expect(response.status).to.be.oneOf([400, 404]);
  });
  
 
  it('should handle malformed JSON data properly', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send('{"amount": 100, "category": "Food", "description": "Groceries", $where: function() { return true; }}');
    
    expect(response.status).to.not.equal(200);
  });
});