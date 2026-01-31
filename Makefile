.PHONY: help dev-help dev-build dev-run dev-clean dev-clean-all dev-status prod-help prod-build prod-run prod-clean prod-clean-all prod-status

MAKEFILE_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
DEV_ENV_DIR := $(MAKEFILE_DIR)/dev-env
PROD_ENV_DIR := $(MAKEFILE_DIR)/prod-env

help:
	@echo "Football Numbers - Development & Production Management"
	@echo ""
	@echo "DEVELOPMENT ENVIRONMENT (Port 3000):"
	@echo "  make dev-help        - Show development targets"
	@echo "  make dev-build       - Build the development container image"
	@echo "  make dev-run         - Start the development container"
	@echo "  make dev-clean       - Stop and remove the development container"
	@echo "  make dev-clean-all   - Remove development container and image"
	@echo "  make dev-status      - Display development container status"
	@echo ""
	@echo "PRODUCTION ENVIRONMENT (Port 3030):"
	@echo "  make prod-help       - Show production targets"
	@echo "  make prod-build      - Build the production container image"
	@echo "  make prod-run        - Start the production container"
	@echo "  make prod-clean      - Stop and remove the production container"
	@echo "  make prod-clean-all  - Remove production container and image"
	@echo "  make prod-status     - Display production container status"
	@echo ""

# Development targets
dev-help:
	@$(MAKE) -C $(DEV_ENV_DIR) help

dev-build:
	@$(MAKE) -C $(DEV_ENV_DIR) build

dev-run:
	@$(MAKE) -C $(DEV_ENV_DIR) run

dev-clean:
	@$(MAKE) -C $(DEV_ENV_DIR) clean

dev-clean-all:
	@$(MAKE) -C $(DEV_ENV_DIR) clean-all

dev-status:
	@$(MAKE) -C $(DEV_ENV_DIR) status

# Production targets
prod-help:
	@$(MAKE) -C $(PROD_ENV_DIR) help

prod-build:
	@$(MAKE) -C $(PROD_ENV_DIR) build

prod-run:
	@$(MAKE) -C $(PROD_ENV_DIR) run

prod-clean:
	@$(MAKE) -C $(PROD_ENV_DIR) clean

prod-clean-all:
	@$(MAKE) -C $(PROD_ENV_DIR) clean-all

prod-status:
	@$(MAKE) -C $(PROD_ENV_DIR) status
