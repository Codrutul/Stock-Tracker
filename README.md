# Stock Tracker Application

A full-stack application for tracking stocks in your portfolio. Users can add, remove, and track stocks with detailed information including price, market cap, industry, and more.

## Features

- Add and remove stocks from your portfolio
- View detailed stock information
- Filter stocks by industry or price range
- Sort stocks by various criteria (price, market cap, etc.)
- Modern, responsive UI with charts and visualizations
- Complete RESTful API backend

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Chart.js for data visualization

### Backend
- Node.js with Express
- PostgreSQL database
- RESTful API architecture
- Jest for testing

## Project Structure

```
stock-tracker/
├── backend/             # Express backend
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middleware
│   ├── tests/           # Unit tests
│   ├── server.js        # Entry point
│   └── db.js            # Database connection
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── classes/         # Data models
│   ├── utils/           # Utility functions
│   ├── assets/          # Images and icons
│   └── App.tsx          # Main application component
└── package.json         # Project dependencies and scripts
```

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-tracker
```

2. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

3. Configure environment variables:
   - Update `backend/database.env` with your PostgreSQL connection string

4. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (http://localhost:5000) and the frontend development server.

## API Endpoints

### Stocks

- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:name` - Get a stock by name
- `POST /api/stocks` - Create a new stock
- `PATCH /api/stocks/:name` - Update an existing stock
- `DELETE /api/stocks/:name` - Delete a stock

### Filtering and Sorting

- `GET /api/stocks/filter/industry/:industry` - Get stocks by industry
- `GET /api/stocks/filter/price?min=X&max=Y` - Get stocks within a price range
- `GET /api/stocks/sort/:sortBy` - Get sorted stocks (price, marketCap, change, dividendAmount, amount_owned)

## Testing

Run backend tests with Jest:
```bash
npm test
```

## License

ISC
