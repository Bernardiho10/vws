CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(8) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    election_id VARCHAR(255) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    blockchain_txn VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, election_id)
);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_election_id ON certificates(election_id);
CREATE INDEX idx_certificates_created_at ON certificates(created_at); 