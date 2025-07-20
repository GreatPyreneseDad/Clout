import { config } from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Event from '../models/Event';
import Pick from '../models/Pick';

// Load environment variables
config();

async function checkData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check users
    const totalUsers = await User.countDocuments();
    const cappers = await User.countDocuments({ role: 'capper' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    console.log('\n📊 Users:');
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Cappers: ${cappers}`);
    console.log(`- Regular users: ${regularUsers}`);
    
    // List cappers
    const capperList = await User.find({ role: 'capper' }).select('username email stats');
    console.log('\n👥 Cappers:');
    capperList.forEach(c => {
      console.log(`- ${c.username} (${c.email}) - ${c.stats?.wins || 0}W-${c.stats?.losses || 0}L`);
    });

    // Check events
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ eventDate: { $gt: new Date() } });
    
    console.log('\n🥊 Events:');
    console.log(`- Total events: ${totalEvents}`);
    console.log(`- Upcoming events: ${upcomingEvents}`);

    // Check picks
    const totalPicks = await Pick.countDocuments();
    const verifiedPicks = await Pick.countDocuments({ verifiedOutcome: { $exists: true } });
    
    console.log('\n🎯 Picks:');
    console.log(`- Total picks: ${totalPicks}`);
    console.log(`- Verified picks: ${verifiedPicks}`);

    // Sample picks
    const samplePicks = await Pick.find().limit(5).populate('capperId', 'username');
    console.log('\n📝 Sample picks:');
    samplePicks.forEach(p => {
      console.log(`- ${(p.capperId as any)?.username || 'Unknown'} picked ${p.prediction.winner}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkData();