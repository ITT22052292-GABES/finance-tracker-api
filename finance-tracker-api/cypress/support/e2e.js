// cypress/support/commands.js

// Custom command for login and getting auth token
Cypress.Commands.add('login', (email, password) => {
    return cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password }
    }).then((response) => {
      expect(response.status).to.equal(200);
      return response.token;
    });
  });
  
  // Custom command for creating a test goal
  Cypress.Commands.add('createTestGoal', (token, goalData) => {
    return cy.request({
      method: 'POST',
      url: '/api/goals',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: goalData
    }).then((response) => {
      expect(response.status).to.equal(201);
      return response.body._id;
    });
  });
  
 
  