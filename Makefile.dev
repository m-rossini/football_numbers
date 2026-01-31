.PHONY: help build run clean clean-all status

# Get the directory where this Makefile is located
MAKEFILE_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
DEV_ENV_DIR := $(MAKEFILE_DIR)/dev-env

help:
	@$(MAKE) -C $(DEV_ENV_DIR) help

build:
	@$(MAKE) -C $(DEV_ENV_DIR) build

run:
	@$(MAKE) -C $(DEV_ENV_DIR) run

clean:
	@$(MAKE) -C $(DEV_ENV_DIR) clean

clean-all:
	@$(MAKE) -C $(DEV_ENV_DIR) clean-all

status:
	@$(MAKE) -C $(DEV_ENV_DIR) status
