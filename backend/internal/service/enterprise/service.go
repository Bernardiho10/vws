package enterprise

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrOrganizationNotFound = errors.New("organization not found")
	ErrMemberNotFound       = errors.New("member not found")
	ErrInvalidRole          = errors.New("invalid role")
	ErrVoteNotFound         = errors.New("vote not found")
	ErrInvalidDateRange     = errors.New("invalid date range")
	ErrInvalidVotingType    = errors.New("invalid voting type")
	ErrVoteExpired          = errors.New("vote has expired")
	ErrVoteAlreadySubmitted = errors.New("vote already submitted")
)

type Service struct {
	db *sql.DB
}

type Organization struct {
	ID           int64           `json:"id"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	ContactEmail string          `json:"contact_email"`
	Domain       string          `json:"domain"`
	LogoURL      string          `json:"logo_url"`
	WebsiteURL   string          `json:"website_url"`
	Settings     json.RawMessage `json:"settings"`
	CreatedBy    int64           `json:"created_by"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type Member struct {
	ID             int64           `json:"id"`
	OrganizationID int64           `json:"organization_id"`
	UserID         int64           `json:"user_id"`
	Role           string          `json:"role"`
	Permissions    json.RawMessage `json:"permissions"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type APIKey struct {
	ID             int64     `json:"id"`
	OrganizationID int64     `json:"organization_id"`
	Name           string    `json:"name"`
	Scopes         []string  `json:"scopes"`
	RateLimit      int       `json:"rate_limit"`
	ExpiresAt      time.Time `json:"expires_at"`
	LastUsedAt     time.Time `json:"last_used_at"`
	CreatedBy      int64     `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type VotingSystem struct {
	ID             int64           `json:"id"`
	OrganizationID int64           `json:"organization_id"`
	Name           string          `json:"name"`
	Description    string          `json:"description"`
	VotingType     string          `json:"voting_type"`
	Config         json.RawMessage `json:"config"`
	Active         bool            `json:"active"`
	CreatedBy      int64           `json:"created_by"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Vote struct {
	ID             int64           `json:"id"`
	VotingSystemID int64           `json:"voting_system_id"`
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	Options        json.RawMessage `json:"options"`
	StartDate      time.Time       `json:"start_date"`
	EndDate        time.Time       `json:"end_date"`
	Status         string          `json:"status"`
	Result         json.RawMessage `json:"result"`
	CreatedBy      int64           `json:"created_by"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type VoteResponse struct {
	ID        int64           `json:"id"`
	VoteID    int64           `json:"vote_id"`
	UserID    int64           `json:"user_id"`
	Response  json.RawMessage `json:"response"`
	Weight    float64         `json:"weight"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type WhiteLabelSettings struct {
	ID             int64           `json:"id"`
	OrganizationID int64           `json:"organization_id"`
	Domain         string          `json:"domain"`
	ThemeConfig    json.RawMessage `json:"theme_config"`
	CustomCSS      string          `json:"custom_css"`
	CustomJS       string          `json:"custom_js"`
	Enabled        bool            `json:"enabled"`
	Settings       json.RawMessage `json:"settings"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) CreateOrganization(name, description, contactEmail, domain string, createdBy int64) (*Organization, error) {
	org := &Organization{
		Name:         name,
		Description:  description,
		ContactEmail: contactEmail,
		Domain:       domain,
		CreatedBy:    createdBy,
	}

	err := s.db.QueryRow(
		`INSERT INTO organizations (name, description, contact_email, domain, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`,
		name, description, contactEmail, domain, createdBy,
	).Scan(&org.ID, &org.CreatedAt, &org.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return org, nil
}

func (s *Service) GetOrganization(id int64) (*Organization, error) {
	org := &Organization{}
	err := s.db.QueryRow(
		`SELECT id, name, description, contact_email, domain,
		created_by, created_at, updated_at
		FROM organizations WHERE id = $1`,
		id,
	).Scan(
		&org.ID, &org.Name, &org.Description, &org.ContactEmail,
		&org.Domain, &org.CreatedBy, &org.CreatedAt, &org.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrOrganizationNotFound
	}
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (s *Service) AddMember(orgID, userID int64, role string) (*Member, error) {
	member := &Member{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           role,
	}

	err := s.db.QueryRow(
		`INSERT INTO organization_members (organization_id, user_id, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at`,
		orgID, userID, role,
	).Scan(&member.ID, &member.CreatedAt, &member.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return member, nil
}

func (s *Service) UpdateMemberRole(orgID, userID int64, role string) error {
	result, err := s.db.Exec(
		`UPDATE organization_members SET role = $1, updated_at = NOW()
		WHERE organization_id = $2 AND user_id = $3`,
		role, orgID, userID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrMemberNotFound
	}

	return nil
}

func (s *Service) CreateAPIKey(orgID int64, name string, scopes []string, rateLimit int, expiresAt time.Time, createdBy int64) (*APIKey, error) {
	scopesJSON, err := json.Marshal(scopes)
	if err != nil {
		return nil, err
	}

	key := &APIKey{}
	err = s.db.QueryRow(
		`INSERT INTO api_keys (organization_id, name, scopes, rate_limit, expires_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`,
		orgID, name, scopesJSON, rateLimit, expiresAt, createdBy,
	).Scan(&key.ID, &key.CreatedAt, &key.UpdatedAt)
	if err != nil {
		return nil, err
	}

	key.OrganizationID = orgID
	key.Name = name
	key.Scopes = scopes
	key.RateLimit = rateLimit
	key.ExpiresAt = expiresAt
	key.CreatedBy = createdBy

	return key, nil
}

func (s *Service) ValidateAPIKey(keyID, orgID int64) (*APIKey, error) {
	key := &APIKey{}
	var scopesJSON []byte
	err := s.db.QueryRow(
		`SELECT id, organization_id, name, scopes, rate_limit,
		expires_at, last_used_at, created_by, created_at, updated_at
		FROM api_keys WHERE id = $1 AND organization_id = $2`,
		keyID, orgID,
	).Scan(
		&key.ID, &key.OrganizationID, &key.Name, &scopesJSON,
		&key.RateLimit, &key.ExpiresAt, &key.LastUsedAt,
		&key.CreatedBy, &key.CreatedAt, &key.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(scopesJSON, &key.Scopes)
	if err != nil {
		return nil, err
	}

	_, err = s.db.Exec(
		`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
		keyID,
	)
	if err != nil {
		return nil, err
	}

	return key, nil
}

func (s *Service) ListAPIKeys(orgID int64) ([]*APIKey, error) {
	rows, err := s.db.Query(
		`SELECT id, organization_id, name, scopes, rate_limit,
		expires_at, last_used_at, created_by, created_at, updated_at
		FROM api_keys WHERE organization_id = $1`,
		orgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*APIKey
	for rows.Next() {
		key := &APIKey{}
		var scopesJSON []byte
		err := rows.Scan(
			&key.ID, &key.OrganizationID, &key.Name, &scopesJSON,
			&key.RateLimit, &key.ExpiresAt, &key.LastUsedAt,
			&key.CreatedBy, &key.CreatedAt, &key.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(scopesJSON, &key.Scopes)
		if err != nil {
			return nil, err
		}

		keys = append(keys, key)
	}
	return keys, rows.Err()
}

func (s *Service) RevokeAPIKey(orgID, keyID int64) error {
	result, err := s.db.Exec(
		`DELETE FROM api_keys WHERE organization_id = $1 AND id = $2`,
		orgID, keyID,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Service) ListVotingSystems(orgID int64) ([]*VotingSystem, error) {
	rows, err := s.db.Query(
		`SELECT id, organization_id, name, description, voting_type,
		config, active, created_by, created_at, updated_at
		FROM voting_systems WHERE organization_id = $1`,
		orgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var systems []*VotingSystem
	for rows.Next() {
		vs := &VotingSystem{}
		err := rows.Scan(
			&vs.ID, &vs.OrganizationID, &vs.Name, &vs.Description,
			&vs.VotingType, &vs.Config, &vs.Active, &vs.CreatedBy,
			&vs.CreatedAt, &vs.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		systems = append(systems, vs)
	}
	return systems, rows.Err()
}

func (s *Service) GetVoteResults(voteID int64) (map[string]interface{}, error) {
	// Get vote details
	vote := &Vote{}
	err := s.db.QueryRow(
		`SELECT id, voting_system_id, title, description, options,
		start_date, end_date, status, result, created_by, created_at, updated_at
		FROM votes WHERE id = $1`,
		voteID,
	).Scan(
		&vote.ID, &vote.VotingSystemID, &vote.Title, &vote.Description,
		&vote.Options, &vote.StartDate, &vote.EndDate, &vote.Status,
		&vote.Result, &vote.CreatedBy, &vote.CreatedAt, &vote.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrVoteNotFound
	}
	if err != nil {
		return nil, err
	}

	// Get voting system details
	vs := &VotingSystem{}
	err = s.db.QueryRow(
		`SELECT voting_type, config FROM voting_systems WHERE id = $1`,
		vote.VotingSystemID,
	).Scan(&vs.VotingType, &vs.Config)
	if err != nil {
		return nil, err
	}

	// Get all responses
	rows, err := s.db.Query(
		`SELECT response, weight FROM vote_responses WHERE vote_id = $1`,
		voteID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []struct {
		Response json.RawMessage
		Weight   float64
	}
	for rows.Next() {
		var resp struct {
			Response json.RawMessage
			Weight   float64
		}
		if err := rows.Scan(&resp.Response, &resp.Weight); err != nil {
			return nil, err
		}
		responses = append(responses, resp)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Calculate results based on voting type
	var results map[string]interface{}
	switch vs.VotingType {
	case "MAJORITY":
		results = calculateMajorityResults(responses)
	case "WEIGHTED":
		results = calculateWeightedResults(responses)
	case "CONSENSUS":
		results = calculateConsensusResults(responses)
	case "CUSTOM":
		results = calculateCustomResults(responses, vs.Config)
	default:
		return nil, ErrInvalidVotingType
	}

	// Update vote with results
	resultJSON, err := json.Marshal(results)
	if err != nil {
		return nil, err
	}

	_, err = s.db.Exec(
		`UPDATE votes SET result = $1, status = 'COMPLETED', updated_at = NOW()
		WHERE id = $2`,
		resultJSON, voteID,
	)
	if err != nil {
		return nil, err
	}

	return results, nil
}

func calculateMajorityResults(responses []struct {
	Response json.RawMessage
	Weight   float64
}) map[string]interface{} {
	counts := make(map[string]int)
	total := 0

	for _, resp := range responses {
		var choice string
		if err := json.Unmarshal(resp.Response, &choice); err != nil {
			continue
		}
		counts[choice]++
		total++
	}

	results := make(map[string]interface{})
	for choice, count := range counts {
		results[choice] = float64(count) / float64(total) * 100
	}

	return map[string]interface{}{
		"type":        "MAJORITY",
		"total_votes": total,
		"results":     results,
	}
}

func calculateWeightedResults(responses []struct {
	Response json.RawMessage
	Weight   float64
}) map[string]interface{} {
	weights := make(map[string]float64)
	totalWeight := 0.0

	for _, resp := range responses {
		var choice string
		if err := json.Unmarshal(resp.Response, &choice); err != nil {
			continue
		}
		weights[choice] += resp.Weight
		totalWeight += resp.Weight
	}

	results := make(map[string]interface{})
	for choice, weight := range weights {
		results[choice] = weight / totalWeight * 100
	}

	return map[string]interface{}{
		"type":         "WEIGHTED",
		"total_weight": totalWeight,
		"results":      results,
	}
}

func calculateConsensusResults(responses []struct {
	Response json.RawMessage
	Weight   float64
}) map[string]interface{} {
	type consensusResponse struct {
		Choice string `json:"choice"`
		Level  int    `json:"level"` // 1: Strongly Agree, 2: Agree, 3: Neutral, 4: Disagree, 5: Strongly Disagree
	}

	levels := make(map[string]map[int]int)
	total := 0

	for _, resp := range responses {
		var cr consensusResponse
		if err := json.Unmarshal(resp.Response, &cr); err != nil {
			continue
		}
		if levels[cr.Choice] == nil {
			levels[cr.Choice] = make(map[int]int)
		}
		levels[cr.Choice][cr.Level]++
		total++
	}

	results := make(map[string]interface{})
	for choice, levelCounts := range levels {
		totalScore := 0
		for level, count := range levelCounts {
			totalScore += (6 - level) * count // Invert scale so 5 points for Strongly Agree
		}
		results[choice] = float64(totalScore) / float64(total*5) * 100 // Normalize to percentage
	}

	return map[string]interface{}{
		"type":        "CONSENSUS",
		"total_votes": total,
		"results":     results,
	}
}

func calculateCustomResults(responses []struct {
	Response json.RawMessage
	Weight   float64
}, config json.RawMessage) map[string]interface{} {
	// Custom calculation based on config
	// This is a placeholder that returns raw response data
	var rawResponses []interface{}
	for _, resp := range responses {
		var data interface{}
		if err := json.Unmarshal(resp.Response, &data); err != nil {
			continue
		}
		rawResponses = append(rawResponses, map[string]interface{}{
			"response": data,
			"weight":   resp.Weight,
		})
	}

	return map[string]interface{}{
		"type":      "CUSTOM",
		"config":    config,
		"responses": rawResponses,
	}
}

func (s *Service) UpdateOrganization(org *Organization) error {
	result, err := s.db.Exec(
		`UPDATE organizations 
		SET name = $1, description = $2, contact_email = $3, domain = $4,
		logo_url = $5, website_url = $6, settings = $7, updated_at = NOW()
		WHERE id = $8`,
		org.Name, org.Description, org.ContactEmail, org.Domain,
		org.LogoURL, org.WebsiteURL, org.Settings, org.ID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrOrganizationNotFound
	}

	return nil
}

func (s *Service) CreateVotingSystem(vs *VotingSystem) error {
	err := s.db.QueryRow(
		`INSERT INTO voting_systems (organization_id, name, description, voting_type, config, active, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`,
		vs.OrganizationID, vs.Name, vs.Description, vs.VotingType,
		vs.Config, vs.Active, vs.CreatedBy,
	).Scan(&vs.ID, &vs.CreatedAt, &vs.UpdatedAt)
	return err
}

func (s *Service) CreateVote(vote *Vote) error {
	if vote.EndDate.Before(vote.StartDate) {
		return ErrInvalidDateRange
	}

	err := s.db.QueryRow(
		`INSERT INTO votes (voting_system_id, title, description, options, start_date, end_date, status, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at`,
		vote.VotingSystemID, vote.Title, vote.Description, vote.Options,
		vote.StartDate, vote.EndDate, vote.Status, vote.CreatedBy,
	).Scan(&vote.ID, &vote.CreatedAt, &vote.UpdatedAt)
	return err
}

func (s *Service) SubmitVoteResponse(resp *VoteResponse) error {
	// Check if vote exists and is active
	var startDate, endDate time.Time
	var status string
	err := s.db.QueryRow(
		`SELECT start_date, end_date, status FROM votes WHERE id = $1`,
		resp.VoteID,
	).Scan(&startDate, &endDate, &status)
	if err == sql.ErrNoRows {
		return ErrVoteNotFound
	}
	if err != nil {
		return err
	}

	now := time.Now()
	if now.Before(startDate) || now.After(endDate) {
		return ErrVoteExpired
	}

	// Check if user has already voted
	var count int
	err = s.db.QueryRow(
		`SELECT COUNT(*) FROM vote_responses WHERE vote_id = $1 AND user_id = $2`,
		resp.VoteID, resp.UserID,
	).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrVoteAlreadySubmitted
	}

	// Submit response
	err = s.db.QueryRow(
		`INSERT INTO vote_responses (vote_id, user_id, response, weight)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`,
		resp.VoteID, resp.UserID, resp.Response, resp.Weight,
	).Scan(&resp.ID, &resp.CreatedAt, &resp.UpdatedAt)
	return err
}

func (s *Service) UpdateWhiteLabelSettings(settings *WhiteLabelSettings) error {
	err := s.db.QueryRow(
		`INSERT INTO white_label_settings 
		(organization_id, domain, theme_config, custom_css, custom_js, enabled)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (organization_id) DO UPDATE
		SET domain = $2, theme_config = $3, custom_css = $4, custom_js = $5, enabled = $6,
		updated_at = NOW()
		RETURNING id, created_at, updated_at`,
		settings.OrganizationID, settings.Domain, settings.ThemeConfig,
		settings.CustomCSS, settings.CustomJS, settings.Enabled,
	).Scan(&settings.ID, &settings.CreatedAt, &settings.UpdatedAt)
	return err
}

func (s *Service) GetWhiteLabelSettings(orgID int64) (*WhiteLabelSettings, error) {
	settings := &WhiteLabelSettings{OrganizationID: orgID}
	err := s.db.QueryRow(
		`SELECT id, domain, theme_config, custom_css, custom_js, enabled, created_at, updated_at
		FROM white_label_settings WHERE organization_id = $1`,
		orgID,
	).Scan(
		&settings.ID, &settings.Domain, &settings.ThemeConfig,
		&settings.CustomCSS, &settings.CustomJS, &settings.Enabled,
		&settings.CreatedAt, &settings.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return settings, nil
}
