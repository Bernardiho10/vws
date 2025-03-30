package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"golang.org/x/time/rate"

	"vws-backend/config"
	analyticsHandler "vws-backend/internal/handler/analytics"
	enterpriseHandler "vws-backend/internal/handler/enterprise"
	faceHandler "vws-backend/internal/handler/face"
	tokenHandler "vws-backend/internal/handler/token"
	userHandler "vws-backend/internal/handler/user"
	verificationHandler "vws-backend/internal/handler/verification"
	"vws-backend/internal/middleware"
	analyticsService "vws-backend/internal/service/analytics"
	enterpriseService "vws-backend/internal/service/enterprise"
	faceService "vws-backend/internal/service/face"
	tokenService "vws-backend/internal/service/token"
	userService "vws-backend/internal/service/user"
	verificationService "vws-backend/internal/service/verification"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig("config/config.json")
	if err != nil {
		cfg = config.GetConfig() // Use default config
	}

	// Initialize database
	db, err := sql.Open("postgres", cfg.Database.URL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize router
	router := gin.Default()

	// Initialize middleware
	rateLimiter := middleware.NewRateLimiter(
		rate.Limit(cfg.Security.RequestsPerWindow),
		int(cfg.Security.RateWindow.Seconds()),
	)
	router.Use(
		middleware.CORS(),
		middleware.Logger(),
		rateLimiter.RateLimit(),
	)

	// Initialize services
	faceDetectionService, err := faceService.NewService(cfg.FaceDetection.ModelPath)
	if err != nil {
		log.Fatalf("Failed to initialize face detection service: %v", err)
	}
	defer faceDetectionService.Close()

	userSvc := userService.NewService(db)
	tokenSvc := tokenService.NewService(db)
	verificationSvc, err := verificationService.NewService(db, cfg.Blockchain.NetworkURL, cfg.Blockchain.ContractAddr)
	if err != nil {
		log.Fatalf("Failed to initialize verification service: %v", err)
	}
	defer verificationSvc.Close()

	analyticsSvc := analyticsService.NewService(db)
	enterpriseSvc := enterpriseService.NewService(db)

	// Initialize handlers
	faceDetectionHandler := faceHandler.NewHandler(faceDetectionService)
	userHandler := userHandler.NewHandler(userSvc)
	tokenHandler := tokenHandler.NewHandler(tokenSvc)
	verificationHandler := verificationHandler.NewHandler(verificationSvc)
	analyticsHandler := analyticsHandler.NewHandler(analyticsSvc)
	enterpriseHandler := enterpriseHandler.NewHandler(enterpriseSvc)

	// Register routes
	initializeRoutes(router, faceDetectionHandler, userHandler, tokenHandler, verificationHandler, analyticsHandler, enterpriseHandler)

	// Configure server
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	// Graceful shutdown
	go func() {
		// Service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}

func initializeRoutes(router *gin.Engine, faceDetectionHandler *faceHandler.Handler, userHandler *userHandler.Handler, tokenHandler *tokenHandler.Handler, verificationHandler *verificationHandler.Handler, analyticsHandler *analyticsHandler.Handler, enterpriseHandler *enterpriseHandler.Handler) {
	// API routes
	api := router.Group("/api")
	{
		// Public routes
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})

		// User routes
		userHandler.RegisterRoutes(router)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.Auth())
		{
			// Face detection routes
			faceDetectionHandler.RegisterRoutes(router)
			// Token routes
			tokenHandler.RegisterRoutes(router)
			// Verification routes
			verificationHandler.RegisterRoutes(router)
			// Analytics routes
			analyticsHandler.RegisterRoutes(router)
			// Enterprise routes
			enterpriseHandler.RegisterRoutes(router)
		}
	}
}
