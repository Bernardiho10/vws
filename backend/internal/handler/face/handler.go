package face

import (
	"bytes"
	"image"
	"image/jpeg"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"vws-backend/internal/service/face"
)

// Handler handles HTTP requests for face detection
type Handler struct {
	service *face.Service
}

// NewHandler creates a new face detection handler
func NewHandler(service *face.Service) *Handler {
	return &Handler{
		service: service,
	}
}

// RegisterRoutes registers the face detection routes
func (h *Handler) RegisterRoutes(router *gin.Engine) {
	group := router.Group("/api/face")
	{
		group.POST("/detect", h.DetectFace)
		group.POST("/verify", h.VerifyFace)
	}
}

// DetectFace handles face detection requests
func (h *Handler) DetectFace(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No image file provided",
		})
		return
	}

	// Validate file size and type
	if err := h.validateFile(file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Open and decode image
	img, err := h.decodeImage(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid image format",
		})
		return
	}

	// Perform face detection
	detection, err := h.service.DetectFace(c.Request.Context(), img)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Face detection failed",
		})
		return
	}

	c.JSON(http.StatusOK, detection)
}

// VerifyFace handles face verification requests
func (h *Handler) VerifyFace(c *gin.Context) {
	// TODO: Implement face verification
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Face verification not implemented yet",
	})
}

// validateFile validates the uploaded file
func (h *Handler) validateFile(file *multipart.FileHeader) error {
	// TODO: Implement file validation
	return nil
}

// decodeImage decodes the uploaded image file
func (h *Handler) decodeImage(file *multipart.FileHeader) (image.Image, error) {
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Read the entire file into memory
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, src); err != nil {
		return nil, err
	}

	// Decode the image
	img, err := jpeg.Decode(buf)
	if err != nil {
		return nil, err
	}

	return img, nil
} 