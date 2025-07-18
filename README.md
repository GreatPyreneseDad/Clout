# Clout - Fight Betting Social Platform MVP

A social platform for sports betting predictions focused on fight sports (UFC, MMA, Boxing).

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
- ✅ **Enhanced Clout Algorithm**: 70% win rate + 30% social (capped at 300 followers)
- ✅ **Follow System**: Users can follow cappers, affects clout score
- ✅ **Event Management**: Link picks to real events, auto-verification system
- ✅ **Error Handling**: Global error middleware, frontend toast notifications
- ✅ **Testing**: Jest tests for auth flows and clout calculation
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
- Dynamic aggregation pipeline
- Ranks by clout score
- Period filtering (all/month/week)

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
- `GET /leaderboard` - Get top cappers by clout score
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