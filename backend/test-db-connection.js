const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Connection State: ${conn.connection.readyState}`);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({
      test: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'Connection test' });
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
    // Test User model
    const User = require('./models/User');
    console.log('✅ User model loaded successfully');
    
    // Check if we can query users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testConnection();