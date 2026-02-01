.PHONY: help build run clean clean-all status

# Configuration
IMAGE_NAME := football-numbers-dev
CONTAINER_NAME := dev-env_dev_1
DOCKERFILE := Containerfile
MAKEFILE_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
PROJECT_ROOT := $(shell dirname $(MAKEFILE_DIR))
DATA_PROJECT_ROOT ?= $(shell dirname $(PROJECT_ROOT))/international_results
DEV_HOSTNAME := football-numbers-dev.local

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
	cd $(MAKEFILE_DIR) && PROJECT_ROOT=$(PROJECT_ROOT) DATA_PROJECT_ROOT=$(DATA_PROJECT_ROOT) DEV_HOSTNAME=$(DEV_HOSTNAME) podman-compose -f dev-compose.yml build
	@echo "✓ Image built successfully"

run:
	@echo "Starting development container: $(CONTAINER_NAME)"
	cd $(MAKEFILE_DIR) && PROJECT_ROOT=$(PROJECT_ROOT) DATA_PROJECT_ROOT=$(DATA_PROJECT_ROOT) DEV_HOSTNAME=$(DEV_HOSTNAME) podman-compose -f dev-compose.yml up -d

clean:
	@echo "Stopping and removing development environment"
	@cd $(MAKEFILE_DIR) && PROJECT_ROOT=$(PROJECT_ROOT) podman-compose -f dev-compose.yml down --remove-orphans -v 2>/dev/null || true
	@echo "✓ Development environment cleaned"

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
	@running=$$(podman ps -f name=$(CONTAINER_NAME) --format '{{.Names}}' 2>/dev/null | grep -x '$(CONTAINER_NAME)' || true); \
	if [ -n "$$running" ]; then \
		echo "  ✓ Container running"; \
	elif podman container exists $(CONTAINER_NAME) 2>/dev/null; then \
		echo "  ⊘ Container exists (stopped)"; \
	else \
		echo "  ✗ Container not found"; \
	fi
	@echo ""
