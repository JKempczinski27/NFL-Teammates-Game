# S3 Bucket Management Dashboard

This document provides setup instructions for the S3 bucket management dashboard added to the NFL Teammates Game project.

## Features

The S3 dashboard provides the following functionality:

- **File Management**
  - Upload single or multiple files
  - List all files in the bucket with metadata
  - Delete files individually or in bulk
  - Download/view files via presigned URLs
  - Organize files in folders

- **Statistics**
  - Total file count
  - Total storage size
  - File type distribution
  - Bucket information

- **Security**
  - API key authentication
  - Protected admin routes
  - Secure presigned URLs (1-hour expiration)

## Prerequisites

1. **AWS Account** with S3 access
2. **IAM User** with the following permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`
   - `s3:HeadObject`

3. **S3 Bucket** created and configured

## Backend Setup

### 1. Environment Variables

Copy the example environment file and configure your settings:

```bash
cd nfl-teamates-game/backend
cp .env.example .env
```

Edit `.env` and add the following required variables:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your-bucket-name

# Admin Authentication
ADMIN_API_KEY=your-secure-api-key-here
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Generate a strong random string for `ADMIN_API_KEY`
- Use IAM user credentials with minimal required permissions
- Consider using AWS IAM roles for production deployment

### 2. Install Dependencies

The required dependencies are already installed:

```bash
cd nfl-teamates-game/backend
npm install
```

Dependencies added:
- `@aws-sdk/client-s3` - AWS SDK for S3 operations
- `@aws-sdk/s3-request-presigner` - Generate presigned URLs
- `multer` - Handle file uploads

### 3. Start the Backend

```bash
cd nfl-teamates-game/backend
npm start
```

The backend will run on port 8080 (or the port specified in your .env file).

## Frontend Setup

### 1. Environment Variables (Optional)

If your backend API is hosted on a different domain than the frontend, create a `.env` file in the frontend directory:

```bash
cd nfl-teamates-game
echo "REACT_APP_API_URL=https://your-backend-url.com" > .env
```

For local development, the proxy configuration in `package.json` will handle API requests.

### 2. Install Dependencies

Dependencies are already installed:

```bash
cd nfl-teamates-game
npm install
```

Dependencies added:
- `react-router-dom` - Client-side routing
- `axios` - HTTP client
- `@mui/icons-material` - Material-UI icons

### 3. Start the Frontend

```bash
cd nfl-teamates-game
npm start
```

The application will open at http://localhost:3000

## Using the Dashboard

### Access the Dashboard

1. Navigate to http://localhost:3000/admin/s3 (or your deployed URL)
2. Enter your Admin API Key (the value of `ADMIN_API_KEY` from your backend .env)
3. The API key is stored in your browser's localStorage for convenience

### Upload Files

1. Click the "Upload Files" button
2. (Optional) Enter a folder path (e.g., `images/players`)
3. Click "Select Files" and choose one or more files
4. Click "Upload"

### Manage Files

- **View/Download**: Click the download icon next to any file
- **Delete Single File**: Click the delete icon next to the file
- **Delete Multiple Files**:
  1. Select files using checkboxes
  2. Click "Delete Selected" button
- **Refresh**: Click the "Refresh" button to reload the file list

### View Statistics

The dashboard displays:
- Total number of files
- Total storage size (formatted)
- Bucket name
- File type distribution

## API Endpoints

All S3 management endpoints require the `x-api-key` header.

### Authentication

```http
x-api-key: your-admin-api-key
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/s3/files` | GET | List all files in bucket |
| `/api/s3/upload` | POST | Upload single file |
| `/api/s3/upload-multiple` | POST | Upload multiple files |
| `/api/s3/files/:key` | DELETE | Delete a file |
| `/api/s3/delete-multiple` | POST | Delete multiple files |
| `/api/s3/stats` | GET | Get bucket statistics |
| `/api/s3/files/:key/metadata` | GET | Get file metadata |

### Example: Upload File

```bash
curl -X POST http://localhost:8080/api/s3/upload \
  -H "x-api-key: your-admin-api-key" \
  -F "file=@path/to/file.jpg" \
  -F "folder=images"
```

### Example: List Files

```bash
curl http://localhost:8080/api/s3/files \
  -H "x-api-key: your-admin-api-key"
```

### Example: Delete File

```bash
curl -X DELETE http://localhost:8080/api/s3/files/images/player.jpg \
  -H "x-api-key: your-admin-api-key"
```

## Deployment

### Railway Deployment

The project is already configured for Railway deployment. Add the following environment variables to your Railway project:

1. Go to your Railway project dashboard
2. Navigate to Variables
3. Add:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `ADMIN_API_KEY`
   - `DATABASE_URL` (if not already set)

### Production Considerations

1. **CORS Configuration**: Update CORS settings in `backend/index.js` to whitelist only your frontend domain
2. **HTTPS**: Ensure your backend uses HTTPS in production
3. **API Key Rotation**: Regularly rotate your admin API key
4. **File Size Limits**: Current limit is 50MB per file (configurable in `backend/routes/s3-management.js`)
5. **Rate Limiting**: Consider adding rate limiting middleware for production
6. **Bucket Policy**: Configure S3 bucket policies to restrict access
7. **CloudFront**: Consider using CloudFront for better file delivery performance

## Architecture

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
│                 │
│  - Game UI      │
│  - S3 Dashboard │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │ (with API Key)
         │
┌────────▼────────┐
│  Express API    │
│   (Backend)     │
│                 │
│  - Auth MW      │
│  - S3 Routes    │
└────────┬────────┘
         │
         │ AWS SDK
         │
┌────────▼────────┐
│   AWS S3        │
│   (Storage)     │
│                 │
│  - Files        │
│  - Objects      │
└─────────────────┘
```

## File Structure

```
nfl-teamates-game/
├── backend/
│   ├── config/
│   │   └── s3.js                 # S3 client configuration
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── track.js              # Event tracking
│   │   └── s3-management.js      # S3 management routes
│   ├── index.js                  # Main server file
│   ├── .env                      # Environment variables (gitignored)
│   └── .env.example              # Environment template
├── src/
│   ├── App.js                    # Main game component
│   ├── AppRouter.js              # Routing configuration
│   ├── S3Dashboard.js            # S3 management dashboard
│   └── index.js                  # React entry point
└── S3_DASHBOARD_SETUP.md         # This file
```

## Troubleshooting

### Cannot connect to S3

1. Verify AWS credentials in `.env`
2. Check IAM user permissions
3. Ensure S3 bucket exists and is accessible
4. Verify AWS region matches bucket region

### "Invalid API key" error

1. Check `ADMIN_API_KEY` in backend `.env`
2. Ensure the same key is entered in the dashboard
3. Clear browser localStorage and re-enter the key

### Files not uploading

1. Check file size (current limit: 50MB)
2. Verify S3 bucket has sufficient space
3. Check browser console for errors
4. Verify bucket CORS configuration if uploading from different domain

### CORS errors

Update CORS configuration in `backend/index.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

## Security Best Practices

1. **Never expose AWS credentials** in client-side code
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Implement rate limiting** on upload endpoints
5. **Validate file types** before upload
6. **Scan files for malware** in production
7. **Use bucket policies** to restrict public access
8. **Enable S3 versioning** for important data
9. **Configure bucket logging** for audit trails
10. **Use IAM roles** instead of access keys when possible

## Future Enhancements

Potential improvements for the dashboard:

- [ ] JWT-based authentication instead of API keys
- [ ] User roles and permissions (admin, viewer, uploader)
- [ ] File preview for images and PDFs
- [ ] Search and filter functionality
- [ ] Batch operations (move, rename)
- [ ] Usage analytics and charts
- [ ] File metadata editing
- [ ] CDN integration
- [ ] Automatic image optimization
- [ ] Scheduled backups

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console for frontend errors
4. Verify AWS CloudWatch logs for S3 operations

## License

This dashboard is part of the NFL Teammates Game project.
