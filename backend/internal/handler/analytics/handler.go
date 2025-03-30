package analytics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"vws-backend/internal/middleware"
	"vws-backend/internal/service/analytics"
)

type Handler struct {
	service *analytics.Service
}

func NewHandler(service *analytics.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	analytics := r.Group("/api/analytics")
	analytics.Use(middleware.Auth())
	{
		// Activity tracking
		analytics.POST("/activities", h.trackActivity)

		// Metrics
		analytics.GET("/metrics/daily", h.getDailyMetrics)
		analytics.GET("/metrics/engagement/:userID", h.getUserEngagement)

		// Reports
		analytics.POST("/reports", h.generateReport)
		analytics.GET("/reports/:reportID", h.getReport)
	}
}

type trackActivityRequest struct {
	Type     string         `json:"type" binding:"required"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

func (h *Handler) trackActivity(c *gin.Context) {
	userID := c.GetInt64(middleware.UserIDKey)

	var req trackActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := h.service.TrackActivity(c.Request.Context(), userID, req.Type, req.Metadata)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track activity"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success"})
}

func (h *Handler) getDailyMetrics(c *gin.Context) {
	metricType := c.Query("type")
	if metricType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Metric type is required"})
		return
	}

	dateStr := c.Query("date")
	var date time.Time
	var err error
	if dateStr == "" {
		date = time.Now()
	} else {
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
	}

	metric, err := h.service.CalculateDailyMetric(c.Request.Context(), metricType, date)
	if err == analytics.ErrInvalidMetric {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid metric type"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate metric"})
		return
	}

	c.JSON(http.StatusOK, metric)
}

func (h *Handler) getUserEngagement(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start date and end date are required"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format"})
		return
	}

	err = h.service.UpdateUserEngagement(c.Request.Context(), userID, startDate, endDate)
	if err == analytics.ErrInvalidDateRange {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date range"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user engagement"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

type generateReportRequest struct {
	Type       string         `json:"type" binding:"required"`
	StartDate  string         `json:"startDate" binding:"required"`
	EndDate    string         `json:"endDate" binding:"required"`
	Parameters map[string]any `json:"parameters,omitempty"`
}

func (h *Handler) generateReport(c *gin.Context) {
	var req generateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format"})
		return
	}

	report, err := h.service.GenerateReport(c.Request.Context(), req.Type, startDate, endDate, req.Parameters)
	if err == analytics.ErrInvalidDateRange {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date range"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *Handler) getReport(c *gin.Context) {
	reportID := c.Param("reportID")
	if reportID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Report ID is required"})
		return
	}

	// TODO: Implement get report by ID functionality in the service
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}
