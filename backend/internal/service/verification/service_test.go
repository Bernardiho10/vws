package verification

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestVerifyVoteParticipation(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	// Test data
	userID := int64(1)
	electionID := "election123"
	proofData := []byte("test proof data")

	// Mock the existence check
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(userID, electionID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	// Mock the insert
	mock.ExpectExec("INSERT INTO certificates").
		WithArgs(
			sqlmock.AnyArg(), // id
			userID,
			electionID,
			sqlmock.AnyArg(), // hash
			sqlmock.AnyArg(), // blockchain_txn
			sqlmock.AnyArg(), // created_at
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Test the verification
	cert, err := service.VerifyVoteParticipation(context.Background(), userID, electionID, proofData)
	assert.NoError(t, err)
	assert.NotNil(t, cert)
	assert.Equal(t, userID, cert.UserID)
	assert.Equal(t, electionID, cert.ElectionID)
}

func TestGetCertificate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	// Test data
	now := time.Now()
	certID := "cert123"
	userID := int64(1)
	electionID := "election123"
	hash := "testhash"
	blockchainTxn := "0xtxn"

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "election_id", "hash", "blockchain_txn", "created_at",
	}).AddRow(
		certID, userID, electionID, hash, blockchainTxn, now,
	)

	mock.ExpectQuery("SELECT (.+) FROM certificates WHERE id").
		WithArgs(certID).
		WillReturnRows(rows)

	// Test getting the certificate
	cert, err := service.GetCertificate(context.Background(), certID)
	assert.NoError(t, err)
	assert.NotNil(t, cert)
	assert.Equal(t, certID, cert.ID)
	assert.Equal(t, userID, cert.UserID)
	assert.Equal(t, electionID, cert.ElectionID)
	assert.Equal(t, hash, cert.Hash)
	assert.Equal(t, blockchainTxn, cert.BlockchainTxn)
}

func TestGetUserCertificates(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	// Test data
	now := time.Now()
	userID := int64(1)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "election_id", "hash", "blockchain_txn", "created_at",
	}).AddRow(
		"cert1", userID, "election1", "hash1", "0xtxn1", now,
	).AddRow(
		"cert2", userID, "election2", "hash2", "0xtxn2", now,
	)

	mock.ExpectQuery("SELECT (.+) FROM certificates WHERE user_id").
		WithArgs(userID).
		WillReturnRows(rows)

	// Test getting user certificates
	certs, err := service.GetUserCertificates(context.Background(), userID)
	assert.NoError(t, err)
	assert.Len(t, certs, 2)
	assert.Equal(t, "cert1", certs[0].ID)
	assert.Equal(t, "cert2", certs[1].ID)
}

func TestVerifyCertificate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	// Test data
	now := time.Now()
	certID := "cert123"
	userID := int64(1)
	electionID := "election123"
	hash := "testhash"
	blockchainTxn := "0xtxn"

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "election_id", "hash", "blockchain_txn", "created_at",
	}).AddRow(
		certID, userID, electionID, hash, blockchainTxn, now,
	)

	mock.ExpectQuery("SELECT (.+) FROM certificates WHERE id").
		WithArgs(certID).
		WillReturnRows(rows)

	// Test verifying the certificate
	isValid, err := service.VerifyCertificate(context.Background(), certID)
	assert.NoError(t, err)
	assert.True(t, isValid)
}

func TestVerifyVoteParticipation_AlreadyExists(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	// Test data
	userID := int64(1)
	electionID := "election123"
	proofData := []byte("test proof data")

	// Mock the existence check to return true
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(userID, electionID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Test the verification
	cert, err := service.VerifyVoteParticipation(context.Background(), userID, electionID, proofData)
	assert.Error(t, err)
	assert.Nil(t, cert)
	assert.Equal(t, "verification already exists", err.Error())
}

func TestGetCertificate_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	service, err := NewService(db, "http://localhost:8545", "0x0000000000000000000000000000000000000000")
	assert.NoError(t, err)
	defer service.Close()

	certID := "nonexistent"
	mock.ExpectQuery("SELECT (.+) FROM certificates WHERE id").
		WithArgs(certID).
		WillReturnError(sql.ErrNoRows)

	cert, err := service.GetCertificate(context.Background(), certID)
	assert.Error(t, err)
	assert.Nil(t, cert)
	assert.Equal(t, sql.ErrNoRows, err)
}
