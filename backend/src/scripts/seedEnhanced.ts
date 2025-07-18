import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Pick from '../models/Pick';
import Event from '../models/Event';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clout');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Pick.deleteMany({});
    await Event.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create events
    const events = await Event.create([
      {
        externalId: 'ufc-300',
        eventName: 'UFC 300: Pereira vs Hill',
        organization: 'UFC',
        eventDate: new Date('2025-02-15'),
        venue: 'T-Mobile Arena',
        location: 'Las Vegas, Nevada',
        status: 'upcoming',
        fights: [
          {
            fighter1: { name: 'Alex Pereira', record: '9-2-0', odds: -150 },
            fighter2: { name: 'Jamahal Hill', record: '12-2-0', odds: +130 },
            weightClass: 'Light Heavyweight',
            scheduledRounds: 5
          },
          {
            fighter1: { name: 'Zhang Weili', record: '24-3-0', odds: -200 },
            fighter2: { name: 'Yan Xiaonan', record: '17-3-0', odds: +170 },
            weightClass: "Women's Strawweight",
            scheduledRounds: 3
          },
          {
            fighter1: { name: 'Justin Gaethje', record: '25-4-0', odds: +110 },
            fighter2: { name: 'Max Holloway', record: '25-7-0', odds: -130 },
            weightClass: 'Lightweight',
            scheduledRounds: 3
          }
        ]
      },
      {
        externalId: 'ufc-299',
        eventName: 'UFC 299: O\'Malley vs Vera',
        organization: 'UFC',
        eventDate: new Date('2025-01-10'),
        venue: 'Kaseya Center',
        location: 'Miami, Florida',
        status: 'completed',
        fights: [
          {
            fighter1: { name: "Sean O'Malley", record: '17-1-0', odds: -180 },
            fighter2: { name: 'Marlon Vera', record: '21-8-0', odds: +155 },
            weightClass: 'Bantamweight',
            scheduledRounds: 5,
            result: {
              winner: "Sean O'Malley",
              method: 'Decision',
              round: 5,
              verifiedAt: new Date('2025-01-11')
            }
          },
          {
            fighter1: { name: 'Dustin Poirier', record: '30-8-0', odds: -120 },
            fighter2: { name: 'Benoit Saint Denis', record: '13-2-0', odds: +100 },
            weightClass: 'Lightweight',
            scheduledRounds: 3,
            result: {
              winner: 'Dustin Poirier',
              method: 'KO/TKO',
              round: 2,
              time: '2:32',
              verifiedAt: new Date('2025-01-11')
            }
          }
        ]
      }
    ]);

    console.log('📅 Created events');

    // Create professional cappers with detailed profiles
    const cappers = await User.create([
      {
        username: 'IronMike',
        email: 'ironmike@example.com',
        password: 'password123',
        role: 'capper',
        cloutScore: 85.5,
        stats: { totalPicks: 120, correctPicks: 96, winRate: 0.8 }
      },
      {
        username: 'MysticMac',
        email: 'mysticmac@example.com',
        password: 'password123',
        role: 'capper',
        cloutScore: 78.2,
        stats: { totalPicks: 89, correctPicks: 67, winRate: 0.752 }
      },
      {
        username: 'ThePredator',
        email: 'thepredator@example.com',
        password: 'password123',
        role: 'capper',
        cloutScore: 92.1,
        stats: { totalPicks: 156, correctPicks: 132, winRate: 0.846 }
      },
      {
        username: 'FightOracle',
        email: 'fightoracle@example.com',
        password: 'password123',
        role: 'capper',
        cloutScore: 71.8,
        stats: { totalPicks: 78, correctPicks: 55, winRate: 0.705 }
      },
      {
        username: 'CombatGuru',
        email: 'combatguru@example.com',
        password: 'password123',
        role: 'capper',
        cloutScore: 88.3,
        stats: { totalPicks: 143, correctPicks: 118, winRate: 0.825 }
      }
    ]);

    console.log('👤 Created cappers');

    // Create regular users
    const users = await User.create([
      {
        username: 'JohnDoe',
        email: 'johndoe@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'JaneDoe',
        email: 'janedoe@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'FightFan2024',
        email: 'fightfan@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'UFCAddict',
        email: 'ufcaddict@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        username: 'MMAJunkie',
        email: 'mmajunkie@example.com',
        password: 'password123',
        role: 'user'
      }
    ]);

    console.log('👥 Created regular users');

    // Create social connections
    // Top cappers have more followers
    await User.findByIdAndUpdate(cappers[2]._id, {
      $push: { followers: { $each: [users[0]._id, users[1]._id, users[2]._id, users[3]._id, users[4]._id] } }
    });
    await User.findByIdAndUpdate(cappers[0]._id, {
      $push: { followers: { $each: [users[0]._id, users[1]._id, users[3]._id] } }
    });
    await User.findByIdAndUpdate(cappers[4]._id, {
      $push: { followers: { $each: [users[2]._id, users[3]._id, users[4]._id] } }
    });

    // Users follow cappers
    for (const user of users) {
      await User.findByIdAndUpdate(user._id, {
        $push: { following: { $each: [cappers[0]._id, cappers[2]._id] } }
      });
    }

    console.log('🔗 Created social connections');

    // Create picks for completed event (with outcomes)
    const completedEvent = events.find(e => e.status === 'completed');
    const upcomingEvent = events.find(e => e.status === 'upcoming');

    const picks = [];

    // Create historical picks (verified)
    if (completedEvent) {
      for (let i = 0; i < cappers.length; i++) {
        const capper = cappers[i];
        
        // Pick for main event
        const mainEventPick = await Pick.create({
          capperId: capper._id,
          eventId: completedEvent._id,
          fightIndex: 0,
          fightEvent: {
            eventName: completedEvent.eventName,
            date: completedEvent.eventDate,
            fighters: [completedEvent.fights[0].fighter1.name, completedEvent.fights[0].fighter2.name],
            organization: completedEvent.organization
          },
          prediction: {
            winner: i % 2 === 0 ? "Sean O'Malley" : 'Marlon Vera',
            method: i % 3 === 0 ? 'Decision' : 'KO/TKO',
            confidence: 7 + Math.floor(Math.random() * 3)
          },
          analysis: `Based on recent performance and striking advantage, I'm going with ${i % 2 === 0 ? "O'Malley" : 'Vera'}.`,
          timestamp: new Date(completedEvent.eventDate.getTime() - 24 * 60 * 60 * 1000),
          verifiedOutcome: {
            winner: completedEvent.fights[0].result!.winner,
            method: completedEvent.fights[0].result!.method,
            round: completedEvent.fights[0].result!.round,
            verifiedAt: completedEvent.fights[0].result!.verifiedAt,
            isCorrect: i % 2 === 0 // O'Malley won
          }
        });
        picks.push(mainEventPick);
      }
    }

    // Create upcoming picks
    if (upcomingEvent) {
      for (let i = 0; i < cappers.length; i++) {
        const capper = cappers[i];
        
        // Multiple picks per capper
        for (let j = 0; j < Math.min(3, upcomingEvent.fights.length); j++) {
          const fight = upcomingEvent.fights[j];
          const pick = await Pick.create({
            capperId: capper._id,
            eventId: upcomingEvent._id,
            fightIndex: j,
            fightEvent: {
              eventName: upcomingEvent.eventName,
              date: upcomingEvent.eventDate,
              fighters: [fight.fighter1.name, fight.fighter2.name],
              organization: upcomingEvent.organization
            },
            prediction: {
              winner: Math.random() > 0.5 ? fight.fighter1.name : fight.fighter2.name,
              method: ['Decision', 'KO/TKO', 'Submission'][Math.floor(Math.random() * 3)] as any,
              round: Math.floor(Math.random() * 3) + 1,
              confidence: 6 + Math.floor(Math.random() * 4),
              odds: fight.fighter1.odds
            },
            analysis: `Strong analysis based on fighting styles, recent form, and matchup dynamics.`,
            timestamp: new Date(),
            likes: i === 2 ? [users[0]._id, users[1]._id] : [] // Top capper has likes
          });
          picks.push(pick);
        }
      }
    }

    console.log(`🎯 Created ${picks.length} picks`);

    // Update clout scores based on actual data
    for (const capper of cappers) {
      const capperPicks = await Pick.find({ capperId: capper._id, verifiedOutcome: { $exists: true } });
      const correctPicks = capperPicks.filter(p => p.verifiedOutcome?.isCorrect).length;
      const winRate = capperPicks.length > 0 ? correctPicks / capperPicks.length : 0;
      const followerCount = await User.findById(capper._id).then(u => u?.followers.length || 0);
      const socialScore = Math.min(followerCount / 10, 30);
      const cloutScore = (winRate * 70) + socialScore;
      
      await User.findByIdAndUpdate(capper._id, {
        cloutScore,
        stats: {
          totalPicks: capperPicks.length,
          correctPicks,
          winRate
        }
      });
    }

    console.log('📊 Updated clout scores');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('Cappers:');
    cappers.forEach(c => {
      console.log(`  - Email: ${c.email}, Password: password123`);
    });
    console.log('\nRegular Users:');
    users.slice(0, 2).forEach(u => {
      console.log(`  - Email: ${u.email}, Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();