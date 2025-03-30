package verification

import (
	"net/http"

	"vws-backend/internal/middleware"
	"vws-backend/internal/service/verification"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *verification.Service
}

func NewHandler(service *verification.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/verification")
	api.Use(middleware.Auth())
	{
		api.POST("/verify", h.verifyVoteParticipation)
		api.GET("/certificate/:id", h.getCertificate)
		api.GET("/certificates", h.getUserCertificates)
		api.POST("/verify-certificate/:id", h.verifyCertificate)
	}
}

type VerifyRequest struct {
	ElectionID string `json:"electionId" binding:"required"`
	ProofData  []byte `json:"proofData" binding:"required"`
}

func (h *Handler) verifyVoteParticipation(c *gin.Context) {
	var req VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt64("userID")
	cert, err := h.service.VerifyVoteParticipation(c.Request.Context(), userID, req.ElectionID, req.ProofData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cert)
}

func (h *Handler) getCertificate(c *gin.Context) {
	id := c.Param("id")
	cert, err := h.service.GetCertificate(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "certificate not found"})
		return
	}

	// Check if the certificate belongs to the requesting user
	userID := c.GetInt64("userID")
	if cert.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.JSON(http.StatusOK, cert)
}

func (h *Handler) getUserCertificates(c *gin.Context) {
	userID := c.GetInt64("userID")
	certs, err := h.service.GetUserCertificates(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"certificates": certs})
}

func (h *Handler) verifyCertificate(c *gin.Context) {
	id := c.Param("id")
	isValid, err := h.service.VerifyCertificate(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"valid": isValid})
}
