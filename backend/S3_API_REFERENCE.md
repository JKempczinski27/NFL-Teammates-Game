# S3 API Quick Reference

Quick reference for all S3 endpoints in the consolidated backend.

## Authentication

All endpoints require admin authentication:

```bash
-H "x-admin-token: YOUR_ADMIN_KEY"
```

---

## General Endpoints

### Test Connection
```http
GET /api/s3/test
```
Tests S3 credentials and bucket access.

### List All Files
```http
GET /api/s3/files?prefix=teammates&maxKeys=100
```

### Upload Single File
```http
POST /api/s3/upload
Content-Type: multipart/form-data

file: [file]
folder: teammates (optional)
```

### Upload Multiple Files
```http
POST /api/s3/upload-multiple
Content-Type: multipart/form-data

files: [file array, max 10]
folder: journeyman (optional)
```

### Delete File
```http
DELETE /api/s3/files/teammates/player.jpg
```

### Delete Multiple Files
```http
POST /api/s3/delete-multiple
Content-Type: application/json

{
  "keys": ["teammates/file1.jpg", "trivia/file2.png"]
}
```

### Get File Metadata
```http
GET /api/s3/files/teammates/player.jpg/metadata
```

### Get Bucket Statistics
```http
GET /api/s3/stats
```

---

## Game-Specific Endpoints

### Upload Player Image
```http
POST /api/s3/upload-player
Content-Type: multipart/form-data

file: [image file]
playerName: Tom Brady
gameType: teammates|journeyman|trivia
```

**Response:**
```json
{
  "message": "Player image uploaded successfully",
  "key": "teammates/players/1640995200000-tom-brady.jpg",
  "size": 245678,
  "url": "https://...",
  "playerName": "Tom Brady",
  "gameType": "teammates"
}
```

### Upload Team Logo
```http
POST /api/s3/upload-team
Content-Type: multipart/form-data

file: [PNG or SVG]
teamName: New England Patriots
gameType: teammates|journeyman|trivia
```

**Response:**
```json
{
  "message": "Team logo uploaded successfully",
  "key": "teammates/teams/new-england-patriots-logo.png",
  "size": 12345,
  "url": "https://...",
  "teamName": "New England Patriots",
  "gameType": "teammates"
}
```

### Upload Question Image (Trivia)
```http
POST /api/s3/upload-question
Content-Type: multipart/form-data

file: [JPEG or PNG]
questionId: 12345
```

**Response:**
```json
{
  "message": "Question image uploaded successfully",
  "key": "trivia/questions/q12345-image.jpg",
  "size": 98765,
  "url": "https://...",
  "questionId": "12345"
}
```

### Upload Badge/Achievement
```http
POST /api/s3/upload-badge
Content-Type: multipart/form-data

file: [PNG]
badgeName: First Win
gameType: teammates|journeyman|trivia
```

**Response:**
```json
{
  "message": "Badge uploaded successfully",
  "key": "teammates/badges/first-win.png",
  "size": 5432,
  "url": "https://...",
  "badgeName": "First Win",
  "gameType": "teammates"
}
```

### List Files by Game
```http
GET /api/s3/files/:gameType?category=players&maxKeys=50
```

**Example:**
```bash
GET /api/s3/files/teammates?category=players&maxKeys=20
```

**Response:**
```json
{
  "gameType": "teammates",
  "category": "players",
  "files": [
    {
      "key": "teammates/players/player1.jpg",
      "size": 123456,
      "lastModified": "2025-01-20T10:00:00.000Z",
      "url": "https://..."
    }
  ],
  "count": 15,
  "isTruncated": false
}
```

### Get Stats by Game
```http
GET /api/s3/stats/:gameType
```

**Example:**
```bash
GET /api/s3/stats/teammates
```

**Response:**
```json
{
  "gameType": "teammates",
  "totalFiles": 150,
  "totalSize": 52428800,
  "totalSizeFormatted": "50 MB",
  "fileTypes": {
    "jpg": 85,
    "png": 45,
    "gif": 20
  },
  "categoryCounts": {
    "players": 85,
    "teams": 32,
    "badges": 25,
    "backgrounds": 8
  }
}
```

---

## Game Types

- `teammates` - NFL Teammates Game
- `journeyman` - Journeyman Game
- `trivia` - NFL Trivia Game
- `shared` - Shared across all games

---

## Asset Categories

### Teammates
- `players` - Player images
- `teams` - Team logos
- `badges` - Achievement badges
- `backgrounds` - Background images
- `ui-elements` - UI assets

### Journeyman
- `players` - Player images
- `teams` - Team logos
- `routes` - Career route visualizations
- `badges` - Achievement badges
- `backgrounds` - Background images

### Trivia
- `questions` - Question images
- `categories` - Category icons
- `rewards` - Reward graphics
- `backgrounds` - Background images
- `ui-elements` - UI assets

### Shared
- `backgrounds` - Shared backgrounds
- `ui-elements` - Shared UI elements
- `fonts` - Font files
- `icons` - Icon sets
- `templates` - Template assets

---

## cURL Examples

### Upload Player Image
```bash
curl -X POST \
  -H "x-admin-token: YOUR_KEY" \
  -F "file=@tom-brady.jpg" \
  -F "playerName=Tom Brady" \
  -F "gameType=teammates" \
  https://your-api.railway.app/api/s3/upload-player
```

### Upload Team Logo
```bash
curl -X POST \
  -H "x-admin-token: YOUR_KEY" \
  -F "file=@patriots-logo.png" \
  -F "teamName=New England Patriots" \
  -F "gameType=teammates" \
  https://your-api.railway.app/api/s3/upload-team
```

### List Teammates Players
```bash
curl -H "x-admin-token: YOUR_KEY" \
  "https://your-api.railway.app/api/s3/files/teammates?category=players"
```

### Get Trivia Game Stats
```bash
curl -H "x-admin-token: YOUR_KEY" \
  https://your-api.railway.app/api/s3/stats/trivia
```

### Delete File
```bash
curl -X DELETE \
  -H "x-admin-token: YOUR_KEY" \
  https://your-api.railway.app/api/s3/files/teammates/players/old-image.jpg
```

---

## JavaScript Examples

### Upload Player Image
```javascript
const formData = new FormData();
formData.append('file', playerImageFile);
formData.append('playerName', 'Tom Brady');
formData.append('gameType', 'teammates');

const response = await fetch(`${API_URL}/api/s3/upload-player`, {
  method: 'POST',
  headers: {
    'x-admin-token': process.env.ADMIN_KEY
  },
  body: formData
});

const data = await response.json();
console.log('Player image URL:', data.url);
```

### List Files
```javascript
const response = await fetch(
  `${API_URL}/api/s3/files/teammates?category=players&maxKeys=50`,
  {
    headers: {
      'x-admin-token': process.env.ADMIN_KEY
    }
  }
);

const { files } = await response.json();
files.forEach(file => {
  console.log(`${file.key}: ${file.url}`);
});
```

### Get Stats
```javascript
const response = await fetch(`${API_URL}/api/s3/stats/teammates`, {
  headers: {
    'x-admin-token': process.env.ADMIN_KEY
  }
});

const stats = await response.json();
console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total size: ${stats.totalSizeFormatted}`);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "playerName and gameType are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Admin API key required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to upload file",
  "details": "Connection timeout"
}
```

---

## File Size & Type Limits

- **Max file size**: 50MB
- **Max files per batch**: 10
- **Accepted image types**: JPEG, PNG, WebP, GIF, SVG
- **Accepted video types**: MP4, WebM
- **Accepted document types**: PDF

### Specific Restrictions

- **Player images**: JPEG, PNG, WebP only
- **Team logos**: PNG, SVG only
- **Badges**: PNG only
- **Question images**: JPEG, PNG only

---

## Notes

- All URLs are presigned with 1-hour expiration
- File names are automatically sanitized (lowercase, hyphens, no special chars)
- Player images include timestamp prefix to prevent overwriting
- Team logos and badges use consistent naming (e.g., `team-name-logo.png`)

---

For complete documentation, see [S3_PIPELINE_GUIDE.md](../S3_PIPELINE_GUIDE.md)
