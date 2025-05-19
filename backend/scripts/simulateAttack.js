/**
 * Script to simulate a suspicious user attack pattern for testing
 * the monitoring system
 * 
 * Run with: node simulateAttack.js <userId> <numRequests>
 * Example: node simulateAttack.js 1 50
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = process.argv[4] || 'generated-after-login';

// Parse command line arguments
const userId = process.argv[2] || 1;
const numRequests = parseInt(process.argv[3] || 30);

// Array of possible actions to simulate
const possibleActions = [
    { method: 'GET', endpoint: '/stocks', name: 'View stocks' },
    { method: 'GET', endpoint: '/stocks/1', name: 'View stock details' },
    { method: 'GET', endpoint: '/users/profile', name: 'View profile' },
    { method: 'PUT', endpoint: '/stocks/1', name: 'Update stock', data: { price: 150 + Math.random() * 100 } },
    { method: 'POST', endpoint: '/stocks', name: 'Create stock', data: { name: `TEST-${Math.floor(Math.random() * 1000)}`, price: 100 + Math.random() * 100 } },
    { method: 'DELETE', endpoint: '/stocks/20', name: 'Delete stock' },
    { method: 'GET', endpoint: '/users', name: 'View users' },
    { method: 'GET', endpoint: '/activity/user/' + userId, name: 'View activity logs' }
];

// Function to simulate a single request
async function makeRequest(action) {
    const config = {
        method: action.method,
        url: `${API_BASE_URL}${action.endpoint}`,
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    };
    
    // Add data for POST/PUT requests
    if (['POST', 'PUT'].includes(action.method) && action.data) {
        config.data = action.data;
    }
    
    try {
        console.log(`Making ${action.method} request to ${action.endpoint} (${action.name})`);
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Request failed:`, error.message);
        return null;
    }
}

// Function to run the attack simulation
async function runAttackSimulation() {
    console.log(`Starting attack simulation for user ${userId} with ${numRequests} requests...`);
    
    // First make login request to get token if not provided
    let token = AUTH_TOKEN;
    if (token === 'generated-after-login') {
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: 'admin',  // Default admin user
                password: 'admin',  // Default admin password
            });
            
            token = loginResponse.data.token;
            console.log(`Got authentication token: ${token.substring(0, 15)}...`);
        } catch (error) {
            console.error('Login failed:', error.message);
            console.log('Continuing with default token, but requests may fail');
        }
    }
    
    // Make random requests in rapid succession
    for (let i = 0; i < numRequests; i++) {
        // Pick a random action
        const actionIndex = Math.floor(Math.random() * possibleActions.length);
        const action = possibleActions[actionIndex];
        
        // Make the request
        await makeRequest(action);
        
        // Small random delay between requests (50-100ms)
        const delay = 50 + Math.floor(Math.random() * 50);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`Attack simulation completed for user ${userId}`);
}

// Run the simulation
runAttackSimulation()
    .then(() => console.log('Simulation completed!'))
    .catch(error => console.error('Simulation failed:', error)); 