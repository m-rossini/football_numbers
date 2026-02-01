#!/bin/bash
# Run tests inside the dev container to verify data mapping
# This ensures tests run in the same environment where volumes are mounted

set -e

CONTAINER_NAME="${1:-dev-env_dev_1}"

echo "Running data mapping tests inside container: $CONTAINER_NAME"

podman exec "$CONTAINER_NAME" npm test -- tests/data-mapping.test.ts
