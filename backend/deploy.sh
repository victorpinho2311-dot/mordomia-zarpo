#!/bin/bash
# Deploy Apps Script: push code + update live deployment
set -e

DEPLOY_ID="AKfycbxembZHQzVTOKmny3rLt-eanGupAQull0d47nKwMq0pZnEG0GTsIjrE1rDdvADALE3NOQ"

echo "→ Pushing code..."
clasp push --force

echo "→ Updating deployment..."
clasp deploy --deploymentId "$DEPLOY_ID"

echo "✓ Done. Live URL:"
echo "  https://script.google.com/macros/s/${DEPLOY_ID}/exec"
