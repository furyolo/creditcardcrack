# Credit Card Test Tool

**Language / 语言选择:**
**English** | [中文文档](README.zh-CN.md)

---

A comprehensive toolkit for generating test credit card numbers and related information, designed specifically for payment system development and testing environments.

## 📋 Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Project Architecture](#project-architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Userscripts](#userscripts)
- [FAQ](#faq)

## ✨ Features

### 🎴 Credit Card Generation

- Generate valid test card numbers compliant with Luhn algorithm
- Support multiple card types: Visa, MasterCard, Discover, JCB
- Auto-generate expiration dates (MM/YYYY) and CVV codes
- Support both batch and single card generation
- Database persistence storage

### 🌍 Geolocation Services

- Auto-fetch geolocation based on real IP
- Reverse geocoding using OpenStreetMap
- Generate complete address information (house number, street, city, state, postal code)
- Auto-match country codes

### 👤 User Information Generation

- Generate random test user names
- Generate phone numbers in country-specific formats
- Generate SSN/ID numbers
- Support multi-country user information (based on IP geolocation)

### 🤖 Browser Automation

- **StripeHelper** - Auto-fill Stripe payment forms
- **GenCreditNum** - Credit card number generation and management interface
- **GeoUserInfo** - Geolocation and user information retrieval
- Intelligent form field recognition
- One-click copy functionality
- Draggable floating window

### 🔐 API Security

- API Key authentication mechanism
- Configurable authentication toggle
- Request header validation (x-api-key)

## 📦 System Requirements

- **Node.js** >= 18.0.0
- **pnpm** >= 10.0.0
- **PostgreSQL** >= 14
- **Browser Extension**: Tampermonkey (Chrome/Firefox/Edge)

## 🏗️ Project Architecture

```
creditcardcrack/
├── packages/
│   ├── api-server/              # Backend API service
│   │   ├── src/
│   │   │   ├── server.js        # Fastify server entry
│   │   │   ├── controllers/     # Business logic controllers
│   │   │   │   └── cardController.js
│   │   │   ├── routes/          # API route definitions
│   │   │   │   └── cardRoutes.js
│   │   │   ├── hooks/           # Request hooks (authentication)
│   │   │   │   └── apiKeyAuth.js
│   │   │   └── db/              # Database client
│   │   │       └── prismaClient.js
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Data model definitions
│   │   │   └── migrations/      # Database migrations
│   │   └── package.json
│   │
│   └── userscripts/             # Browser userscripts
│       ├── StripeHelper.user.js      # Stripe form helper
│       ├── GenCreditNum.user.js      # Card number generator
│       ├── GeoUserInfo.user.js       # Geo info retrieval
│       └── GeoUserInfo.lib.js        # Shared library
│
├── package.json                 # Root project config
├── CLAUDE.md                    # AI assistant guide
└── README.md                    # Project documentation
```

### Tech Stack

**Backend:**
- Fastify - High-performance web framework
- Prisma - Modern ORM
- PostgreSQL - Relational database
- Swagger/OpenAPI - API documentation

**Frontend/Scripts:**
- Tampermonkey - Userscript manager
- GM API - Cross-origin requests and storage

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/creditcardcrack.git
cd creditcardcrack
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `packages/api-server/.env` file:

```ini
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/creditcards?schema=public"

# Server configuration
HOST="0.0.0.0"
PORT="3227"

# API authentication (optional)
REQUIRE_API_KEY=true
API_KEY=your_secret_api_key_here
```

**Authentication Notes:**
- `REQUIRE_API_KEY=false` - Disable authentication (local development only)
- `REQUIRE_API_KEY=true` - Enable authentication (recommended for production)

### 4. Initialize Database

```bash
# Run database migrations
pnpm db:migrate

# (Optional) Open database management interface
pnpm db:studio
```

### 5. Start API Server

```bash
# Production mode
pnpm start:api

# Development mode (with hot reload)
pnpm dev:api
```

Server will run at `http://localhost:3227`

### 6. Install Userscripts

#### Method 1: Install from Local Files

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey Dashboard
3. Click "Utilities" → "Import"
4. Select files from `packages/userscripts/` directory:
   - `GeoUserInfo.lib.js` (must install first)
   - `StripeHelper.user.js`
   - `GenCreditNum.user.js`
   - `GeoUserInfo.user.js`

#### Method 2: Install via URL (if server is configured)

Visit the following URLs and click install:
- `http://localhost:3227/scripts/StripeHelper.user.js`
- `http://localhost:3227/scripts/GenCreditNum.user.js`
- `http://localhost:3227/scripts/GeoUserInfo.user.js`

**First-time Use:**
When API Key authentication is enabled, userscripts will prompt for API Key on first API call. The key will be saved automatically.

## 📚 API Documentation

Access Swagger documentation after starting the server:
```
http://localhost:3227/documentation
```

### Main Endpoints

All requests require `x-api-key` header (if authentication is enabled).

#### Get Random Card
```http
GET /random-card?type=visa
```

**Query Parameters:**
- `type` (optional): Card type - `visa`, `mastercard`, `discover`, `jcb`

**Response Example:**
```json
{
  "success": true,
  "card": {
    "card_type": "VISA",
    "card_number": "4532123456789012",
    "expire_month": "12",
    "expire_year": "2028",
    "cvv": "123",
    "formatted_info": "4532 1234 5678 9012 | 12/2028 | 123"
  }
}
```

#### Batch Save Cards
```http
POST /save-cards
Content-Type: application/json

{
  "cards": [
    {
      "card_type": "VISA",
      "card_number": "4532123456789012",
      "expire_month": "12",
      "expire_year": "2028",
      "cvv": "123",
      "formatted_info": "4532 1234 5678 9012 | 12/2028 | 123"
    }
  ]
}
```

#### Delete Card
```http
DELETE /card/4532123456789012
```

#### Update Card Information
```http
PUT /card/4532123456789012
Content-Type: application/json

{
  "expire_month": "06",
  "expire_year": "2029"
}
```

#### Get Statistics
```http
GET /stats
```

**Response Example:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "by_type": [
      { "card_type": "VISA", "count": 80 },
      { "card_type": "MASTERCARD", "count": 70 }
    ]
  }
}
```

## 🔧 Userscripts

### StripeHelper - Stripe Payment Assistant

**Applicable Pages:**
- `https://checkout.stripe.com/c/pay*`
- `https://billing.stripe.com/p*`

**Features:**
- Auto-fill credit card information
- Auto-fill billing address
- One-click copy card number/CVV/postal code
- Delete used card numbers

**Usage:**
1. Visit Stripe payment page
2. Click "Generate Credit Card" button in floating window
3. Select card type (Visa/MasterCard/Discover/JCB)
4. Click "Get Address Info" to auto-fill address
5. Form will be auto-filled

### GenCreditNum - Credit Card Generator

**Applicable Pages:**
- `https://uncoder.eu.org/cc-checker/*`

**Features:**
- Generate single or batch credit card numbers
- Real-time Luhn algorithm validation
- One-click copy functionality
- Save to database

### GeoUserInfo - Geo Information Assistant

**Applicable Pages:**
- `https://uncoder.eu.org/cc-checker/*`

**Features:**
- Fetch geolocation based on IP
- Generate complete address information
- Generate random user information
- Auto-match country codes

## ❓ FAQ

### 1. Database Connection Failed

**Issue:** `Error: Can't reach database server`

**Solutions:**
- Confirm PostgreSQL service is running
- Verify `DATABASE_URL` in `.env` is correct
- Check database user permissions
- Confirm database is created: `CREATE DATABASE creditcards;`

### 2. Userscript Not Working

**Issue:** No floating window after script installation

**Solutions:**
- Confirm Tampermonkey is enabled
- Check if script runs on correct website (check `@match` rules)
- Open browser console for error messages
- Confirm `GeoUserInfo.lib.js` is properly installed

### 3. API Request Failed (401 Unauthorized)

**Issue:** `{"success": false, "error": "Missing API key"}`

**Solutions:**
- Confirm `REQUIRE_API_KEY=true` in `.env`
- Enter correct API Key in userscript
- Check if request header contains `x-api-key`
- For local testing, set `REQUIRE_API_KEY=false`

### 4. Cross-Origin Request Blocked

**Issue:** CORS error

**Solutions:**
- Confirm `@connect` directive in Tampermonkey includes target domain
- API server has CORS enabled (default configuration)
- Use `GM_xmlhttpRequest` instead of `fetch`

### 5. Generated Card Number Invalid

**Issue:** Luhn algorithm validation failed

**Solutions:**
- Check if BIN prefix is correct
- Confirm card number length is 16 digits
- Verify Luhn checksum calculation in generation logic

### 6. Address Information Retrieval Failed

**Issue:** OpenStreetMap API returns error

**Solutions:**
- Check network connection
- Confirm IP geolocation service is available
- OSM Nominatim has rate limits (1 request/second)
- Consider adding `User-Agent` and `email` parameters

### 7. Batch Generation Performance Issues

**Issue:** Slow when generating large batches

**Solutions:**
- Recommend generating no more than 100 cards per batch
- Use database caching to improve performance
- Consider using database transactions for batch operations
- Monitor database connection pool

### 8. Data Privacy and Security

**Issue:** Concerns about data storage

**Solutions:**
- All generated data is test data only
- Data stored locally in your database
- No real user information is collected
- Regularly clean test data
- Never use in production environment

## ⚠️ Legal Disclaimer

This tool is for educational purposes and development testing only. It must not be used for any illegal activities. Users are solely responsible for any consequences arising from misuse of this tool.

## 📝 License

This project is for educational and testing purposes only.

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📧 Contact

- Submit an Issue on GitHub

