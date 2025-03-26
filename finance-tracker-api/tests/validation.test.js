import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js';

describe('Input Validation Security Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'securitytest@example.com',
        password: 'SecurePassword123!'
      });
    
    authToken = loginResponse.body.token;
  });
  
 
  it('should validate transaction amount fields', async () => {
    
    const invalidAmountResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: 'not-a-number',
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    expect(invalidAmountResponse.status).to.not.equal(201);
    
    
    const negativeAmountResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: -100,
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    expect(negativeAmountResponse.status).to.not.equal(201);
    
    
    const largeAmountResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: 1e20, // Very large number
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    
    if (largeAmountResponse.status === 201) {
      console.log('Large amounts are accepted - ensure they are handled properly in calculations');
    }
  });
  
  
  it('should validate date fields', async () => {
   
    const invalidDateResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: 100,
        category: 'Food',
        description: 'Test transaction',
        date: 'not-a-date'
      });
    
    expect(invalidDateResponse.status).to.not.equal(201);
    
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    
    const futureDateResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: 100,
        category: 'Food',
        description: 'Test transaction',
        date: futureDate
      });
    
    
    if (futureDateResponse.status === 201) {
      console.log('Future dates are accepted - ensure this is intended behavior');
    }
  });
  
  
  it('should validate required fields', async () => {
    // Test missing type
    const missingTypeResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100,
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    expect(missingTypeResponse.status).to.not.equal(201);
    
    
    const missingAmountResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    expect(missingAmountResponse.status).to.not.equal(201);
  });
  
  
  it('should validate enum fields', async () => {
   
    const invalidTypeResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'invalid-type',
        amount: 100,
        category: 'Food',
        description: 'Test transaction',
        date: new Date()
      });
    
    expect(invalidTypeResponse.status).to.not.equal(201);
    
    
    const invalidRecurrenceResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'expense',
        amount: 100,
        category: 'Food',
        description: 'Test transaction',
        date: new Date(),
        recurring: true,
        recurrencePattern: 'invalid-pattern',
        nextTransactionDate: new Date()
      });
    
    expect(invalidRecurrenceResponse.status).to.not.equal(201);
  });
});