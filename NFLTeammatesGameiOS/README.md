# NFL Teammates Game - iOS Version

An iOS game where players guess the common NFL teammate that connects three different players. This is the native iOS version of the NFL Teammates web game, using the same backend API and monitoring system.

## Features

- **Identical Game Logic**: Same quiz mechanics as the desktop/web version
- **Backend Integration**: Uses the same PostgreSQL database and API endpoints
- **Event Tracking**: Integrated with the same monitoring system via `/api/track` endpoint
- **Session Management**: Persistent session tracking using UserDefaults (equivalent to localStorage)
- **Social Sharing**: Share your scores on Twitter, Facebook, and other platforms
- **SwiftUI Interface**: Modern iOS UI with native components
- **Async/Await**: Modern Swift concurrency for network requests

## Architecture

### Models
- **Player.swift**: Player data structure matching the backend schema
- **EventTracking.swift**: Event tracking models for backend monitoring

### Services
- **APIClient.swift**: Handles all backend API communication
- **EventTrackingService.swift**: Manages event tracking and session management

### ViewModels
- **GameViewModel.swift**: Game state management and business logic

### Views
- **ContentView.swift**: Main app container
- **GameView.swift**: Active game interface
- **GameOverView.swift**: Score summary and sharing
- **PlayerImageView.swift**: Async image loading for player photos
- **ShareSheet.swift**: Native iOS sharing functionality

## Backend Integration

### API Endpoints Used
All endpoints point to: `https://nfl-teammates-game-production.up.railway.app`

- `GET /` - Health check
- `GET /api/db-test` - Database connection test
- `POST /api/track` - Event tracking (answers, shares)
- `POST /api/player` - Submit player information
- `GET /api/getPlayers` - Fetch player list
- `POST /api/addPlayer` - Add new player

### Event Tracking
The iOS app uses the **same event tracking system** as the desktop version:

```swift
// Session ID stored in UserDefaults (equivalent to localStorage)
let sessionId = UserDefaults.standard.string(forKey: "sessionId") ?? UUID().uuidString

// Track answer events
await EventTrackingService.shared.trackAnswer(
    questionIndex: 0,
    userAnswer: "Julian Edelman",
    isCorrect: true,
    attemptsLeft: 3
)

// Track social shares
await EventTrackingService.shared.trackShare(platform: "twitter")
```

### Event Data Structure
```json
{
  "eventType": "answer",
  "eventData": {
    "questionIndex": 0,
    "userAnswer": "Julian Edelman",
    "isCorrect": true,
    "attemptsLeft": 3
  },
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

## Setup Instructions

### Prerequisites
- macOS 13.0 or later
- Xcode 15.0 or later
- iOS 17.0+ deployment target
- Active internet connection (for backend API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JKempczinski27/NFL-Teammates-Game.git
   cd NFL-Teammates-Game/NFLTeammatesGameiOS
   ```

2. **Open in Xcode**
   ```bash
   open NFLTeammatesGameiOS.xcodeproj
   ```

   **Note**: If you don't have an `.xcodeproj` file yet, you'll need to create one:
   - Open Xcode
   - File → New → Project
   - Choose "iOS" → "App"
   - Product Name: `NFLTeammatesGameiOS`
   - Interface: SwiftUI
   - Language: Swift
   - Bundle Identifier: `com.yourname.NFLTeammatesGameiOS`
   - Save in the `NFLTeammatesGameiOS` directory
   - Add all Swift files to the project

3. **Configure the project**
   - Select your development team in Signing & Capabilities
   - Ensure deployment target is set to iOS 17.0+
   - Build Settings → Enable "Require Only App-Extension-Safe API" = NO

4. **Build and Run**
   - Select a simulator or physical device
   - Press `Cmd + R` to build and run
   - The app will connect to the production backend automatically

### Testing Backend Connection

The app includes built-in API testing. To verify:

```swift
// In your test code or debugging
Task {
    do {
        let result = try await APIClient.shared.testConnection()
        print("✅ Backend connected: \(result)")
    } catch {
        print("❌ Backend error: \(error)")
    }
}
```

## Project Structure

```
NFLTeammatesGameiOS/
├── NFLTeammatesGameiOS/
│   ├── Models/
│   │   ├── Player.swift              # Data models
│   │   └── EventTracking.swift       # Tracking models
│   ├── Services/
│   │   ├── APIClient.swift           # Backend API client
│   │   └── EventTrackingService.swift # Event tracking
│   ├── ViewModels/
│   │   └── GameViewModel.swift       # Game state management
│   ├── Views/
│   │   ├── ContentView.swift         # Main container
│   │   ├── GameView.swift            # Game interface
│   │   ├── GameOverView.swift        # Results screen
│   │   ├── PlayerImageView.swift     # Player image component
│   │   └── ShareSheet.swift          # Share functionality
│   ├── Resources/
│   │   └── Assets.xcassets/          # Images and assets
│   ├── NFLTeammatesGameiOSApp.swift  # App entry point
│   └── Info.plist                     # App configuration
├── README.md
└── .gitignore
```

## Key Differences from Web Version

| Feature | Web Version | iOS Version |
|---------|------------|-------------|
| **Framework** | React + Material-UI | SwiftUI |
| **Session Storage** | localStorage | UserDefaults |
| **HTTP Client** | fetch API | URLSession |
| **Image Loading** | `<img>` tags | AsyncImage / URLSession |
| **Routing** | React Router | NavigationView |
| **State Management** | React hooks | @StateObject / @ObservedObject |
| **Social Sharing** | Web Share API | UIActivityViewController |

## Backend Monitoring

Both versions use the **identical backend monitoring system**:

1. **Session Tracking**: Unique UUID per user
2. **Event Types**:
   - `answer`: User submits an answer
   - `share`: User shares their score
3. **Data Persistence**: Events logged to PostgreSQL database
4. **Analytics**: Same data available for both platforms

## Development

### Adding New Questions

Questions are currently hardcoded in `GameViewModel.swift`. To add more:

```swift
var questions: [Question] = [
    Question(
        id: 3,
        clues: [
            Player(id: 9, name: "Player 1", ...),
            Player(id: 10, name: "Player 2", ...),
            Player(id: 11, name: "Player 3", ...)
        ],
        answer: Player(id: 12, name: "Common Player", ...),
        difficulty: "medium",
        category: "Category Name"
    )
]
```

**Future Enhancement**: Load questions from backend API instead of hardcoding.

### Customizing UI

The app uses the same color scheme as the web version:
- Background: `Color(red: 0.87, green: 0.72, blue: 0.53)` (brown/tan)
- Correct Answer: Green
- Incorrect (1-3): Blue
- Final Wrong: Red

Modify colors in `GameViewModel.swift` → `getAnswerColor(for:)`

### Backend Configuration

To change the backend URL, update both files:
- `Services/APIClient.swift`
- `Services/EventTrackingService.swift`

```swift
private let baseURL = "https://your-backend-url.com"
```

## Troubleshooting

### Images Not Loading
- Ensure `NSAppTransportSecurity` is configured in `Info.plist`
- Check internet connection
- Verify ESPN image URLs are accessible

### Events Not Tracking
- Check backend URL is correct
- Verify `/api/track` endpoint is responding
- Check Xcode console for error messages
- Test with: `await EventTrackingService.shared.trackEvent(...)`

### Build Errors
- Clean build folder: `Cmd + Shift + K`
- Delete derived data: `Cmd + Shift + Alt + K`
- Ensure deployment target matches (iOS 17.0+)
- Check all Swift files are added to target

## Future Enhancements

- [ ] Load questions dynamically from backend API
- [ ] Add leaderboard functionality
- [ ] Implement user accounts and persistent stats
- [ ] Add difficulty levels
- [ ] Support for offline play with cached data
- [ ] iPad-optimized layout
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] Localization for multiple languages

## License

This project is part of the NFL Teammates Game. See the main repository for license information.

## Contact

For issues or questions about the iOS version, please open an issue on the GitHub repository.
