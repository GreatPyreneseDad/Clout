import { config } from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Event from '../models/Event';
import Pick from '../models/Pick';
import { SportsDataService } from '../services/sportsData.service';

// Load environment variables
config();

const capperNames = [
  { username: 'MMAOracle', email: 'oracle@example.com', winRate: 0.75 },
  { username: 'FightPredictor', email: 'predictor@example.com', winRate: 0.68 },
  { username: 'OctagonAnalyst', email: 'analyst@example.com', winRate: 0.72 },
  { username: 'KnockoutKing', email: 'knockout@example.com', winRate: 0.65 },
  { username: 'SubmissionSpecialist', email: 'submission@example.com', winRate: 0.70 },
  { username: 'ChampionPicker', email: 'champion@example.com', winRate: 0.63 },
  { username: 'UnderdogHunter', email: 'underdog@example.com', winRate: 0.58 },
  { username: 'FightIQ', email: 'fightiq@example.com', winRate: 0.71 },
  { username: 'MMAGuru', email: 'guru@example.com', winRate: 0.66 },
  { username: 'CageWarrior', email: 'warrior@example.com', winRate: 0.69 }
];

async function populateRealData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out to keep existing data)
    console.log('🧹 Clearing existing data...');
    await Pick.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({ role: 'capper' });

    // Fetch real MMA events
    console.log('🔄 Fetching real MMA events from The Odds API...');
    const sportsDataService = new SportsDataService();
    const events = await sportsDataService.fetchUpcomingEvents();
    console.log(`✅ Fetched ${events.length} real MMA events`);

    // Create cappers
    console.log('👥 Creating cappers...');
    const cappers = [];
    
    for (const capperData of capperNames) {
      const capper = await User.create({
        username: capperData.username,
        email: capperData.email,
        password: 'password123', // Default password
        role: 'capper',
        stats: {
          totalPicks: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          cloutScore: 50 // Starting clout
        }
      });
      
      // Add some followers
      const followerCount = Math.floor(Math.random() * 300) + 50;
      capper.followerCount = followerCount;
      await capper.save();
      
      cappers.push({ user: capper, targetWinRate: capperData.winRate });
      console.log(`✅ Created capper: ${capper.username} (${followerCount} followers)`);
    }

    // Generate picks for upcoming events
    console.log('🎯 Generating picks for upcoming events...');
    const upcomingEvents = events.filter(event => event.eventDate > new Date()).slice(0, 10);
    
    for (const event of upcomingEvents) {
      // Each capper makes picks for some fights
      for (const { user: capper, targetWinRate } of cappers) {
        // Randomly decide if this capper picks this event (70% chance)
        if (Math.random() > 0.3 && event.fights.length > 0) {
          const fight = event.fights[0]; // Main event
          
          // Pick based on odds and capper's expertise
          let selectedFighter;
          let confidence;
          
          // Better cappers tend to pick favorites more often
          const pickFavorite = Math.random() < (targetWinRate * 0.8);
          
          if (fight.fighter1.odds < fight.fighter2.odds) {
            // Fighter 1 is favorite
            selectedFighter = pickFavorite ? fight.fighter1.name : fight.fighter2.name;
            confidence = pickFavorite ? 
              70 + Math.floor(Math.random() * 25) : 
              60 + Math.floor(Math.random() * 20);
          } else {
            // Fighter 2 is favorite
            selectedFighter = pickFavorite ? fight.fighter2.name : fight.fighter1.name;
            confidence = pickFavorite ? 
              70 + Math.floor(Math.random() * 25) : 
              60 + Math.floor(Math.random() * 20);
          }
          
          const pick = await Pick.create({
            capperId: capper._id,
            eventId: event._id,
            fightIndex: 0,
            fightEvent: {
              eventName: event.eventName,
              date: event.eventDate,
              fighters: [fight.fighter1.name, fight.fighter2.name],
              organization: event.organization
            },
            prediction: {
              winner: selectedFighter,
              method: ['Decision', 'KO/TKO', 'Submission'][Math.floor(Math.random() * 3)] as any,
              confidence: confidence / 10 // Convert to 1-10 scale
            },
            analysis: `${capper.username} likes ${selectedFighter} in this matchup. ` +
                     `The odds suggest a competitive fight, but I see ${selectedFighter} ` +
                     `having the edge in this contest.`,
            likes: []
          });
          
          // Add some random likes
          const likeCount = Math.floor(Math.random() * 50);
          pick.likeCount = likeCount;
          await pick.save();
          
          console.log(`✅ ${capper.username} picked ${selectedFighter} for ${event.eventName}`);
        }
      }
    }

    // Generate historical picks with results
    console.log('📊 Generating historical picks with results...');
    
    for (const { user: capper, targetWinRate } of cappers) {
      const historicalPickCount = 50 + Math.floor(Math.random() * 100);
      let wins = 0;
      
      for (let i = 0; i < historicalPickCount; i++) {
        // Create a past event
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 180)); // Up to 6 months ago
        
        const mockEvent = await Event.create({
          externalId: `mock-historical-${capper._id}-${i}`,
          eventName: `Historical UFC Event ${i}`,
          organization: 'UFC',
          eventDate: pastDate,
          venue: 'Various',
          location: 'Various',
          status: 'completed',
          fights: [{
            fighter1: { name: 'Fighter A', record: '20-5-0', odds: -150 },
            fighter2: { name: 'Fighter B', record: '18-7-0', odds: +130 },
            weightClass: 'Various',
            scheduledRounds: 3,
            result: {
              winner: Math.random() > 0.5 ? 'Fighter A' : 'Fighter B',
              method: ['Decision', 'KO/TKO', 'Submission'][Math.floor(Math.random() * 3)],
              round: Math.ceil(Math.random() * 3),
              time: '2:30'
            }
          }]
        });
        
        // Determine if this pick wins based on target win rate
        const isWin = Math.random() < targetWinRate;
        const selectedFighter = isWin ? mockEvent.fights[0].result!.winner : 
          (mockEvent.fights[0].result!.winner === 'Fighter A' ? 'Fighter B' : 'Fighter A');
        
        if (isWin) wins++;
        
        await Pick.create({
          capperId: capper._id,
          eventId: mockEvent._id,
          fightIndex: 0,
          fightEvent: {
            eventName: mockEvent.eventName,
            date: mockEvent.eventDate,
            fighters: ['Fighter A', 'Fighter B'],
            organization: 'UFC'
          },
          prediction: {
            winner: selectedFighter,
            method: 'Decision' as any,
            confidence: (70 + Math.floor(Math.random() * 20)) / 10
          },
          analysis: 'Historical pick',
          verifiedOutcome: {
            winner: mockEvent.fights[0].result!.winner!,
            method: mockEvent.fights[0].result!.method!,
            round: mockEvent.fights[0].result!.round,
            verifiedAt: pastDate,
            isCorrect: isWin
          },
          likes: []
        });
      }
      
      // Update capper stats
      capper.stats = {
        totalPicks: historicalPickCount,
        wins,
        losses: historicalPickCount - wins,
        winRate: wins / historicalPickCount,
        cloutScore: Math.round(50 + (wins / historicalPickCount * 100) - 50)
      };
      
      await capper.save();
      console.log(`✅ ${capper.username}: ${wins}W-${historicalPickCount - wins}L (${(wins/historicalPickCount*100).toFixed(1)}%)`);
    }

    console.log('\n🎉 Successfully populated real data!');
    console.log(`- ${cappers.length} cappers created`);
    console.log(`- ${events.length} real MMA events fetched`);
    console.log(`- Picks generated for upcoming fights`);
    console.log(`- Historical data created for leaderboard`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

populateRealData();