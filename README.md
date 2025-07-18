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

### MVP Features (Current)
- ✅ User registration (Capper/Bettor roles)
- ✅ Create and publish fight picks
- ✅ View pick feed
- ✅ Leaderboard rankings
- ✅ Basic user profiles
- ✅ Mock fight data integration

### Planned Features
- 🔄 Real-time fight results integration
- 🔄 Social features (follow, like, comment)
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app (React Native)
- 🔄 Expand to NFL, NBA, MLB

## 📊 Data Models

### User
- Username, email, role (capper/user)
- Followers array
- Clout score (computed metric)

### Pick
- Capper ID reference
- Fight event details
- Prediction (winner, method, odds)
- Timestamp
- Verified outcome

### Leaderboard
- Aggregated view of capper performance
- Win rate calculation
- Clout score (70% success + 30% social)

## 🧪 Testing

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

Base URL: `http://localhost:5000/api`

### Endpoints
- `GET /health` - API health check
- `POST /picks` - Create new pick (auth required)
- `GET /picks/:id` - Get specific pick
- `GET /leaderboard` - Get top 10 cappers

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