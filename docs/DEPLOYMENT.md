# AWS Deployment Guide

## Prerequisites

1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   aws configure
   ```
3. **Node.js**: Install Node.js 18+ and npm
4. **Serverless Framework**: Install globally
   ```bash
   npm install -g serverless
   ```

## Step-by-Step Deployment

### 1. Clone and Setup

```bash
git clone https://github.com/Lumina-Oz-Dev/matchmaking-as-a-service.git
cd matchmaking-as-a-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your AWS settings:
```
AWS_REGION=us-east-1
AWS_PROFILE=default
STAGE=dev
```

### 3. Deploy to AWS

#### Development Environment
```bash
npm run deploy
```

#### Production Environment
```bash
npm run deploy:prod
```

### 4. Initialize Database

```bash
npm run setup-db
```

This creates sample data for testing.

### 5. Verify Deployment

After deployment, you'll see output like:
```
Service Information
service: matchmaking-as-a-service
stage: dev
region: us-east-1
stack: matchmaking-as-a-service-dev
api keys:
  None
endpoints:
  POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/players/register
  GET - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/players/{playerId}
  ...
websocket:
  wss://yyyyy.execute-api.us-east-1.amazonaws.com/dev
```

Save these URLs for API testing.

## Post-Deployment Configuration

### 1. API Gateway Throttling

1. Go to AWS Console > API Gateway
2. Select your API
3. Go to Usage Plans
4. Create a usage plan with:
   - Rate: 100 requests per second
   - Burst: 200 requests

### 2. DynamoDB Auto-scaling

1. Go to DynamoDB console
2. For each table, configure auto-scaling:
   - Read capacity: Min 5, Max 100
   - Write capacity: Min 5, Max 100
   - Target utilization: 70%

### 3. CloudWatch Alarms

Create alarms for:
- Lambda errors > 1% error rate
- DynamoDB throttling
- SQS message age > 5 minutes
- API Gateway 4xx/5xx errors

### 4. Enable X-Ray Tracing

```yaml
# Add to serverless.yml provider section
tracing:
  lambda: true
  apiGateway: true
```

## Monitoring

### CloudWatch Dashboard

Create a dashboard with:
- Lambda invocations and errors
- API Gateway requests
- DynamoDB read/write capacity
- SQS messages processed
- WebSocket connections

### Cost Monitoring

Set up AWS Budgets:
1. Go to AWS Budgets
2. Create budget for $100/month
3. Set alerts at 50%, 80%, 100%

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check AWS credentials
   - Verify IAM permissions
   - Check CloudFormation stack events

2. **Lambda Timeouts**
   - Increase timeout in serverless.yml
   - Check DynamoDB capacity
   - Review CloudWatch logs

3. **WebSocket Connection Issues**
   - Verify WebSocket endpoint
   - Check CORS settings
   - Review connection handler logs

### Debug Commands

```bash
# View logs
serverless logs -f functionName -t

# Test locally
serverless offline

# Remove stack
serverless remove
```

## Security Best Practices

1. **API Keys**: Implement API key authentication
2. **IAM Roles**: Use least privilege principle
3. **VPC**: Deploy in VPC for production
4. **Encryption**: Enable encryption at rest for DynamoDB
5. **Secrets**: Use AWS Secrets Manager for sensitive data

## Scaling Considerations

### Current Limits
- 1000 concurrent Lambda executions
- 10,000 DynamoDB read/write units
- 1000 WebSocket connections

### To Scale Higher
1. Request AWS limit increases
2. Implement caching with ElastiCache
3. Use DynamoDB Global Tables for multi-region
4. Implement API Gateway caching
5. Consider AWS GameLift for game server management