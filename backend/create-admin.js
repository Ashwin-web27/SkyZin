const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'ashwinkulthe@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Ashwin Kulthe',
      email: 'ashwinkulthe@gmail.com',
      password: 'Pass@12345',
      role: 'admin',
      status: 'Active',
      emailVerified: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: ashwinkulthe@gmail.com');
    console.log('Password: Pass@12345');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();