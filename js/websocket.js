/**
 * WebSocket Connection Manager
 * Handles ESP32 WebSocket connection with auto-reconnect and error handling
 */

class WebSocketManager {
    constructor(url = 'ws://10.165.122.115:81') {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.reconnectTimeout = null;
        this.isManualDisconnect = false;
        this.lastMessageTime = null;
        this.startTime = null;
        this.messageCount = 0;
        
        // Callbacks
        this.onMessageCallback = null;
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
        this.onErrorCallback = null;
        this.onConnectionStateChange = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect(url = null) {
        if (url) {
            this.url = url;
        }

        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        this.isManualDisconnect = false;
        this.updateConnectionState('connecting');
        
        try {
            console.log(`Connecting to WebSocket: ${this.url}`);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.startTime = Date.now();
                this.messageCount = 0;
                this.updateConnectionState('connected');
                
                if (this.onConnectCallback) {
                    this.onConnectCallback(event);
                }
            };

            this.ws.onmessage = (event) => {
                this.lastMessageTime = Date.now();
                this.messageCount++;
                
                // Log first few messages for debugging
                if (this.messageCount <= 3) {
                    console.log(`Received message #${this.messageCount}:`, event.data);
                }
                
                try {
                    const data = JSON.parse(event.data);
                    
                    // Validate data structure
                    if (this.validateData(data)) {
                        if (this.onMessageCallback) {
                            this.onMessageCallback(data);
                        }
                    } else {
                        console.warn('Invalid data structure received:', data);
                        console.warn('Expected format:', {
                            heartRate: 'number',
                            spO2: 'number',
                            squatCount: 'number',
                            postureStatus: 'string',
                            fingerDetected: 'boolean',
                            fallDetected: 'boolean'
                        });
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    console.error('Raw message:', event.data);
                    console.error('Message type:', typeof event.data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                console.error('Error details:', {
                    type: error.type,
                    target: error.target,
                    readyState: this.ws ? this.ws.readyState : 'N/A',
                    url: this.url
                });
                
                let errorMessage = 'Connection failed. Check if ESP32 is running and reachable.';
                this.updateConnectionState('error', errorMessage);
                
                if (this.onErrorCallback) {
                    this.onErrorCallback(error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                
                // Log close codes for debugging
                let closeReason = 'Unknown';
                if (event.code === 1000) closeReason = 'Normal closure';
                else if (event.code === 1001) closeReason = 'Going away';
                else if (event.code === 1002) closeReason = 'Protocol error';
                else if (event.code === 1003) closeReason = 'Unsupported data';
                else if (event.code === 1006) closeReason = 'Abnormal closure (connection lost)';
                else if (event.code === 1011) closeReason = 'Server error';
                else if (event.code === 1015) closeReason = 'TLS handshake failed';
                
                console.log(`Close reason: ${closeReason} (code: ${event.code})`);
                
                this.updateConnectionState('disconnected', closeReason);
                
                if (this.onDisconnectCallback) {
                    this.onDisconnectCallback(event);
                }

                // Auto-reconnect if not manual disconnect
                if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            console.error('This might be due to:');
            console.error('1. Invalid WebSocket URL format');
            console.error('2. ESP32 not running WebSocket server');
            console.error('3. Network connectivity issues');
            console.error('4. Firewall blocking connection');
            let errorMsg = `Connection failed: ${error.message || 'Unknown error'}. Check console for details.`;
            this.updateConnectionState('error', errorMsg);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.isManualDisconnect = true;
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.updateConnectionState('disconnected');
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.isManualDisconnect) {
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        this.updateConnectionState('connecting');

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Validate received data structure
     */
    validateData(data) {
        return (
            typeof data === 'object' &&
            data !== null &&
            typeof data.heartRate === 'number' &&
            typeof data.spO2 === 'number' &&
            typeof data.squatCount === 'number' &&
            typeof data.postureStatus === 'string' &&
            typeof data.fingerDetected === 'boolean' &&
            typeof data.fallDetected === 'boolean'
        );
    }

    /**
     * Get current connection state
     */
    getState() {
        if (!this.ws) {
            return 'disconnected';
        }

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSING:
                return 'disconnecting';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    /**
     * Get connection statistics
     */
    getStats() {
        const uptime = this.startTime ? Date.now() - this.startTime : 0;
        const avgLatency = this.getLatency();
        
        return {
            connected: this.getState() === 'connected',
            uptime: uptime,
            messageCount: this.messageCount,
            lastMessageTime: this.lastMessageTime,
            reconnectAttempts: this.reconnectAttempts,
            latency: avgLatency
        };
    }

    /**
     * Calculate average latency (simplified)
     */
    getLatency() {
        if (!this.lastMessageTime) {
            return null;
        }
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        // If message received within 1 second, assume good connection
        return timeSinceLastMessage < 1000 ? 'Good' : 
               timeSinceLastMessage < 3000 ? 'Fair' : 'Poor';
    }

    /**
     * Update connection state and trigger callback
     */
    updateConnectionState(state, message = null) {
        this.lastStateMessage = message;
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(state, message);
        }
    }

    /**
     * Set callback for received messages
     */
    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    /**
     * Set callback for connection established
     */
    onConnect(callback) {
        this.onConnectCallback = callback;
    }

    /**
     * Set callback for disconnection
     */
    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Set callback for connection state changes
     */
    onStateChange(callback) {
        this.onConnectionStateChange = callback;
    }

    /**
     * Send message to WebSocket server (if needed)
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        }
        console.warn('WebSocket not connected, cannot send message');
        return false;
    }
}

