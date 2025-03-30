# VoteRight Platform Documentation

## Overview
VoteRight is a blockchain-based voting verification platform that incentivizes voter participation through a points and token system. The platform combines face detection, blockchain technology, and gamification to create a secure and engaging voting verification experience.

## System Architecture

### Backend Services

#### 1. User Service (Implemented)
- **Authentication**: JWT-based authentication system
- **Registration**: Secure user registration with email verification
- **Profile Management**: User profile CRUD operations
- **Points System**: Points tracking and leaderboard functionality
- **API Endpoints**:
  - `POST /api/users/register`: User registration
  - `POST /api/users/login`: User authentication
  - `GET /api/users/me`: Get user profile
  - `PUT /api/users/points`: Update user points
  - `GET /api/users/leaderboard`: Get top users by points

#### 2. Face Detection Service (Implemented)
- **Model**: YuNet face detection model
- **Features**: Real-time face detection and validation
- **API Endpoints**:
  - `POST /api/face/detect`: Face detection endpoint
  - Supports image upload and validation

#### 3. Verification Service (Pending)
- Blockchain-based vote verification
- Certificate generation and management
- Privacy-preserving verification system

#### 4. Token Service (Pending)
- Token economy management
- Points-to-token conversion
- Staking and rewards system

#### 5. Analytics Service (Pending)
- Privacy-focused analytics
- Trend analysis and reporting
- Data aggregation services

#### 6. Enterprise Service (Pending)
- Organization management
- Custom voting system configuration
- API access control

### Frontend Components (Pending)

#### 1. User Dashboard
- Points and streaks display
- Activity tracking
- Profile management interface

#### 2. Verification Interface
- Vote verification workflow
- Certificate management
- Verification history

#### 3. Token Management
- Token wallet
- Transaction interface
- Staking and rewards

#### 4. Analytics Dashboard
- Data visualization
- Report generation
- Export functionality

#### 5. Enterprise Portal
- Organization management
- System configuration
- API key management

## Technical Stack

### Backend
- **Language**: Go
- **Framework**: Gin
- **Database**: PostgreSQL
- **Cache**: Redis (planned)
- **Face Detection**: OpenCV/YuNet
- **Authentication**: JWT
- **API Security**: Rate limiting, CORS

### Frontend (Planned)
- **Framework**: Next.js
- **UI Library**: React
- **State Management**: Redux
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Go 1.21 or higher
- PostgreSQL
- OpenCV

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/voteright.git
   ```

2. Set up the backend:
   ```bash
   cd backend
   go mod tidy
   ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Update database and service configurations

4. Run migrations:
   ```bash
   go run cmd/migrate/main.go up
   ```

5. Start the server:
   ```bash
   go run cmd/server/main.go
   ```

### API Documentation

#### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

#### Rate Limiting
- Default: 100 requests per minute
- Configurable through environment variables

## Development Roadmap

### Phase 1 (Completed)
- ✅ Basic infrastructure setup
- ✅ User service implementation
- ✅ Face detection service
- ✅ Database integration

### Phase 2 (In Progress)
- Verification service implementation
- Token system development
- Frontend dashboard development

### Phase 3 (Planned)
- Analytics service
- Enterprise features
- Advanced security measures

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## Security
For security concerns, please email security@voteright.com

## License
This project is licensed under the MIT License - see the LICENSE file for details 