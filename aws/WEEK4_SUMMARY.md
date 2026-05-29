# Week 4 - AWS Deployment Implementation

## Files Created

### Infrastructure as Code
- `aws/cloudformation/rds.yaml` - RDS PostgreSQL CloudFormation template
- `aws/cloudformation/ecs-task-definition.json` - ECS task definition

### Deployment Scripts
- `aws/scripts/setup.sh` - AWS infrastructure setup script
- `aws/scripts/deploy.sh` - Application deployment script
- `aws/config/.env.production` - Production environment template
- `.github/workflows/deploy-aws.yml` - GitHub Actions CI/CD pipeline

### Documentation
- `aws/DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment checklist
- `aws/AWS_CLI_GUIDE.md` - Complete AWS CLI reference

## Quick Start

### 1. Prerequisites
```bash
# Install/configure AWS CLI
aws configure

# Set environment variables
export AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
export AWS_REGION=us-east-1
```

### 2. Run Setup Script
```bash
cd aws/scripts
chmod +x setup.sh
./setup.sh
```

### 3. Configure Secrets
```bash
# Update environment variables
vi aws/config/.env.production

# Create AWS Secrets Manager entries
aws secretsmanager create-secret \
  --name crm-1862-db-url \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/crm_1862"

aws secretsmanager create-secret \
  --name crm-1862-redis-url \
  --secret-string "redis://redis-endpoint:6379"

aws secretsmanager create-secret \
  --name crm-1862-jwt-secret \
  --secret-string "YOUR_SECURE_JWT_SECRET"
```

### 4. Build and Deploy
```bash
# Build Docker image
docker build -t crm-1862-backend:latest .

# Deploy (using script)
AWS_ACCOUNT_ID=YOUR_ID aws/scripts/deploy.sh

# Or manually deploy to ECS
aws ecs update-service \
  --cluster crm-1862-prod \
  --service crm-1862-api \
  --force-new-deployment
```

### 5. Monitor Deployment
```bash
# Check service status
aws ecs describe-services \
  --cluster crm-1862-prod \
  --services crm-1862-api

# View logs
aws logs tail /ecs/crm-1862-api --follow
```

## Architecture

```
Internet
   ↓
[CloudFront CDN - Optional]
   ↓
[Application Load Balancer]
   ↓
[ECS Fargate Tasks (2-10)]
   ├─ Task 1 (0.25 CPU, 512 MB)
   └─ Task 2 (0.25 CPU, 512 MB)
   ↓
   ├─ [RDS PostgreSQL 15]
   │  └─ Backups: Daily, 7-day retention
   │
   └─ [ElastiCache Redis 7]
      └─ Single node (upgradable)
```

## Estimated Costs

| Service | Config | Monthly |
|---------|--------|---------|
| RDS | db.t3.micro, 20GB | $30 |
| ElastiCache | cache.t3.micro | $20 |
| ECS Fargate | 2 tasks × $15 | $30 |
| ALB | Standard | $18 |
| Data Transfer | Approx | $10 |
| **Total** | | **$108** |

## Next Steps

1. ✅ Code ready on GitHub
2. ✅ Docker configured
3. ⏳ AWS infrastructure setup (Day 1)
4. ⏳ Database migration (Day 1)
5. ⏳ ECS deployment (Day 2)
6. ⏳ Load balancer configuration (Day 2)
7. ⏳ CI/CD pipeline (Day 3)
8. ⏳ Monitoring & alerts (Day 3-4)

## Support

Refer to:
- `DEPLOYMENT.md` - Detailed AWS setup guide
- `AWS_CLI_GUIDE.md` - CLI command reference
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
