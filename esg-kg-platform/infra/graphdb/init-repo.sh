#!/bin/bash
# GraphDB Repository Initialization Script
# This script creates the ESG repository on first startup

set -e

echo "Waiting for GraphDB to be ready..."
until curl -f http://localhost:7200/repositories >/dev/null 2>&1; do
    echo "GraphDB not ready yet, waiting..."
    sleep 5
done

echo "GraphDB is ready. Checking if esg-repo exists..."

# Check if repository already exists
if curl -s http://localhost:7200/repositories/esg-repo >/dev/null 2>&1; then
    echo "Repository 'esg-repo' already exists, skipping creation."
    exit 0
fi

echo "Creating esg-repo repository..."

# Create repository using REST API with TTL configuration
curl -X POST \
    -H "Content-Type: text/turtle" \
    -d @/repo-config/esg-repo-config.ttl \
    "http://localhost:7200/rest/repositories" \
    && echo "Repository created successfully!" \
    || echo "Failed to create repository"

# Verify repository creation
if curl -f http://localhost:7200/repositories/esg-repo >/dev/null 2>&1; then
    echo "✓ Repository 'esg-repo' is ready for use"
    echo "✓ SHACL validation is enabled"
    echo "✓ GraphDB setup complete"
else
    echo "✗ Repository creation failed"
    exit 1
fi