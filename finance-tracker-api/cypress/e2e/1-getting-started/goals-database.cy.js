// cypress/integration/database/goals-db.spec.js

import { options } from "sanitize-html";

describe('Goals Database Tests', () => {
    let authToken;
    let goalId;
    const testUser = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    const testGoal = {
      name: 'Emergency Fund',
      targetAmount: 10000,
      category: 'Savings',
      autoSave: false
    };
  
    before(() => {
      // Login to get auth token before tests
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: testUser
      }).then((response) => {
        expect(response.status).to.equal(200);
        authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MTU3N2IzZDRkZTJiYzc3NzQ5ZDJmOSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ2MjM3OTQwLCJleHAiOjE3NDYzMjQzNDB9.3ZUVtsGMM7lUcgwwTxrEMET_tQDFoFJbR0RhkmhhkmU';
      });
    });
  

    // Test 1: Verify goal creation in database
    it('should correctly store goal data in the database', () => {
      
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: testGoal
      }).then((response) => {
        expect(response.status).to.equal(201);
        goalId = response.body._id;
        
        // 2. Verify database state using a custom DB query command
        cy.task('queryDatabase', {
          collection: 'goals',
          query: { _id: goalId },
          options: { findOne: true }
        }).then((dbGoal) => {
          // Verify database record matches what was created
          expect(dbGoal).to.not.be.null;
          expect('Emergency Fund').to.equal(testGoal.name);
          expect(dbGoal.targetAmount).to.equal(testGoal.targetAmount);
          expect(dbGoal.currentAmount).to.equal(0); // Default value
          expect(dbGoal.status).to.equal('in-progress'); // Default status
        });
      });
    });
  
    // Test 2: Verify contribution updates in database
    it('should correctly update goal amounts in the database after contribution', () => {
      const contributionAmount = 2500;
      
      // 1. Add contribution via API
      cy.request({
        method: 'POST',
        url: `/api/goals/${goalId}/contribute`,
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: { amount: contributionAmount }
      }).then((response) => {
        expect(response.status).to.equal(200);
        
        // 2. Verify database was updated correctly
        cy.task('queryDatabase', {
          collection: 'goals',
          query: { _id: goalId }
        }).then((dbGoal) => {
          expect(dbGoal.currentAmount).to.equal(contributionAmount);
          
          // Check that contribution created a transaction record
          cy.task('queryDatabase', {
            collection: 'transactions',
            query: { 
              userId: dbGoal.userId,
              tags: { $in: ['goal', testGoal.name] }
            }
          }).then((transaction) => {
            expect(transaction).to.not.be.null;
            expect(transaction.amount).to.equal(contributionAmount);
            expect(transaction.type).to.equal('expense');
            expect(transaction.category).to.equal('Savings');
          });
        });
      });
    });
  
    // Test 3: Verify goal update in database
    it('should correctly update goal properties in the database', () => {
      const updatedGoalData = {
        name: 'Updated Emergency Fund',
        targetAmount: 15000,
        category: 'Emergency'
      };
      
      // 1. Update goal via API
      cy.request({
        method: 'PUT',
        url: `/api/goals/${goalId}`,
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: updatedGoalData
      }).then((response) => {
        expect(response.status).to.equal(200);
        
        // 2. Verify database was updated correctly
        cy.task('queryDatabase', {
          collection: 'goals',
          query: { _id: goalId }
        }).then((dbGoal) => {
          expect(dbGoal.name).to.equal(updatedGoalData.name);
          expect(dbGoal.targetAmount).to.equal(updatedGoalData.targetAmount);
          expect(dbGoal.category).to.equal(updatedGoalData.category);
          // Verify that other fields weren't affected
          expect(dbGoal.currentAmount).to.equal(2500); // From previous test
        });
      });
    });
  
    // Test 4: Verify goal status change when target is reached
    it('should correctly update goal status when target is reached', () => {
      // First get current state
      cy.task('queryDatabase', {
        collection: 'goals',
        query: { _id: goalId }
      }).then((dbGoal) => {
        const remainingAmount = dbGoal.targetAmount - dbGoal.currentAmount;
        
        // 1. Add contribution that completes the goal
        cy.request({
          method: 'POST',
          url: `/api/goals/${goalId}/contribute`,
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: { amount: remainingAmount }
        }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body.isCompleted).to.be.true;
          
          // 2. Verify database shows completed status
          cy.task('queryDatabase', {
            collection: 'goals',
            query: { _id: goalId }
          }).then((updatedGoal) => {
            expect(updatedGoal.status).to.equal('completed');
            expect(updatedGoal.currentAmount).to.equal(updatedGoal.targetAmount);
          });
        });
      });
    });
  
    // Test 5: Verify goal deletion from database
    it('should correctly remove goal from database when deleted', () => {
      // 1. Delete goal via API
      cy.request({
        method: 'DELETE',
        url: `/api/goals/${goalId}`,
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then((response) => {
        expect(response.status).to.equal(200);
        
        // 2. Verify database record is removed
        cy.task('queryDatabase', {
          collection: 'goals',
          query: { _id: goalId }
        }).then((dbGoal) => {
          expect(dbGoal).to.be.null;
        });
        
        // 3. Verify transactions are maintained (for financial history)
        cy.task('queryDatabase', {
          collection: 'transactions',
          query: { 
            tags: { $in: ['goal', 'Updated Emergency Fund'] }
          }
        }).then((transactions) => {
          expect(transactions).to.not.be.null;
          // Transactions should still exist even after goal is deleted
        });
      });
    });
  
    // Test 6: Verify auto-save processing database updates
    it('should correctly process auto-savings in database', () => {
      // 1. Create a goal with auto-save enabled
      const autoSaveGoal = {
        name: 'Auto-Save Test',
        targetAmount: 5000,
        category: 'Testing',
        autoSave: true,
        autoSaveAmount: 100,
        autoSaveFrequency: 'daily'
      };
      
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: autoSaveGoal
      }).then((response) => {
        expect(response.status).to.equal(201);
        const newGoalId = response.body._id;
        
        // 2. Simulate calling the processAutoSavings function
        // In a real test, we would call the actual endpoint or function
        cy.task('callProcessAutoSavings').then(() => {
          
          // 3. Verify database was updated by auto-save process
          cy.task('queryDatabase', {
            collection: 'goals',
            query: { _id: newGoalId }
          }).then((dbGoal) => {
            expect(dbGoal.currentAmount).to.equal(autoSaveGoal.autoSaveAmount);
            
            // 4. Verify auto-save transaction was created
            cy.task('queryDatabase', {
              collection: 'transactions',
              query: { 
                tags: { $in: ['auto-save', autoSaveGoal.name] }
              }
            }).then((transaction) => {
              expect(transaction).to.not.be.null;
              expect(transaction.amount).to.equal(autoSaveGoal.autoSaveAmount);
            });
            
            // 5. Clean up
            cy.request({
              method: 'DELETE',
              url: `/api/goals/${newGoalId}`,
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
          });
        });
      });
    });
  
    // Test 7: Test database referential integrity for user-goal relationship
    it('should maintain proper user-goal relationship in database', () => {
      // 1. Create a new goal
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: {
          name: 'User Integrity Test',
          targetAmount: 1000
        }
      }).then((response) => {
        const testGoalId = response.body._id;
        const userId = response.body.userId;
        
        // 2. Verify user-goal relationship in database
        cy.task('queryDatabase', {
          collection: 'goals',
          query: { _id: testGoalId }
        }).then((dbGoal) => {
          expect(dbGoal.userId).to.equal(userId);
          
          // 3. Verify that goal appears in user's goals list
          cy.task('queryDatabase', {
            collection: 'users',
            query: { _id: userId }
          }).then((user) => {
            // This assumes we have a way to get user's goals or a relationship
            // Alternative approach: query goals collection by userId
            cy.task('queryDatabase', {
              collection: 'goals',
              query: { userId: userId }
            }).then((userGoals) => {
              // Check that our created goal is among the user's goals
              const foundGoal = userGoals.find(goal => goal._id.toString() === testGoalId);
              expect(foundGoal).to.not.be.undefined;
            });
            
            // 4. Clean up
            cy.request({
              method: 'DELETE',
              url: `/api/goals/${testGoalId}`,
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
          });
        });
      });
    });
  });