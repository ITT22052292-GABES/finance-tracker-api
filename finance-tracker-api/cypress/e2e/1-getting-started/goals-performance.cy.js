// cypress/integration/performance/goals-performance.spec.js

describe('Goals API Performance Tests', () => {
    let authToken;
    const testUser = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    before(() => {
      // Login to get auth token before tests
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: testUser
      }).then((response) => {
        expect(response.status).to.equal(200);
        authToken = response.token;
      });
      
      // Create test data - multiple goals for load testing
      for (let i = 0; i < 10; i++) {
        cy.request({
          method: 'POST',
          url: '/api/goals',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            name: `Performance Test Goal ${i}`,
            targetAmount: 1000 + (i * 100),
            category: 'Performance Testing'
          }
        });
      }
    });
    
    after(() => {
      // Clean up test data
      cy.request({
        method: 'GET',
        url: '/api/goals/list',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        response.body.forEach(goal => {
          if (goal.name.includes('Performance Test Goal')) {
            cy.request({
              method: 'DELETE',
              url: `/api/goals/${goal._id}`,
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
          }
        });
      });
    });
  
    // Test 1: Measure response time for listing goals
    it('should retrieve all goals with acceptable response time', () => {
      const startTime = performance.now();
      
      cy.request({
        method: 'GET',
        url: '/api/goals/list',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).to.equal(200);
        expect(responseTime).to.be.lessThan(500); // Response should be under 500ms
        
        cy.log(`Goals list response time: ${responseTime.toFixed(2)}ms`);
        expect(response.body.length).to.be.at.least(10);
      });
    });
  
    // Test 2: Measure response time for creating a goal
    it('should create a goal with acceptable response time', () => {
      const testGoal = {
        name: 'Performance Test - Create',
        targetAmount: 5000,
        category: 'Performance'
      };
      
      const startTime = performance.now();
      
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: testGoal
      }).then((response) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).to.equal(201);
        expect(responseTime).to.be.lessThan(300); // Goal creation should be under 300ms
        
        cy.log(`Goal creation response time: ${responseTime.toFixed(2)}ms`);
      });
    });
  
    // Test 3: Sequential load test - create multiple goals in sequence
    it('should handle sequential goal creation requests', () => {
      const iterations = 5;
      const responseTimesMs = [];
      
      // Create multiple goals sequentially and record times
      for (let i = 0; i < iterations; i++) {
        const goalName = `Performance Test Sequential ${i}`;
        
        const startTime = performance.now();
        
        cy.request({
          method: 'POST',
          url: '/api/goals',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            name: goalName,
            targetAmount: 1000,
            category: 'Load Test'
          }
        }).then((response) => {
          const endTime = performance.now();
          responseTimesMs.push(endTime - startTime);
          
          expect(response.status).to.equal(201);
        });
      }
      
      // After all requests, analyze results
      cy.then(() => {
        const totalTime = responseTimesMs.reduce((sum, time) => sum + time, 0);
        const avgTime = totalTime / iterations;
        const maxTime = Math.max(...responseTimesMs);
        
        cy.log(`Sequential load test results:`);
        cy.log(`Average response time: ${avgTime.toFixed(2)}ms`);
        cy.log(`Maximum response time: ${maxTime.toFixed(2)}ms`);
        cy.log(`Total time for ${iterations} requests: ${totalTime.toFixed(2)}ms`);
        
        expect(avgTime).to.be.lessThan(500); // Average should be under 500ms
        expect(maxTime).to.be.lessThan(1000); // No single request should take more than 1000ms
      });
    });
  
    // Test 4: Stress test - retrieve goal details under load
    it('should handle repeated goal retrieval requests', () => {
      // First, get all goals to choose from
      cy.request({
        method: 'GET',
        url: '/api/goals/list',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        // Select a goal to use for stress testing
        const testGoal = response.body.find(goal => 
          goal.name.includes('Performance Test Goal'));
        
        if (!testGoal) {
          throw new Error('No test goal found for stress test');
        }
        
        const goalId = testGoal._id;
        const iterations = 20;
        const responseTimesMs = [];
        
        // Make multiple requests to the same endpoint
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          cy.request({
            method: 'GET',
            url: `/api/goals/${goalId}`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then((response) => {
            const endTime = performance.now();
            responseTimesMs.push(endTime - startTime);
            
            expect(response.status).to.equal(200);
          });
        }
        
        // After all requests, analyze results
        cy.then(() => {
          const totalTime = responseTimesMs.reduce((sum, time) => sum + time, 0);
          const avgTime = totalTime / iterations;
          const maxTime = Math.max(...responseTimesMs);
          
          cy.log(`Stress test results:`);
          cy.log(`Average response time: ${avgTime.toFixed(2)}ms`);
          cy.log(`Maximum response time: ${maxTime.toFixed(2)}ms`);
          cy.log(`Total time for ${iterations} requests: ${totalTime.toFixed(2)}ms`);
          
          // Define performance expectations
          expect(avgTime).to.be.lessThan(200); // Read operations should be fast
          expect(maxTime).to.be.lessThan(500); // Even worst case should be reasonable
        });
      });
    });
  
    // Test 5: Performance test for goal contributions
    it('should handle goal contributions with acceptable performance', () => {
      // First, create a specific goal for this test
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          name: 'Performance Test - Contributions',
          targetAmount: 10000,
          category: 'Performance'
        }
      }).then((response) => {
        const goalId = response.body._id;
        const iterations = 5;
        const responseTimesMs = [];
        
        // Make multiple contribution requests
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          cy.request({
            method: 'POST',
            url: `/api/goals/${goalId}/contribute`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: {
              amount: 100 + (i * 50),
              createTransaction: true
            }
          }).then((response) => {
            const endTime = performance.now();
            responseTimesMs.push(endTime - startTime);
            
            expect(response.status).to.equal(200);
          });
        }
        
        // After all requests, analyze results
        cy.then(() => {
          const totalTime = responseTimesMs.reduce((sum, time) => sum + time, 0);
          const avgTime = totalTime / iterations;
          const maxTime = Math.max(...responseTimesMs);
          
          cy.log(`Contribution performance test results:`);
          cy.log(`Average response time: ${avgTime.toFixed(2)}ms`);
          cy.log(`Maximum response time: ${maxTime.toFixed(2)}ms`);
          cy.log(`Total time for ${iterations} requests: ${totalTime.toFixed(2)}ms`);
          
          // Contributions are more complex operations as they involve multiple collections
          expect(avgTime).to.be.lessThan(500); // Should be under 500ms on average
          expect(maxTime).to.be.lessThan(800); // Even worst case should be under 800ms
        });
      });
    });
  });