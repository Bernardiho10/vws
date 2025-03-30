.PHONY: build run test clean deps lint

# Build settings
BINARY_NAME=vws-backend
GO_FILES=$(shell find . -name '*.go')
GOFLAGS=-v

# Development settings
DEV_PORT=8080
DEV_HOST=localhost

all: clean deps build test

build:
	@echo "Building..."
	go build $(GOFLAGS) -o $(BINARY_NAME) ./cmd/server

run: build
	@echo "Running server..."
	./$(BINARY_NAME)

dev:
	@echo "Running in development mode..."
	go run ./cmd/server/main.go

test:
	@echo "Running tests..."
	go test -v ./...

clean:
	@echo "Cleaning..."
	go clean
	rm -f $(BINARY_NAME)

deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

lint:
	@echo "Running linter..."
	golangci-lint run

# Docker commands
docker-build:
	docker build -t $(BINARY_NAME) .

docker-run:
	docker run -p $(DEV_PORT):$(DEV_PORT) $(BINARY_NAME)

# Database commands
migrate-up:
	@echo "Running database migrations..."
	# TODO: Add migration command

migrate-down:
	@echo "Rolling back database migrations..."
	# TODO: Add rollback command

# Monitoring commands
metrics:
	@echo "Starting metrics server..."
	# TODO: Add metrics command

# Load testing commands
bench:
	@echo "Running benchmarks..."
	go test -bench=. ./...

# Security commands
security-scan:
	@echo "Running security scan..."
	gosec ./...

# Generate documentation
docs:
	@echo "Generating documentation..."
	godoc -http=:6060 