
import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import User from '../models/User.js';
import {jest} from '@jest/globals';


jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ id: 'mock-user-id', role: 'user' }))
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User Registered Successfully');
      
      // Check if user is saved in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
    });
    
    it('should return 400 if email already exists', async () => {
      // Create a user first
      await new User({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedpassword'
      }).save();
      
      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid Credentials');
    });
  });
});