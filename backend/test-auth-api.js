const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Authentication API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Test registration
    console.log('2. Testing user registration...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ Registration successful:', {
        success: registerResponse.data.success,
        message: registerResponse.data.message,
        hasToken: !!registerResponse.data.data?.accessToken,
        user: registerResponse.data.data?.user
      });

      // Test 3: Test login with the same user
      console.log('');
      console.log('3. Testing user login...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('✅ Login successful:', {
        success: loginResponse.data.success,
        message: loginResponse.data.message,
        hasToken: !!loginResponse.data.data?.accessToken,
        user: loginResponse.data.data?.user
      });

      // Test 4: Test profile endpoint with token
      console.log('');
      console.log('4. Testing profile endpoint...');
      const token = loginResponse.data.data?.accessToken;
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Profile fetch successful:', {
        success: profileResponse.data.success,
        user: profileResponse.data.data
      });

    } catch (error) {
      if (error.response) {
        console.log('❌ Registration/Login error:', {
          status: error.response.status,
          message: error.response.data.message,
          errors: error.response.data.errors
        });
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ API connection error:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
}

// Run the tests
testAPI();