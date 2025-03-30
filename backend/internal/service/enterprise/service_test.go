package enterprise

import (
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTest(t *testing.T) (*Service, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	service := NewService(db)
	return service, mock
}

func TestCreateOrganization(t *testing.T) {
	service, mock := setupTest(t)

	name := "Test Org"
	description := "Test Description"
	contactEmail := "test@example.com"
	domain := "example.com"
	createdBy := int64(1)

	mock.ExpectQuery(`INSERT INTO organizations`).
		WithArgs(name, description, contactEmail, domain, createdBy).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	org, err := service.CreateOrganization(name, description, contactEmail, domain, createdBy)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), org.ID)
	assert.Equal(t, name, org.Name)
	assert.Equal(t, description, org.Description)
	assert.Equal(t, contactEmail, org.ContactEmail)
	assert.Equal(t, domain, org.Domain)
	assert.Equal(t, createdBy, org.CreatedBy)
}

func TestGetOrganization(t *testing.T) {
	service, mock := setupTest(t)

	now := time.Now()
	mock.ExpectQuery(`SELECT .+ FROM organizations WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "description", "contact_email", "domain",
			"created_by", "created_at", "updated_at",
		}).AddRow(
			1, "Test Org", "Test Description", "test@example.com",
			"example.com", 1, now, now,
		))

	org, err := service.GetOrganization(1)
	assert.NoError(t, err)
	assert.Equal(t, "Test Org", org.Name)
	assert.Equal(t, "test@example.com", org.ContactEmail)
}

func TestGetOrganization_NotFound(t *testing.T) {
	service, mock := setupTest(t)

	mock.ExpectQuery(`SELECT .+ FROM organizations WHERE id = \$1`).
		WithArgs(1).
		WillReturnError(sql.ErrNoRows)

	org, err := service.GetOrganization(1)
	assert.Error(t, err)
	assert.Equal(t, ErrOrganizationNotFound, err)
	assert.Nil(t, org)
}

func TestAddMember(t *testing.T) {
	service, mock := setupTest(t)

	orgID := int64(1)
	userID := int64(2)
	role := "ADMIN"

	mock.ExpectQuery(`INSERT INTO organization_members`).
		WithArgs(orgID, userID, role).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	member, err := service.AddMember(orgID, userID, role)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), member.ID)
	assert.Equal(t, orgID, member.OrganizationID)
	assert.Equal(t, userID, member.UserID)
	assert.Equal(t, role, member.Role)
}

func TestUpdateMemberRole(t *testing.T) {
	service, mock := setupTest(t)

	mock.ExpectExec(`UPDATE organization_members SET role = \$1, updated_at = NOW\(\) WHERE organization_id = \$2 AND user_id = \$3`).
		WithArgs("OWNER", 1, 2).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := service.UpdateMemberRole(1, 2, "OWNER")
	assert.NoError(t, err)
}

func TestUpdateMemberRole_NotFound(t *testing.T) {
	service, mock := setupTest(t)

	mock.ExpectExec(`UPDATE organization_members SET role = \$1, updated_at = NOW\(\) WHERE organization_id = \$2 AND user_id = \$3`).
		WithArgs("OWNER", 1, 2).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err := service.UpdateMemberRole(1, 2, "OWNER")
	assert.Error(t, err)
	assert.Equal(t, ErrMemberNotFound, err)
}

func TestCreateAPIKey(t *testing.T) {
	service, mock := setupTest(t)

	orgID := int64(1)
	name := "Test Key"
	scopes := []string{"READ", "WRITE"}
	rateLimit := 1000
	expiresAt := time.Now().Add(24 * time.Hour)
	createdBy := int64(2)

	scopesJSON, err := json.Marshal(scopes)
	require.NoError(t, err)

	mock.ExpectQuery(`INSERT INTO api_keys`).
		WithArgs(orgID, name, scopesJSON, rateLimit, expiresAt, createdBy).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	key, err := service.CreateAPIKey(orgID, name, scopes, rateLimit, expiresAt, createdBy)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), key.ID)
	assert.Equal(t, orgID, key.OrganizationID)
	assert.Equal(t, name, key.Name)
	assert.Equal(t, scopes, key.Scopes)
	assert.Equal(t, rateLimit, key.RateLimit)
	assert.Equal(t, expiresAt.Unix(), key.ExpiresAt.Unix())
	assert.Equal(t, createdBy, key.CreatedBy)
}

func TestValidateAPIKey(t *testing.T) {
	service, mock := setupTest(t)

	keyID := int64(1)
	orgID := int64(1)
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)
	scopes := []string{"READ", "WRITE"}
	scopesJSON, err := json.Marshal(scopes)
	require.NoError(t, err)

	mock.ExpectQuery(`SELECT .+ FROM api_keys WHERE id = \$1 AND organization_id = \$2`).
		WithArgs(keyID, orgID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "organization_id", "name", "scopes", "rate_limit",
			"expires_at", "last_used_at", "created_by", "created_at", "updated_at",
		}).AddRow(
			keyID, orgID, "Test Key", scopesJSON, 1000,
			expiresAt, now, 2, now, now,
		))

	mock.ExpectExec(`UPDATE api_keys SET last_used_at = NOW\(\) WHERE id = \$1`).
		WithArgs(keyID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	key, err := service.ValidateAPIKey(keyID, orgID)
	assert.NoError(t, err)
	assert.Equal(t, keyID, key.ID)
	assert.Equal(t, orgID, key.OrganizationID)
	assert.Equal(t, scopes, key.Scopes)
}

func TestCreateVotingSystem(t *testing.T) {
	service, mock := setupTest(t)

	vs := &VotingSystem{
		OrganizationID: 1,
		Name:           "Test Voting System",
		Description:    "Test Description",
		VotingType:     "MAJORITY",
		Config:         json.RawMessage(`{"threshold": 0.5}`),
		Active:         true,
		CreatedBy:      2,
	}

	mock.ExpectQuery(`INSERT INTO voting_systems`).
		WithArgs(vs.OrganizationID, vs.Name, vs.Description, vs.VotingType,
			vs.Config, vs.Active, vs.CreatedBy).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	err := service.CreateVotingSystem(vs)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), vs.ID)
}

func TestCreateVote(t *testing.T) {
	service, mock := setupTest(t)

	startDate := time.Now()
	endDate := startDate.Add(24 * time.Hour)
	vote := &Vote{
		VotingSystemID: 1,
		Title:          "Test Vote",
		Description:    "Test Description",
		Options:        json.RawMessage(`["option1", "option2"]`),
		StartDate:      startDate,
		EndDate:        endDate,
		Status:         "PENDING",
		CreatedBy:      2,
	}

	mock.ExpectQuery(`INSERT INTO votes`).
		WithArgs(vote.VotingSystemID, vote.Title, vote.Description, vote.Options,
			vote.StartDate, vote.EndDate, vote.Status, vote.CreatedBy).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	err := service.CreateVote(vote)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), vote.ID)
}

func TestCreateVote_InvalidDateRange(t *testing.T) {
	service, mock := setupTest(t)

	endDate := time.Now()
	startDate := endDate.Add(24 * time.Hour)
	vote := &Vote{
		VotingSystemID: 1,
		Title:          "Test Vote",
		Description:    "Test Description",
		Options:        json.RawMessage(`["option1", "option2"]`),
		StartDate:      startDate,
		EndDate:        endDate,
		Status:         "PENDING",
		CreatedBy:      2,
	}

	err := service.CreateVote(vote)
	assert.Error(t, err)
	assert.Equal(t, ErrInvalidDateRange, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestSubmitVoteResponse(t *testing.T) {
	service, mock := setupTest(t)

	now := time.Now()
	startDate := now.Add(-1 * time.Hour)
	endDate := now.Add(23 * time.Hour)

	mock.ExpectQuery(`SELECT start_date, end_date, status FROM votes WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"start_date", "end_date", "status"}).
			AddRow(startDate, endDate, "PENDING"))

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM vote_responses WHERE vote_id = \$1 AND user_id = \$2`).
		WithArgs(1, 2).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	resp := &VoteResponse{
		VoteID:   1,
		UserID:   2,
		Response: json.RawMessage(`{"choice": "option1"}`),
		Weight:   1.0,
	}

	mock.ExpectQuery(`INSERT INTO vote_responses`).
		WithArgs(resp.VoteID, resp.UserID, resp.Response, resp.Weight).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	err := service.SubmitVoteResponse(resp)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), resp.ID)
}

func TestSubmitVoteResponse_AlreadySubmitted(t *testing.T) {
	service, mock := setupTest(t)

	now := time.Now()
	startDate := now.Add(-1 * time.Hour)
	endDate := now.Add(23 * time.Hour)

	mock.ExpectQuery(`SELECT start_date, end_date, status FROM votes WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"start_date", "end_date", "status"}).
			AddRow(startDate, endDate, "PENDING"))

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM vote_responses WHERE vote_id = \$1 AND user_id = \$2`).
		WithArgs(1, 2).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	resp := &VoteResponse{
		VoteID:   1,
		UserID:   2,
		Response: json.RawMessage(`{"choice": "option1"}`),
		Weight:   1.0,
	}

	err := service.SubmitVoteResponse(resp)
	assert.Error(t, err)
	assert.Equal(t, ErrVoteAlreadySubmitted, err)
}

func TestUpdateWhiteLabelSettings(t *testing.T) {
	service, mock := setupTest(t)

	settings := &WhiteLabelSettings{
		OrganizationID: 1,
		Domain:         "custom.example.com",
		ThemeConfig:    json.RawMessage(`{"primary": "#000000"}`),
		CustomCSS:      ".custom { color: black; }",
		CustomJS:       "console.log('custom');",
		Enabled:        true,
	}

	mock.ExpectQuery(`INSERT INTO white_label_settings`).
		WithArgs(settings.OrganizationID, settings.Domain, settings.ThemeConfig,
			settings.CustomCSS, settings.CustomJS, settings.Enabled).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(1, time.Now(), time.Now()))

	err := service.UpdateWhiteLabelSettings(settings)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), settings.ID)
}

func TestGetWhiteLabelSettings(t *testing.T) {
	service, mock := setupTest(t)

	now := time.Now()
	mock.ExpectQuery(`SELECT .+ FROM white_label_settings WHERE organization_id = \$1`).
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "domain", "theme_config", "custom_css",
			"custom_js", "enabled", "created_at", "updated_at",
		}).AddRow(
			1, "custom.example.com", []byte(`{"primary": "#000000"}`),
			".custom { color: black; }", "console.log('custom');", true,
			now, now,
		))

	settings, err := service.GetWhiteLabelSettings(1)
	assert.NoError(t, err)
	assert.NotNil(t, settings)
	assert.Equal(t, "custom.example.com", settings.Domain)
	assert.True(t, settings.Enabled)
}

func TestGetWhiteLabelSettings_NotFound(t *testing.T) {
	service, mock := setupTest(t)

	mock.ExpectQuery(`SELECT .+ FROM white_label_settings WHERE organization_id = \$1`).
		WithArgs(1).
		WillReturnError(sql.ErrNoRows)

	settings, err := service.GetWhiteLabelSettings(1)
	assert.NoError(t, err)
	assert.Nil(t, settings)
}
