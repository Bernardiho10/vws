package token

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"vws-backend/internal/middleware"
	"vws-backend/internal/service/token"
)

type Handler struct {
	service *token.Service
}

func NewHandler(service *token.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/tokens")
	api.Use(middleware.Auth())
	{
		api.POST("/convert", h.convertPoints)
		api.POST("/stake", h.stakeTokens)
		api.POST("/unstake", h.unstakeTokens)
		api.POST("/transfer", h.transferTokens)
		api.GET("/balance", h.getBalance)
		api.GET("/transactions", h.getTransactions)
	}
}

type ConvertRequest struct {
	Points int `json:"points" binding:"required,min=1"`
}

func (h *Handler) convertPoints(c *gin.Context) {
	var req ConvertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt64("userID")
	txn, err := h.service.ConvertPointsToTokens(c.Request.Context(), userID, req.Points)
	if err != nil {
		status := http.StatusInternalServerError
		if err == token.ErrInsufficientBalance {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, txn)
}

type StakeRequest struct {
	Amount       float64 `json:"amount" binding:"required,gt=0"`
	DurationDays int     `json:"durationDays" binding:"required,min=30"`
}

func (h *Handler) stakeTokens(c *gin.Context) {
	var req StakeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt64("userID")
	txn, err := h.service.StakeTokens(c.Request.Context(), userID, req.Amount, req.DurationDays)
	if err != nil {
		status := http.StatusInternalServerError
		switch err {
		case token.ErrInsufficientBalance, token.ErrInvalidAmount,
			token.ErrInvalidStakePeriod, token.ErrAlreadyStaked:
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, txn)
}

func (h *Handler) unstakeTokens(c *gin.Context) {
	userID := c.GetInt64("userID")
	txn, err := h.service.UnstakeTokens(c.Request.Context(), userID)
	if err != nil {
		status := http.StatusInternalServerError
		switch err {
		case token.ErrNoStakedTokens, token.ErrStakePeriodActive:
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, txn)
}

type TransferRequest struct {
	ToUserID int64   `json:"toUserId" binding:"required"`
	Amount   float64 `json:"amount" binding:"required,gt=0"`
}

func (h *Handler) transferTokens(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt64("userID")
	if userID == req.ToUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot transfer to self"})
		return
	}

	txn, err := h.service.TransferTokens(c.Request.Context(), userID, req.ToUserID, req.Amount)
	if err != nil {
		status := http.StatusInternalServerError
		if err == token.ErrInsufficientBalance || err == token.ErrInvalidAmount {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, txn)
}

func (h *Handler) getBalance(c *gin.Context) {
	userID := c.GetInt64("userID")
	tokenInfo, err := h.service.GetUserTokens(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenInfo)
}

func (h *Handler) getTransactions(c *gin.Context) {
	userID := c.GetInt64("userID")
	limit := 10
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	transactions, err := h.service.GetUserTransactions(c.Request.Context(), userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
		},
	})
}
