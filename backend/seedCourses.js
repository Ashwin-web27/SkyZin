const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./config/database');

const seedCourses = async () => {
  try {
    await connectDB();

    // Find or create an admin user for the courses
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating default admin...');
      adminUser = new User({
        firstName: 'Course',
        lastName: 'Admin',
        email: 'admin@courseplatform.com',
        password: '$2a$10$dummy.hash.for.seeding.purposes', // This should be properly hashed in production
        role: 'admin',
        isActive: true,
        emailVerified: true
      });
      await adminUser.save();
      console.log('Default admin user created');
    }

    // Clear existing courses (optional - remove this if you want to keep existing courses)
    // await Course.deleteMany({});

    const coursesData = [
      {
        title: 'Robotic Process Automation (RPA) Fundamentals',
        description: 'Learn the fundamentals of RPA and how to automate business processes using leading RPA tools. This comprehensive course covers UiPath, Automation Anywhere, and Blue Prism. Master bot development, process mapping, exception handling, and deployment strategies. Perfect for beginners looking to enter the RPA field or professionals wanting to enhance their automation skills.',
        instructor: adminUser._id,
        instructorName: `${adminUser.firstName} ${adminUser.lastName}`,
        price: 299,
        originalPrice: 399,
        status: 'Published',
        category: 'Programming',
        level: 'Beginner',
        duration: 2400, // 40 hours in minutes
        thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        tags: ['RPA', 'Automation', 'UiPath', 'Process Automation', 'Business Process'],
        lessons: [
          {
            title: 'Introduction to RPA',
            content: 'Overview of Robotic Process Automation, its benefits, and use cases in various industries.',
            duration: 60,
            order: 1
          },
          {
            title: 'RPA Tools Overview',
            content: 'Comparison of leading RPA tools: UiPath, Automation Anywhere, and Blue Prism.',
            duration: 90,
            order: 2
          },
          {
            title: 'Building Your First Bot',
            content: 'Hands-on tutorial to create a simple automation bot.',
            duration: 120,
            order: 3
          },
          {
            title: 'Process Mapping and Analysis',
            content: 'Learn how to identify and map processes suitable for automation.',
            duration: 90,
            order: 4
          },
          {
            title: 'Exception Handling',
            content: 'Implementing robust error handling in your automation workflows.',
            duration: 75,
            order: 5
          }
        ],
        isActive: true,
        defaultExpiryDuration: 365 // 1 year access
      },
      {
        title: 'Amazon Web Services (AWS) Cloud Practitioner',
        description: 'Master the fundamentals of AWS cloud computing with this comprehensive course designed for beginners. Learn about core AWS services including EC2, S3, RDS, Lambda, and more. Understand cloud architecture, security best practices, pricing models, and deployment strategies. Prepare for the AWS Cloud Practitioner certification while gaining hands-on experience with the AWS Management Console.',
        instructor: adminUser._id,
        instructorName: `${adminUser.firstName} ${adminUser.lastName}`,
        price: 199,
        originalPrice: 299,
        status: 'Published',
        category: 'Programming',
        level: 'Beginner',
        duration: 3000, // 50 hours in minutes
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        tags: ['AWS', 'Cloud Computing', 'Amazon Web Services', 'Cloud Architecture', 'DevOps'],
        lessons: [
          {
            title: 'Introduction to Cloud Computing',
            content: 'Understanding cloud computing concepts, benefits, and service models (IaaS, PaaS, SaaS).',
            duration: 90,
            order: 1
          },
          {
            title: 'AWS Global Infrastructure',
            content: 'Learn about AWS regions, availability zones, and edge locations.',
            duration: 60,
            order: 2
          },
          {
            title: 'Core AWS Services - EC2',
            content: 'Deep dive into Amazon Elastic Compute Cloud (EC2) instances and management.',
            duration: 150,
            order: 3
          },
          {
            title: 'Storage Services - S3 and EBS',
            content: 'Understanding Amazon S3 bucket management and Elastic Block Store.',
            duration: 120,
            order: 4
          },
          {
            title: 'Database Services - RDS',
            content: 'Introduction to Amazon Relational Database Service and best practices.',
            duration: 105,
            order: 5
          },
          {
            title: 'Serverless Computing - Lambda',
            content: 'Building and deploying serverless applications with AWS Lambda.',
            duration: 135,
            order: 6
          }
        ],
        isActive: true,
        defaultExpiryDuration: 365 // 1 year access
      },
      {
        title: 'Generative AI and Large Language Models',
        description: 'Explore the cutting-edge world of Generative Artificial Intelligence and Large Language Models. Learn about GPT, BERT, and other transformer architectures. Understand prompt engineering, fine-tuning techniques, and real-world applications. This course covers both theoretical concepts and practical implementation using popular frameworks like OpenAI API, Hugging Face, and more. Perfect for developers, data scientists, and AI enthusiasts.',
        instructor: adminUser._id,
        instructorName: `${adminUser.firstName} ${adminUser.lastName}`,
        price: 399,
        originalPrice: 499,
        status: 'Published',
        category: 'Programming',
        level: 'Intermediate',
        duration: 3600, // 60 hours in minutes
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        tags: ['AI', 'Machine Learning', 'GPT', 'LLM', 'Natural Language Processing', 'Deep Learning'],
        lessons: [
          {
            title: 'Introduction to Generative AI',
            content: 'Understanding the fundamentals of generative artificial intelligence and its applications.',
            duration: 90,
            order: 1
          },
          {
            title: 'Transformer Architecture',
            content: 'Deep dive into the transformer model architecture that powers modern LLMs.',
            duration: 120,
            order: 2
          },
          {
            title: 'Large Language Models Overview',
            content: 'Exploring GPT, BERT, T5, and other popular language models.',
            duration: 105,
            order: 3
          },
          {
            title: 'Prompt Engineering Techniques',
            content: 'Master the art of crafting effective prompts for optimal AI responses.',
            duration: 90,
            order: 4
          },
          {
            title: 'Fine-tuning and Transfer Learning',
            content: 'Learn how to customize pre-trained models for specific tasks.',
            duration: 150,
            order: 5
          },
          {
            title: 'Working with OpenAI API',
            content: 'Practical implementation using OpenAI GPT models in applications.',
            duration: 120,
            order: 6
          },
          {
            title: 'Building AI Applications',
            content: 'Creating end-to-end applications with generative AI capabilities.',
            duration: 180,
            order: 7
          }
        ],
        isActive: true,
        defaultExpiryDuration: 365 // 1 year access
      }
    ];

    // Insert courses
    for (const courseData of coursesData) {
      // Check if course already exists
      const existingCourse = await Course.findOne({ title: courseData.title });
      
      if (existingCourse) {
        console.log(`Course "${courseData.title}" already exists. Skipping...`);
        continue;
      }

      const course = new Course(courseData);
      await course.save();
      console.log(`✅ Created course: ${course.title}`);
    }

    console.log('\n🎉 Course seeding completed successfully!');
    console.log('\nCourses created:');
    console.log('1. Robotic Process Automation (RPA) Fundamentals - $299');
    console.log('2. Amazon Web Services (AWS) Cloud Practitioner - $199');
    console.log('3. Generative AI and Large Language Models - $399');

  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
  }
};

// Run the seed function
if (require.main === module) {
  seedCourses();
}

module.exports = seedCourses;