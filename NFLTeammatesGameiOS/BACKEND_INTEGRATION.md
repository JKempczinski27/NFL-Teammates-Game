# Backend Integration Guide

This document explains how the iOS app integrates with the same backend monitoring system as the desktop version.

## Overview

The iOS app uses **identical backend endpoints** and **event tracking** as the web version, ensuring consistent data collection across platforms.

## Backend URL

```
Production: https://nfl-teammates-game-production.up.railway.app
Database: PostgreSQL on Railway.app
```

## Session Management

### Web Version (JavaScript)
```javascript
function getSessionId() {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
  }
  return id;
}
```

### iOS Version (Swift)
```swift
private init() {
    if let existingSessionId = UserDefaults.standard.string(forKey: "sessionId") {
        self.sessionId = existingSessionId
    } else {
        self.sessionId = UUID().uuidString
        UserDefaults.standard.set(self.sessionId, forKey: "sessionId")
    }
}
```

**Result**: Both platforms generate and persist a UUID-based session ID.

## Event Tracking

### Web Version (JavaScript)
```javascript
async function trackEvent(eventType, eventData) {
  await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      eventData,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
    }),
  });
}

// Track an answer
trackEvent('answer', {
  questionIndex: 0,
  userAnswer: 'Julian Edelman',
  isCorrect: true,
  attemptsLeft: 3
});
```

### iOS Version (Swift)
```swift
func trackEvent(eventType: String, eventData: EventData) async {
    let event = TrackingEvent(
        eventType: eventType,
        eventData: eventData,
        sessionId: sessionId,
        timestamp: ISO8601DateFormatter().string(from: Date())
    )
    await sendTrackingEvent(event)
}

// Track an answer
await EventTrackingService.shared.trackAnswer(
    questionIndex: 0,
    userAnswer: "Julian Edelman",
    isCorrect: true,
    attemptsLeft: 3
)
```

## API Endpoints Comparison

### 1. Event Tracking
**Endpoint**: `POST /api/track`

**Web Request**:
```javascript
fetch('https://nfl-teammates-game-production.up.railway.app/api/track', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'answer',
    eventData: { questionIndex: 0, userAnswer: 'Tom Brady', isCorrect: false, attemptsLeft: 2 },
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: '2025-11-18T10:30:00Z'
  })
})
```

**iOS Request**:
```swift
var request = URLRequest(url: URL(string: "\(baseURL)/api/track")!)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

let event = TrackingEvent(
    eventType: "answer",
    eventData: EventData(questionIndex: 0, userAnswer: "Tom Brady", isCorrect: false, attemptsLeft: 2),
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: "2025-11-18T10:30:00Z"
)

request.httpBody = try JSONEncoder().encode(event)
let (data, response) = try await URLSession.shared.data(for: request)
```

**Backend Handler** (Node.js):
```javascript
router.post('/track', (req, res) => {
  const { eventType, eventData, sessionId, timestamp } = req.body;
  console.log('Event tracked:', { eventType, eventData, sessionId, timestamp });

  // Future: Store in player_updated table
  // await pool.query('INSERT INTO player_updated (session_id, event_type, event_data, timestamp) VALUES ($1, $2, $3, $4)',
  //   [sessionId, eventType, eventData, timestamp]);

  res.json({ status: 'success' });
});
```

### 2. Player Submission
**Endpoint**: `POST /api/player`

**Web**:
```javascript
fetch('/api/player', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(),
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'Kansas City Chiefs',
    yearsActive: '2017-present'
  })
})
```

**iOS**:
```swift
let submission = PlayerSubmission(
    sessionId: EventTrackingService.shared.getSessionId(),
    name: "Patrick Mahomes",
    position: "QB",
    team: "Kansas City Chiefs",
    yearsActive: "2017-present"
)

try await APIClient.shared.submitPlayerInfo(submission: submission)
```

### 3. Database Test
**Endpoint**: `GET /api/db-test`

Both platforms can call this to verify backend connectivity:

**Web**:
```javascript
const response = await fetch('/api/db-test');
const result = await response.json();
console.log(result); // { status: 'connected', message: 'Database connection successful' }
```

**iOS**:
```swift
let result = try await APIClient.shared.testDatabase()
print(result) // ["status": "connected", "message": "Database connection successful"]
```

## Event Types

| Event Type | Triggered When | Data Fields |
|-----------|----------------|-------------|
| `answer` | User submits an answer | `questionIndex`, `userAnswer`, `isCorrect`, `attemptsLeft` |
| `share` | User shares score | `platform` (twitter, facebook, etc.) |

## Data Schema

### Event Tracking Payload
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
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Database Table (Planned)
```sql
CREATE TABLE player_updated (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Web Version
```javascript
try {
  await trackEvent('answer', eventData);
} catch (error) {
  console.error('Failed to track event:', error);
  // Continue game even if tracking fails
}
```

### iOS Version
```swift
do {
    await trackEvent(eventType: "answer", eventData: eventData)
} catch {
    print("❌ Failed to track event: \(error)")
    // Continue game even if tracking fails
}
```

**Philosophy**: Both versions implement fire-and-forget tracking. Tracking failures should not disrupt gameplay.

## Testing Backend Integration

### Test Checklist

1. **Session ID Persistence**
   - [ ] Launch app, note session ID
   - [ ] Close and reopen app
   - [ ] Verify same session ID is used

2. **Event Tracking**
   - [ ] Answer a question
   - [ ] Check backend logs for event
   - [ ] Verify correct data structure

3. **Social Sharing**
   - [ ] Share score on platform
   - [ ] Check backend logs for share event
   - [ ] Verify platform name is correct

4. **API Connectivity**
   - [ ] Test in airplane mode (should fail gracefully)
   - [ ] Test with slow network
   - [ ] Verify timeout handling

### Debug Logging

Enable verbose logging in iOS:

```swift
// In EventTrackingService.swift
private func sendTrackingEvent(_ event: TrackingEvent) async {
    print("📤 Sending event: \(event.eventType)")
    print("   Session: \(event.sessionId)")
    print("   Data: \(event.eventData)")

    // ... send request ...

    if (200...299).contains(httpResponse.statusCode) {
        print("✅ Event tracked successfully")
    } else {
        print("⚠️ Event tracking failed: \(httpResponse.statusCode)")
    }
}
```

## Platform-Specific Considerations

### iOS Network Security

The iOS app requires `NSAppTransportSecurity` configuration to allow HTTPS connections:

```xml
<!-- Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**Note**: In production, use `NSExceptionDomains` instead to only allow specific hosts.

### Background Requests

iOS may suspend background network requests. Current implementation:
- Events are tracked during active gameplay only
- Session ID persists across app launches
- No background sync required

## Monitoring Dashboard

To view events from both platforms:

```sql
-- View all events
SELECT * FROM player_updated ORDER BY timestamp DESC;

-- Events by platform (when implemented)
SELECT
    session_id,
    event_type,
    event_data->>'platform' as platform,
    COUNT(*) as event_count
FROM player_updated
GROUP BY session_id, event_type, platform;

-- iOS vs Web sessions (distinguish by user agent or add platform field)
SELECT
    session_id,
    event_data->>'userAgent' as platform,
    COUNT(*) as total_events
FROM player_updated
GROUP BY session_id, platform;
```

## Future Enhancements

1. **Platform Identification**: Add `platform: 'iOS'` to event data
2. **Offline Queue**: Store events locally when offline, sync when connected
3. **Analytics SDK**: Integrate Firebase or similar for advanced analytics
4. **Real-time Sync**: WebSocket connection for live leaderboards
5. **Event Batching**: Send multiple events in single request for efficiency

## Conclusion

The iOS app maintains **100% compatibility** with the existing backend monitoring system. All event tracking, session management, and API communication work identically to the web version, ensuring consistent data collection across platforms.
