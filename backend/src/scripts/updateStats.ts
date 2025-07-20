import { config } from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Pick from '../models/Pick';

// Load environment variables
config();

async function updateStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Get all cappers
    const cappers = await User.find({ role: 'capper' });
    
    for (const capper of cappers) {
      // Count picks for this capper
      const totalPicks = await Pick.countDocuments({ capperId: capper._id });
      const verifiedPicks = await Pick.countDocuments({ 
        capperId: capper._id,
        'verifiedOutcome.isCorrect': { $exists: true }
      });
      const wins = await Pick.countDocuments({ 
        capperId: capper._id,
        'verifiedOutcome.isCorrect': true
      });
      const losses = verifiedPicks - wins;
      
      // Calculate win rate and clout score
      const winRate = verifiedPicks > 0 ? wins / verifiedPicks : 0.5;
      const cloutScore = Math.round(50 + (winRate * 100) - 50);
      
      // Update user stats
      capper.stats = {
        totalPicks: totalPicks || 1,
        wins: wins || 0,
        losses: losses || 0,
        winRate: winRate || 0.5,
        cloutScore: cloutScore || 50
      };
      
      await capper.save();
      console.log(`✅ Updated ${capper.username}: ${wins}W-${losses}L (${(winRate * 100).toFixed(1)}%) - Clout: ${cloutScore}`);
    }

    console.log('\n🎉 Stats updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

updateStats();