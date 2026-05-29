# AWS Deployment Checklist

## Pre-Deployment (Day 1)

### Infrastructure Setup
- [ ] Create AWS account / ensure access
- [ ] Create IAM roles and policies
- [ ] Create VPC with public/private subnets
- [ ] Create security groups
- [ ] Create RDS parameter group
- [ ] Create RDS subnet group

### Secrets & Configuration
- [ ] Create AWS Secrets Manager entries
- [ ] Configure environment variables
- [ ] Set up .env.production
- [ ] Create SSL certificate in ACM

## Deployment (Days 2-3)

### Phase 1: Database Setup
- [ ] Deploy RDS CloudFormation stack
- [ ] Verify database connectivity
- [ ] Run database migrations
- [ ] Create initial data if needed

### Phase 2: Cache Setup
- [ ] Create ElastiCache Redis cluster
- [ ] Configure security group
- [ ] Test connection from application

### Phase 3: Container Registry
- [ ] Create ECR repository
- [ ] Build Docker image
- [ ] Push image to ECR
- [ ] Tag image as 'latest'

### Phase 4: ECS Setup
- [ ] Create ECS cluster
- [ ] Create task execution role
- [ ] Create task role
- [ ] Register task definition
- [ ] Create ECS service
- [ ] Configure auto-scaling

### Phase 5: Load Balancer
- [ ] Create Application Load Balancer
- [ ] Create target group
- [ ] Create listener (HTTP)
- [ ] Add HTTPS listener with SSL
- [ ] Configure health checks
- [ ] Point domain to ALB

### Phase 6: CI/CD Pipeline
- [ ] Set up GitHub Actions secrets
- [ ] Create deployment workflow
- [ ] Test manual deployment
- [ ] Enable automatic deployments

## Post-Deployment (Day 4)

### Monitoring & Alerts
- [ ] Create CloudWatch log group
- [ ] Set up CloudWatch alarms
- [ ] Configure SNS notifications
- [ ] Create CloudWatch dashboard

### Testing
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test cache functionality
- [ ] Load test
- [ ] Security audit

### Documentation
- [ ] Update README with AWS URLs
- [ ] Document deployment procedure
- [ ] Create runbooks for common tasks
- [ ] Train team on deployment

### Optimization
- [ ] Enable RDS automated backups
- [ ] Configure backup retention
- [ ] Enable RDS monitoring
- [ ] Set up cost alerts

## Success Criteria
- [ ] API responds on load balancer DNS
- [ ] All endpoints functional
- [ ] Database persists data
- [ ] Cache reduces queries
- [ ] Logs flow to CloudWatch
- [ ] Alarms trigger correctly
- [ ] Auto-scaling works
- [ ] CI/CD pipeline working
