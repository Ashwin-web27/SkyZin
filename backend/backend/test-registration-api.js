const fetch = require('node-fetch');

const testRegistration = async () => {
  try {
    console.log('Testing registration API endpoint...');
    
    // Test data for registration
    const testUser = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`, // Unique email
      password: 'testpassword123'
    };
    
    console.log('Sending registration request...');
    console.log('Test user data:', { name: testUser.name, email: testUser.email, password: '[HIDDEN]' });
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ Registration API test successful!');
      console.log('User registered successfully:', responseData.data?.user?.name);
    } else {
      console.log('❌ Registration API test failed');
      console.log('Error:', responseData.message);
      if (responseData.errors) {
        console.log('Validation errors:', responseData.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ API test failed with error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running on port 5000');
      console.error('Make sure to start the backend server first with: npm run dev');
    }
  }
};

testRegistration();