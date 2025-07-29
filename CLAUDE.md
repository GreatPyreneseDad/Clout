# CLAUDE.md - Clout Sports Betting Platform

This file provides guidance to Claude Code when working with the Clout repository, including architecture overview and data science recommendations.

## Repository Overview

Clout is a sports betting picks tracking platform that allows users ("cappers") to make predictions on sporting events and track their performance. The platform features a leaderboard system, pick verification, and social features like following other cappers.

**Tech Stack**: MongoDB, Express.js, React, Node.js, TypeScript

## Key Components

### Backend (`/backend`)
- **Controllers**: Handle API endpoints for events, picks, users, and leaderboard
- **Models**: MongoDB schemas for User, Pick, and Event
- **Services**: Sports data integration and pick verification
- **Middleware**: Authentication, CSRF protection, error handling

### Frontend (`/frontend`)
- **React + TypeScript**: Modern UI with Vite build system
- **TailwindCSS**: Styling framework
- **State Management**: Local stores for capper data

## Development Commands

```bash
# Backend
cd backend
npm install
npm run dev          # Development server with nodemon
npm run build        # TypeScript compilation
npm test            # Run tests

# Frontend
cd frontend
npm install
npm run dev         # Vite development server
npm run build       # Production build
npm run preview     # Preview production build

# Root level
npm run dev         # Run both frontend and backend concurrently
```

## Security Considerations

Recent security improvements have been implemented:
- JWT secret enforcement (no fallbacks)
- Admin route protection with role-based access
- Input validation and sanitization
- CSRF protection on state-changing operations
- Enhanced password requirements

## Data Science Recommendations

### 1. Performance Optimization

#### Implement Batch Processing for Pick Verification
```javascript
// Replace sequential processing with batch operations
export class OptimizedVerificationService {
  async verifyPicksForEvent(eventId: string): Promise<void> {
    // Use aggregation pipeline for batch verification
    const pipeline = [
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          verifiedOutcome: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      // ... additional pipeline stages
      {
        $merge: {
          into: 'picks',
          on: '_id',
          whenMatched: 'merge'
        }
      }
    ];

    await Pick.aggregate(pipeline);
  }
}
```

#### Add Redis Caching Layer
```javascript
// Implement caching for frequently accessed data
class LeaderboardService {
  private redis: Redis;
  private CACHE_TTL = 300; // 5 minutes

  async getLeaderboard(timeframe: string): Promise<LeaderboardData> {
    const cacheKey = `leaderboard:${timeframe}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    const results = await this.calculateLeaderboard(timeframe);
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(results));
    
    return results;
  }
}
```

### 2. Database Optimization

#### Essential Indexes
```javascript
// Add these indexes for optimal query performance
pickSchema.index({ capperId: 1, 'verifiedOutcome.verifiedAt': -1 });
pickSchema.index({ eventId: 1, 'verifiedOutcome.isCorrect': 1 });
pickSchema.index({ 'fightEvent.organization': 1, timestamp: -1 });
pickSchema.index({ 'prediction.confidence': -1, 'verifiedOutcome.isCorrect': 1 });

userSchema.index({ cloutScore: -1, 'stats.totalPicks': -1 });
userSchema.index({ role: 1, 'stats.winRate': -1 });

eventSchema.index({ eventDate: -1, organization: 1 });
eventSchema.index({ status: 1, eventDate: 1 });
```

#### Connection Pool Configuration
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 3. Real-time Analytics Implementation

#### Event-Driven Architecture
```javascript
import Bull from 'bull';

class RealTimeAnalytics {
  private pickQueue: Bull.Queue;
  
  constructor() {
    this.pickQueue = new Bull('pick-processing', {
      redis: { host: process.env.REDIS_HOST }
    });
    
    this.pickQueue.process(async (job) => {
      const { pick } = job.data;
      
      // Update real-time leaderboard
      await this.updateLiveLeaderboard(pick.capperId);
      
      // Stream to WebSocket clients
      this.broadcast('new-pick', pick);
      
      // Trigger pattern detection
      await this.detectBettingPatterns(pick);
    });
  }
}
```

### 4. Machine Learning Opportunities

#### Fraud Detection System
```python
# Python service for anomaly detection
class PickFraudDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1)
        
    def extract_features(self, pick_data):
        return {
            'time_since_last_pick': self.calculate_time_delta(pick_data),
            'confidence_deviation': self.calculate_confidence_anomaly(pick_data),
            'odds_correlation': self.calculate_odds_correlation(pick_data),
            'pick_velocity': self.calculate_pick_rate(pick_data),
            'follower_spike': self.detect_follower_anomaly(pick_data)
        }
    
    def detect_anomalies(self, user_picks):
        features = self.extract_features(user_picks)
        return self.model.predict(features)
```

#### Pick Recommendation Engine
- Collaborative filtering based on similar cappers
- Content-based filtering using pick history
- Hybrid approach combining multiple signals
- Real-time trending analysis

### 5. Enhanced User Statistics

#### Implement Advanced Metrics
```javascript
interface IEnhancedUserStats {
  // Streaks
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
    startDate: Date;
  };
  longestWinStreak: number;
  
  // Time-based performance
  daily: StatsSnapshot;
  weekly: StatsSnapshot;
  monthly: StatsSnapshot;
  
  // Advanced metrics
  sharpness: number; // Success betting against public
  roiPercentage: number; // Return on investment
  consistencyScore: number; // Performance variance
  
  // Sport-specific breakdown
  sportStats: Map<string, SportSpecificStats>;
}
```

### 6. Scalability Architecture

#### Microservices Approach
```yaml
services:
  api-gateway:
    - Load balancing
    - Rate limiting
    - Authentication
  
  pick-service:
    - Pick creation/verification
    - Real-time updates
  
  analytics-service:
    - Stats calculation
    - Pattern detection
    - ML predictions
  
  notification-service:
    - Email/push notifications
    - WebSocket management
```

#### Infrastructure Recommendations
1. **Load Balancer**: Nginx or AWS ALB
2. **Caching**: Redis Cluster with multiple nodes
3. **Message Queue**: RabbitMQ or Redis Pub/Sub
4. **Database**: MongoDB replica set with sharding
5. **Search**: Elasticsearch for pick analysis search
6. **Monitoring**: Prometheus + Grafana

### 7. API Performance Enhancements

#### Implement GraphQL for Efficient Data Fetching
```graphql
type Query {
  leaderboard(timeframe: Timeframe!, limit: Int): [Capper!]!
  capper(id: ID!): Capper
  picks(filters: PickFilters): PickConnection!
}

type Subscription {
  pickAdded(capperId: ID): Pick!
  leaderboardUpdate: [Capper!]!
}
```

#### Add Response Compression
```javascript
import compression from 'compression';
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

### 8. Monitoring and Observability

#### Application Performance Monitoring
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 0.1,
});

// Custom metrics
class MetricsCollector {
  async trackPickVerification(duration: number): Promise<void> {
    await this.prometheus.histogram('pick_verification_duration', duration);
  }
}
```

### 9. Testing Strategy

#### Critical Areas to Test
1. **Authentication flows** - JWT generation/validation
2. **Pick verification logic** - Accuracy of outcome matching
3. **Clout score calculations** - Mathematical correctness
4. **Rate limiting** - Proper request throttling
5. **CSRF protection** - Token validation

#### Load Testing Recommendations
```bash
# Use k6 for load testing
k6 run --vus 1000 --duration 30s load-test.js
```

### 10. Security Enhancements

#### Additional Security Measures
1. **API Key Management**: Implement API keys for third-party access
2. **Audit Logging**: Log all critical operations
3. **Encryption at Rest**: Encrypt sensitive user data
4. **2FA Support**: Two-factor authentication for cappers
5. **IP Whitelisting**: For admin operations

## Priority Implementation Order

### Phase 1 (Immediate)
1. Add Redis caching for leaderboard
2. Implement database indexes
3. Set up connection pooling
4. Add basic monitoring

### Phase 2 (Short-term)
1. Batch processing for verification
2. WebSocket for real-time updates
3. Job queue implementation
4. Enhanced error tracking

### Phase 3 (Long-term)
1. Machine learning models
2. Microservices migration
3. Advanced analytics
4. Horizontal scaling

## Environment Variables

Required environment variables:
```bash
# Database
MONGODB_URI=mongodb://...

# Security
JWT_SECRET=your-secret-key
CSRF_SECRET=your-csrf-secret

# Redis (when implemented)
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
ODDS_API_KEY=your-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Notes for Claude Code

- Always validate inputs to prevent NoSQL injection
- Maintain backward compatibility when updating APIs
- Consider performance implications of database queries
- Follow the established TypeScript patterns
- Test thoroughly, especially verification logic
- Document any new environment variables
- Consider rate limiting for all new endpoints