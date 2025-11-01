# Real-Time Athlete Monitoring Dashboard

A production-ready web dashboard for real-time monitoring of athlete health and exercise data from an ESP32-based monitoring system with MPU6050 (motion) and MAX30102 (health) sensors.

## Features

- **Real-Time Data Display**: Live updates of heart rate, SpO2, exercise count, and posture status
- **WebSocket Integration**: Robust connection with auto-reconnect and exponential backoff
- **Interactive Charts**: Real-time line charts for Heart Rate and SpO2 trends using Chart.js
- **Data Persistence**: Local storage of session data with export functionality (JSON/CSV)
- **Responsive Design**: Mobile-first design that works on all devices
- **Color-Coded Alerts**: Visual indicators for normal, warning, and critical health values
- **Connection Management**: Visual connection status and quality indicators

## Project Structure

```
sensors_realtime_monitoring/
├── index.html          # Main dashboard HTML structure
├── css/
│   └── dashboard.css   # Responsive stylesheet with athletic theme
├── js/
│   ├── websocket.js    # WebSocket connection manager
│   ├── charts.js       # Chart.js initialization and updates
│   ├── storage.js      # LocalStorage and export functionality
│   └── dashboard.js    # Main application controller
└── README.md           # This file
```

## Hardware Requirements

### ESP32 Setup
Your ESP32 device should send JSON data via WebSocket with the following structure:

```json
{
  "heartRate": 72,
  "spO2": 97,
  "squatCount": 15,
  "postureStatus": "GOOD",
  "fingerDetected": true,
  "fallDetected": false
}
```

### WebSocket Server
- The ESP32 should host a WebSocket server
- Default port: 81
- Default URL format: `ws://192.168.x.x:81`
- Update frequency: 400-500ms recommended

## Setup Instructions

### 1. Local Development

1. **Clone or Download** this repository to your local machine

2. **Open the Dashboard**:
   - Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
   - Or use a local web server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (if you have http-server installed)
     npx http-server
     ```
   - Navigate to `http://localhost:8000` in your browser

3. **Configure WebSocket URL**:
   - Enter your ESP32's IP address and port in the WebSocket URL field
   - Default: `ws://192.168.1.100:81`
   - Click "Connect" to establish connection

### 2. ESP32 Configuration

Ensure your ESP32 is:
- Connected to the same WiFi network as your computer
- Running a WebSocket server on the specified port (default: 81)
- Sending data in the exact JSON format specified above

### 3. Network Requirements

- Both ESP32 and web browser must be on the same local network
- If accessing from mobile device, ensure it's on the same WiFi network
- For remote access, you'll need to set up port forwarding or use a cloud relay

## Usage Guide

### Connecting to ESP32

1. **Enter WebSocket URL**: 
   - Format: `ws://[ESP32_IP_ADDRESS]:[PORT]`
   - Example: `ws://192.168.1.100:81`

2. **Click "Connect"**: 
   - Connection status will change to "Connecting..."
   - When connected, status indicator turns green
   - Data will start flowing automatically

3. **Monitor Connection**:
   - Green indicator = Connected
   - Yellow indicator = Connecting
   - Red indicator = Disconnected/Error
   - Connection quality shows latency status

### Dashboard Sections

#### Health Metrics
- **Heart Rate (BPM)**: 
  - Normal: 60-100 BPM (Green)
  - Elevated: 101-120 BPM (Yellow)
  - High: 121+ BPM (Red)
  - Trend arrows show increasing/decreasing rate

- **SpO2 (%)**:
  - Normal: 95-100% (Green)
  - Low: 90-94% (Yellow)
  - Critical: <90% (Red)

#### Exercise Tracking
- **Squat Count**: Real-time counter with progress visualization
- **Posture Status**: 
  - ✓ GOOD (Green)
  - ⚠ BAD (Yellow)
  - 🚨 FALL (Red)

#### Real-Time Charts
- **Heart Rate Trend**: Line chart showing last 2 minutes (120 data points)
- **SpO2 Trend**: Line chart showing last 2 minutes
- **Pause/Resume**: Freeze charts to examine specific time periods

#### System Status
- **Finger Detection**: Shows if finger is on MAX30102 sensor
- **Fall Detection**: Alerts when fall is detected (with banner notification)
- **Connection Quality**: Real-time latency indicator
- **Data Points**: Total readings received in current session

#### Controls
- **Export JSON**: Download complete session data as JSON file
- **Export CSV**: Download data in spreadsheet-compatible format
- **Clear History**: Reset all stored data and charts (with confirmation)

## Color Coding Standards

### Health Values

**Heart Rate:**
- 🟢 Green: 60-100 BPM (Normal)
- 🟡 Yellow: 101-120 BPM (Elevated)
- 🔴 Red: 121+ BPM (High)

**SpO2:**
- 🟢 Green: 95-100% (Normal)
- 🟡 Yellow: 90-94% (Low)
- 🔴 Red: <90% (Critical)

**Posture:**
- 🟢 ✓ GOOD (Normal posture)
- 🟡 ⚠ BAD (Poor posture)
- 🔴 🚨 FALL (Fall detected)

## Data Export

### JSON Export
- Complete session data including all readings
- Metadata: session start time, total readings, export timestamp
- Format: Pretty-printed JSON for easy reading

### CSV Export
- Spreadsheet-compatible format
- Headers: Timestamp, Date, Heart Rate, SpO2, Squat Count, Posture Status, Finger Detected, Fall Detected
- Can be opened in Excel, Google Sheets, or any spreadsheet application

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to ESP32
- **Solution**: 
  - Verify ESP32 IP address (check serial monitor)
  - Ensure ESP32 and computer are on same WiFi network
  - Check firewall settings
  - Verify WebSocket port is correct

**Problem**: Connection keeps dropping
- **Solution**:
  - Check WiFi signal strength
  - Verify ESP32 WebSocket server is stable
  - Check for network interference
  - Dashboard will auto-reconnect automatically

**Problem**: No data displaying
- **Solution**:
  - Verify ESP32 is sending data in correct JSON format
  - Check browser console for errors (F12)
  - Ensure WebSocket connection is established (green indicator)

### Performance Issues

**Problem**: Charts lagging or freezing
- **Solution**:
  - Click "Pause" button if too much data
  - Clear history periodically
  - Check browser performance (close other tabs)

**Problem**: Browser storage full
- **Solution**:
  - Export and clear history
  - Dashboard automatically limits to 1000 readings
  - Clear browser cache if needed

## Customization

### Changing WebSocket Default URL
Edit `js/websocket.js`:
```javascript
constructor(url = 'ws://YOUR_IP:YOUR_PORT') {
```

### Adjusting Chart Time Window
Edit `js/charts.js`:
```javascript
this.maxDataPoints = 120; // Change to desired number of points
```

### Modifying Color Schemes
Edit `css/dashboard.css` CSS variables:
```css
:root {
    --color-primary: #3b82f6;
    --color-success: #10b981;
    /* ... */
}
```

### Changing Health Thresholds
Edit `js/dashboard.js` in `updateHeartRate()` and `updateSpO2()` methods.

## Technical Details

### Data Storage
- Uses browser localStorage API
- Maximum 1000 readings stored per session
- Automatic cleanup when limit reached
- Data persists across page refreshes

### WebSocket Reconnection
- Exponential backoff: 1s, 2s, 4s, 8s, max 30s
- Automatic reconnection on disconnect
- Manual disconnect prevents auto-reconnect

### Chart Updates
- Updates every 400-500ms (based on ESP32 update frequency)
- Rolling window: keeps last 120 data points (2 minutes)
- Smooth animations disabled for real-time performance
- Color changes based on health value ranges

## License

This project is provided as-is for use with ESP32 athlete monitoring systems.

## Support

For issues related to:
- **Dashboard**: Check browser console (F12) for errors
- **ESP32 Connection**: Verify hardware setup and network configuration
- **Data Format**: Ensure JSON structure matches specification exactly

## Future Enhancements

Potential improvements:
- Historical data viewing beyond current session
- Multiple athlete profiles
- Customizable alert thresholds
- Data visualization for exercise patterns
- Integration with cloud storage
- Real-time notifications
- Multi-device support

---

**Version**: 1.0.0  
**Last Updated**: 2024

