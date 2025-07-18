import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Pick from '../models/Pick';

dotenv.config();

const fighters = [
  ['Islam Makhachev', 'Charles Oliveira'],
  ['Jon Jones', 'Stipe Miocic'],
  ['Leon Edwards', 'Kamaru Usman'],
  ['Alexander Volkanovski', 'Max Holloway'],
  ['Israel Adesanya', 'Sean Strickland'],
  ['Sean O\'Malley', 'Aljamain Sterling'],
  ['Amanda Nunes', 'Valentina Shevchenko'],
  ['Conor McGregor', 'Michael Chandler']
];

const events = [
  'UFC 300', 'UFC 301', 'UFC 302', 'UFC Fight Night 240',
  'Bellator 300', 'ONE Championship 200', 'PFL Championship'
];

const methods = ['KO/TKO', 'Submission', 'Decision'];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clout');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Pick.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const users = [];
    
    // Create cappers
    for (let i = 1; i <= 5; i++) {
      const capper = await User.create({
        username: `pro_capper_${i}`,
        email: `capper${i}@example.com`,
        password: 'password123',
        role: 'capper'
      });
      users.push(capper);
    }

    // Create regular users
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        username: `fight_fan_${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
        role: 'user'
      });
      users.push(user);
    }

    console.log(`✅ Created ${users.length} users`);

    // Create followers
    const cappers = users.filter(u => u.role === 'capper');
    const regularUsers = users.filter(u => u.role === 'user');

    for (const capper of cappers) {
      // Each capper gets 3-8 followers
      const followerCount = Math.floor(Math.random() * 6) + 3;
      const followers = regularUsers
        .sort(() => Math.random() - 0.5)
        .slice(0, followerCount);

      for (const follower of followers) {
        await User.findByIdAndUpdate(capper._id, {
          $push: { followers: follower._id }
        });
        await User.findByIdAndUpdate(follower._id, {
          $push: { following: capper._id }
        });
      }
    }

    console.log('✅ Created follower relationships');

    // Create picks
    const picks = [];
    const now = new Date();

    for (const capper of cappers) {
      // Each capper makes 10-20 picks
      const pickCount = Math.floor(Math.random() * 11) + 10;
      
      for (let i = 0; i < pickCount; i++) {
        const fightPair = fighters[Math.floor(Math.random() * fighters.length)];
        const winner = fightPair[Math.floor(Math.random() * 2)];
        const eventName = events[Math.floor(Math.random() * events.length)];
        const isPast = Math.random() > 0.3; // 70% past fights
        const fightDate = isPast 
          ? new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Past 90 days
          : new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Next 30 days

        const pick = await Pick.create({
          capperId: capper._id,
          fightEvent: {
            eventName,
            date: fightDate,
            fighters: fightPair,
            organization: eventName.includes('UFC') ? 'UFC' : 
                        eventName.includes('Bellator') ? 'Bellator' :
                        eventName.includes('ONE') ? 'ONE' : 'PFL'
          },
          prediction: {
            winner,
            method: methods[Math.floor(Math.random() * methods.length)],
            round: Math.floor(Math.random() * 5) + 1,
            confidence: Math.floor(Math.random() * 5) + 6 // 6-10
          },
          analysis: `Expert analysis: ${winner} has shown superior ${
            ['striking', 'grappling', 'cardio', 'fight IQ'][Math.floor(Math.random() * 4)]
          } in recent fights. Expecting a ${
            ['dominant', 'competitive', 'tactical'][Math.floor(Math.random() * 3)]
          } performance.`,
          timestamp: new Date(fightDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });

        // If past fight, add verified outcome
        if (isPast) {
          const isCorrect = Math.random() > 0.4; // 60% win rate
          pick.verifiedOutcome = {
            winner: isCorrect ? winner : fightPair.find(f => f !== winner)!,
            method: methods[Math.floor(Math.random() * methods.length)],
            round: Math.floor(Math.random() * 5) + 1,
            verifiedAt: new Date(fightDate.getTime() + 24 * 60 * 60 * 1000),
            isCorrect
          };
          await pick.save();
        }

        // Add some likes
        const likeCount = Math.floor(Math.random() * regularUsers.length);
        const likers = regularUsers
          .sort(() => Math.random() - 0.5)
          .slice(0, likeCount);
        
        pick.likes = likers.map(u => u._id);
        await pick.save();

        picks.push(pick);
      }
    }

    console.log(`✅ Created ${picks.length} picks`);

    // Update clout scores
    for (const capper of cappers) {
      const capperPicks = await Pick.find({ 
        capperId: capper._id,
        verifiedOutcome: { $exists: true }
      });

      const correctPicks = capperPicks.filter(p => p.verifiedOutcome?.isCorrect).length;
      const winRate = capperPicks.length > 0 ? correctPicks / capperPicks.length : 0;
      const followerCount = capper.followers.length;
      
      capper.cloutScore = (winRate * 0.7) + ((followerCount / 10) * 0.3);
      await capper.save();
    }

    console.log('✅ Updated clout scores');
    console.log('\n📊 Database seeded successfully!');
    console.log(`   - Users: ${users.length} (${cappers.length} cappers, ${regularUsers.length} users)`);
    console.log(`   - Picks: ${picks.length}`);
    console.log(`   - Verified: ${picks.filter(p => p.verifiedOutcome).length}`);
    console.log(`   - Pending: ${picks.filter(p => !p.verifiedOutcome).length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();