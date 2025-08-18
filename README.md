# Waivio API

A comprehensive REST API for the Waivio social media platform built on the Hive blockchain. Waivio is a decentralized social media platform where users can earn crypto rewards for their content, create social shopping experiences, and build communities around objects, businesses, and products.

## 🚀 Overview

Waivio API serves as the backend for the Waivio platform, providing endpoints for:
- **Social Media Features**: Posts, comments, voting, following
- **Object Management**: Businesses, products, places, pages, and custom objects
- **Social Shopping**: Affiliate shops, product recommendations, e-commerce integration
- **User Management**: Authentication, profiles, wallets, notifications
- **Content Discovery**: Search, feeds, trending content
- **Blockchain Integration**: Hive blockchain operations and token management

## 🏗️ Architecture

- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session management and data caching
- **Blockchain**: Hive blockchain integration via @hiveio/dhive
- **Authentication**: Multiple auth providers (HiveSigner, HiveAuth, Google)
- **Documentation**: Swagger/OpenAPI
- **Monitoring**: Sentry for error tracking
- **AI Integration**: LangChain for AI-powered features

## 📦 Key Features

### Social Media Platform
- Decentralized content creation and curation
- Crypto rewards system (WAIV tokens)
- Social connections and following
- Content discovery and trending algorithms

### Object System
- Create and manage various object types (businesses, products, places, pages)
- Object-specific pages with reviews and discussions
- Tag-based categorization and search
- Custom object types and fields

### Social Shopping
- Affiliate shop integration
- Product recommendations and reviews
- E-commerce platform integration
- Social.Gifts website generation

### Blockchain Integration
- Hive blockchain operations
- Token management (WAIV, HIVE, HBD)
- Smart contract interactions
- Decentralized identity management

## 🛠️ Tech Stack

### Core Dependencies
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **ioredis** - Redis client
- **@hiveio/dhive** - Hive blockchain client
- **Joi** - Data validation
- **Sharp** - Image processing
- **Axios** - HTTP client

### AI & ML
- **LangChain** - AI framework
- **@langchain/openai** - OpenAI integration
- **@langchain/redis** - Vector storage
- **@langchain/weaviate** - Vector database

### Development & Testing
- **Mocha** - Testing framework
- **Chai** - Assertion library
- **ESLint** - Code linting
- **NYC** - Code coverage

## 🚀 Getting Started

### Prerequisites
- Node.js 22.18.0+
- MongoDB
- Redis
- Hive blockchain access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waivio-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/waivio
   REDIS_URL=redis://localhost:6379
   HIVE_NODE_URL=https://api.hive.blog
   SENTRY_DSN=your_sentry_dsn
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB and Redis
   # Ensure databases are running and accessible
   ```

5. **Run the application**
   ```bash
   npm start
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.staging.yml up --build
```

## 📚 API Documentation

The API documentation is available at `/api/docs` when the server is running. The documentation is generated using Swagger/OpenAPI and includes:

- **Authentication endpoints**
- **User management**
- **Post and content operations**
- **Object management**
- **Social shopping features**
- **Blockchain operations**

## 🏃‍♂️ Available Scripts

### Development
```bash
npm start          # Start the application
npm run lint       # Run ESLint
```

### Testing
```bash
npm test           # Run tests with coverage
```

## 🏗️ Project Structure

```
waivio-api/
├── app.js                 # Express application setup
├── bin/www               # Server entry point
├── config/               # Configuration files
├── constants/            # Application constants
├── controllers/          # Route controllers
│   └── validators/      # Request validation
├── database/            # Database schemas and models
├── jobs/               # Background jobs and cron tasks
├── middlewares/        # Express middlewares
├── models/             # Mongoose models
├── pipeline/           # Data processing pipelines
├── routes/             # API route definitions
├── swagger/            # API documentation
├── test/               # Test files
├── utilities/          # Helper functions and utilities
│   ├── operations/     # Business logic operations
│   ├── redis/          # Redis utilities
│   └── tasks/          # Database maintenance tasks
└── currenciesDB/       # Currency rate management
```

## 🔧 Configuration

The application supports multiple environments:
- **Development** - Local development setup
- **Staging** - Pre-production testing
- **Production** - Live production environment
- **Test** - Testing environment

Configuration is managed through `config/config.json` and environment variables.

## 🔐 Authentication

Waivio API supports multiple authentication methods:
- **HiveSigner** - Hive blockchain authentication
- **HiveAuth** - Hive Keychain integration
- **Google OAuth** - Social authentication for guest users

## 📊 Monitoring & Logging

- **Sentry** - Error tracking and performance monitoring
- **Morgan** - HTTP request logging
- **Custom middleware** - Request rate limiting and statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Links

- [Waivio Platform](https://www.waivio.com)
- [Hive Blockchain](https://hive.io)
- [Social.Gifts](https://social.gifts)
- [API Documentation](https://www.waivio.com/api/docs)

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Visit the [Waivio community threads](https://www.waivio.com/object/ylr-waivio/threads)
- Check the [About section](https://www.waivio.com/object/ylr-waivio/page) for general information
