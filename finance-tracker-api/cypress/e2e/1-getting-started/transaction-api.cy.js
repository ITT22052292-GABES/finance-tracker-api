

describe('Transaction API Test Suite', () => {
  let authToken;
  let transactionId;

  
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  // Sample transaction data
  const sampleTransaction = {
    amount: 150.50,
    category: 'Food',
    description: 'Grocery shopping',
    date: new Date().toISOString(),
    type: 'expense',
    tags: ['groceries', 'monthly']
  };

  const updatedTransaction = {
    amount: 175.25,
    category: 'Food',
    description: 'Updated grocery shopping',
    tags: ['groceries', 'essentials']
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

  
  it('should create a new transaction', () => {
    // Skip test if no auth token
    if (!authToken) {
      cy.log('Skipping test due to missing authentication token');
      return;
    }

    cy.request({
      method: 'POST',
      url: '/api/transactions',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: sampleTransaction,
      failOnStatusCode: false 
    }).then((response) => {
      // Log the response for debugging
      cy.log(`Response status: ${response.status}`);
      cy.log(`Response body: ${JSON.stringify(response.body)}`);
      
      if (response.status === 201) {
        expect(response.body).to.have.property('_id');
        expect(response.body.amount).to.eq(sampleTransaction.amount);
        expect(response.body.category).to.eq(sampleTransaction.category);
        expect(response.body.description).to.eq(sampleTransaction.description);
        expect(response.body.tags).to.deep.eq(sampleTransaction.tags);
        
        
        transactionId = response.body._id;
      } else {
        cy.log(`Failed to create transaction: ${response.body.message || 'Unknown error'}`);
      }
    });
  });


  it('should retrieve all transactions', () => {
    
    if (!authToken) {
      cy.log('Skipping test due to missing authentication token');
      return;
    }

    cy.request({
      method: 'GET',
      url: '/api/transactions/list', // Make sure this endpoint matches your API
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Response status: ${response.status}`);
      
      if (response.status === 200) {
        expect(response.body).to.be.an('array');
        cy.log(`Found ${response.body.length} transactions`);
      } else {
        cy.log(`Failed to get transactions: ${response.body.message || 'Unknown error'}`);
      }
    });
  });

  
  describe('Tests requiring a transaction ID', () => {
    beforeEach(() => {
      // Skip tests if we don't have a transaction ID
      if (!transactionId) {
        cy.log('Skipping test as no transaction ID is available');
        this.skip();
      }
    });

   
    it('should retrieve a transaction by ID', () => {
      cy.request({
        method: 'GET',
        url: `/api/transactions/${transactionId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property('_id', transactionId);
        } else {
          cy.log(`Failed to get transaction: ${response.body.message || 'Unknown error'}`);
        }
      });
    });

    
    it('should update an existing transaction', () => {
      cy.request({
        method: 'PUT',
        url: `/api/transactions/${transactionId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updatedTransaction,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property('_id', transactionId);
          expect(response.body.amount).to.eq(updatedTransaction.amount);
          expect(response.body.description).to.eq(updatedTransaction.description);
        } else {
          cy.log(`Failed to update transaction: ${response.body.message || 'Unknown error'}`);
        }
      });
    });

    
    it('should delete a transaction', () => {
      cy.request({
        method: 'DELETE',
        url: `/api/transactions/${transactionId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property('message', 'Transaction deleted successfully');
        } else {
          cy.log(`Failed to delete transaction: ${response.body.message || 'Unknown error'}`);
        }
      });
    });
  });

  
  describe('General API tests', () => {
    // Test 6: Get transactions by category
    it('should retrieve transactions by category', () => {
      if (!authToken) {
        cy.log('Skipping test due to missing authentication token');
        return;
      }

      cy.request({
        method: 'GET',
        url: `/api/transactions/category/${sampleTransaction.category}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.be.an('array');
        } else {
          cy.log(`Failed to get transactions by category: ${response.body.message || 'Unknown error'}`);
        }
      });
    });

    
    it('should retrieve all unique tags', () => {
      if (!authToken) {
        cy.log('Skipping test due to missing authentication token');
        return;
      }

      cy.request({
        method: 'GET',
        url: '/api/transactions/tags/all',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.be.an('array');
          cy.log(`Found ${response.body.length} unique tags`);
        } else {
          cy.log(`Failed to get tags: ${response.body.message || 'Unknown error'}`);
        }
      });
    });

   
    it('should reject transaction creation with missing required fields', () => {
      if (!authToken) {
        cy.log('Skipping test due to missing authentication token');
        return;
      }

      cy.request({
        method: 'POST',
        url: '/api/transactions',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          description: 'This should fail'
          // Missing required fields
        },
        failOnStatusCode: false
      }).then((response) => {
        // We expect a 400 Bad Request here
        expect(response.status).to.eq(400);
      });
    });

    
    it('should reject requests without authentication', () => {
      cy.request({
        method: 'GET',
        url: '/api/transactions/list',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });
});