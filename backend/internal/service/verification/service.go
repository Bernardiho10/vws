package verification

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Certificate struct {
	ID            string    `json:"id"`
	UserID        int64     `json:"userId"`
	ElectionID    string    `json:"electionId"`
	Hash          string    `json:"hash"`
	BlockchainTxn string    `json:"blockchainTxn"`
	CreatedAt     time.Time `json:"createdAt"`
}

type Service struct {
	db          *sql.DB
	ethClient   *ethclient.Client
	contractAdr common.Address
}

func NewService(db *sql.DB, ethURL string, contractAddress string) (*Service, error) {
	client, err := ethclient.Dial(ethURL)
	if err != nil {
		return nil, err
	}

	return &Service{
		db:          db,
		ethClient:   client,
		contractAdr: common.HexToAddress(contractAddress),
	}, nil
}

// VerifyVoteParticipation verifies a user's vote participation and generates a certificate
func (s *Service) VerifyVoteParticipation(ctx context.Context, userID int64, electionID string, proofData []byte) (*Certificate, error) {
	// Generate hash of the proof data
	hash := sha256.Sum256(proofData)
	hashStr := hex.EncodeToString(hash[:])

	// Check if verification already exists
	var exists bool
	err := s.db.QueryRowContext(ctx,
		"SELECT EXISTS(SELECT 1 FROM certificates WHERE user_id = $1 AND election_id = $2)",
		userID, electionID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("verification already exists")
	}

	// Store verification record
	cert := &Certificate{
		ID:         hashStr[:8],
		UserID:     userID,
		ElectionID: electionID,
		Hash:       hashStr,
		CreatedAt:  time.Now(),
	}

	// Insert into database
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO certificates (id, user_id, election_id, hash, blockchain_txn, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		cert.ID, cert.UserID, cert.ElectionID, cert.Hash, cert.BlockchainTxn, cert.CreatedAt)
	if err != nil {
		return nil, err
	}

	return cert, nil
}

// GetCertificate retrieves a certificate by ID
func (s *Service) GetCertificate(ctx context.Context, id string) (*Certificate, error) {
	cert := &Certificate{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, election_id, hash, blockchain_txn, created_at
		FROM certificates WHERE id = $1`,
		id).Scan(&cert.ID, &cert.UserID, &cert.ElectionID, &cert.Hash,
		&cert.BlockchainTxn, &cert.CreatedAt)
	if err != nil {
		return nil, err
	}
	return cert, nil
}

// GetUserCertificates retrieves all certificates for a user
func (s *Service) GetUserCertificates(ctx context.Context, userID int64) ([]*Certificate, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, election_id, hash, blockchain_txn, created_at
		FROM certificates WHERE user_id = $1
		ORDER BY created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []*Certificate
	for rows.Next() {
		cert := &Certificate{}
		err := rows.Scan(&cert.ID, &cert.UserID, &cert.ElectionID, &cert.Hash,
			&cert.BlockchainTxn, &cert.CreatedAt)
		if err != nil {
			return nil, err
		}
		certs = append(certs, cert)
	}
	return certs, nil
}

// VerifyCertificate verifies a certificate's authenticity on the blockchain
func (s *Service) VerifyCertificate(ctx context.Context, id string) (bool, error) {
	_, err := s.GetCertificate(ctx, id)
	if err != nil {
		return false, err
	}

	// TODO: Implement blockchain verification logic
	// This would involve:
	// 1. Loading the smart contract
	// 2. Calling the verification method
	// 3. Checking the result

	return true, nil
}

// Close closes the service connections
func (s *Service) Close() error {
	s.ethClient.Close()
	return nil
}
