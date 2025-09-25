const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

const courses = [
  // RPA Course
  {
    title: "Complete RPA Development with UiPath",
    slug: "complete-rpa-development-uipath",
    description: "Master Robotic Process Automation (RPA) with UiPath from beginner to advanced level. Learn to build automation workflows, handle exceptions, and deploy enterprise-grade RPA solutions.",
    shortDescription: "Master RPA with UiPath - from basics to enterprise automation solutions",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop",
    category: "Automation",
    subcategory: "RPA",
    level: "Advanced",
    duration: 2400, // 40 hours
    language: "English",
    subtitles: ["English", "Spanish"],
    price: 149.99,
    originalPrice: 199.99,
    currency: "USD",
    instructorName: "Sarah Johnson",
    instructorBio: "Senior RPA Developer with 8+ years experience at Fortune 500 companies",
    instructorImage: "https://images.unsplash.com/photo-1494790108755-2616b612b1ad?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    totalRatings: 1245,
    totalStudents: 8760,
    whatYoullLearn: [
      "Build complete automation workflows using UiPath",
      "Handle different types of data and applications",
      "Implement exception handling and error management",
      "Deploy RPA solutions in enterprise environments",
      "Use UiPath Orchestrator for bot management",
      "Create reusable automation components",
      "Integrate APIs and databases in automation",
      "Best practices for RPA development lifecycle"
    ],
    prerequisites: [
      "Basic computer skills",
      "No programming experience required",
      "Access to Windows computer for UiPath installation"
    ],
    modules: [
      {
        title: "Introduction to RPA and UiPath",
        description: "Understanding RPA concepts and setting up UiPath",
        duration: 180,
        lessons: [
          { title: "What is RPA and its benefits", duration: 25, type: "video" },
          { title: "UiPath Studio Installation", duration: 30, type: "video" },
          { title: "UiPath Interface Overview", duration: 20, type: "video" },
          { title: "Your First Automation", duration: 35, type: "hands-on" },
          { title: "RPA Best Practices", duration: 25, type: "video" },
          { title: "Module 1 Quiz", duration: 15, type: "quiz" },
          { title: "Practice Exercise", duration: 30, type: "assignment" }
        ]
      },
      {
        title: "Data Manipulation and Variables",
        description: "Working with different data types and variables in UiPath",
        duration: 240,
        lessons: [
          { title: "Variables and Arguments", duration: 30, type: "video" },
          { title: "String Manipulation", duration: 35, type: "video" },
          { title: "Collections and Arrays", duration: 40, type: "video" },
          { title: "DateTime Operations", duration: 25, type: "video" },
          { title: "Data Table Operations", duration: 45, type: "hands-on" },
          { title: "File and Folder Operations", duration: 35, type: "video" },
          { title: "Practice Project", duration: 30, type: "assignment" }
        ]
      },
      {
        title: "UI Automation and Selectors",
        description: "Automating desktop and web applications",
        duration: 300,
        lessons: [
          { title: "Understanding Selectors", duration: 40, type: "video" },
          { title: "Recording Techniques", duration: 35, type: "video" },
          { title: "Web Automation", duration: 50, type: "hands-on" },
          { title: "Desktop Automation", duration: 45, type: "hands-on" },
          { title: "Dynamic Selectors", duration: 40, type: "video" },
          { title: "Image and OCR Automation", duration: 30, type: "video" },
          { title: "Advanced UI Techniques", duration: 35, type: "video" },
          { title: "Real-world Project", duration: 25, type: "assignment" }
        ]
      },
      {
        title: "Excel and Database Automation",
        description: "Automating Excel operations and database interactions",
        duration: 360,
        lessons: [
          { title: "Excel Application Scope", duration: 30, type: "video" },
          { title: "Reading and Writing Excel", duration: 45, type: "hands-on" },
          { title: "Excel Formulas and Macros", duration: 40, type: "video" },
          { title: "Database Connections", duration: 35, type: "video" },
          { title: "SQL Queries in UiPath", duration: 50, type: "hands-on" },
          { title: "Email Automation", duration: 40, type: "video" },
          { title: "PDF Processing", duration: 35, type: "video" },
          { title: "Integration Project", duration: 85, type: "assignment" }
        ]
      },
      {
        title: "Exception Handling and Debugging",
        description: "Building robust automation with proper error handling",
        duration: 280,
        lessons: [
          { title: "Exception Handling Concepts", duration: 30, type: "video" },
          { title: "Try-Catch Activities", duration: 40, type: "hands-on" },
          { title: "Retry and Timeout Mechanisms", duration: 35, type: "video" },
          { title: "Logging and Monitoring", duration: 40, type: "video" },
          { title: "Debugging Techniques", duration: 45, type: "hands-on" },
          { title: "Error Recovery Strategies", duration: 30, type: "video" },
          { title: "Robust Automation Project", duration: 60, type: "assignment" }
        ]
      },
      {
        title: "UiPath Orchestrator and Deployment",
        description: "Managing and deploying RPA solutions at enterprise scale",
        duration: 320,
        lessons: [
          { title: "Orchestrator Overview", duration: 25, type: "video" },
          { title: "Publishing Processes", duration: 35, type: "hands-on" },
          { title: "Robot Management", duration: 30, type: "video" },
          { title: "Queue Management", duration: 45, type: "hands-on" },
          { title: "Asset Management", duration: 30, type: "video" },
          { title: "Scheduling and Monitoring", duration: 40, type: "video" },
          { title: "Security and Compliance", duration: 35, type: "video" },
          { title: "Enterprise Deployment", duration: 80, type: "assignment" }
        ]
      },
      {
        title: "Advanced RPA Concepts",
        description: "Advanced automation techniques and AI integration",
        duration: 400,
        lessons: [
          { title: "REFramework Introduction", duration: 45, type: "video" },
          { title: "State Machine Workflows", duration: 40, type: "video" },
          { title: "Custom Activities", duration: 50, type: "hands-on" },
          { title: "AI Computer Vision", duration: 45, type: "video" },
          { title: "Document Understanding", duration: 55, type: "hands-on" },
          { title: "API Integration", duration: 40, type: "video" },
          { title: "Performance Optimization", duration: 35, type: "video" },
          { title: "Capstone Project", duration: 90, type: "assignment" }
        ]
      }
    ],
    tags: ["RPA", "UiPath", "Automation", "Process Automation", "Enterprise", "No-Code"],
    status: "Published",
    featured: true,
    trending: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // AWS Course
  {
    title: "AWS Certified Solutions Architect - Complete Guide",
    slug: "aws-certified-solutions-architect-complete-guide",
    description: "Master Amazon Web Services (AWS) and become a certified Solutions Architect. Learn to design, deploy, and manage scalable, secure, and cost-effective cloud solutions on AWS.",
    shortDescription: "Master AWS cloud architecture and pass the Solutions Architect certification exam",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop",
    category: "Cloud Computing",
    subcategory: "AWS",
    level: "Advanced",
    duration: 3000, // 50 hours
    language: "English",
    subtitles: ["English", "Spanish", "French"],
    price: 199.99,
    originalPrice: 299.99,
    currency: "USD",
    instructorName: "Michael Chen",
    instructorBio: "AWS Certified Solutions Architect Professional with 10+ years cloud experience",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    totalRatings: 2156,
    totalStudents: 12450,
    whatYoullLearn: [
      "Design highly available and scalable AWS architectures",
      "Master core AWS services like EC2, S3, VPC, and RDS",
      "Implement security best practices and compliance",
      "Optimize costs and performance in AWS",
      "Design disaster recovery and backup strategies",
      "Use Infrastructure as Code with CloudFormation",
      "Implement monitoring and logging solutions",
      "Pass the AWS Solutions Architect certification exam"
    ],
    prerequisites: [
      "Basic understanding of IT concepts",
      "Some experience with networking concepts",
      "Recommended: basic Linux/Windows administration",
      "AWS Free Tier account (we'll help you create one)"
    ],
    modules: [
      {
        title: "AWS Fundamentals and Global Infrastructure",
        description: "Understanding AWS basics, regions, availability zones, and core concepts",
        duration: 300,
        lessons: [
          { title: "Introduction to Cloud Computing", duration: 30, type: "video" },
          { title: "AWS Global Infrastructure", duration: 35, type: "video" },
          { title: "AWS Management Console", duration: 25, type: "hands-on" },
          { title: "AWS CLI and SDK Setup", duration: 40, type: "hands-on" },
          { title: "AWS Pricing Models", duration: 30, type: "video" },
          { title: "AWS Support Plans", duration: 20, type: "video" },
          { title: "Free Tier and Billing Setup", duration: 45, type: "hands-on" },
          { title: "AWS Well-Architected Framework", duration: 35, type: "video" },
          { title: "Hands-on Lab: Console Navigation", duration: 40, type: "assignment" }
        ]
      },
      {
        title: "Identity and Access Management (IAM)",
        description: "Securing AWS resources with proper access controls",
        duration: 280,
        lessons: [
          { title: "IAM Fundamentals", duration: 35, type: "video" },
          { title: "Users, Groups, and Roles", duration: 40, type: "hands-on" },
          { title: "Policies and Permissions", duration: 45, type: "video" },
          { title: "Multi-Factor Authentication", duration: 25, type: "hands-on" },
          { title: "Cross-Account Access", duration: 30, type: "video" },
          { title: "IAM Best Practices", duration: 25, type: "video" },
          { title: "Security Token Service (STS)", duration: 30, type: "video" },
          { title: "IAM Lab: Secure Architecture", duration: 50, type: "assignment" }
        ]
      },
      {
        title: "Amazon EC2 and Instance Management",
        description: "Mastering virtual servers and compute resources in AWS",
        duration: 420,
        lessons: [
          { title: "EC2 Instance Types and Families", duration: 40, type: "video" },
          { title: "Launching Your First EC2 Instance", duration: 45, type: "hands-on" },
          { title: "Security Groups and Network ACLs", duration: 50, type: "video" },
          { title: "Key Pairs and SSH Access", duration: 30, type: "hands-on" },
          { title: "Elastic Block Store (EBS)", duration: 45, type: "video" },
          { title: "Snapshots and AMIs", duration: 40, type: "hands-on" },
          { title: "Auto Scaling Groups", duration: 50, type: "video" },
          { title: "Elastic Load Balancers", duration: 45, type: "hands-on" },
          { title: "EC2 Placement Groups", duration: 25, type: "video" },
          { title: "Spot Instances and Reserved Instances", duration: 35, type: "video" },
          { title: "EC2 Lab: Scalable Web Application", duration: 35, type: "assignment" }
        ]
      },
      {
        title: "Amazon S3 and Storage Services",
        description: "Object storage, archiving, and data management in AWS",
        duration: 350,
        lessons: [
          { title: "S3 Fundamentals and Storage Classes", duration: 40, type: "video" },
          { title: "Buckets, Objects, and Versioning", duration: 45, type: "hands-on" },
          { title: "S3 Security and Access Control", duration: 40, type: "video" },
          { title: "S3 Static Website Hosting", duration: 35, type: "hands-on" },
          { title: "S3 Lifecycle Policies", duration: 30, type: "video" },
          { title: "S3 Cross-Region Replication", duration: 35, type: "hands-on" },
          { title: "CloudFront CDN Integration", duration: 40, type: "video" },
          { title: "Glacier and Deep Archive", duration: 25, type: "video" },
          { title: "Storage Gateway", duration: 30, type: "video" },
          { title: "S3 Lab: Content Distribution", duration: 30, type: "assignment" }
        ]
      },
      {
        title: "Virtual Private Cloud (VPC) and Networking",
        description: "Designing secure and scalable network architectures",
        duration: 400,
        lessons: [
          { title: "VPC Fundamentals", duration: 40, type: "video" },
          { title: "Subnets and Route Tables", duration: 45, type: "hands-on" },
          { title: "Internet and NAT Gateways", duration: 40, type: "video" },
          { title: "Security Groups vs NACLs", duration: 35, type: "video" },
          { title: "VPC Peering", duration: 35, type: "hands-on" },
          { title: "VPN Connections", duration: 40, type: "video" },
          { title: "Direct Connect", duration: 30, type: "video" },
          { title: "Transit Gateway", duration: 35, type: "video" },
          { title: "VPC Endpoints", duration: 30, type: "hands-on" },
          { title: "DNS and Route 53", duration: 40, type: "video" },
          { title: "VPC Lab: Multi-Tier Architecture", duration: 30, type: "assignment" }
        ]
      },
      {
        title: "Databases and Analytics",
        description: "AWS database services and data analytics solutions",
        duration: 380,
        lessons: [
          { title: "RDS and Aurora", duration: 50, type: "video" },
          { title: "DynamoDB NoSQL Database", duration: 45, type: "hands-on" },
          { title: "ElastiCache for Caching", duration: 35, type: "video" },
          { title: "Redshift Data Warehouse", duration: 40, type: "video" },
          { title: "Database Migration Service", duration: 30, type: "video" },
          { title: "Kinesis for Streaming Data", duration: 35, type: "hands-on" },
          { title: "EMR and Big Data", duration: 30, type: "video" },
          { title: "Athena and QuickSight", duration: 35, type: "video" },
          { title: "Database Backup and Recovery", duration: 30, type: "video" },
          { title: "Database Lab: Multi-Database Solution", duration: 50, type: "assignment" }
        ]
      },
      {
        title: "Application Services and Integration",
        description: "Microservices, messaging, and application integration",
        duration: 320,
        lessons: [
          { title: "Simple Queue Service (SQS)", duration: 40, type: "video" },
          { title: "Simple Notification Service (SNS)", duration: 35, type: "hands-on" },
          { title: "API Gateway", duration: 45, type: "video" },
          { title: "AWS Lambda Functions", duration: 50, type: "hands-on" },
          { title: "Step Functions", duration: 30, type: "video" },
          { title: "Elastic Beanstalk", duration: 35, type: "video" },
          { title: "Container Services (ECS/EKS)", duration: 45, type: "video" },
          { title: "Application Integration Lab", duration: 40, type: "assignment" }
        ]
      },
      {
        title: "Monitoring, Security, and Compliance",
        description: "AWS monitoring tools, security services, and compliance frameworks",
        duration: 350,
        lessons: [
          { title: "CloudWatch Monitoring", duration: 45, type: "video" },
          { title: "CloudTrail Auditing", duration: 35, type: "hands-on" },
          { title: "Config and Compliance", duration: 40, type: "video" },
          { title: "Inspector and Macie", duration: 30, type: "video" },
          { title: "GuardDuty and Security Hub", duration: 35, type: "video" },
          { title: "WAF and Shield", duration: 30, type: "hands-on" },
          { title: "KMS and CloudHSM", duration: 40, type: "video" },
          { title: "Certificate Manager", duration: 25, type: "video" },
          { title: "Security Lab: Comprehensive Security", duration: 70, type: "assignment" }
        ]
      },
      {
        title: "Exam Preparation and Practice",
        description: "Final review, practice exams, and certification tips",
        duration: 200,
        lessons: [
          { title: "Exam Format and Strategy", duration: 30, type: "video" },
          { title: "Practice Exam 1", duration: 90, type: "quiz" },
          { title: "Practice Exam 2", duration: 90, type: "quiz" },
          { title: "Final Review Session", duration: 40, type: "video" }
        ]
      }
    ],
    tags: ["AWS", "Cloud Computing", "Solutions Architect", "Certification", "Infrastructure", "DevOps"],
    status: "Published",
    featured: true,
    trending: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Generative AI Course
  {
    title: "Generative AI Mastery: From GPT to DALL-E",
    slug: "generative-ai-mastery-gpt-dalle",
    description: "Master Generative AI technologies including GPT, DALL-E, Midjourney, and Stable Diffusion. Learn to build AI applications, prompt engineering, and integrate AI into your projects.",
    shortDescription: "Master Generative AI - Build AI applications with GPT, DALL-E, and more",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    category: "Artificial Intelligence",
    subcategory: "Generative AI",
    level: "Intermediate",
    duration: 2800, // 46+ hours
    language: "English",
    subtitles: ["English", "Spanish", "French", "German"],
    price: 179.99,
    originalPrice: 249.99,
    currency: "USD",
    instructorName: "Dr. Emily Rodriguez",
    instructorBio: "AI Research Scientist and former OpenAI researcher with 12+ years in ML/AI",
    instructorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    totalRatings: 1876,
    totalStudents: 9340,
    whatYoullLearn: [
      "Master prompt engineering for optimal AI outputs",
      "Build applications with GPT-3/4 and ChatGPT API",
      "Create stunning images with DALL-E and Midjourney",
      "Understand transformer architecture and attention mechanisms",
      "Fine-tune language models for specific tasks",
      "Deploy AI applications in production environments",
      "Implement ethical AI practices and bias mitigation",
      "Build complete AI-powered products and services"
    ],
    prerequisites: [
      "Basic programming knowledge (Python preferred)",
      "High school level mathematics",
      "Curiosity about AI and machine learning",
      "Computer with internet connection for API access"
    ],
    modules: [
      {
        title: "Introduction to Generative AI",
        description: "Understanding the fundamentals of generative artificial intelligence",
        duration: 240,
        lessons: [
          { title: "What is Generative AI?", duration: 25, type: "video" },
          { title: "Brief History of AI and ML", duration: 30, type: "video" },
          { title: "Types of Generative Models", duration: 35, type: "video" },
          { title: "Current Applications and Use Cases", duration: 30, type: "video" },
          { title: "Setting Up Development Environment", duration: 40, type: "hands-on" },
          { title: "OpenAI API Setup and First Call", duration: 35, type: "hands-on" },
          { title: "Ethics and Responsible AI", duration: 25, type: "video" },
          { title: "Introduction Assessment", duration: 20, type: "quiz" }
        ]
      },
      {
        title: "Understanding Large Language Models",
        description: "Deep dive into LLMs, transformers, and how they work",
        duration: 320,
        lessons: [
          { title: "Evolution from RNNs to Transformers", duration: 40, type: "video" },
          { title: "Attention Mechanism Explained", duration: 45, type: "video" },
          { title: "GPT Architecture Deep Dive", duration: 50, type: "video" },
          { title: "Training Process and Data Requirements", duration: 40, type: "video" },
          { title: "Model Parameters and Scaling Laws", duration: 25, type: "video" },
          { title: "GPT-3 vs GPT-4 vs Other Models", duration: 30, type: "video" },
          { title: "Limitations and Challenges", duration: 25, type: "video" },
          { title: "Hands-on: Model Comparison", duration: 35, type: "hands-on" },
          { title: "LLM Knowledge Check", duration: 30, type: "quiz" }
        ]
      },
      {
        title: "Prompt Engineering Mastery",
        description: "Master the art and science of crafting effective AI prompts",
        duration: 400,
        lessons: [
          { title: "Prompt Engineering Fundamentals", duration: 35, type: "video" },
          { title: "Zero-shot vs Few-shot Prompting", duration: 40, type: "video" },
          { title: "Chain of Thought Prompting", duration: 45, type: "hands-on" },
          { title: "Role-based and Persona Prompting", duration: 35, type: "hands-on" },
          { title: "Advanced Prompting Techniques", duration: 50, type: "video" },
          { title: "Prompt Optimization Strategies", duration: 40, type: "video" },
          { title: "Handling Model Limitations", duration: 30, type: "video" },
          { title: "Temperature and Parameter Tuning", duration: 35, type: "hands-on" },
          { title: "Prompt Templates and Libraries", duration: 30, type: "video" },
          { title: "Build Your Prompt Library", duration: 60, type: "assignment" }
        ]
      },
      {
        title: "Working with ChatGPT and GPT-4 API",
        description: "Building applications using OpenAI's powerful language models",
        duration: 450,
        lessons: [
          { title: "OpenAI API Overview and Authentication", duration: 30, type: "video" },
          { title: "Chat Completions API Deep Dive", duration: 45, type: "hands-on" },
          { title: "Function Calling and Tools", duration: 55, type: "hands-on" },
          { title: "Streaming Responses", duration: 35, type: "hands-on" },
          { title: "Building a Chatbot Interface", duration: 60, type: "hands-on" },
          { title: "Context Management and Memory", duration: 40, type: "video" },
          { title: "Error Handling and Rate Limiting", duration: 35, type: "video" },
          { title: "Cost Optimization Techniques", duration: 25, type: "video" },
          { title: "Building a Customer Support Bot", duration: 75, type: "assignment" },
          { title: "API Best Practices", duration: 30, type: "video" },
          { title: "Testing and Monitoring AI Apps", duration: 20, type: "video" }
        ]
      },
      {
        title: "Image Generation with DALL-E and Midjourney",
        description: "Create stunning AI-generated images and artwork",
        duration: 350,
        lessons: [
          { title: "Introduction to AI Image Generation", duration: 30, type: "video" },
          { title: "DALL-E 2 and DALL-E 3 Overview", duration: 35, type: "video" },
          { title: "DALL-E API Integration", duration: 40, type: "hands-on" },
          { title: "Image Editing and Variations", duration: 45, type: "hands-on" },
          { title: "Midjourney Setup and Basics", duration: 40, type: "hands-on" },
          { title: "Advanced Midjourney Techniques", duration: 50, type: "hands-on" },
          { title: "Stable Diffusion Introduction", duration: 35, type: "video" },
          { title: "Prompt Engineering for Images", duration: 45, type: "video" },
          { title: "Style Transfer and Artistic Control", duration: 30, type: "hands-on" },
          { title: "Build an AI Art Generator", duration: 50, type: "assignment" }
        ]
      },
      {
        title: "Advanced AI Models and Techniques",
        description: "Exploring cutting-edge AI models and implementation techniques",
        duration: 380,
        lessons: [
          { title: "Claude and Anthropic Models", duration: 35, type: "video" },
          { title: "Google Bard and PaLM", duration: 30, type: "video" },
          { title: "Open Source Alternatives", duration: 40, type: "video" },
          { title: "Hugging Face Transformers", duration: 50, type: "hands-on" },
          { title: "Model Fine-tuning Basics", duration: 55, type: "hands-on" },
          { title: "RAG (Retrieval Augmented Generation)", duration: 45, type: "video" },
          { title: "Vector Databases and Embeddings", duration: 40, type: "hands-on" },
          { title: "LangChain Framework", duration: 45, type: "hands-on" },
          { title: "Build a Knowledge Base AI", duration: 40, type: "assignment" }
        ]
      },
      {
        title: "Multimodal AI and Advanced Applications",
        description: "Working with AI that handles text, images, audio, and video",
        duration: 320,
        lessons: [
          { title: "Introduction to Multimodal AI", duration: 30, type: "video" },
          { title: "GPT-4 Vision Capabilities", duration: 40, type: "hands-on" },
          { title: "Image-to-Text and OCR", duration: 35, type: "hands-on" },
          { title: "Speech-to-Text with Whisper", duration: 45, type: "hands-on" },
          { title: "Text-to-Speech Solutions", duration: 35, type: "hands-on" },
          { title: "Video Analysis and Generation", duration: 40, type: "video" },
          { title: "Building Multimodal Applications", duration: 55, type: "hands-on" },
          { title: "AI Assistant Project", duration: 60, type: "assignment" }
        ]
      },
      {
        title: "Production Deployment and Scaling",
        description: "Deploying AI applications at scale with proper architecture",
        duration: 280,
        lessons: [
          { title: "Production Architecture Patterns", duration: 35, type: "video" },
          { title: "API Gateway and Load Balancing", duration: 40, type: "video" },
          { title: "Caching Strategies for AI Apps", duration: 30, type: "video" },
          { title: "Monitoring and Logging", duration: 35, type: "hands-on" },
          { title: "Cost Management and Optimization", duration: 30, type: "video" },
          { title: "Security and Privacy Considerations", duration: 35, type: "video" },
          { title: "A/B Testing AI Features", duration: 25, type: "video" },
          { title: "Deploy to Cloud Platforms", duration: 50, type: "hands-on" }
        ]
      },
      {
        title: "Business Applications and Case Studies",
        description: "Real-world applications and successful AI implementation case studies",
        duration: 250,
        lessons: [
          { title: "AI in Content Creation", duration: 30, type: "video" },
          { title: "Customer Service Automation", duration: 35, type: "video" },
          { title: "Educational AI Applications", duration: 30, type: "video" },
          { title: "Healthcare AI Use Cases", duration: 25, type: "video" },
          { title: "Marketing and Sales AI", duration: 35, type: "video" },
          { title: "Legal and Compliance Applications", duration: 25, type: "video" },
          { title: "Startup Success Stories", duration: 30, type: "video" },
          { title: "Build Your AI Product Strategy", duration: 40, type: "assignment" }
        ]
      },
      {
        title: "Future of AI and Career Opportunities",
        description: "Understanding AI trends and building a career in AI",
        duration: 180,
        lessons: [
          { title: "Current AI Trends and Predictions", duration: 30, type: "video" },
          { title: "AGI and Beyond", duration: 25, type: "video" },
          { title: "Career Paths in AI", duration: 30, type: "video" },
          { title: "Building Your AI Portfolio", duration: 35, type: "video" },
          { title: "Continuous Learning in AI", duration: 20, type: "video" },
          { title: "Final Capstone Project", duration: 40, type: "assignment" }
        ]
      }
    ],
    tags: ["Generative AI", "GPT", "DALL-E", "Machine Learning", "ChatGPT", "AI Applications", "Prompt Engineering"],
    status: "Published",
    featured: true,
    trending: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find or create admin user for instructor reference
    const User = require('./models/User');
    let adminUser = await User.findOne({ email: 'admin@elearning.com' });
    
    if (!adminUser) {
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@elearning.com',
        password: 'admin123',
        role: 'admin',
        status: 'Active',
        emailVerified: true
      });
      await adminUser.save();
      console.log('Created admin user for instructor reference');
    }

    // Clear existing courses (optional - remove this if you want to keep existing data)
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Add instructor reference to all courses
    const coursesWithInstructor = courses.map(course => ({
      ...course,
      instructor: adminUser._id,
      level: course.level.split(' ')[0], // Take first word (Beginner, Intermediate, Advanced)
      rating: {
        average: course.rating,
        count: course.totalRatings
      }
    }));

    // Insert new courses
    const createdCourses = await Course.insertMany(coursesWithInstructor);
    console.log(`✅ Successfully created ${createdCourses.length} courses!`);

    // Display course information
    createdCourses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Category: ${course.category}`);
      console.log(`   Level: ${course.level}`);
      console.log(`   Duration: ${Math.round(course.duration / 60)} hours`);
      console.log(`   Price: $${course.price}`);
      console.log(`   Modules: ${course.modules ? course.modules.length : 0}`);
      console.log(`   Status: ${course.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding courses:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('Course seeding completed! 🎉');
  }
}

if (require.main === module) {
  seedCourses();
}

module.exports = { courses, seedCourses };