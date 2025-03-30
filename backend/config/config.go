package config

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

type Config struct {
	Server struct {
		Port int    `json:"port"`
		Host string `json:"host"`
	} `json:"server"`

	FaceDetection struct {
		ModelPath    string   `json:"modelPath"`
		MaxFileSize  int64    `json:"maxFileSize"`
		AllowedTypes []string `json:"allowedTypes"`
	} `json:"faceDetection"`

	Blockchain struct {
		NetworkURL    string `json:"networkURL"`
		ContractAddr  string `json:"contractAddr"`
		GasLimit      uint64 `json:"gasLimit"`
		MaxRetries    int    `json:"maxRetries"`
		PrivateKey    string `json:"privateKey"`
		ChainID       int64  `json:"chainId"`
		ConfirmBlocks int    `json:"confirmBlocks"`
	} `json:"blockchain"`

	Security struct {
		JWTSecret         string        `json:"jwtSecret"`
		RequestsPerWindow float64       `json:"requestsPerWindow"`
		RateWindow        time.Duration `json:"rateWindow"`
		AllowedOrigins    []string      `json:"allowedOrigins"`
		TokenExpiry       time.Duration `json:"tokenExpiry"`
	} `json:"security"`

	Cache struct {
		RedisURL   string `json:"redisURL"`
		TTL        int    `json:"ttl"`
		MaxEntries int    `json:"maxEntries"`
	} `json:"cache"`

	Database struct {
		URL string `json:"url"`
	} `json:"database"`
}

var (
	config *Config
	once   sync.Once
)

// LoadConfig loads configuration from a JSON file
func LoadConfig(path string) (*Config, error) {
	once.Do(func() {
		config = &Config{}
		file, err := os.ReadFile(path)
		if err != nil {
			return
		}
		if err := json.Unmarshal(file, config); err != nil {
			return
		}
	})
	return config, nil
}

// GetConfig returns the singleton config instance
func GetConfig() *Config {
	if config == nil {
		// Load default configuration
		config = &Config{}
		config.Server.Port = 8080
		config.Server.Host = "localhost"

		config.FaceDetection.MaxFileSize = 5 * 1024 * 1024 // 5MB
		config.FaceDetection.AllowedTypes = []string{"image/jpeg", "image/png"}

		config.Blockchain.NetworkURL = "http://localhost:8545"
		config.Blockchain.ContractAddr = "0x0000000000000000000000000000000000000000"
		config.Blockchain.GasLimit = 3000000
		config.Blockchain.MaxRetries = 3
		config.Blockchain.ChainID = 1337 // Local testnet
		config.Blockchain.ConfirmBlocks = 1

		config.Security.RequestsPerWindow = 100
		config.Security.RateWindow = time.Minute
		config.Security.AllowedOrigins = []string{"http://localhost:3000"}
		config.Security.TokenExpiry = 24 * time.Hour

		config.Cache.TTL = 3600 // 1 hour
		config.Cache.MaxEntries = 10000

		config.Database.URL = "postgres://postgres:postgres@localhost:5432/vws?sslmode=disable"
	}
	return config
}
