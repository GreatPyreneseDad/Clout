import { config } from 'dotenv';
import mongoose from 'mongoose';
import { SportsDataService } from '../services/sportsData.service';

// Load environment variables
config();

async function testOddsApi() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Initialize the sports data service
    const sportsDataService = new SportsDataService();
    
    // Fetch upcoming MMA events
    console.log('🔄 Fetching MMA events from The Odds API...');
    const events = await sportsDataService.fetchUpcomingEvents();
    
    console.log(`\n✅ Successfully fetched ${events.length} events:\n`);
    
    // Display event details
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.eventName}`);
      console.log(`   Organization: ${event.organization}`);
      console.log(`   Date: ${event.eventDate.toLocaleDateString()}`);
      if (event.fights && event.fights.length > 0) {
        const fight = event.fights[0];
        console.log(`   Main Event: ${fight.fighter1.name} (${fight.fighter1.odds}) vs ${fight.fighter2.name} (${fight.fighter2.odds})`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testOddsApi();