# 🚀 COMPLETE DEPLOYMENT GUIDE

## Prerequisites

Before running deployment, ensure you have:

1. **AWS Account**
   - [ ] AWS account created
   - [ ] Billing enabled
   - [ ] Access Keys generated

2. **Local Tools**
   ```bash
   # Check AWS CLI
   aws --version
   
   # Check Docker
   docker --version
   
   # Check Node.js
   node --version
   ```

3. **AWS Credentials**
   ```bash
   aws configure
   # Enter: Access Key ID
   # Enter: Secret Access Key
   # Region: us-east-1
   # Format: json
   ```

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/lucasdescombes8-glitch/crm-1862-backend.git
cd crm-1862-backend

# Run automatic deployment
chmod +x aws/scripts/quick-deploy.sh
./aws/scripts/quick-deploy.sh

# Follow prompts and enter:
# - Database URL
# - Redis URL
# - JWT Secret
```

### Option 2: Manual Deployment (Step by step)

#### Step 1: Build Docker Image
```bash
docker build -t crm-1862-backend:latest .
```

#### Step 2: Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name crm-1862-backend \
  --region us-east-1
```

#### Step 3: Login to ECR
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 4: Push Image
```bash
docker tag crm-1862-backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crm-1862-backend:latest

docker push \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crm-1862-backend:latest
```

#### Step 5: Create Secrets
```bash
# Database URL
aws secretsmanager create-secret \
  --name crm-1862-db-url \
  --secret-string 'postgresql://user:pass@rds:5432/crm_1862'

# Redis URL
aws secretsmanager create-secret \
  --name crm-1862-redis-url \
  --secret-string 'redis://redis-endpoint:6379'

# JWT Secret
aws secretsmanager create-secret \
  --name crm-1862-jwt-secret \
  --secret-string 'YOUR_SECURE_KEY'
```

#### Step 6: Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name crm-1862-prod
```

#### Step 7: Register Task Definition
```bash
aws ecs register-task-definition \
  --cli-input-json file://aws/cloudformation/ecs-task-definition.json
```

#### Step 8: Create ECS Service
```bash
aws ecs create-service \
  --cluster crm-1862-prod \
  --service-name crm-1862-api \
  --task-definition crm-1862-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

#### Step 9: Create Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name crm-1862-alb \
  --subnets subnet-xxx subnet-xxx

# Create target group
aws elbv2 create-target-group \
  --name crm-1862-api \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx
```

## Verification

### Check Service Status
```bash
aws ecs describe-services \
  --cluster crm-1862-prod \
  --services crm-1862-api
```

### View Logs
```bash
aws logs tail /ecs/crm-1862-api --follow
```

### Test Endpoints
```bash
# Health check
curl http://ALB_DNS/health

# Login (test)
curl -X POST http://ALB_DNS/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password"}'
```

## Troubleshooting

### 1. Docker Build Fails
```bash
# Clean up and retry
docker system prune -a
docker build -t crm-1862-backend:latest .
```

### 2. ECR Push Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check repository exists
aws ecr describe-repositories --region us-east-1
```

### 3. ECS Service Won't Start
```bash
# Check logs
aws logs tail /ecs/crm-1862-api

# Check task status
aws ecs describe-tasks \
  --cluster crm-1862-prod \
  --tasks <task-arn>
```

### 4. Load Balancer Not Responding
```bash
# Check ALB status
aws elbv2 describe-load-balancers

# Check target group
aws elbv2 describe-target-groups
```

## Monitoring

### CloudWatch Dashboard
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name crm-1862-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Setup Alerts
```bash
# SNS topic for alerts
aws sns create-topic --name crm-1862-alerts

# Subscribe to alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:crm-1862-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cost Monitoring

### Enable Billing Alerts
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name monthly-billing-alert \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 150 \
  --comparison-operator GreaterThanThreshold
```

## Success!

Once deployment is complete:
- ✅ API responds on Load Balancer DNS
- ✅ All endpoints functional
- ✅ Logs streaming to CloudWatch
- ✅ Monitoring and alerts active
- ✅ Ready for production traffic

For more details, see:
- DEPLOYMENT.md - Complete AWS guide
- AWS_CLI_GUIDE.md - CLI command reference
- DEPLOYMENT_CHECKLIST.md - Step-by-step checklist
