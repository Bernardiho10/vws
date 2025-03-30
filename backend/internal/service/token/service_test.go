package token

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestConvertPointsToTokens(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock DB: %v", err)
	}
	defer db.Close()

	svc := &Service{db: db}
	ctx := context.Background()
	now := time.Now()

	mock.ExpectBegin()

	// Expect points check query
	mock.ExpectQuery(`SELECT points FROM users WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"points"}).AddRow(200)) // User has 200 points

	mock.ExpectQuery(`INSERT INTO token_transactions`).
		WithArgs(1, "EARN", 10.0, 100, "Points conversion").
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, now, now))

	mock.ExpectExec(`UPDATE users SET points = points - \$1 WHERE id = \$2`).
		WithArgs(100, 1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	txn, err := svc.ConvertPointsToTokens(ctx, 1, 100)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), txn.ID)
	assert.Equal(t, int64(1), txn.UserID)
	assert.Equal(t, "EARN", txn.Type)
	assert.Equal(t, 10.0, txn.Amount)
	assert.Equal(t, 100, txn.PointsConverted)
	assert.Equal(t, "Points conversion", txn.Description)
}

func TestGetTransaction(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock DB: %v", err)
	}
	defer db.Close()

	svc := &Service{db: db}
	ctx := context.Background()
	now := time.Now()

	mock.ExpectQuery(`SELECT .+ FROM token_transactions WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "user_id", "type", "amount", "points_converted",
			"description", "created_at", "updated_at",
		}).AddRow(1, 1, "EARN", 10.0, 100, "Points conversion", now, now))

	txn, err := svc.GetTransaction(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), txn.ID)
	assert.Equal(t, int64(1), txn.UserID)
	assert.Equal(t, "EARN", txn.Type)
	assert.Equal(t, 10.0, txn.Amount)
	assert.Equal(t, 100, txn.PointsConverted)
	assert.Equal(t, "Points conversion", txn.Description)
}

func TestGetUserTransactions(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock DB: %v", err)
	}
	defer db.Close()

	svc := NewService(db)
	ctx := context.Background()
	now := time.Now()

	mock.ExpectQuery(`SELECT id, user_id, type, amount, points_converted, description, created_at, updated_at
		FROM token_transactions
		WHERE user_id = \$1
		ORDER BY created_at DESC
		LIMIT \$2 OFFSET \$3`).
		WithArgs(1, 10, 0).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "user_id", "type", "amount", "points_converted",
			"description", "created_at", "updated_at",
		}).AddRow(
			1, 1, "POINTS_CONVERSION", 100.0, 1000,
			"Converted points to tokens", now, now,
		))

	txns, err := svc.GetUserTransactions(ctx, 1, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, txns, 1)
	assert.Equal(t, int64(1), txns[0].ID)
	assert.Equal(t, int64(1), txns[0].UserID)
	assert.Equal(t, "POINTS_CONVERSION", txns[0].Type)
	assert.Equal(t, 100.0, txns[0].Amount)
	assert.Equal(t, 1000, txns[0].PointsConverted)
	assert.Equal(t, "Converted points to tokens", txns[0].Description)
}

func TestConvertPointsToTokens_InsufficientPoints(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock DB: %v", err)
	}
	defer db.Close()

	svc := &Service{db: db}
	ctx := context.Background()

	mock.ExpectBegin()

	// First, check if user has enough points
	mock.ExpectQuery(`SELECT points FROM users WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"points"}).AddRow(50)) // User only has 50 points

	mock.ExpectRollback()

	_, err = svc.ConvertPointsToTokens(ctx, 1, 100) // Trying to convert 100 points
	assert.Error(t, err)
	assert.Equal(t, ErrInsufficientPoints, err)
}
