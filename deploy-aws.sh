#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Set variables
AWS_REGION="us-east-1"  # Change to your preferred region
ECR_BACKEND_REPO="stock-tracker-backend"
ECR_FRONTEND_REPO="stock-tracker-frontend"
APP_NAME="stock-tracker"
ENV_NAME="stock-tracker-env"

echo "🔄 Deploying Stock Tracker application to AWS..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get AWS account ID. Make sure you're authenticated with AWS CLI."
    exit 1
fi

# Create ECR repositories if they don't exist
aws ecr describe-repositories --repository-names $ECR_BACKEND_REPO $ECR_FRONTEND_REPO --region $AWS_REGION &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔄 Creating ECR repositories..."
    aws ecr create-repository --repository-name $ECR_BACKEND_REPO --region $AWS_REGION
    aws ecr create-repository --repository-name $ECR_FRONTEND_REPO --region $AWS_REGION
fi

# Log in to ECR
echo "🔄 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend image
echo "🔄 Building and pushing backend image..."
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest

# Build and push frontend image
echo "🔄 Building and pushing frontend image..."
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest

# Check if Elastic Beanstalk application exists
aws elasticbeanstalk describe-applications --application-names $APP_NAME &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔄 Creating Elastic Beanstalk application..."
    aws elasticbeanstalk create-application --application-name $APP_NAME
fi

# Check if Elastic Beanstalk environment exists
aws elasticbeanstalk describe-environments --application-name $APP_NAME --environment-names $ENV_NAME &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔄 Creating Elastic Beanstalk environment..."
    # Generate docker-compose file with AWS variables
    export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
    export AWS_REGION=$AWS_REGION
    export DATABASE_URL="postgresql://postgres:sgdsg09659@${DB_ENDPOINT}:5432/postgres"
    export JWT_SECRET="stocktracker-secure-jwt-secret-for-auth"
    envsubst < docker-compose.aws.yml > docker-compose-deploy.yml
    
    # Create environment
    aws elasticbeanstalk create-environment \
        --application-name $APP_NAME \
        --environment-name $ENV_NAME \
        --solution-stack-name "64bit Amazon Linux 2 v3.7.4 running Docker" \
        --option-settings file://aws-config.json
else
    echo "🔄 Updating Elastic Beanstalk environment..."
    # Generate docker-compose file with AWS variables
    export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
    export AWS_REGION=$AWS_REGION
    export DATABASE_URL="postgresql://postgres:sgdsg09659@${DB_ENDPOINT}:5432/postgres"
    export JWT_SECRET="stocktracker-secure-jwt-secret-for-auth"
    envsubst < docker-compose.aws.yml > docker-compose-deploy.yml
    
    # Create a new application version
    VERSION_LABEL=$(date +%Y%m%d%H%M%S)
    aws elasticbeanstalk create-application-version \
        --application-name $APP_NAME \
        --version-label $VERSION_LABEL \
        --source-bundle S3Bucket=elasticbeanstalk-$AWS_REGION-$AWS_ACCOUNT_ID,S3Key=docker-compose-deploy.yml
    
    # Update environment
    aws elasticbeanstalk update-environment \
        --application-name $APP_NAME \
        --environment-name $ENV_NAME \
        --version-label $VERSION_LABEL
fi

echo "✅ Stock Tracker application deployed successfully to AWS!"
echo "📊 Check the Elastic Beanstalk console for the application URL and status." 