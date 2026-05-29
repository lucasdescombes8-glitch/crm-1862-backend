# AWS Deployment Guide - GROUPE 1862 CRM

## Overview

This guide covers deploying the GROUPE 1862 CRM backend to AWS using:
- **Database**: RDS (PostgreSQL 15)
- **Cache**: ElastiCache (Redis 7)
- **Compute**: ECS with Fargate
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch

## Architecture Diagram

```
┌─────────────────────────────────────┐
│      Application Load Balancer      │
└────────────────┬────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
 ┌───▼──┐              ┌────▼───┐
 │ECS   │              │ECS     │
 │Task 1│              │Task 2  │
 └───┬──┘              └────┬───┘
     │                      │
     └──────────┬───────────┘
                │
    ┌───────────┴────────────┐
    │                        │
┌───▼────┐          ┌────────▼──┐
│RDS     │          │ElastiCache│
│PostgreSQL         │Redis      │
└────────┘          └───────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed locally
- GitHub repository access
- Domain name (optional)

## Week 4 Implementation Timeline

### Phase 1: Infrastructure (Days 1-2)

**1.1 RDS PostgreSQL Setup**
- Instance class: db.t3.micro
- Storage: 20 GB (auto-scaling to 100 GB)
- Backup: 7-day retention
- Encryption: AES-256

**1.2 ElastiCache Redis Setup**
- Node type: cache.t3.micro
- Engine: Redis 7.0
- Single node (can scale to multi-AZ cluster)
- Port: 6379

### Phase 2: Containerization (Days 2-3)

**2.1 Docker Image**
- Build Node.js 18 Alpine image
- Install dependencies
- Build TypeScript
- Health checks enabled

**2.2 ECR Repository**
- Create private ECR repository
- Tag and push Docker images
- Enable image scanning

**2.3 ECS Setup**
- Create ECS cluster (crm-1862-prod)
- Register task definitions
- Configure launch type: Fargate
- Set up 2-3 task instances for HA

### Phase 3: Load Balancing (Day 3)

**3.1 Application Load Balancer**
- Configure listener on port 80/443
- Health check: /api/health
- Target group for ECS tasks

**3.2 SSL/TLS Certificate**
- Use AWS Certificate Manager
- Auto-renewal enabled

### Phase 4: CI/CD Pipeline (Day 4)

**4.1 GitHub Actions**
- Trigger on push to main
- Build Docker image
- Push to ECR
- Update ECS service
- Automated deployment

### Phase 5: Monitoring (Day 4-5)

**5.1 CloudWatch**
- Log groups for ECS tasks
- Performance metrics
- Custom dashboards

**5.2 Alarms**
- High CPU usage (>80%)
- Database connection limits
- Memory utilization
- API error rates

## Environment Variables (ECS Task Definition)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/crm_1862
REDIS_URL=redis://redis-endpoint:6379
JWT_SECRET=<SECURE_RANDOM_KEY>
JWT_EXPIRY=24h
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

## Scaling Strategy

### Application Scaling
- Target tracking: 70% CPU utilization
- Min tasks: 2
- Max tasks: 10
- Scale-up: 1 minute
- Scale-down: 5 minutes

### Database Scaling
- Enable storage auto-scaling
- Read replicas for reporting
- Connection pooling: 10-20 connections

### Redis Scaling
- Consider cluster mode if >500K ops/sec
- Multi-AZ for availability

## Estimated Costs

| Service | Config | Monthly |
|---------|--------|---------|
| RDS | db.t3.micro, 20GB | $30 |
| ElastiCache | cache.t3.micro | $20 |
| ECS Fargate | 2 tasks, 0.25 CPU, 512MB | $30 |
| ALB | Standard | $18 |
| Data Transfer | Average | $10 |
| **Total** | | **~$108** |

## Post-Deployment Tasks

- [ ] Database migrations applied
- [ ] Health checks passing (2+ tasks)
- [ ] CloudWatch alarms active
- [ ] Automated backups enabled
- [ ] Load testing completed
- [ ] SSL certificate verified
- [ ] CI/CD pipeline tested
- [ ] Documentation updated
- [ ] Team training completed

## Monitoring Checklist

- [ ] ECS task CPU usage
- [ ] ECS task memory usage
- [ ] RDS CPU and connections
- [ ] ElastiCache evictions and replication lag
- [ ] ALB request count and latency
- [ ] API error rates
- [ ] Database query performance

## Rollback Procedure

1. Revert to previous task definition version
2. Force new deployment
3. Verify health checks
4. Monitor logs and metrics

## Security Best Practices

1. Use AWS Secrets Manager for credentials
2. Enable VPC encryption for RDS/Redis
3. Use private subnets for databases
4. Enable CloudTrail logging
5. Implement WAF rules if needed
6. Regular security updates
7. IAM role with least privilege
8. Enable MFA for AWS console access

## Useful AWS CLI Commands

```bash
# View ECS task logs
aws logs tail /ecs/crm-1862-api --follow

# Update ECS service
aws ecs update-service --cluster crm-1862-prod --service crm-1862-api --force-new-deployment

# Scale service
aws ecs update-service --cluster crm-1862-prod --service crm-1862-api --desired-count 3

# View RDS status
aws rds describe-db-instances --db-instance-identifier crm-1862-postgres

# Check ElastiCache status
aws elasticache describe-cache-clusters --cache-cluster-id crm-1862-redis
```

## Troubleshooting

### ECS Tasks failing to start
- Check CloudWatch logs: aws logs tail /ecs/crm-1862-api
- Verify environment variables
- Check IAM task role permissions
- Verify Docker image exists in ECR

### Database connection errors
- Check RDS security group inbound rules
- Verify DATABASE_URL is correct
- Test connection from ECS task
- Check RDS availability

### Redis connection issues
- Verify ElastiCache security group
- Check Redis endpoint and port
- Verify network connectivity
- Check Redis memory usage

## References

- AWS ECS: https://docs.aws.amazon.com/ecs/
- AWS RDS: https://docs.aws.amazon.com/rds/
- AWS ElastiCache: https://docs.aws.amazon.com/elasticache/
- GitHub Actions: https://github.com/aws-actions
