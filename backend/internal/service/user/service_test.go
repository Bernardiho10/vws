package user

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestCreateUser(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)

	mock.ExpectQuery("INSERT INTO users").
		WithArgs(
			sqlmock.AnyArg(), // username
			sqlmock.AnyArg(), // email
			sqlmock.AnyArg(), // password
			sqlmock.AnyArg(), // points
			sqlmock.AnyArg(), // streak
			sqlmock.AnyArg(), // last_login
			sqlmock.AnyArg(), // created_at
			sqlmock.AnyArg(), // updated_at
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	user, err := service.CreateUser(context.Background(), "testuser", "test@example.com", "password123")
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, int64(0), user.Points)
	assert.Equal(t, 0, user.Streak)
}

func TestGetUser(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "username", "email", "points", "streak",
		"last_login", "created_at", "updated_at",
	}).AddRow(
		1, "testuser", "test@example.com", 100, 5,
		now, now, now,
	)

	mock.ExpectQuery("SELECT (.+) FROM users").
		WithArgs(1).
		WillReturnRows(rows)

	user, err := service.GetUser(context.Background(), 1)
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, int64(1), user.ID)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, int64(100), user.Points)
	assert.Equal(t, 5, user.Streak)
}

func TestUpdatePoints(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)

	mock.ExpectExec("UPDATE users").
		WithArgs(
			sqlmock.AnyArg(), // points
			sqlmock.AnyArg(), // updated_at
			1,                // user_id
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err = service.UpdatePoints(context.Background(), 1, 50)
	assert.NoError(t, err)
}

func TestGetLeaderboard(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)

	rows := sqlmock.NewRows([]string{
		"id", "username", "points", "streak",
	}).
		AddRow(1, "user1", 100, 5).
		AddRow(2, "user2", 80, 3).
		AddRow(3, "user3", 60, 2)

	mock.ExpectQuery("SELECT (.+) FROM users ORDER BY points DESC").
		WithArgs(10).
		WillReturnRows(rows)

	users, err := service.GetLeaderboard(context.Background(), 10)
	assert.NoError(t, err)
	assert.Len(t, users, 3)
	assert.Equal(t, "user1", users[0].Username)
	assert.Equal(t, int64(100), users[0].Points)
}

func TestAuthenticate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)
	now := time.Now()

	// Set up mock for user query
	rows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "points", "streak",
		"last_login", "created_at", "updated_at",
	}).AddRow(
		1, "testuser", "test@example.com",
		"$2a$10$f21Tq4lkY4/zBs5GyEu0vuq1hgiv9j0oblJfX594mvp7LHuK7Mpbm", // pre-hashed "password123"
		100, 5,
		now, now, now,
	)

	mock.ExpectQuery("SELECT (.+) FROM users WHERE email").
		WithArgs("test@example.com").
		WillReturnRows(rows)

	mock.ExpectExec("UPDATE users").
		WithArgs(
			sqlmock.AnyArg(), // last_login
			1,                // user_id
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	authenticatedUser, err := service.Authenticate(context.Background(), "test@example.com", "password123")
	assert.NoError(t, err)
	assert.NotNil(t, authenticatedUser)
	assert.Equal(t, "testuser", authenticatedUser.Username)
	assert.Equal(t, "", authenticatedUser.Password) // Password should be cleared
}

func TestAuthenticateInvalidCredentials(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewService(db)

	mock.ExpectQuery("SELECT (.+) FROM users WHERE email").
		WithArgs("test@example.com").
		WillReturnError(sql.ErrNoRows)

	_, err = service.Authenticate(context.Background(), "test@example.com", "wrongpassword")
	assert.Error(t, err)
	assert.Equal(t, "invalid credentials", err.Error())
}
