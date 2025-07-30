import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Get database info
    const db = mongoose.connection.db;
    if (db) {
      const admin = db.admin();
      const dbInfo = await admin.listDatabases();
      console.log('\n📊 Available databases:');
      dbInfo.databases.forEach((database: any) => {
        console.log(`  - ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });
    }

    // Test creating a collection
    const testCollection = mongoose.connection.collection('connection_test');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('\n✅ Write test successful');

    // Clean up test data
    await testCollection.deleteOne({ test: true });
    console.log('🧹 Cleaned up test data');

    // Close connection
    await mongoose.disconnect();
    console.log('\n👋 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

// URL encoding helper
function urlEncodePassword(password: string): string {
  return encodeURIComponent(password);
}

console.log('\n💡 Tip: If your password contains special characters, they need to be URL encoded:');
console.log('   @ → %40');
console.log('   # → %23');
console.log('   $ → %24');
console.log('   & → %26');
console.log('   + → %2B');
console.log('\n');

testConnection();