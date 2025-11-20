# S3 Pipeline Guide - Consolidated Backend

Complete guide for setting up and using the S3 storage pipeline in the consolidated NFL Games backend.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [API Endpoints](#api-endpoints)
5. [File Organization](#file-organization)
6. [Usage Examples](#usage-examples)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The consolidated backend provides a complete S3 file management pipeline for all three NFL games:
- **NFL Teammates Game**
- **Journeyman**
- **NFL Trivia**

### Features

- ✅ Secure file uploads (single & multiple)
- ✅ Pre-signed URLs for secure downloads
- ✅ File listing with filtering
- ✅ File deletion (single & bulk)
- ✅ Bucket statistics and metrics
- ✅ File metadata retrieval
- ✅ Game-specific folder organization
- ✅ Authentication required for all operations
- ✅ 50MB file size limit
- ✅ Automatic content-type detection

---

## Architecture

```
┌─────────────────┐
│  Game Frontends │
│  (3 games)      │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│ Consolidated    │
│ Backend         │
│ /api/s3/*       │
└────────┬────────┘
         │
         │ AWS SDK v3
         ▼
┌─────────────────┐
│  AWS S3 Bucket  │
│                 │
│  /teammates/    │
│  /journeyman/   │
│  /trivia/       │
│  /shared/       │
└─────────────────┘
```

### Components

- **Backend**: `backend/`
  - `config/s3.js` - S3 client configuration
  - `routes/s3-management.js` - API endpoints
  - `middleware/auth.js` - Authentication
- **S3 Bucket**: Organized by game type
- **Authentication**: Admin API key required for all operations

---

## Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://nfl-games-uploads --region us-east-1

# Set bucket policy for private access
aws s3api put-bucket-policy --bucket nfl-games-uploads --policy file://bucket-policy.json
```

**bucket-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nfl-games-uploads/*",
        "arn:aws:s3:::nfl-games-uploads"
      ]
    }
  ]
}
```

### 2. Create IAM User

```bash
# Create IAM user
aws iam create-user --user-name nfl-games-s3-user

# Attach S3 policy
aws iam attach-user-policy \
  --user-name nfl-games-s3-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name nfl-games-s3-user
```

Save the `AccessKeyId` and `SecretAccessKey` from the output.

### 3. Configure Environment Variables

Add to your deployment platform (Railway/Render):

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=nfl-games-uploads
ADMIN_API_KEY=your-secure-admin-key
```

**Railway**:
```bash
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=YOUR_KEY
railway variables set AWS_SECRET_ACCESS_KEY=YOUR_SECRET
railway variables set S3_BUCKET_NAME=nfl-games-uploads
```

**Render**:
1. Dashboard → Service → Environment
2. Add each variable above

### 4. Verify Connection

```bash
curl -H "x-admin-token: your-admin-key" \
  https://your-api.railway.app/api/s3/test
```

Expected response:
```json
{
  "success": true,
  "message": "All S3 connection tests passed",
  "details": {
    "tests": {
      "credentials": { "status": "passed" },
      "bucketName": { "status": "passed" },
      "bucketAccess": { "status": "passed" },
      "listOperation": { "status": "passed" }
    }
  }
}
```

---

## API Endpoints

All endpoints require authentication via `x-admin-token` header.

### Authentication

```bash
curl -H "x-admin-token: YOUR_ADMIN_KEY" \
  https://your-api.railway.app/api/s3/...
```

### 1. Test Connection

```http
GET /api/s3/test
```

Tests S3 credentials, bucket access, and permissions.

**Response**:
```json
{
  "success": true,
  "message": "All S3 connection tests passed",
  "details": {
    "timestamp": "2025-01-20T10:30:00.000Z",
    "bucketName": "nfl-games-uploads",
    "region": "us-east-1",
    "tests": {...}
  }
}
```

### 2. Upload Single File

```http
POST /api/s3/upload
Content-Type: multipart/form-data

file: [binary file data]
folder: teammates (optional)
```

**Example (curl)**:
```bash
curl -X POST \
  -H "x-admin-token: YOUR_KEY" \
  -F "file=@player-image.jpg" \
  -F "folder=teammates" \
  https://your-api.railway.app/api/s3/upload
```

**Response**:
```json
{
  "message": "File uploaded successfully",
  "key": "teammates/player-image.jpg",
  "size": 245678,
  "url": "https://nfl-games-uploads.s3.amazonaws.com/..."
}
```

### 3. Upload Multiple Files

```http
POST /api/s3/upload-multiple
Content-Type: multipart/form-data

files: [array of files, max 10]
folder: journeyman (optional)
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('folder', 'journeyman');

const response = await fetch('https://your-api.railway.app/api/s3/upload-multiple', {
  method: 'POST',
  headers: {
    'x-admin-token': 'YOUR_KEY'
  },
  body: formData
});
```

**Response**:
```json
{
  "message": "2 files uploaded successfully",
  "files": [
    {
      "key": "journeyman/image1.jpg",
      "size": 123456,
      "url": "https://..."
    },
    {
      "key": "journeyman/image2.jpg",
      "size": 234567,
      "url": "https://..."
    }
  ]
}
```

### 4. List Files

```http
GET /api/s3/files?prefix=teammates&maxKeys=100
```

**Query Parameters**:
- `prefix` (optional): Filter files by folder/prefix
- `maxKeys` (optional): Maximum files to return (default: 1000)

**Response**:
```json
{
  "files": [
    {
      "key": "teammates/player1.jpg",
      "size": 245678,
      "lastModified": "2025-01-20T10:00:00.000Z",
      "url": "https://... (presigned URL, valid 1 hour)"
    }
  ],
  "count": 15,
  "isTruncated": false
}
```

### 5. Delete Single File

```http
DELETE /api/s3/files/teammates/player1.jpg
```

**Response**:
```json
{
  "message": "File deleted successfully",
  "key": "teammates/player1.jpg"
}
```

### 6. Delete Multiple Files

```http
POST /api/s3/delete-multiple
Content-Type: application/json

{
  "keys": [
    "teammates/old-image1.jpg",
    "teammates/old-image2.jpg"
  ]
}
```

**Response**:
```json
{
  "message": "2 files deleted successfully",
  "deleted": [
    { "Key": "teammates/old-image1.jpg" },
    { "Key": "teammates/old-image2.jpg" }
  ],
  "errors": []
}
```

### 7. Get File Metadata

```http
GET /api/s3/files/teammates/player1.jpg/metadata
```

**Response**:
```json
{
  "key": "teammates/player1.jpg",
  "size": 245678,
  "sizeFormatted": "240.02 KB",
  "contentType": "image/jpeg",
  "lastModified": "2025-01-20T10:00:00.000Z",
  "metadata": {},
  "etag": "\"abc123def456\""
}
```

### 8. Get Bucket Statistics

```http
GET /api/s3/stats
```

**Response**:
```json
{
  "bucketName": "nfl-games-uploads",
  "totalFiles": 1543,
  "totalSize": 524288000,
  "totalSizeFormatted": "500 MB",
  "fileTypes": {
    "jpg": 850,
    "png": 450,
    "gif": 150,
    "mp4": 93
  }
}
```

---

## File Organization

### Recommended Folder Structure

```
s3://nfl-games-uploads/
├── teammates/          # NFL Teammates Game assets
│   ├── players/        # Player images
│   ├── teams/          # Team logos
│   └── badges/         # Achievement badges
│
├── journeyman/         # Journeyman Game assets
│   ├── players/
│   ├── teams/
│   └── routes/         # Career path visualizations
│
├── trivia/             # NFL Trivia Game assets
│   ├── questions/      # Question images
│   ├── categories/     # Category icons
│   └── rewards/        # Reward graphics
│
└── shared/             # Shared across all games
    ├── backgrounds/
    ├── ui-elements/
    └── fonts/
```

### Naming Conventions

```bash
# Player images
teammates/players/tom-brady-2024.jpg

# Team logos
shared/teams/patriots-logo.png

# Question assets
trivia/questions/q12345-image.jpg

# Timestamped uploads
journeyman/players/player-{timestamp}-{uuid}.jpg
```

---

## Usage Examples

### Frontend Integration

**React Component (NFL Teammates)**:
```javascript
import React, { useState } from 'react';

const ImageUploader = () => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'teammates/players');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/s3/upload`,
        {
          method: 'POST',
          headers: {
            'x-admin-token': process.env.REACT_APP_ADMIN_KEY
          },
          body: formData
        }
      );

      const data = await response.json();
      console.log('Uploaded:', data.url);

      // Store URL in your state/database
      setPlayerImageUrl(data.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
};
```

**JavaScript (Vanilla)**:
```javascript
async function uploadToS3(file, folder = 'teammates') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('https://your-api.railway.app/api/s3/upload', {
    method: 'POST',
    headers: {
      'x-admin-token': 'YOUR_ADMIN_KEY'
    },
    body: formData
  });

  return await response.json();
}

// Usage
const fileInput = document.querySelector('#file-input');
const file = fileInput.files[0];
const result = await uploadToS3(file, 'teammates/players');
console.log('File URL:', result.url);
```

### Node.js Backend-to-Backend

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFileFromServer(filePath, folder) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('folder', folder);

  const response = await fetch('https://your-api.railway.app/api/s3/upload', {
    method: 'POST',
    headers: {
      'x-admin-token': process.env.ADMIN_API_KEY,
      ...form.getHeaders()
    },
    body: form
  });

  return await response.json();
}

// Usage
const result = await uploadFileFromServer(
  './generated-badge.png',
  'teammates/badges'
);
```

---

## Security

### Authentication

All S3 endpoints require authentication:

```javascript
headers: {
  'x-admin-token': 'YOUR_SECURE_ADMIN_KEY'
}
```

**Generate a secure admin key**:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

### File Size Limits

- **Max file size**: 50MB per file
- **Max files per batch**: 10 files

To change limits, edit `backend/routes/s3-management.js`:
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Change this value
  },
});
```

### CORS Configuration

Update `backend/index.js` to allow frontend domains:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://nfl-teammates.vercel.app',
    'https://journeyman-game.vercel.app',
    'https://nfl-trivia.vercel.app'
  ],
  credentials: true
}));
```

### Presigned URLs

All file URLs are presigned with 1-hour expiration for security:
```javascript
const url = await getSignedUrl(s3Client, getCommand, {
  expiresIn: 3600 // 1 hour
});
```

To change expiration time, edit `backend/routes/s3-management.js`.

---

## Troubleshooting

### Connection Test Failures

**Problem**: `AWS credentials not configured`

**Solution**:
```bash
# Verify environment variables are set
railway run env | grep AWS

# Set missing variables
railway variables set AWS_ACCESS_KEY_ID=YOUR_KEY
railway variables set AWS_SECRET_ACCESS_KEY=YOUR_SECRET
```

---

**Problem**: `Cannot access S3 bucket`

**Solution**:
1. Verify bucket exists:
   ```bash
   aws s3 ls s3://nfl-games-uploads
   ```

2. Check IAM permissions:
   ```bash
   aws iam get-user-policy --user-name nfl-games-s3-user --policy-name S3Access
   ```

3. Verify bucket region matches `AWS_REGION` env var

---

**Problem**: `Upload fails with 403 Forbidden`

**Solution**:
1. Check IAM user has `s3:PutObject` permission
2. Verify bucket policy allows uploads
3. Check bucket is not in different AWS account

---

### File Upload Issues

**Problem**: File upload times out

**Solution**:
1. Check file size < 50MB
2. Increase timeout in Railway/Render settings
3. Use multipart upload for large files

---

**Problem**: `x-admin-token required`

**Solution**:
Include admin token in request headers:
```javascript
headers: {
  'x-admin-token': process.env.ADMIN_API_KEY
}
```

---

**Problem**: Files not appearing in bucket

**Solution**:
1. Check response from upload endpoint
2. Verify file key in AWS console
3. List files via API: `GET /api/s3/files`

---

### Performance Issues

**Problem**: Slow file listings

**Solution**:
1. Use `prefix` parameter to filter:
   ```
   GET /api/s3/files?prefix=teammates/
   ```

2. Reduce `maxKeys`:
   ```
   GET /api/s3/files?maxKeys=50
   ```

3. Implement pagination in frontend

---

### Bucket Statistics

**Problem**: Stats endpoint times out

**Solution**:
The stats endpoint iterates all files. For large buckets (>10,000 files):
1. Run stats during off-peak hours
2. Implement caching:
   ```javascript
   // Cache stats for 1 hour
   const cachedStats = await redis.get('bucket:stats');
   if (cachedStats) return JSON.parse(cachedStats);
   ```

---

## Cost Optimization

### S3 Pricing (as of 2025)

- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09 per GB

### Estimated Costs

**Low traffic** (100 uploads/day, 1,000 downloads/day):
- Storage: 10GB = $0.23/month
- PUT: 3,000/month = $0.015/month
- GET: 30,000/month = $0.012/month
- Transfer: 5GB = $0.45/month
- **Total**: ~$0.70/month

**Medium traffic** (1,000 uploads/day, 10,000 downloads/day):
- Storage: 100GB = $2.30/month
- PUT: 30,000/month = $0.15/month
- GET: 300,000/month = $0.12/month
- Transfer: 50GB = $4.50/month
- **Total**: ~$7.10/month

### Cost Reduction Tips

1. **Use CloudFront CDN** for frequently accessed files
2. **Implement lifecycle policies** to delete old files
3. **Compress images** before upload
4. **Use S3 Intelligent-Tiering** for infrequent access files

---

## Next Steps

1. ✅ Set up S3 bucket and IAM user
2. ✅ Configure environment variables
3. ✅ Test connection via `/api/s3/test`
4. ✅ Upload test file via `/api/s3/upload`
5. 📊 Integrate with game frontends
6. 🎯 Set up CloudFront CDN (optional)
7. 📈 Monitor usage in AWS console

---

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Multer Documentation](https://github.com/expressjs/multer)
- Backend API: `backend/routes/s3-management.js`
- S3 Config: `backend/config/s3.js`

---

**Questions or Issues?**

Check the backend logs:
```bash
railway logs -f
```

Or open an issue on GitHub.
