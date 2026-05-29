#!/bin/bash

#################################
# GROUPE 1862 CRM - Deployment Script
# Automatise tout le déploiement AWS
#################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║    🚀 GROUPE 1862 CRM - AWS Deployment Automation 🚀          ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
echo ""

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 installed${NC}"
}

check_command aws
check_command docker
check_command npm

echo ""

# Step 2: Configure AWS
echo -e "${YELLOW}Step 2: Configuring AWS credentials...${NC}"
echo ""

if aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AWS credentials already configured${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "  Account ID: ${GREEN}${AWS_ACCOUNT_ID}${NC}"
else
    echo -e "${RED}AWS credentials not configured.${NC}"
    echo "Run: aws configure"
    echo "Then re-run this script"
    exit 1
fi

AWS_REGION="us-east-1"
echo ""

# Step 3: Create secrets
echo -e "${YELLOW}Step 3: Creating AWS Secrets Manager entries...${NC}"
echo ""

create_secret() {
    local name=$1
    local value=$2
    
    if aws secretsmanager describe-secret --secret-id $name --region $AWS_REGION > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Secret '$name' already exists${NC}"
    else
        aws secretsmanager create-secret \
            --name $name \
            --secret-string "$value" \
            --region $AWS_REGION > /dev/null
        echo -e "${GREEN}✓ Created secret: $name${NC}"
    fi
}

echo "Creating secrets (you'll be prompted for values)..."
echo ""

read -sp "Database URL (postgresql://...): " DB_URL
echo ""
create_secret "crm-1862-db-url" "$DB_URL"

read -sp "Redis URL (redis://...): " REDIS_URL
echo ""
create_secret "crm-1862-redis-url" "$REDIS_URL"

read -sp "JWT Secret (secure key): " JWT_SECRET
echo ""
create_secret "crm-1862-jwt-secret" "$JWT_SECRET"

echo ""

# Step 4: Build Docker image
echo -e "${YELLOW}Step 4: Building Docker image...${NC}"
echo ""

docker build -t crm-1862-backend:latest . || {
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 5: Create ECR repository
echo -e "${YELLOW}Step 5: Creating ECR repository...${NC}"
echo ""

REPO_URI=$(aws ecr describe-repositories --repository-names crm-1862-backend --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text 2>/dev/null || echo "")

if [ -z "$REPO_URI" ] || [ "$REPO_URI" = "None" ]; then
    REPO_URI=$(aws ecr create-repository \
        --repository-name crm-1862-backend \
        --region $AWS_REGION \
        --query 'repository.repositoryUri' \
        --output text)
    echo -e "${GREEN}✓ ECR repository created${NC}"
else
    echo -e "${GREEN}✓ ECR repository already exists${NC}"
fi

echo -e "  URI: ${GREEN}${REPO_URI}${NC}"
echo ""

# Step 6: Push to ECR
echo -e "${YELLOW}Step 6: Pushing Docker image to ECR...${NC}"
echo ""

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${REPO_URI%/*}

docker tag crm-1862-backend:latest ${REPO_URI}:latest
docker push ${REPO_URI}:latest

echo -e "${GREEN}✓ Image pushed to ECR${NC}"
echo ""

# Step 7: Setup AWS infrastructure
echo -e "${YELLOW}Step 7: Setting up AWS infrastructure...${NC}"
echo ""

# Create log group
aws logs create-log-group --log-group-name /ecs/crm-1862-api --region $AWS_REGION 2>/dev/null || true
echo -e "${GREEN}✓ CloudWatch log group ready${NC}"

# Create IAM role
aws iam create-role --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' 2>/dev/null || true

aws iam attach-role-policy --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

echo -e "${GREEN}✓ IAM roles configured${NC}"
echo ""

# Step 8: Create ECS cluster
echo -e "${YELLOW}Step 8: Creating ECS cluster...${NC}"
echo ""

CLUSTER_ARN=$(aws ecs describe-clusters --clusters crm-1862-prod --region $AWS_REGION --query 'clusters[0].clusterArn' --output text 2>/dev/null || echo "")

if [ -z "$CLUSTER_ARN" ] || [ "$CLUSTER_ARN" = "None" ]; then
    aws ecs create-cluster --cluster-name crm-1862-prod --region $AWS_REGION > /dev/null
    echo -e "${GREEN}✓ ECS cluster created${NC}"
else
    echo -e "${GREEN}✓ ECS cluster already exists${NC}"
fi

echo ""

# Step 9: Register task definition
echo -e "${YELLOW}Step 9: Registering ECS task definition...${NC}"
echo ""

# Create task definition
cat > /tmp/task-definition.json <<EOF
{
  "family": "crm-1862-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "crm-1862-api",
      "image": "${REPO_URI}:latest",
      "portMappings": [{
        "containerPort": 3000,
        "hostPort": 3000,
        "protocol": "tcp"
      }],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "LOG_LEVEL", "value": "info"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:crm-1862-db-url"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:crm-1862-redis-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:crm-1862-jwt-secret"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crm-1862-api",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole"
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-definition.json \
    --region $AWS_REGION > /dev/null

echo -e "${GREEN}✓ Task definition registered${NC}"
echo ""

# Final summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo -e "  1. Create ECS service in AWS Console"
echo -e "  2. Create Application Load Balancer"
echo -e "  3. Configure domain and SSL"
echo -e "  4. Monitor logs: aws logs tail /ecs/crm-1862-api --follow"
echo ""
echo -e "Documentation: See DEPLOYMENT.md for detailed steps"
echo ""
