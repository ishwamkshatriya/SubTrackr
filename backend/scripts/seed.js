const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const Discount = require('../models/Discount');
const AuditLog = require('../models/AuditLog');

// Import database connection
const connectDB = require('../config/db');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Plan.deleteMany({});
    await Subscription.deleteMany({});
    await Usage.deleteMany({});
    await Discount.deleteMany({});
    await AuditLog.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@subscription.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12345',
        country: 'USA'
      }
    });
    await adminUser.save();

    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'user123',
        role: 'user',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567891',
        address: {
          street: '456 User Street',
          city: 'User City',
          state: 'UC',
          zipCode: '54321',
          country: 'USA'
        }
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'user123',
        role: 'user',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567892',
        address: {
          street: '789 Customer Street',
          city: 'Customer City',
          state: 'CC',
          zipCode: '67890',
          country: 'USA'
        }
      },
      {
        username: 'bob_wilson',
        email: 'bob@example.com',
        password: 'user123',
        role: 'user',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1234567893',
        address: {
          street: '321 Client Street',
          city: 'Client City',
          state: 'CL',
          zipCode: '13579',
          country: 'USA'
        }
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }

    // Create plans
    console.log('📋 Creating subscription plans...');
    const plans = [
      {
        name: 'Basic Fibernet',
        description: 'Perfect for light internet usage - browsing, email, and social media',
        price: 29.99,
        quota: 100, // GB
        productType: 'Fibernet',
        features: [
          { name: 'Download Speed', description: '50 Mbps', included: true },
          { name: 'Upload Speed', description: '25 Mbps', included: true },
          { name: 'Data Quota', description: '100 GB per month', included: true },
          { name: '24/7 Support', description: 'Email support', included: true }
        ],
        billingCycle: 'monthly',
        maxUsers: 1,
        downloadSpeed: 50,
        uploadSpeed: 25,
        setupFee: 0,
        contractLength: 12
      },
      {
        name: 'Standard Fibernet',
        description: 'Great for families and moderate usage - streaming, gaming, and work',
        price: 49.99,
        quota: 300,
        productType: 'Fibernet',
        features: [
          { name: 'Download Speed', description: '100 Mbps', included: true },
          { name: 'Upload Speed', description: '50 Mbps', included: true },
          { name: 'Data Quota', description: '300 GB per month', included: true },
          { name: '24/7 Support', description: 'Phone and email support', included: true },
          { name: 'Free Router', description: 'High-speed router included', included: true }
        ],
        billingCycle: 'monthly',
        maxUsers: 4,
        downloadSpeed: 100,
        uploadSpeed: 50,
        setupFee: 25,
        contractLength: 12
      },
      {
        name: 'Premium Fibernet',
        description: 'Ultimate plan for heavy users - 4K streaming, gaming, and business',
        price: 79.99,
        quota: 1000,
        productType: 'Fibernet',
        features: [
          { name: 'Download Speed', description: '200 Mbps', included: true },
          { name: 'Upload Speed', description: '100 Mbps', included: true },
          { name: 'Data Quota', description: '1 TB per month', included: true },
          { name: '24/7 Support', description: 'Priority phone and email support', included: true },
          { name: 'Premium Router', description: 'Gaming-grade router included', included: true },
          { name: 'Static IP', description: 'Static IP address included', included: true }
        ],
        billingCycle: 'monthly',
        maxUsers: 8,
        downloadSpeed: 200,
        uploadSpeed: 100,
        setupFee: 50,
        contractLength: 12
      },
      {
        name: 'Basic Broadband',
        description: 'Affordable option for basic internet needs',
        price: 19.99,
        quota: 50,
        productType: 'Broadband Copper',
        features: [
          { name: 'Download Speed', description: '25 Mbps', included: true },
          { name: 'Upload Speed', description: '10 Mbps', included: true },
          { name: 'Data Quota', description: '50 GB per month', included: true },
          { name: 'Email Support', description: 'Email support during business hours', included: true }
        ],
        billingCycle: 'monthly',
        maxUsers: 1,
        downloadSpeed: 25,
        uploadSpeed: 10,
        setupFee: 0,
        contractLength: 6
      },
      {
        name: 'Standard Broadband',
        description: 'Reliable broadband for everyday internet use',
        price: 39.99,
        quota: 200,
        productType: 'Broadband Copper',
        features: [
          { name: 'Download Speed', description: '75 Mbps', included: true },
          { name: 'Upload Speed', description: '25 Mbps', included: true },
          { name: 'Data Quota', description: '200 GB per month', included: true },
          { name: '24/7 Support', description: 'Phone and email support', included: true },
          { name: 'Free Modem', description: 'High-speed modem included', included: true }
        ],
        billingCycle: 'monthly',
        maxUsers: 3,
        downloadSpeed: 75,
        uploadSpeed: 25,
        setupFee: 15,
        contractLength: 12
      }
    ];

    const createdPlans = [];
    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      createdPlans.push(plan);
    }

    // Create subscriptions
    console.log('📝 Creating subscriptions...');
    const subscriptions = [
      {
        userId: createdUsers[0]._id,
        planId: createdPlans[1]._id, // Standard Fibernet
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        autoRenew: true,
        nextPaymentAmount: createdPlans[1].price,
        totalPaid: createdPlans[1].price
      },
      {
        userId: createdUsers[1]._id,
        planId: createdPlans[2]._id, // Premium Fibernet
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        nextBillingDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'active',
        autoRenew: true,
        nextPaymentAmount: createdPlans[2].price,
        totalPaid: createdPlans[2].price
      },
      {
        userId: createdUsers[2]._id,
        planId: createdPlans[0]._id, // Basic Fibernet
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired)
        nextBillingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'expired',
        autoRenew: false,
        nextPaymentAmount: createdPlans[0].price,
        totalPaid: createdPlans[0].price * 2 // Paid for 2 months
      }
    ];

    const createdSubscriptions = [];
    for (const subData of subscriptions) {
      const subscription = new Subscription(subData);
      await subscription.save();
      createdSubscriptions.push(subscription);
    }

    // Create usage data
    console.log('📊 Creating usage data...');
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      
      // Create usage for active subscriptions
      for (const subscription of createdSubscriptions.filter(s => s.status === 'active')) {
        // Find the plan for this subscription
        const plan = createdPlans.find(p => p._id.toString() === subscription.planId.toString());
        const baseSpeed = plan ? plan.downloadSpeed : 50; // Default to 50 if plan not found
        
        const usage = new Usage({
          subscriptionId: subscription._id,
          userId: subscription.userId,
          date: date,
          dataUsed: Math.random() * 20 + 5, // 5-25 GB
          dataDownloaded: Math.random() * 15 + 3,
          dataUploaded: Math.random() * 5 + 1,
          peakHours: Math.random() * 8 + 2,
          offPeakHours: Math.random() * 16 + 2,
          devicesConnected: Math.floor(Math.random() * 3) + 1,
          averageSpeed: baseSpeed * (0.7 + Math.random() * 0.3),
          peakSpeed: baseSpeed * (0.8 + Math.random() * 0.2),
          latency: Math.random() * 20 + 10,
          packetLoss: Math.random() * 0.5,
          timeOfDay: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
          dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.getDay()]
        });
        await usage.save();
      }
    }

    // Create discounts
    console.log('🎫 Creating discounts...');
    const discounts = [
      {
        name: 'New Customer Discount',
        description: 'Welcome discount for new customers',
        code: 'WELCOME20',
        type: 'percentage',
        value: 20,
        maxDiscountAmount: 50,
        minOrderAmount: 0,
        applicableProductTypes: ['Fibernet', 'Broadband Copper'],
        conditions: 'new_customer',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        usageLimit: 100,
        isPublic: true,
        createdBy: adminUser._id
      },
      {
        name: 'Student Discount',
        description: 'Special pricing for students',
        code: 'STUDENT15',
        type: 'percentage',
        value: 15,
        maxDiscountAmount: 25,
        minOrderAmount: 0,
        applicableProductTypes: ['Fibernet', 'Broadband Copper'],
        conditions: 'student_verification_required',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: null, // unlimited
        isPublic: true,
        createdBy: adminUser._id
      },
      {
        name: 'Summer Promotion',
        description: 'Limited time summer offer',
        code: 'SUMMER2024',
        type: 'fixed_amount',
        value: 10,
        maxDiscountAmount: 10,
        minOrderAmount: 30,
        applicableProductTypes: ['Fibernet'],
        conditions: 'seasonal_promotion',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit: 50,
        isPublic: true,
        createdBy: adminUser._id
      }
    ];

    const createdDiscounts = [];
    for (const discountData of discounts) {
      const discount = new Discount(discountData);
      await discount.save();
      createdDiscounts.push(discount);
    }

    // Create audit logs
    console.log('📋 Creating audit logs...');
    const auditLogs = [
      {
        userId: adminUser._id,
        action: 'create_plan',
        resource: 'plan',
        resourceId: createdPlans[0]._id,
        details: `Plan "${createdPlans[0].name}" created`,
        category: 'data_modification',
        severity: 'low'
      },
      {
        userId: createdUsers[0]._id,
        action: 'create_subscription',
        resource: 'subscription',
        resourceId: createdSubscriptions[0]._id,
        details: `Subscribed to plan "${createdPlans[1].name}"`,
        category: 'data_modification',
        severity: 'low'
      },
      {
        userId: createdUsers[1]._id,
        action: 'create_subscription',
        resource: 'subscription',
        resourceId: createdSubscriptions[1]._id,
        details: `Subscribed to plan "${createdPlans[2].name}"`,
        category: 'data_modification',
        severity: 'low'
      },
      {
        userId: adminUser._id,
        action: 'create_discount',
        resource: 'discount',
        resourceId: createdDiscounts[0]._id,
        details: `Discount "${createdDiscounts[0].name}" created`,
        category: 'data_modification',
        severity: 'low'
      }
    ];

    for (const logData of auditLogs) {
      const auditLog = new AuditLog(logData);
      await auditLog.save();
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded Data Summary:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`📋 Plans: ${await Plan.countDocuments()}`);
    console.log(`📝 Subscriptions: ${await Subscription.countDocuments()}`);
    console.log(`📊 Usage Records: ${await Usage.countDocuments()}`);
    console.log(`🎫 Discounts: ${await Discount.countDocuments()}`);
    console.log(`📋 Audit Logs: ${await AuditLog.countDocuments()}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin / admin123');
    console.log('User 1: john_doe / user123');
    console.log('User 2: jane_smith / user123');
    console.log('User 3: bob_wilson / user123');
    
    console.log('\n🎫 Discount Codes:');
    console.log('WELCOME20 - 20% off (max $50)');
    console.log('STUDENT15 - 15% off (max $25)');
    console.log('SUMMER2024 - $10 off (min $30 order)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
seedDatabase();
