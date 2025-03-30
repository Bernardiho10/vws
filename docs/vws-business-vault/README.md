# VoteRight Business Vault Documentation

## Overview
VoteRight is a blockchain-based voting verification platform that combines face detection, blockchain technology, and gamification to create a secure and engaging voting experience.

## System Architecture

### Backend Services (Go)
The backend is built with Go and provides several RESTful APIs:

1. **Face Detection Service**
   - Path: `/api/face/detect`
   - Method: POST
   - Purpose: Verifies user identity through facial recognition
   - Input: Image file
   - Output: Detection results with confidence score

2. **Authentication Service** (To be implemented)
   - Path: `/api/auth/*`
   - Methods: POST, GET
   - Purpose: User registration, login, and session management

3. **Verification Service** (To be implemented)
   - Path: `/api/verify/*`
   - Methods: POST, GET
   - Purpose: Vote verification and certificate generation

4. **Token Service** (To be implemented)
   - Path: `/api/token/*`
   - Methods: POST, GET
   - Purpose: Token management and transactions

### Frontend Application (Next.js)
The frontend is built with Next.js and provides:

1. **Face Detection Interface**
   - Path: `/face-detection`
   - Features: Real-time face detection using face-api.js
   - Integration: Communicates with Go backend for verification

2. **User Dashboard** (To be implemented)
   - Path: `/dashboard`
   - Features: Points, streaks, and verification history

3. **Token Management** (To be implemented)
   - Path: `/wallet`
   - Features: Token balance, transactions, and staking

## Setup Instructions

### Prerequisites
1. Go 1.21 or higher
2. Node.js 18 or higher
3. OpenCV 4.8.0
4. PostgreSQL 15 or higher

### Backend Setup
1. Install OpenCV:
   ```powershell
   cd scripts
   ./install-opencv.ps1
   ```

2. Set environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run the backend:
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Face Detection API
```http
POST /api/face/detect
Content-Type: multipart/form-data

{
  "image": <file>
}

Response:
{
  "faces": [
    {
      "box": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 200
      },
      "score": 0.98,
      "landmarks": [...]
    }
  ]
}
```

## Testing

### Backend Tests
```bash
cd backend
go test ./...
```

### Frontend Tests
```bash
npm run test
```

## Deployment

### Backend Deployment
1. Build the binary:
   ```bash
   cd backend
   go build -o vws-server cmd/server/main.go
   ```

2. Run in production:
   ```bash
   ./vws-server
   ```

### Frontend Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## Security Considerations

1. **Face Detection Security**
   - Liveness detection to prevent spoofing
   - Encrypted image transmission
   - Secure storage of biometric data

2. **Blockchain Security**
   - Smart contract auditing
   - Multi-signature wallets
   - Rate limiting for transactions

3. **API Security**
   - JWT authentication
   - Rate limiting
   - Input validation

## Monitoring and Maintenance

1. **Health Checks**
   - Backend: `/api/health`
   - Frontend: `/api/status`

2. **Logging**
   - Backend: Structured logging with levels
   - Frontend: Client-side error tracking

3. **Metrics**
   - Request latency
   - Error rates
   - System resource usage

## Troubleshooting

### Common Issues

1. OpenCV Installation
   ```
   Error: OpenCV not found
   Solution: Verify PATH in install-opencv.ps1
   ```

2. Face Detection
   ```
   Error: Model loading failed
   Solution: Check model path in config.json
   ```

3. API Communication
   ```
   Error: CORS error
   Solution: Verify CORS configuration in main.go
   ```

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement changes
   - Write tests
   - Submit PR

2. **Testing Process**
   - Unit tests
   - Integration tests
   - End-to-end tests

3. **Deployment Process**
   - Stage changes
   - Run test suite
   - Deploy to production

## Contributing
Please see CONTRIBUTING.md for guidelines.

## License
This project is licensed under the MIT License. 