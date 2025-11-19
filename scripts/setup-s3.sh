#!/bin/bash

# S3 Bucket Setup Script for NFL Teammates Game
# This script helps you set up an S3 bucket for the management dashboard

set -e

echo "========================================"
echo "S3 Bucket Setup for NFL Teammates Game"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed.${NC}"
    echo ""
    echo "Please install AWS CLI first:"
    echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo ""
    echo "Or set up S3 manually following the instructions in S3_SETUP_MANUAL.md"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS CLI is not configured.${NC}"
    echo ""
    echo "Please configure AWS CLI first:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI is installed and configured${NC}"
echo ""

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"
echo ""

# Prompt for bucket name
read -p "Enter a unique bucket name (e.g., nfl-teammates-game-assets-$ACCOUNT_ID): " BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Bucket name cannot be empty${NC}"
    exit 1
fi

# Prompt for region
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "Creating S3 bucket: $BUCKET_NAME in region: $AWS_REGION"
echo ""

# Create the bucket
if [ "$AWS_REGION" == "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
fi

echo -e "${GREEN}✓ S3 bucket created successfully${NC}"

# Enable versioning (recommended)
read -p "Enable versioning for this bucket? (y/n, default: y): " ENABLE_VERSIONING
ENABLE_VERSIONING=${ENABLE_VERSIONING:-y}

if [ "$ENABLE_VERSIONING" == "y" ]; then
    aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    echo -e "${GREEN}✓ Versioning enabled${NC}"
fi

# Block public access (recommended)
read -p "Block all public access? (y/n, default: y): " BLOCK_PUBLIC
BLOCK_PUBLIC=${BLOCK_PUBLIC:-y}

if [ "$BLOCK_PUBLIC" == "y" ]; then
    aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    echo -e "${GREEN}✓ Public access blocked${NC}"
fi

# Configure CORS for the bucket
echo ""
echo "Configuring CORS for web access..."

cat > /tmp/cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/cors-config.json
rm /tmp/cors-config.json

echo -e "${GREEN}✓ CORS configured${NC}"

# Create IAM user for the application
echo ""
read -p "Create a dedicated IAM user for this application? (y/n, default: y): " CREATE_IAM
CREATE_IAM=${CREATE_IAM:-y}

if [ "$CREATE_IAM" == "y" ]; then
    IAM_USER_NAME="nfl-teammates-s3-user"

    echo "Creating IAM user: $IAM_USER_NAME"

    # Create IAM user
    aws iam create-user --user-name "$IAM_USER_NAME" || echo "User may already exist"

    # Create and attach policy
    POLICY_NAME="nfl-teammates-s3-policy"

    cat > /tmp/iam-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::${BUCKET_NAME}",
        "arn:aws:s3:::${BUCKET_NAME}/*"
      ]
    }
  ]
}
EOF

    POLICY_ARN=$(aws iam create-policy --policy-name "$POLICY_NAME" \
        --policy-document file:///tmp/iam-policy.json \
        --query 'Policy.Arn' --output text 2>/dev/null || \
        aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)

    rm /tmp/iam-policy.json

    # Attach policy to user
    aws iam attach-user-policy --user-name "$IAM_USER_NAME" --policy-arn "$POLICY_ARN"

    echo -e "${GREEN}✓ IAM user created and policy attached${NC}"

    # Create access keys
    echo ""
    echo "Creating access keys for $IAM_USER_NAME..."

    CREDENTIALS=$(aws iam create-access-key --user-name "$IAM_USER_NAME")
    ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)

    echo -e "${GREEN}✓ Access keys created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
    echo "Access Key ID: $ACCESS_KEY_ID"
    echo "Secret Access Key: $SECRET_ACCESS_KEY"
    echo ""
else
    # Use current credentials
    ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
    SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)

    if [ -z "$ACCESS_KEY_ID" ]; then
        echo -e "${YELLOW}Warning: Could not retrieve current AWS credentials${NC}"
        echo "You'll need to manually add AWS credentials to your .env file"
    fi
fi

# Update .env file
echo ""
echo "Updating backend/.env file..."

ENV_FILE="nfl-teamates-game/backend/.env"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup"
    echo "Backed up existing .env to .env.backup"
fi

# Add AWS configuration to .env
cat >> "$ENV_FILE" <<EOF

# AWS S3 Configuration (added by setup script)
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
S3_BUCKET_NAME=$BUCKET_NAME

# Admin API Key (change this to a secure random string)
ADMIN_API_KEY=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE-ME-$(date +%s)")
EOF

echo -e "${GREEN}✓ .env file updated${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Your S3 bucket is ready to use:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $AWS_REGION"
echo ""
echo "Next steps:"
echo "  1. Review and update nfl-teamates-game/backend/.env"
echo "  2. Change the ADMIN_API_KEY to a secure value"
echo "  3. Start your backend: cd nfl-teamates-game/backend && npm start"
echo "  4. Start your frontend: cd nfl-teamates-game && npm start"
echo "  5. Access dashboard at: http://localhost:3000/admin/s3"
echo ""
echo "Test S3 connection:"
echo "  curl http://localhost:8080/api/s3/test -H 'x-api-key: YOUR_API_KEY'"
echo ""
