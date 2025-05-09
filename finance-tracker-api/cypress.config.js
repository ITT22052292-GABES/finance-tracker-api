// cypress.config.js
import { defineConfig } from 'cypress';

// Import MongoDB client

import { MongoClient } from 'mongodb';

// Database connection settings
const dbConfig = {
  url: 'mongodb+srv://it22052292:%40Gavesha70@cluster0.s7luz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  dbName: 'test'
};

// Create a MongoDB client instance
let dbClient = null;
let dbConnection = null;

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    supportFile: 'cypress/support/*.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on, config) {
      // Tasks for database operations
      on('task', {
        // Query database
        async queryDatabase({ collection, query, options = {} }) {
          if (!dbClient) {
            dbClient = new MongoClient(dbConfig.url);
            await dbClient.connect();
            dbConnection = dbClient.db(dbConfig.dbName);
          }
          
          try {
            if (options.findOne === true) {
              return await dbConnection.collection(collection).findOne(query);
            } else if (options.updateOne) {
              return await dbConnection.collection(collection).updateOne(
                query, 
                options.updateOne.update, 
                options.updateOne.options
              );
            } else if (options.insertOne) {
              return await dbConnection.collection(collection).insertOne(options.insertOne);
            } else if (options.deleteOne) {
              return await dbConnection.collection(collection).deleteOne(query);
            } else {
              // Default to find (returns array)
              const result = await dbConnection.collection(collection).find(query).toArray();
              return result;
            }
          } catch (error) {
            console.error(`Database operation failed: ${error.message}`);
            return null;
          }
        },
        
        // Call process auto-savings function
        async callProcessAutoSavings() {
          // In a real implementation, this would call the actual function
          // For the test purposes, we simulate the function call
          
          // Mock implementation of processAutoSavings
          try {
            if (!dbClient) {
              dbClient = new MongoClient(dbConfig.url);
              await dbClient.connect();
              dbConnection = dbClient.db(dbConfig.dbName);
            }
            
            // Find goals with auto-save enabled
            const goals = await dbConnection.collection('goals')
              .find({
                autoSave: true,
                status: 'in-progress'
              })
              .toArray();
              
            // Process each goal - similar to the actual processAutoSavings function
            for (const goal of goals) {
              // Add auto-save amount to current amount
              await dbConnection.collection('goals').updateOne(
                { _id: goal._id },
                { $inc: { currentAmount: goal.autoSaveAmount } }
              );
              
              // Create a transaction record
              await dbConnection.collection('transactions').insertOne({
                userId: goal.userId,
                type: 'expense',
                amount: goal.autoSaveAmount,
                category: 'Savings',
                tags: ['auto-save', goal.name],
                date: new Date(),
                notes: `Auto-save for goal: ${goal.name}`
              });
              
              // Check if goal is completed
              const updatedGoal = await dbConnection.collection('goals').findOne({ _id: goal._id });
              if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
                await dbConnection.collection('goals').updateOne(
                  { _id: goal._id },
                  { $set: { status: 'completed' } }
                );
              }
            }
            
            return { success: true, processed: goals.length };
          } catch (error) {
            console.error(`Auto-save processing failed: ${error.message}`);
            return { success: false, error: error.message };
          }
        },
        
        // Close database connection
        async closeDbConnection() {
          if (dbClient) {
            await dbClient.close();
            dbClient = null;
            dbConnection = null;
          }
          return null;
        }
      });
      
      // Close DB connection when Cypress exits
      on('before:run', async () => {
        if (dbClient) {
          await dbClient.close();
          dbClient = null;
          dbConnection = null;
        }
      });
      
      return config;
    },
  },
});