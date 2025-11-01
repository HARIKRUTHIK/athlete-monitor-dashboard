# Troubleshooting ESP32 WebSocket Connection

## Common Issues and Solutions

### 1. Cannot Connect to ESP32

**Symptoms:**
- Connection status shows "Error" or "Disconnected"
- Error message appears in header
- Browser console shows connection errors

**Solutions:**

#### Check Network Connectivity
1. **Verify ESP32 IP Address:**
   - Check ESP32 serial monitor output for the actual IP address
   - ESP32 should print: `WiFi connected. IP address: 10.165.122.115`
   - Make sure the IP matches your dashboard URL: `ws://10.165.122.115:81`

2. **Ping Test:**
   - Open terminal/command prompt
   - Run: `ping 10.165.122.115`
   - If ping fails, ESP32 and computer are not on the same network

3. **Same Network Required:**
   - ESP32 and computer/mobile device MUST be on the same WiFi network
   - Check WiFi SSID on both devices
   - Restart ESP32 if needed

#### Check ESP32 WebSocket Server
1. **Verify Server is Running:**
   - ESP32 should have WebSocket server code running
   - Check serial monitor for: "WebSocket server started" or similar message
   - Default port should be 81

2. **Check Port Number:**
   - Default: port 81
   - URL format: `ws://10.165.122.115:81`
   - Make sure ESP32 code uses the same port

#### Firewall Issues
1. **Windows Firewall:**
   - May block WebSocket connections
   - Try disabling firewall temporarily for testing
   - Add exception for your browser

2. **Antivirus Software:**
   - Some antivirus may block WebSocket connections
   - Add exception for your browser

### 2. Connection Established but No Data Received

**Symptoms:**
- Status shows "Connected" (green)
- But no data appears on dashboard
- All metrics show "--" or "No data"

**Solutions:**

#### Check Data Format
1. **Verify JSON Structure:**
   - ESP32 must send data in this exact format:
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

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages:
     - "Invalid data structure received"
     - "Error parsing WebSocket message"
   - Check what data ESP32 is actually sending

3. **Test with Sample Data:**
   - First 3 received messages are logged to console
   - Check console for: `Received message #1: {...}`
   - Verify the JSON is valid and matches expected format

#### ESP32 Code Issues
1. **WebSocket Send Function:**
   - ESP32 must use `webSocket.broadcastTXT()` or `webSocket.sendTXT()`
   - Data must be JSON stringified
   - Example: `webSocket.broadcastTXT(JSON.stringify(data));`

2. **Update Frequency:**
   - Should send data every 400-500ms
   - Too fast may cause issues
   - Too slow will make dashboard appear unresponsive

### 3. Connection Keeps Dropping

**Symptoms:**
- Connection works briefly then disconnects
- Status alternates between Connected and Disconnected
- Console shows repeated connect/disconnect messages

**Solutions:**

1. **Network Stability:**
   - Check WiFi signal strength
   - Move ESP32 closer to router
   - Reduce interference (microwave, other devices)

2. **ESP32 Resources:**
   - ESP32 may be running out of memory
   - Check serial monitor for errors
   - Reduce update frequency if needed

3. **WebSocket Buffer:**
   - ESP32 may have send buffer issues
   - Add delay between sends
   - Limit message size

### 4. Browser Console Errors

**Common Error Messages:**

#### "Invalid WebSocket URL"
- **Cause:** URL format is incorrect
- **Fix:** Use format: `ws://IP_ADDRESS:PORT`
- **Example:** `ws://10.165.122.115:81`
- **Note:** Use `ws://` not `http://` or `https://`

#### "WebSocket connection failed"
- **Cause:** Cannot reach ESP32
- **Fixes:**
  1. Verify ESP32 is running and connected to WiFi
  2. Check IP address is correct
  3. Ensure both devices on same network
  4. Try pinging ESP32 IP address

#### "Invalid data structure received"
- **Cause:** ESP32 sending wrong JSON format
- **Fix:** Check ESP32 code matches expected format (see above)
- **Check:** Browser console shows actual received data

#### "Error parsing WebSocket message"
- **Cause:** Data is not valid JSON
- **Fixes:**
  1. ESP32 must use `JSON.stringify()` before sending
  2. Check for extra characters or malformed JSON
  3. Verify data types (numbers not strings, booleans not strings)

### 5. ESP32 Code Requirements

Your ESP32 code should include:

```cpp
#include <WebSocketsServer.h>

WebSocketsServer webSocket = WebSocketsServer(81);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    // Handle events
}

void setup() {
    // ... WiFi setup ...
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    webSocket.loop();
    
    // Create data object
    DynamicJsonDocument doc(1024);
    doc["heartRate"] = getHeartRate();
    doc["spO2"] = getSpO2();
    doc["squatCount"] = getSquatCount();
    doc["postureStatus"] = getPostureStatus();
    doc["fingerDetected"] = isFingerDetected();
    doc["fallDetected"] = isFallDetected();
    
    // Send to all connected clients
    String jsonString;
    serializeJson(doc, jsonString);
    webSocket.broadcastTXT(jsonString);
    
    delay(500); // Update every 500ms
}
```

### 6. Testing Steps

**Step-by-Step Debugging:**

1. **Verify ESP32 WiFi Connection:**
   ```
   - Check serial monitor
   - Should show: "WiFi connected"
   - Note the IP address displayed
   ```

2. **Verify WebSocket Server:**
   ```
   - ESP32 should start WebSocket server
   - Serial monitor should confirm server started
   ```

3. **Test Network Connection:**
   ```
   - Ping ESP32 from computer: ping 10.165.122.115
   - Should get replies
   ```

4. **Open Dashboard:**
   ```
   - Open index.html in browser
   - Check browser console (F12)
   - Should see no errors on page load
   ```

5. **Attempt Connection:**
   ```
   - Enter WebSocket URL: ws://10.165.122.115:81
   - Click Connect
   - Watch browser console for connection messages
   ```

6. **Check Received Data:**
   ```
   - If connected, check console for "Received message #1"
   - Verify JSON structure matches expected format
   ```

### 7. Quick Diagnostic Commands

**On Windows (PowerShell):**
```powershell
# Test connectivity
Test-NetConnection -ComputerName 10.165.122.115 -Port 81

# Ping test
ping 10.165.122.115
```

**On Mac/Linux:**
```bash
# Test connectivity
nc -zv 10.165.122.115 81

# Ping test
ping 10.165.122.115
```

### 8. Browser-Specific Issues

**Chrome/Edge:**
- Usually works well
- Check for extensions blocking WebSocket

**Firefox:**
- May have stricter security
- Check browser console for warnings

**Safari:**
- May require HTTPS for some features
- Local WebSocket should work fine

**Mobile Browsers:**
- Must be on same WiFi network
- Some mobile browsers may have restrictions

### 9. Still Having Issues?

**Check These:**
1. ESP32 serial monitor output for errors
2. Browser console (F12) for JavaScript errors
3. Network connection between devices
4. WebSocket URL format (must start with `ws://`)
5. Port number matches ESP32 code (default: 81)
6. JSON data format from ESP32 matches specification
7. Firewall/antivirus not blocking connection

**Enable Debug Mode:**
- Browser console logs all connection attempts
- First 3 received messages are logged
- Error messages show detailed information
- Connection state changes are logged

**Get Help:**
- Share browser console output
- Share ESP32 serial monitor output
- Share exact error messages
- Describe what happens when you click Connect

