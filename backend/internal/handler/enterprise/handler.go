package enterprise

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"vws-backend/internal/middleware"
	"vws-backend/internal/service/enterprise"

	"github.com/gin-gonic/gin"
)

type Organization struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	ContactEmail string `json:"contact_email"`
	Domain       string `json:"domain"`
}

type Member struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
}

type APIKey struct {
	Name      string    `json:"name"`
	Scopes    []string  `json:"scopes"`
	RateLimit int       `json:"rate_limit"`
	ExpiresAt time.Time `json:"expires_at"`
}

type Handler struct {
	service *enterprise.Service
}

func NewHandler(service *enterprise.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/enterprise")
	{
		// Organization routes
		api.POST("/organizations", h.createOrganization)
		api.GET("/organizations/:id", h.getOrganization)
		api.PUT("/organizations/:id", h.updateOrganization)

		// Member routes
		api.POST("/organizations/:id/members", h.addMember)
		api.PUT("/organizations/:id/members/:userId/role", h.updateMemberRole)

		// API Key routes
		api.POST("/organizations/:id/api-keys", h.createAPIKey)
		api.GET("/organizations/:id/api-keys", h.listAPIKeys)
		api.DELETE("/organizations/:id/api-keys/:keyId", h.revokeAPIKey)

		// Voting System routes
		api.POST("/organizations/:id/voting-systems", h.createVotingSystem)
		api.GET("/organizations/:id/voting-systems", h.listVotingSystems)
		api.POST("/voting-systems/:id/votes", h.createVote)
		api.POST("/votes/:id/responses", h.submitVoteResponse)
		api.GET("/votes/:id/results", h.getVoteResults)

		// White Label routes
		api.PUT("/organizations/:id/white-label", h.updateWhiteLabelSettings)
		api.GET("/organizations/:id/white-label", h.getWhiteLabelSettings)
	}
}

type createOrganizationRequest struct {
	Name         string                 `json:"name" binding:"required"`
	Description  string                 `json:"description"`
	LogoURL      string                 `json:"logo_url"`
	WebsiteURL   string                 `json:"website_url"`
	ContactEmail string                 `json:"contact_email" binding:"required,email"`
	Settings     map[string]interface{} `json:"settings"`
}

func (h *Handler) createOrganization(c *gin.Context) {
	var org Organization
	if err := c.ShouldBindJSON(&org); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt64(middleware.UserIDKey)
	result, err := h.service.CreateOrganization(
		org.Name,
		org.Description,
		org.ContactEmail,
		org.Domain,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

func (h *Handler) getOrganization(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	org, err := h.service.GetOrganization(id)
	if err == enterprise.ErrOrganizationNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "organization not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, org)
}

type updateOrganizationRequest struct {
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	LogoURL      string                 `json:"logo_url"`
	WebsiteURL   string                 `json:"website_url"`
	ContactEmail string                 `json:"contact_email" binding:"omitempty,email"`
	Settings     map[string]interface{} `json:"settings"`
}

func (h *Handler) updateOrganization(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	var req updateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org, err := h.service.GetOrganization(id)
	if err == enterprise.ErrOrganizationNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "organization not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		org.Name = req.Name
	}
	if req.Description != "" {
		org.Description = req.Description
	}
	if req.LogoURL != "" {
		org.LogoURL = req.LogoURL
	}
	if req.WebsiteURL != "" {
		org.WebsiteURL = req.WebsiteURL
	}
	if req.ContactEmail != "" {
		org.ContactEmail = req.ContactEmail
	}
	if req.Settings != nil {
		settings, err := json.Marshal(req.Settings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings format"})
			return
		}
		org.Settings = settings
	}

	if err := h.service.UpdateOrganization(org); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, org)
}

type addMemberRequest struct {
	UserID      int64                  `json:"user_id" binding:"required"`
	Role        string                 `json:"role" binding:"required"`
	Permissions map[string]interface{} `json:"permissions"`
}

func (h *Handler) addMember(c *gin.Context) {
	var member Member
	if err := c.ShouldBindJSON(&member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgID := c.GetInt64("organization_id")
	result, err := h.service.AddMember(orgID, member.UserID, member.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

type updateMemberRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

func (h *Handler) updateMemberRole(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req updateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateMemberRole(orgID, userID, req.Role); err != nil {
		if err == enterprise.ErrMemberNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

type createAPIKeyRequest struct {
	Name      string   `json:"name" binding:"required"`
	Scopes    []string `json:"scopes" binding:"required"`
	RateLimit int      `json:"rate_limit"`
	ExpiresAt string   `json:"expires_at"`
}

func (h *Handler) createAPIKey(c *gin.Context) {
	var key APIKey
	if err := c.ShouldBindJSON(&key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgID := c.GetInt64("organization_id")
	userID := c.GetInt64(middleware.UserIDKey)
	result, err := h.service.CreateAPIKey(
		orgID,
		key.Name,
		key.Scopes,
		key.RateLimit,
		key.ExpiresAt,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

type createVotingSystemRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	VotingType  string                 `json:"voting_type" binding:"required"`
	Config      map[string]interface{} `json:"config"`
}

func (h *Handler) createVotingSystem(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	var req createVotingSystemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, err := json.Marshal(req.Config)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid config format"})
		return
	}

	vs := &enterprise.VotingSystem{
		OrganizationID: orgID,
		Name:           req.Name,
		Description:    req.Description,
		VotingType:     req.VotingType,
		Config:         config,
		Active:         true,
		CreatedBy:      getUserID(c), // Implement this helper function
	}

	if err := h.service.CreateVotingSystem(vs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vs)
}

type createVoteRequest struct {
	Title       string                 `json:"title" binding:"required"`
	Description string                 `json:"description"`
	Options     map[string]interface{} `json:"options" binding:"required"`
	StartDate   string                 `json:"start_date" binding:"required"`
	EndDate     string                 `json:"end_date" binding:"required"`
}

func (h *Handler) createVote(c *gin.Context) {
	systemID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid voting system ID"})
		return
	}

	var req createVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date format"})
		return
	}

	options, err := json.Marshal(req.Options)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid options format"})
		return
	}

	vote := &enterprise.Vote{
		VotingSystemID: systemID,
		Title:          req.Title,
		Description:    req.Description,
		Options:        options,
		StartDate:      startDate,
		EndDate:        endDate,
		Status:         "PENDING",
		CreatedBy:      getUserID(c), // Implement this helper function
	}

	if err := h.service.CreateVote(vote); err != nil {
		if err == enterprise.ErrInvalidDateRange {
			c.JSON(http.StatusBadRequest, gin.H{"error": "end date must be after start date"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vote)
}

type submitVoteResponseRequest struct {
	Response map[string]interface{} `json:"response" binding:"required"`
	Weight   float64                `json:"weight"`
}

func (h *Handler) submitVoteResponse(c *gin.Context) {
	voteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vote ID"})
		return
	}

	var req submitVoteResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := json.Marshal(req.Response)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid response format"})
		return
	}

	resp := &enterprise.VoteResponse{
		VoteID:   voteID,
		UserID:   getUserID(c), // Implement this helper function
		Response: response,
		Weight:   req.Weight,
	}

	if err := h.service.SubmitVoteResponse(resp); err != nil {
		switch err {
		case enterprise.ErrVoteNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "vote not found"})
		case enterprise.ErrVoteExpired:
			c.JSON(http.StatusBadRequest, gin.H{"error": "vote has expired"})
		case enterprise.ErrVoteAlreadySubmitted:
			c.JSON(http.StatusConflict, gin.H{"error": "vote already submitted"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, resp)
}

type updateWhiteLabelRequest struct {
	Domain      string                 `json:"domain"`
	ThemeConfig map[string]interface{} `json:"theme_config"`
	CustomCSS   string                 `json:"custom_css"`
	CustomJS    string                 `json:"custom_js"`
	Enabled     bool                   `json:"enabled"`
}

func (h *Handler) updateWhiteLabelSettings(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	var req updateWhiteLabelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	themeConfig, err := json.Marshal(req.ThemeConfig)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid theme_config format"})
		return
	}

	settings := &enterprise.WhiteLabelSettings{
		OrganizationID: orgID,
		Domain:         req.Domain,
		ThemeConfig:    themeConfig,
		CustomCSS:      req.CustomCSS,
		CustomJS:       req.CustomJS,
		Enabled:        req.Enabled,
	}

	if err := h.service.UpdateWhiteLabelSettings(settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *Handler) getWhiteLabelSettings(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	settings, err := h.service.GetWhiteLabelSettings(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if settings == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "white label settings not found"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *Handler) listAPIKeys(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	keys, err := h.service.ListAPIKeys(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *Handler) revokeAPIKey(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	keyID, err := strconv.ParseInt(c.Param("keyId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	if err := h.service.RevokeAPIKey(orgID, keyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

func (h *Handler) listVotingSystems(c *gin.Context) {
	orgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization ID"})
		return
	}

	systems, err := h.service.ListVotingSystems(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, systems)
}

func (h *Handler) getVoteResults(c *gin.Context) {
	voteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vote ID"})
		return
	}

	results, err := h.service.GetVoteResults(voteID)
	if err == enterprise.ErrVoteNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "vote not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// Helper function to get user ID from context
// This should be implemented based on your authentication middleware
func getUserID(c *gin.Context) int64 {
	// Implementation depends on how you store the user ID in the context
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	id, ok := userID.(int64)
	if !ok {
		return 0
	}
	return id
}
