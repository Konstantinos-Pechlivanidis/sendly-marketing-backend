# 🚀 SMS Blossom Backend

A production-ready SMS marketing backend for Shopify extensions, built with Express.js, PostgreSQL, and Redis.

## ✨ Features

- **📱 SMS Marketing** - Send SMS campaigns via Mitto API
- **🎯 Campaign Management** - Create and manage SMS campaigns
- **👥 Contact Management** - Import and segment contacts
- **🤖 Automation** - Automated SMS workflows
- **📊 Analytics** - Campaign performance tracking
- **🔒 Security** - Production-ready security features
- **📈 Monitoring** - Health checks and metrics
- **🚀 Scalable** - Queue-based architecture with Redis

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│   (Shopify)     │◄──►│   (Express.js)  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache &     │
                       │    Queues)     │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Shopify Partner account
- Mitto SMS API account

### Installation

#### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
scripts\install-production.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/install-production.sh
./scripts/install-production.sh
```

#### Option 2: Manual Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd sendly-marketing-backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start Server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `SHOPIFY_API_KEY` | Shopify API key | ✅ |
| `SHOPIFY_API_SECRET` | Shopify API secret | ✅ |
| `MITTO_API_KEY` | Mitto SMS API key | ✅ |
| `HOST` | Your app URL | ✅ |
| `ALLOWED_ORIGINS` | CORS allowed origins | ✅ |

### Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **Shop** - Shopify store information
- **Contact** - SMS contacts and subscribers
- **Campaign** - SMS campaigns
- **Automation** - Automated workflows
- **Wallet** - SMS credits management

## 📊 API Endpoints

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/config` - Configuration health
- `GET /health/full` - Comprehensive health check
- `GET /metrics` - Application metrics

### Core Features
- `POST /campaigns` - Create SMS campaigns
- `GET /contacts` - Manage contacts
- `POST /automations` - Setup automations
- `GET /reports` - Campaign analytics

## 🚀 Deployment

### Render.com (Recommended)

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [Render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Set environment variables
   - Deploy!

### Docker

```bash
docker build -t sendly-marketing-backend .
docker run -p 3000:3000 \
  -e DATABASE_URL=your_database_url \
  -e REDIS_URL=your_redis_url \
  sendly-marketing-backend
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📈 Monitoring

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health status |
| `/health/full` | Comprehensive system health |
| `/metrics` | Application metrics |

### Key Metrics

- Response time
- Error rate
- Database health
- Redis health
- Queue status
- Memory usage

## 🔒 Security Features

- **Rate Limiting** - Multiple rate limit configurations
- **CORS Protection** - Origin validation
- **Security Headers** - Helmet with CSP
- **Input Validation** - Request sanitization
- **API Authentication** - Secure API keys
- **Request Logging** - Security monitoring

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment instructions
- [Production Ready](PRODUCTION_READY.md) - Production checklist
- [API Documentation](docs/) - Detailed API documentation

## 🛠️ Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run db:studio  # Open Prisma Studio
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Project Structure

```
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middlewares/      # Express middlewares
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── queue/           # Background jobs
├── tests/           # Test files
├── scripts/         # Build and deployment scripts
├── prisma/          # Database schema and migrations
└── docs/            # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the [documentation](docs/)
2. Review [health endpoints](https://your-app.onrender.com/health/full)
3. Check application logs
4. Verify environment variables

## 🎯 Roadmap

- [ ] Advanced segmentation
- [ ] A/B testing
- [ ] Multi-language support
- [ ] AI-powered content
- [ ] Mobile app companion

---

**Built with ❤️ for Shopify merchants**

*SMS Blossom - Transform your SMS marketing with powerful automation and analytics.*
