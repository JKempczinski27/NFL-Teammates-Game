# NFL Teammates Game - Dashboard Setup Guide

## Overview

A comprehensive admin dashboard has been added to manage questions and player images for the NFL Teammates Game. This allows you to add, edit, and delete questions and images through a user-friendly interface instead of modifying code directly.

## Features

### Question Management
- **View all questions** in a searchable table
- **Add new questions** with multiple player images
- **Edit existing questions** including answer, difficulty, and players
- **Delete questions** that are no longer needed
- **Difficulty levels**: Easy, Medium, Hard
- **Categories**: Organize questions by type

### Image Management
- **Upload player images** via URL
- **Preview images** before saving
- **Edit player information** (name, position, team)
- **Delete unused images**
- **Validation**: Prevents deletion of images used in questions

## Setup Instructions

### 1. Database Initialization

The database must be initialized before using the dashboard. Run this command from the `backend` directory:

```bash
cd backend
npm run init-db
```

This will:
- Create all necessary database tables
- Set up indexes for performance
- Add sample data (if the database is empty)

### 2. Start the Backend Server

```bash
cd backend
npm start
```

The backend will run on port 8080 (or the PORT environment variable).

### 3. Start the Frontend

In a separate terminal:

```bash
cd nfl-teamates-game
npm start
```

The frontend will run on port 3000.

## Accessing the Dashboard

### Method 1: Floating Action Button
On the main game page, you'll see a blue floating action button in the bottom-right corner with a dashboard icon. Click it to navigate to the admin dashboard.

### Method 2: Direct URL
Navigate directly to: `http://localhost:3000/dashboard`

## Using the Dashboard

### Question Management Tab

#### Adding a New Question
1. Click "Add New Question" button
2. Fill in the answer (e.g., "Tom Brady")
3. Select difficulty level (Easy/Medium/Hard)
4. Optionally add a category (e.g., "Common Teammate")
5. Add player images:
   - Enter player name
   - Enter image URL (ESPN headshot URLs work well)
   - Click "Add Another Player" for more players (minimum 2 required)
6. Click "Create" to save

#### Editing a Question
1. Click the edit icon (pencil) on any question row
2. Modify any fields as needed
3. Click "Update" to save changes

#### Deleting a Question
1. Click the delete icon (trash) on any question row
2. Confirm the deletion in the popup dialog

### Image Management Tab

#### Adding a New Image
1. Click "Add New Image" button
2. Fill in player name (required)
3. Enter image URL (required)
4. Preview the image to verify it loads correctly
5. Optionally add position and team
6. Click "Add" to save

#### Editing an Image
1. Click the edit icon on any image card
2. Modify the information as needed
3. Preview updates in real-time
4. Click "Update" to save

#### Deleting an Image
1. Click the delete icon on any image card
2. Note: Images used in questions cannot be deleted
3. Confirm the deletion in the popup dialog

## Database Schema

### Tables Created

- **players**: Stores player information and image URLs
- **questions**: Stores game questions with answers and metadata
- **question_players**: Junction table linking questions to players
- **player_updated**: Tracking/analytics table for events

### Key Features
- Automatic timestamp tracking (created_at, updated_at)
- Foreign key constraints for data integrity
- Unique constraints to prevent duplicates
- Indexes for fast queries

## API Endpoints

### Questions API
- `GET /api/questions` - List all questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Images API
- `GET /api/images` - List all images
- `GET /api/images/:id` - Get single image
- `POST /api/images` - Add new image
- `PUT /api/images/:id` - Update image
- `DELETE /api/images/:id` - Delete image

## File Structure

```
nfl-teamates-game/
├── src/
│   ├── pages/
│   │   ├── GamePage.js          # Main game component
│   │   └── Dashboard.js         # Admin dashboard with tabs
│   ├── components/
│   │   ├── QuestionManager.js   # Question CRUD interface
│   │   └── ImageManager.js      # Image CRUD interface
│   └── App.js                   # Router setup
├── backend/
│   ├── routes/
│   │   ├── questions.js         # Question API routes
│   │   └── images.js            # Image API routes
│   ├── schema.sql               # Database schema
│   ├── initDatabase.js          # DB initialization script
│   └── index.js                 # Express server
└── DASHBOARD_SETUP.md           # This file
```

## Tips & Best Practices

### For Questions
- Use clear, concise answers
- Set appropriate difficulty levels to match the obscurity of connections
- Use high-quality images from ESPN's CDN when possible
- Test questions in the game before making them live

### For Images
- Use ESPN headshot URLs for consistency:
  - Format: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/[PLAYER_ID].png`
- Include position and team for better organization
- Preview images before saving to catch broken links
- Keep player names consistent across questions

### Performance
- The dashboard uses optimistic UI updates for a smooth experience
- All API calls include error handling with user-friendly messages
- Database indexes ensure fast queries even with many questions

## Troubleshooting

### Dashboard doesn't load
- Verify the backend is running (`npm start` in backend directory)
- Check that port 8080 is not blocked
- Verify database connection in backend `.env` file

### Can't add questions
- Ensure database is initialized (`npm run init-db`)
- Check backend logs for errors
- Verify at least 2 player images are provided

### Images not displaying
- Verify the image URL is accessible
- Check for CORS issues (ESPN URLs should work)
- Try a different image URL

### Database connection errors
- Verify `DATABASE_URL` is set correctly in backend `.env`
- Check Railway database is accessible
- Ensure SSL is configured properly

## Future Enhancements

Potential improvements for future development:
- Bulk import questions from CSV/JSON
- Image upload to cloud storage (Cloudinary, S3)
- Search and filter functionality
- Question preview before saving
- User authentication for admin access
- Statistics dashboard (popular questions, usage analytics)
- Drag-and-drop image upload

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for error details
3. Verify all dependencies are installed
4. Ensure database schema is up to date

---

**Note**: This dashboard is designed for admin use. Consider adding authentication before deploying to production to prevent unauthorized access to the management interface.
