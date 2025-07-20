import { config } from 'dotenv';
import mongoose from 'mongoose';
import Pick from '../models/Pick';

// Load environment variables
config();

async function debugPicks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Get raw picks
    const rawPicks = await Pick.find().limit(5);
    console.log('\n📝 Raw picks:');
    rawPicks.forEach(p => {
      console.log(`- Pick ID: ${p._id}`);
      console.log(`  CapperId: ${p.capperId}`);
      console.log(`  Fighter: ${p.prediction.winner}`);
      console.log(`  isActive: ${p.isActive}`);
    });

    // Test the query used in getAllPicks
    const picks = await Pick.find({})
      .populate('capperId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`\n✅ Found ${picks.length} picks with populate`);
    picks.forEach(p => {
      console.log(`- ${(p.capperId as any)?.username || 'No capper'} picked ${p.prediction.winner}`);
    });

    // Count total active picks
    const activePicks = await Pick.countDocuments({ isActive: true });
    const totalPicks = await Pick.countDocuments();
    console.log(`\n📊 Active picks: ${activePicks} / ${totalPicks}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

debugPicks();