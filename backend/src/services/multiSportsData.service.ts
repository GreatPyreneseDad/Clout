import axios from 'axios';
import Event, { IEvent } from '../models/Event';

export interface SportConfig {
  key: string;          // Odds API sport key
  organization: IEvent['organization'];
}

/**
 * Service that can fetch events for multiple sports and keep a simple
 * in-memory cache for quick access. This extends the existing
 * SportsDataService which was MMA specific.
 */
export class MultiSportsDataService {
  private apiKey: string;
  private baseUrl: string;
  private sports: SportConfig[];
  private cache: Map<string, IEvent[]> = new Map();

  constructor(sports?: SportConfig[]) {
    this.apiKey = process.env.ODDS_API_KEY || '';
    this.baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
    // Default to a small selection of popular sports
    this.sports =
      sports || [
        { key: 'mma_mixed_martial_arts', organization: 'UFC' },
        { key: 'americanfootball_nfl', organization: 'NFL' },
        { key: 'basketball_nba', organization: 'NBA' },
        { key: 'baseball_mlb', organization: 'MLB' },
        { key: 'soccer_epl', organization: 'Soccer' }
      ];
  }

  /** Fetch events for all configured sports and populate the cache. */
  async fetchAllUpcoming(): Promise<Map<string, IEvent[]>> {
    const results = new Map<string, IEvent[]>();
    for (const sport of this.sports) {
      const events = await this.fetchSportEvents(sport);
      results.set(sport.organization, events);
      this.cache.set(sport.organization, events);
    }
    return results;
  }

  /** Retrieve cached events for a specific organization. */
  getCached(organization: string): IEvent[] | undefined {
    return this.cache.get(organization);
  }

  private async fetchSportEvents(sport: SportConfig): Promise<IEvent[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/sports/${sport.key}/events`, {
        params: {
          apiKey: this.apiKey,
          regions: 'us',
          markets: 'h2h',
          oddsFormat: 'american',
          dateFormat: 'iso'
        }
      });

      const oddsEvents: any[] = res.data;
      const events: IEvent[] = [];

      for (const oe of oddsEvents) {
        const fighters = [oe.home_team, oe.away_team];
        // Attempt to get odds from first bookmaker if present
        let fighter1Odds = -110;
        let fighter2Odds = -110;

        if (oe.bookmakers && oe.bookmakers.length > 0) {
          const bookmaker = oe.bookmakers[0];
          const market = bookmaker.markets?.find((m: any) => m.key === 'h2h');
          if (market && market.outcomes.length >= 2) {
            const out1 = market.outcomes.find((o: any) => o.name === fighters[0]);
            const out2 = market.outcomes.find((o: any) => o.name === fighters[1]);
            if (out1) fighter1Odds = out1.price;
            if (out2) fighter2Odds = out2.price;
          }
        }

        const eventData = {
          externalId: oe.id,
          eventName: `${fighters[0]} vs ${fighters[1]}`,
          organization: sport.organization,
          eventDate: new Date(oe.commence_time),
          venue: 'TBA',
          location: 'TBA',
          fights: [
            {
              fighter1: { name: fighters[0], odds: fighter1Odds },
              fighter2: { name: fighters[1], odds: fighter2Odds },
              scheduledRounds: 3
            }
          ],
          status: new Date(oe.commence_time) > new Date() ? 'upcoming' : 'completed'
        } as IEvent;

        let event = await Event.findOne({ externalId: oe.id });
        if (!event) {
          event = await Event.create(eventData);
        } else {
          event.set(eventData);
          await event.save();
        }
        events.push(event);
      }
      return events;
    } catch (err) {
      console.error('Error fetching odds for', sport.organization, err);
      return [];
    }
  }
}
