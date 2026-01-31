.PHONY: help build run clean clean-all status

# Configuration
IMAGE_NAME := football-numbers-dev
CONTAINER_NAME := football-numbers-dev
DOCKERFILE := Containerfile
MAKEFILE_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
PROJECT_ROOT := $(shell dirname $(MAKEFILE_DIR))

help:
	@echo "Football Numbers Development Environment - Available Targets"
	@echo ""
	@echo "  make build       - Build the development container image"
	@echo "  make run         - Run the development container (auto-cleanup with --rm)"
	@echo "  make clean       - Stop and remove the running container"
	@echo "  make clean-all   - Remove container, image, and all related resources"
	@echo "  make status      - Display status of image and container"
	@echo "  make help        - Display this help message"
	@echo ""

build:
	@echo "Building container image: $(IMAGE_NAME)"
	cd $(MAKEFILE_DIR) && podman build -t $(IMAGE_NAME) -f $(DOCKERFILE) .
	@echo "✓ Image built successfully"

run:
	@echo "Starting development container: $(CONTAINER_NAME)"
	cd $(MAKEFILE_DIR) && podman-compose -f dev-compose.yml up -d

clean:
	@echo "Stopping and removing container: $(CONTAINER_NAME)"
	@cd $(MAKEFILE_DIR) && podman-compose -f dev-compose.yml down 2>/dev/null || true
	@echo "✓ Container cleaned"

clean-all: clean
	@echo "Removing image: $(IMAGE_NAME)"
	@podman image rm $(IMAGE_NAME) 2>/dev/null || true
	@echo "✓ All resources cleaned"

status:
	@echo "=== Container Status ==="
	@echo "Image: $(IMAGE_NAME)"
	@podman image exists $(IMAGE_NAME) && echo "  ✓ Image exists" || echo "  ✗ Image not found"
	@echo ""
	@echo "Container: $(CONTAINER_NAME)"
	@podman container exists $(CONTAINER_NAME) && echo "  ✓ Container running" || echo "  ✗ Container not running"
	@echo ""
