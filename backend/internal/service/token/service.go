package token

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrInsufficientPoints  = errors.New("insufficient points")
	ErrInsufficientBalance = errors.New("insufficient balance")
	ErrInvalidAmount       = errors.New("invalid amount")
	ErrInvalidStakePeriod  = errors.New("invalid stake period")
	ErrAlreadyStaked       = errors.New("tokens already staked")
	ErrNoStakedTokens      = errors.New("no staked tokens")
	ErrStakePeriodActive   = errors.New("stake period still active")
)

type Token struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"userId"`
	Balance       float64   `json:"balance"`
	StakedAmount  float64   `json:"stakedAmount"`
	LastStakeDate time.Time `json:"lastStakeDate,omitempty"`
	StakeDuration int       `json:"stakeDuration,omitempty"`
	StakeEndDate  time.Time `json:"stakeEndDate,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Transaction struct {
	ID              int64     `json:"id"`
	UserID          int64     `json:"user_id"`
	Type            string    `json:"type"`
	Amount          float64   `json:"amount"`
	PointsConverted int       `json:"points_converted"`
	Description     string    `json:"description"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// ConvertPointsToTokens converts user points to tokens at a specified rate
func (s *Service) ConvertPointsToTokens(ctx context.Context, userID int64, points int) (*Transaction, error) {
	// Calculate token amount (1 point = 0.1 tokens)
	tokenAmount := float64(points) * 0.1

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if user has enough points
	var userPoints int
	err = tx.QueryRow("SELECT points FROM users WHERE id = $1", userID).Scan(&userPoints)
	if err != nil {
		return nil, err
	}
	if userPoints < points {
		return nil, ErrInsufficientPoints
	}

	// Create token transaction
	var transaction Transaction
	err = tx.QueryRow(
		`INSERT INTO token_transactions
		(user_id, type, amount, points_converted, description)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`,
		userID, "EARN", tokenAmount, points, "Points conversion",
	).Scan(&transaction.ID, &transaction.CreatedAt, &transaction.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Update user points
	result, err := tx.Exec(
		`UPDATE users SET points = points - $1 WHERE id = $2`,
		points, userID,
	)
	if err != nil {
		return nil, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, sql.ErrNoRows
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	transaction.UserID = userID
	transaction.Type = "EARN"
	transaction.Amount = tokenAmount
	transaction.PointsConverted = points
	transaction.Description = "Points conversion"

	return &transaction, nil
}

// StakeTokens stakes a specified amount of tokens for a duration
func (s *Service) StakeTokens(ctx context.Context, userID int64, amount float64, durationDays int) (*Transaction, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	if durationDays < 30 {
		return nil, ErrInvalidStakePeriod
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if user already has staked tokens
	var stakedAmount float64
	err = tx.QueryRowContext(ctx,
		"SELECT staked_amount FROM tokens WHERE user_id = $1",
		userID).Scan(&stakedAmount)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if stakedAmount > 0 {
		return nil, ErrAlreadyStaked
	}

	// Update token balance and stake
	now := time.Now()
	endDate := now.AddDate(0, 0, durationDays)
	result, err := tx.ExecContext(ctx,
		`UPDATE tokens 
		SET balance = balance - $1,
			staked_amount = $1,
			last_stake_date = $2,
			stake_duration_days = $3,
			stake_end_date = $4
		WHERE user_id = $5 AND balance >= $1`,
		amount, now, durationDays, endDate, userID)
	if err != nil {
		return nil, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, ErrInsufficientBalance
	}

	// Record transaction
	var txnID int64
	err = tx.QueryRowContext(ctx,
		`INSERT INTO token_transactions 
		(user_id, type, amount, description)
		VALUES ($1, 'STAKE', $2, $3)
		RETURNING id`,
		userID, amount, "Token staking").Scan(&txnID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetTransaction(ctx, txnID)
}

// UnstakeTokens unstakes tokens after the staking period has ended
func (s *Service) UnstakeTokens(ctx context.Context, userID int64) (*Transaction, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Get staking details
	var token Token
	err = tx.QueryRowContext(ctx,
		`SELECT staked_amount, stake_end_date 
		FROM tokens WHERE user_id = $1`,
		userID).Scan(&token.StakedAmount, &token.StakeEndDate)
	if err != nil {
		return nil, err
	}

	if token.StakedAmount == 0 {
		return nil, ErrNoStakedTokens
	}

	if time.Now().Before(token.StakeEndDate) {
		return nil, ErrStakePeriodActive
	}

	// Calculate reward (5% APY, prorated for stake duration)
	reward := token.StakedAmount * 0.05

	// Update token balance
	_, err = tx.ExecContext(ctx,
		`UPDATE tokens 
		SET balance = balance + $1 + $2,
			staked_amount = 0,
			last_stake_date = NULL,
			stake_duration_days = NULL,
			stake_end_date = NULL
		WHERE user_id = $3`,
		token.StakedAmount, reward, userID)
	if err != nil {
		return nil, err
	}

	// Record transaction
	var txnID int64
	err = tx.QueryRowContext(ctx,
		`INSERT INTO token_transactions 
		(user_id, type, amount, description)
		VALUES ($1, 'UNSTAKE', $2, $3)
		RETURNING id`,
		userID, token.StakedAmount+reward,
		"Token unstaking with reward").Scan(&txnID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetTransaction(ctx, txnID)
}

// TransferTokens transfers tokens between users
func (s *Service) TransferTokens(ctx context.Context, fromUserID, toUserID int64, amount float64) (*Transaction, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Deduct from sender
	result, err := tx.ExecContext(ctx,
		`UPDATE tokens 
		SET balance = balance - $1
		WHERE user_id = $2 AND balance >= $1`,
		amount, fromUserID)
	if err != nil {
		return nil, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, ErrInsufficientBalance
	}

	// Add to receiver
	_, err = tx.ExecContext(ctx,
		`INSERT INTO tokens (user_id, balance) 
		VALUES ($1, $2)
		ON CONFLICT (user_id) 
		DO UPDATE SET balance = tokens.balance + $2`,
		toUserID, amount)
	if err != nil {
		return nil, err
	}

	// Record transaction
	var txnID int64
	err = tx.QueryRowContext(ctx,
		`INSERT INTO token_transactions 
		(user_id, type, amount, from_user_id, to_user_id, description)
		VALUES ($1, 'TRANSFER', $2, $3, $4, $5)
		RETURNING id`,
		fromUserID, amount, fromUserID, toUserID,
		"Token transfer").Scan(&txnID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetTransaction(ctx, txnID)
}

// GetUserTokens gets a user's token information
func (s *Service) GetUserTokens(ctx context.Context, userID int64) (*Token, error) {
	token := &Token{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, balance, staked_amount, 
		last_stake_date, stake_duration_days, stake_end_date,
		created_at, updated_at
		FROM tokens WHERE user_id = $1`,
		userID).Scan(
		&token.ID, &token.UserID, &token.Balance, &token.StakedAmount,
		&token.LastStakeDate, &token.StakeDuration, &token.StakeEndDate,
		&token.CreatedAt, &token.UpdatedAt)
	if err == sql.ErrNoRows {
		// Return empty token info if not found
		token.UserID = userID
		return token, nil
	}
	if err != nil {
		return nil, err
	}
	return token, nil
}

// GetTransaction gets a transaction by ID
func (s *Service) GetTransaction(ctx context.Context, id int64) (*Transaction, error) {
	txn := &Transaction{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, type, amount, points_converted, description, created_at, updated_at
		FROM token_transactions WHERE id = $1`,
		id).Scan(
		&txn.ID, &txn.UserID, &txn.Type, &txn.Amount,
		&txn.PointsConverted, &txn.Description, &txn.CreatedAt, &txn.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return txn, nil
}

// GetUserTransactions gets a user's transaction history
func (s *Service) GetUserTransactions(ctx context.Context, userID int64, limit, offset int) ([]*Transaction, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, type, amount, points_converted, description, created_at, updated_at
		FROM token_transactions 
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*Transaction
	for rows.Next() {
		txn := &Transaction{}
		err := rows.Scan(
			&txn.ID, &txn.UserID, &txn.Type, &txn.Amount,
			&txn.PointsConverted, &txn.Description, &txn.CreatedAt, &txn.UpdatedAt)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, txn)
	}
	return transactions, nil
}
