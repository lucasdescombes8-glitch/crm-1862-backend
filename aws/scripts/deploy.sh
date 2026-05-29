#!/bin/bash

set -e

echo "🚀 GROUPE 1862 CRM - AWS Deployment Script"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="\"
IMAGE_NAME="crm-1862-backend"
ECR_REPO="\.dkr.ecr.\.amazonaws.com/\"
CLUSTER_NAME="crm-1862-prod"
SERVICE_NAME="crm-1862-api"

if [ -z "\" ]; then
    echo "❌ Error: Set AWS_ACCOUNT_ID environment variable"
    exit 1
fi

echo "📋 Configuration:"
echo "  Region: \"
echo "  Account: \"
echo "  ECR Repo: \"
echo ""

# Step 1: Build Docker image
echo "1️⃣  Building Docker image..."
docker build -t \ .
docker tag \ \
echo "✓ Docker image built"
echo ""

# Step 2: Push to ECR
echo "2️⃣  Pushing to ECR..."
aws ecr get-login-password --region \ | docker login --username AWS --password-stdin \
docker push \
echo "✓ Pushed to ECR"
echo ""

# Step 3: Update ECS service
echo "3️⃣  Updating ECS service..."
aws ecs update-service \\
    --cluster \ \\
    --service \ \\
    --force-new-deployment \\
    --region \
echo "✓ ECS service updated"
echo ""

# Step 4: Wait for deployment
echo "4️⃣  Waiting for deployment to complete..."
aws ecs wait services-stable \\
    --cluster \ \\
    --services \ \\
    --region \
echo "✓ Deployment complete"
echo ""

echo "🎉 Deployment successful!"
