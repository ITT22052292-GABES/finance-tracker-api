describe('Goals API Tests', () => {
    let authToken;
    let goalId;
    const testUser = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    const testGoal = {
      name: 'Vacation Fund',
      targetAmount: 5000,
      targetDate: '2025-12-31',
      category: 'Travel',
      autoSave: true,
      autoSaveAmount: 200,
      autoSaveFrequency: 'weekly'
    };
    const contributionAmount = {
      amount: 500,
      createTransaction: true
    };
  
    before(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: testUser
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');
        authToken = response.body.token;
      });
    });
  
    // Test 1: Create a new goal
    it('should create a new goal', () => {
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: testGoal
      }).then((response) => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('_id');
        expect(response.body.name).to.equal(testGoal.name);
        expect(response.body.targetAmount).to.equal(testGoal.targetAmount);
        expect(response.body.userId).to.exist;
        
        
        goalId = response.body._id;
      });
    });
  
    
    it('should retrieve all goals for the user', () => {
      cy.request({
        method: 'GET',
        url: '/api/goals/list',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.at.least(1);
      });
    });
  
    
    it('should retrieve a specific goal by ID', () => {
      cy.request({
        method: 'GET',
        url: `/api/goals/${goalId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body._id).to.equal(goalId);
        expect(response.body.name).to.equal(testGoal.name);
        expect(response.body).to.have.property('progressPercentage');
        expect(response.body).to.have.property('remainingAmount');
        expect(response.body).to.have.property('dailySavingRate');
      });
    });
  
    
    it('should add a contribution to a goal', () => {
      cy.request({
        method: 'POST',
        url: `/api/goals/${goalId}/contribute`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: contributionAmount
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Contribution added successfully');
        expect(response.body.goalId).to.equal(goalId);
        expect(response.body.newAmount).to.be.greaterThan(0);
        expect(response.body).to.have.property('progressPercentage');
      });
    });
  
    
    it('should update a goal', () => {
      const updatedGoal = {
        name: 'Updated Vacation Fund',
        targetAmount: 6000
      };
  
      cy.request({
        method: 'PUT',
        url: `/api/goals/${goalId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updatedGoal
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body._id).to.equal(goalId);
        expect(response.body.name).to.equal(updatedGoal.name);
        expect(response.body.targetAmount).to.equal(updatedGoal.targetAmount);
      });
    });
  
    
    it('should return 404 for non-existent goal', () => {
      cy.request({
        method: 'GET',
        url: '/api/goals/60a1b2c3d4e5f6a7b8c9d0e1',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(404);
        expect(response.body.message).to.equal('Goal not found');
      });
    });
  
    it('should reject goal creation with missing required fields', () => {
      cy.request({
        method: 'POST',
        url: '/api/goals',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          
          category: 'Travel'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Name and target amount are required');
      });
    });
  
    
    it('should reject invalid contribution amount', () => {
      cy.request({
        method: 'POST',
        url: `/api/goals/${goalId}/contribute`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          amount: -100
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Valid amount is required');
      });
    });
  
    
    it('should delete a goal', () => {
      cy.request({
        method: 'DELETE',
        url: `/api/goals/${goalId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Goal deleted successfully');
      });
    });
  
    
    it('should confirm goal was deleted', () => {
      cy.request({
        method: 'GET',
        url: `/api/goals/${goalId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  
    
    it('should reject requests without authorization', () => {
      cy.request({
        method: 'GET',
        url: '/api/goals/list',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(401);
      });
    });
  
  
  });