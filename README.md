# Clout - Fight Betting Social Platform MVP

A social platform for sports betting predictions focused on fight sports (UFC, MMA, Boxing).

## Quick Deploy

### Deploy Backend to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/GreatPyreneseDad/Clout)

After clicking, you'll need to add these environment variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure secret key (generate with: `openssl rand -base64 32`)
- `CORS_ORIGIN` - Your frontend URL (e.g., https://your-app.vercel.app)
- `ODDS_API_KEY` - Your sports data API key

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas URL

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Backend (.env in /backend):
```
MONGODB_URI=mongodb://localhost:27017/clout
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
SPORTS_DB_API_KEY=3  # Optional: for sports data integration
```

Frontend (.env in /frontend):
```
VITE_API_URL=http://localhost:3000/api
```

### Running the Application

1. **Start MongoDB** (if running locally)

2. **Seed the database** (creates test users and data):
```bash
npm run seed
```

3. **Start both frontend and backend**:
```bash
npm run dev
```

This will start:
- Backend API at http://localhost:3000
- Frontend at http://localhost:5173

### Test Accounts

After seeding, you can login with:

**Cappers:**
- Email: ironmike@example.com, Password: password123
- Email: mysticmac@example.com, Password: password123
- Email: thepredator@example.com, Password: password123

**Regular Users:**
- Email: johndoe@example.com, Password: password123
- Email: janedoe@example.com, Password: password123

## 🎮 Features

### Sprint 1 Features (Completed)
- ✅ **Authentication**: JWT-based auth with login/signup endpoints
- ✅ **Sports Data Integration**: Event model with fight data, mock API fallback
- ✅ **Clout = units won**: flat 1u at the odds quoted; Brier calibration on stated confidence. Followers do not affect it. See *Scoring* below.
- ✅ **Follow System**: Users can follow cappers
- ✅ **Event Management**: Link picks to real events, auto-verification system
- ✅ **Error Handling**: Global error middleware, frontend toast notifications
- ✅ **Testing**: Jest tests for auth flows and the scoring module (`backend/src/tests/scoring.test.ts`)
- ✅ **Enhanced Seed Data**: 20+ picks, events, and social connections

### Next Sprint Features
- 🔄 Real-time fight results from live APIs
- 🔄 Comment system on picks
- 🔄 Advanced analytics dashboard with charts
- 🔄 Email notifications for followed cappers
- 🔄 Mobile app (React Native)
- 🔄 Expand to other sports

## 📊 Data Models

### User
- Username, email, password (hashed)
- Role: 'capper' | 'user'
- Followers/following arrays
- Stats: totalPicks, correctPicks, winRate
- Clout score (computed: 70% accuracy + 30% social)

### Pick
- Capper reference
- Event reference with fight index
- Prediction: winner, method, round, confidence
- Analysis text
- Verified outcome with correctness
- Likes array

### Event
- External ID, name, organization
- Event date, venue, location
- Fights array with fighter details
- Status: upcoming/live/completed
- Fight results for verification

### Leaderboard
- Ranks by net units, ties broken by Brier score
- Period filtering (all/month/week)

## 📐 Scoring

The original clout formula was `winRate × 70 + min(followers / 10, 30)`. It
rewarded picking heavy favourites — a capper taking −400 chalk every fight runs
80% and tops the board while losing money — and gave 30% of credibility to
follower count. That formula is gone.

Each verified pick now contributes two numbers (`backend/src/services/scoring.ts`):

| metric | definition | reads |
|---|---|---|
| **units** | flat 1-unit bet at `prediction.odds`; win → decimal − 1, loss → −1 | what a bettor following this capper would have made |
| **brier** | `(statedProb − outcome)²`, with confidence 1–10 → p = 0.5 + 0.045·c | whether the confidence slider means anything. 0.25 is a coin flip; lower is better |

`cloutScore` **is** net units. ROI, graded-pick count and Brier skill
(`1 − brier/0.25`) are exposed on `/leaderboard` and `/leaderboard/:capperId`.
Picks without odds count toward win rate and Brier but are not graded for units.

Worked example, in the tests: ten −400 favourites at 8–2 → 80% win rate,
**0.00u**. Ten +250 underdogs at 4–6 → 40% win rate, **+4.00u**. The second
capper ranks first.

To backfill existing cappers after deploying: `cd backend && npx tsx src/scripts/updateStats.ts`.

## 🧪 Testing

### Running Tests
```bash
# Backend unit tests
cd backend
npm test

# With coverage
npm test -- --coverage
```

### Test Coverage
- Authentication flows (signup, login)
- Clout score calculation
- Pick verification system
- API endpoint validation

Run tests with:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Backend (Render/Heroku)
1. Create new web service
2. Set environment variables
3. Deploy from GitHub

### Frontend (Vercel/Netlify)
1. Import GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`

## 📝 API Documentation

Base URL: `http://localhost:3000/api`

### Authentication Endpoints
- `POST /auth/signup` - Register new user
  - Body: `{ username, email, password, role }`
- `POST /auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: JWT token

### User Endpoints
- `GET /users/:id` - Get user profile
- `POST /users/:id/follow` - Follow user (auth required)
- `POST /users/:id/unfollow` - Unfollow user (auth required)
- `GET /users/:id/followers` - Get user's followers
- `GET /users/:id/following` - Get who user follows

### Pick Endpoints
- `GET /picks` - Get pick feed (paginated)
- `GET /picks/capper/:id` - Get capper's picks
- `POST /picks` - Create new pick (capper only)
- `POST /picks/:id/like` - Like a pick (auth required)

### Event Endpoints
- `GET /events` - Get upcoming/past events
- `GET /events/:id` - Get specific event details
- `POST /events/refresh` - Refresh events from API (admin)

### Leaderboard Endpoints
- `GET /leaderboard` - Top cappers by net units (ties: Brier)
  - Query params: `?period=all|month|week`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

Questions? Contact the team on Slack or open an issue.

---

**Clout** - Where fight predictions meet social proof. 🥊📈