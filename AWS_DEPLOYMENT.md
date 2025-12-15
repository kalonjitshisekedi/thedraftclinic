# Draft Clinic - AWS Deployment Guide

This guide provides step-by-step instructions to deploy the Draft Clinic document review application on AWS in a cost-effective manner.

## Architecture Overview

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   (CDN/HTTPS)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐         ┌────────▼────────┐
    │   S3 Bucket       │         │   ALB           │
    │   (Static Assets) │         │   (Load Balancer)│
    └───────────────────┘         └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │   ECS Fargate   │
                                  │   (Python App)  │
                                  └────────┬────────┘
                                           │
                         ┌─────────────────┼─────────────────┐
                         │                 │                 │
               ┌─────────▼───────┐ ┌───────▼───────┐ ┌──────▼──────┐
               │  RDS PostgreSQL │ │  S3 Uploads   │ │    SES      │
               │  (Database)     │ │  (Documents)  │ │  (Email)    │
               └─────────────────┘ └───────────────┘ └─────────────┘
```

## Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI installed and configured
- Docker installed locally
- Domain name (optional, but recommended)

## Cost Optimization Tips

1. **Use t3.micro/small instances** for RDS in development
2. **Enable Aurora Serverless v2** for production with auto-scaling
3. **Use Fargate Spot** for non-critical workloads (up to 70% savings)
4. **Set up lifecycle policies** for S3 to move old files to Glacier
5. **Use Reserved Instances** for predictable workloads

**Estimated Monthly Costs (Low Traffic):**
- ECS Fargate: $15-30/month
- RDS (db.t3.micro): $15-20/month
- S3: $1-5/month
- CloudFront: $1-10/month
- SES: $0.10/1000 emails
- **Total: ~$35-70/month**

## Step 1: Set Up VPC and Networking

```bash
# Create VPC with public and private subnets
aws cloudformation create-stack \
  --stack-name draft-clinic-vpc \
  --template-body file://infra/vpc.yaml \
  --capabilities CAPABILITY_IAM
```

Or use the default VPC for cost savings in development.

## Step 2: Create RDS PostgreSQL Database

```bash
# Create a parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name draft-clinic-pg \
  --db-parameter-group-family postgres15 \
  --description "Draft Clinic PostgreSQL params"

# Create the database instance
aws rds create-db-instance \
  --db-instance-identifier draft-clinic-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username draftclinic_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-name draftclinic \
  --backup-retention-period 7 \
  --storage-type gp3 \
  --no-publicly-accessible
```

**Cost-saving alternative: Aurora Serverless v2**
```bash
aws rds create-db-cluster \
  --db-cluster-identifier draft-clinic-aurora \
  --engine aurora-postgresql \
  --engine-mode provisioned \
  --engine-version 15.4 \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
  --master-username draftclinic_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --database-name draftclinic
```

## Step 3: Create S3 Buckets

```bash
# Bucket for document uploads
aws s3 mb s3://draft-clinic-uploads-ACCOUNT_ID --region us-east-1

# Bucket for static frontend assets
aws s3 mb s3://draft-clinic-static-ACCOUNT_ID --region us-east-1

# Enable versioning for uploads (data protection)
aws s3api put-bucket-versioning \
  --bucket draft-clinic-uploads-ACCOUNT_ID \
  --versioning-configuration Status=Enabled

# Set up lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration \
  --bucket draft-clinic-uploads-ACCOUNT_ID \
  --lifecycle-configuration file://infra/s3-lifecycle.json
```

### S3 Lifecycle Policy (infra/s3-lifecycle.json)
```json
{
  "Rules": [
    {
      "ID": "MoveToGlacierAfter90Days",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "completed/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "ID": "DeleteOldTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

## Step 4: Create ECR Repository and Push Docker Image

```bash
# Create ECR repository
aws ecr create-repository --repository-name draft-clinic-api

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push the Docker image
docker build -t draft-clinic-api ./backend
docker tag draft-clinic-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/draft-clinic-api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/draft-clinic-api:latest
```

## Step 5: Create ECS Cluster and Service

### Create Task Definition (infra/task-definition.json)
```json
{
  "family": "draft-clinic-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/draft-clinic-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:draft-clinic/database-url"
        },
        {
          "name": "SESSION_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:draft-clinic/session-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/draft-clinic",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name draft-clinic-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://infra/task-definition.json

# Create service
aws ecs create-service \
  --cluster draft-clinic-cluster \
  --service-name draft-clinic-api \
  --task-definition draft-clinic-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxx],securityGroups=[sg-xxxx],assignPublicIp=ENABLED}"
```

## Step 6: Set Up Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name draft-clinic-alb \
  --subnets subnet-xxxx subnet-yyyy \
  --security-groups sg-xxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name draft-clinic-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxx \
  --target-type ip \
  --health-check-path /api/pricing

# Create listener with HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

## Step 7: Set Up CloudFront Distribution

```bash
# Create CloudFront distribution for static assets
aws cloudfront create-distribution \
  --distribution-config file://infra/cloudfront-config.json
```

## Step 8: Configure SES for Transactional Emails

```bash
# Verify domain
aws ses verify-domain-identity --domain yourdomain.com

# Create email template
aws ses create-template --template file://infra/email-templates/job-completed.json
```

## Step 9: Set Up Secrets Manager

```bash
# Store database URL
aws secretsmanager create-secret \
  --name draft-clinic/database-url \
  --secret-string "postgresql://user:password@host:5432/draftclinic"

# Store session secret
aws secretsmanager create-secret \
  --name draft-clinic/session-secret \
  --secret-string "your-secure-session-secret"

# Store payment gateway keys
aws secretsmanager create-secret \
  --name draft-clinic/payment-keys \
  --secret-string '{"payfast_merchant_id":"...","payfast_merchant_key":"...","stripe_secret":"..."}'
```

## Step 10: Set Up CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: draft-clinic-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster draft-clinic-cluster \
            --service draft-clinic-api \
            --force-new-deployment
```

## Environment Variables

Set these environment variables in your ECS task definition or Secrets Manager:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| SESSION_SECRET | Secret for session encryption | random-32-char-string |
| AWS_S3_BUCKET | S3 bucket for uploads | draft-clinic-uploads |
| AWS_REGION | AWS region | us-east-1 |
| PAYFAST_MERCHANT_ID | PayFast merchant ID | 10000000 |
| PAYFAST_MERCHANT_KEY | PayFast merchant key | xxxxx |
| STRIPE_SECRET_KEY | Stripe secret key (optional) | sk_live_xxx |
| SES_FROM_EMAIL | Email sender address | noreply@draftclinic.com |

## Database Migrations

Run migrations after deployment:
```bash
# Connect to ECS task and run migrations
aws ecs execute-command \
  --cluster draft-clinic-cluster \
  --task TASK_ID \
  --container api \
  --interactive \
  --command "/bin/sh -c 'cd /app && alembic upgrade head'"
```

## Monitoring and Logging

1. **CloudWatch Logs**: All container logs are sent to CloudWatch
2. **CloudWatch Alarms**: Set up alarms for CPU, memory, and error rates
3. **X-Ray**: Enable for distributed tracing (optional)

```bash
# Create CloudWatch alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name draft-clinic-high-error-rate \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

## Security Checklist

- [ ] Enable VPC endpoints for S3 and ECR
- [ ] Use private subnets for ECS tasks
- [ ] Enable encryption at rest for RDS
- [ ] Enable encryption for S3 buckets
- [ ] Configure WAF rules for ALB
- [ ] Set up Security Hub for compliance monitoring
- [ ] Enable CloudTrail for audit logging
- [ ] Rotate secrets regularly using Secrets Manager

## Backup and Disaster Recovery

1. **RDS Automated Backups**: Enabled with 7-day retention
2. **S3 Versioning**: Enabled for document recovery
3. **Cross-region replication**: Optional for critical data

## Scaling Considerations

For higher traffic:
1. Increase ECS service desired count
2. Enable auto-scaling based on CPU/memory
3. Upgrade RDS instance size or use read replicas
4. Enable CloudFront caching for static assets
