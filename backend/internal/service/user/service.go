package user

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Never expose password
	Points    int64     `json:"points"`
	Streak    int       `json:"streak"`
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Service represents the user service
type Service struct {
	db *sql.DB
}

// NewService creates a new user service
func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// CreateUser creates a new user
func (s *Service) CreateUser(ctx context.Context, username, email, password string) (*User, error) {
	if username == "" || email == "" || password == "" {
		return nil, errors.New("username, email, and password are required")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	now := time.Now()
	user := &User{
		Username:  username,
		Email:     email,
		Password:  string(hashedPassword),
		Points:    0,
		Streak:    0,
		LastLogin: now,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Insert into database
	query := `
		INSERT INTO users (username, email, password, points, streak, last_login, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	err = s.db.QueryRowContext(ctx, query,
		user.Username,
		user.Email,
		user.Password,
		user.Points,
		user.Streak,
		user.LastLogin,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(&user.ID)

	if err != nil {
		return nil, err
	}

	return user, nil
}

// GetUser retrieves a user by ID
func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
	user := &User{}
	query := `
		SELECT id, username, email, points, streak, last_login, created_at, updated_at
		FROM users
		WHERE id = $1`

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Points,
		&user.Streak,
		&user.LastLogin,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

// UpdatePoints updates a user's points
func (s *Service) UpdatePoints(ctx context.Context, userID int64, points int64) error {
	query := `
		UPDATE users
		SET points = points + $1, updated_at = $2
		WHERE id = $3`

	result, err := s.db.ExecContext(ctx, query, points, time.Now(), userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}

// UpdateStreak updates a user's streak
func (s *Service) UpdateStreak(ctx context.Context, userID int64) error {
	query := `
		UPDATE users
		SET streak = streak + 1, last_login = $1, updated_at = $1
		WHERE id = $2 AND (
			last_login IS NULL OR
			(EXTRACT(EPOCH FROM ($1 - last_login)) <= 86400)
		)`

	now := time.Now()
	result, err := s.db.ExecContext(ctx, query, now, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		// Reset streak if more than 24 hours have passed
		query = `
			UPDATE users
			SET streak = 1, last_login = $1, updated_at = $1
			WHERE id = $2`
		_, err = s.db.ExecContext(ctx, query, now, userID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetLeaderboard returns the top users by points
func (s *Service) GetLeaderboard(ctx context.Context, limit int) ([]*User, error) {
	if limit <= 0 {
		limit = 10
	}

	query := `
		SELECT id, username, points, streak
		FROM users
		ORDER BY points DESC
		LIMIT $1`

	rows, err := s.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		user := &User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Points,
			&user.Streak,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// Authenticate authenticates a user
func (s *Service) Authenticate(ctx context.Context, email, password string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, username, email, password, points, streak, last_login, created_at, updated_at
		FROM users
		WHERE email = $1`

	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.Points,
		&user.Streak,
		&user.LastLogin,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid credentials")
	}
	if err != nil {
		return nil, err
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Update last login and streak
	err = s.UpdateStreak(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	// Clear password before returning
	user.Password = ""
	return user, nil
}
