#!/bin/bash

# Quick deployment - just run this!
echo "🚀 Quick Deployment Script"
echo ""
echo "Prerequisites:"
echo "  ✓ AWS CLI installed"
echo "  ✓ Docker installed"
echo "  ✓ AWS credentials configured"
echo ""

# Make scripts executable
chmod +x aws/scripts/auto-deploy.sh

# Run deployment
cd aws/scripts
./auto-deploy.sh
