# Setup Scripts

This directory contains automated setup scripts for the NFL Teammates Game project.

## Available Scripts

### setup-s3.sh

Automated S3 bucket setup script that:
- Creates an S3 bucket in your AWS account
- Configures bucket settings (versioning, CORS, public access blocking)
- Creates an IAM user with minimal required permissions
- Generates access keys
- Updates the backend .env file automatically

**Prerequisites:**
- AWS CLI installed and configured
- AWS account with permissions to create S3 buckets and IAM users

**Usage:**
```bash
./scripts/setup-s3.sh
```

Follow the interactive prompts to complete the setup.

**Alternative:**
If you prefer manual setup or don't have AWS CLI, follow the detailed guide in `S3_SETUP_MANUAL.md`

## After Running Setup

1. Review the updated `nfl-teamates-game/backend/.env` file
2. Ensure all credentials are correct
3. Start the backend: `cd nfl-teamates-game/backend && npm start`
4. Test the connection: `curl http://localhost:8080/api/s3/test -H "x-api-key: YOUR_API_KEY"`
5. Access the dashboard: http://localhost:3000/admin/s3

## Troubleshooting

If the script fails:
1. Check AWS CLI is installed: `aws --version`
2. Verify AWS CLI is configured: `aws sts get-caller-identity`
3. Ensure you have necessary AWS permissions
4. Try manual setup using `S3_SETUP_MANUAL.md`

## Security Notes

- The script creates an IAM user with minimal required permissions
- Access keys are displayed only once - save them securely
- The script automatically adds credentials to your .env file
- Never commit the .env file to version control (it's gitignored)
- Rotate credentials regularly for production use
