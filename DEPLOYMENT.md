# Stock Tracker Deployment Guide

This guide provides instructions for deploying the Stock Tracker application using Docker Compose and AWS.

## Prerequisites

- Docker and Docker Compose installed
- AWS CLI installed and configured with appropriate credentials
- Git installed
- Node.js and npm installed (for local development)

## Project Structure

The Stock Tracker application consists of:

- Frontend: React application
- Backend: Node.js Express API
- Database: PostgreSQL

## Local Deployment with Docker Compose

To deploy the application locally using Docker Compose:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Stock-Tracker
   ```

2. Run the deployment script:
   ```
   # On Linux/Mac
   chmod +x deploy-local.sh
   ./deploy-local.sh
   
   # On Windows
   .\deploy-local.sh
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5001

4. Verify the API is working:
   ```
   curl http://localhost:5001/api/ping
   ```

5. Stop the application:
   ```
   docker-compose down
   ```

## Troubleshooting Backend Connection Issues

If you see "This site can't be reached" or "connection refused" when trying to access the backend:

1. **Check the database connection**:
   - Make sure your `backend/database.env` file has the correct database URL:
     ```
     DATABASE_URL=postgresql://postgres:sgdsg09659@postgres:5432/postgres
     ```
   - Note that the hostname should be `postgres` (the service name), not `localhost`.

2. **Run the troubleshooting script**:
   ```
   # On Linux/Mac
   chmod +x troubleshoot.sh
   ./troubleshoot.sh
   
   # On Windows
   .\troubleshoot.sh
   ```

3. **Check Docker container logs**:
   ```
   docker-compose logs backend
   ```

4. **Common fixes**:
   - Make sure no other application is using port 5001
   - Try stopping all containers and rebuilding:
     ```
     docker-compose down
     docker-compose up -d --build
     ```
   - If PostgreSQL connection fails, try:
     ```
     docker-compose down -v  # This will remove volumes
     docker-compose up -d
     ```

5. **Windows-specific issues**:
   - Check Windows Defender Firewall settings
   - Try running Docker Desktop as Administrator
   - Enable required Docker features in Windows

## AWS Deployment Options

### Option 1: AWS Elastic Beanstalk with Docker Compose

This method uses AWS Elastic Beanstalk to deploy both the frontend and backend services using Docker Compose.

1. Deploy using the provided script:
   ```
   chmod +x deploy-aws.sh
   ./deploy-aws.sh
   ```

2. The script will:
   - Create ECR repositories for frontend and backend images
   - Build and push Docker images to ECR
   - Create/update Elastic Beanstalk application and environment
   - Deploy the application

3. Once deployed, access your application at the URL provided by Elastic Beanstalk.

### Option 2: Manual Deployment to AWS Elastic Container Service (ECS)

For a more advanced setup with Amazon ECS:

1. Create an Amazon RDS PostgreSQL database

2. Create ECR repositories for your images:
   ```
   aws ecr create-repository --repository-name stock-tracker-backend
   aws ecr create-repository --repository-name stock-tracker-frontend
   ```

3. Build and push Docker images:
   ```
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and push backend
   docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/stock-tracker-backend:latest ./backend
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/stock-tracker-backend:latest

   # Build and push frontend
   docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/stock-tracker-frontend:latest .
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/stock-tracker-frontend:latest
   ```

4. Create an ECS cluster, task definitions, and services for both frontend and backend.

5. Set up a load balancer to route traffic to your services.

### Option 3: GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to AWS when you push to the main branch.

To use this workflow:

1. Set up the following GitHub repository secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. Push changes to the main branch to trigger the deployment.

## Environment Variables

The following environment variables are used:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Backend server port (default: 5001)
- `JWT_SECRET`: Secret key for JWT authentication

## Troubleshooting

- **Docker Compose Issues**: Check container logs with `docker-compose logs`
- **AWS Deployment Issues**: Check Elastic Beanstalk logs or CloudWatch logs
- **Database Connection Issues**: Verify RDS security group settings allow connections from your EC2 instances

## Gold Tier Implementation

For Gold Tier, the deployment uses Docker Compose with Amazon ECS:

1. The application is containerized with Docker
2. Containers are deployed to Amazon ECS
3. Web server front-end container connects to backend API container
4. API container connects to RDS PostgreSQL database
5. Environment variables are used for configuration

This setup provides automatic scaling, high availability, and easier maintenance through container orchestration. 