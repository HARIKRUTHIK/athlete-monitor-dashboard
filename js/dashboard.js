/**
 * Main Dashboard Controller
 * Coordinates all modules and handles real-time DOM updates
 */

class DashboardController {
    constructor() {
        this.wsManager = null;
        this.chartManager = null;
        this.storageManager = null;
        this.lastHeartRate = null;
        this.lastSpO2 = null;
        this.updateInterval = null;
        
        // DOM Elements
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            lastUpdate: document.getElementById('lastUpdate'),
            heartRate: document.getElementById('heartRate'),
            hrStatus: document.getElementById('hrStatus'),
            hrTrend: document.getElementById('hrTrend'),
            spO2: document.getElementById('spO2'),
            spO2Status: document.getElementById('spO2Status'),
            spO2Trend: document.getElementById('spO2Trend'),
            squatCount: document.getElementById('squatCount'),
            squatProgress: document.getElementById('squatProgress'),
            postureStatus: document.getElementById('postureStatus'),
            fingerDetected: document.getElementById('fingerDetected'),
            fallDetected: document.getElementById('fallDetected'),
            fallAlert: document.getElementById('fallAlert'),
            dismissFallAlert: document.getElementById('dismissFallAlert'),
            connectionQuality: document.getElementById('connectionQuality'),
            dataPointCount: document.getElementById('dataPointCount'),
            wsUrl: document.getElementById('wsUrl'),
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            exportCsvBtn: document.getElementById('exportCsvBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            chartPauseBtn: document.getElementById('chartPauseBtn'),
            sessionStart: document.getElementById('sessionStart'),
            totalReadings: document.getElementById('totalReadings'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        // Initialize managers
        this.storageManager = new StorageManager();
        this.chartManager = new ChartManager();
        this.wsManager = new WebSocketManager();

        // Initialize charts
        this.chartManager.initialize();

        // Set up WebSocket callbacks
        this.setupWebSocketCallbacks();

        // Set up event listeners
        this.setupEventListeners();

        // Load saved WebSocket URL if available
        const savedUrl = localStorage.getItem('wsUrl');
        if (savedUrl) {
            this.elements.wsUrl.value = savedUrl;
        }

        // Update UI with initial state
        this.updateConnectionState('disconnected');
        this.updateSessionInfo();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.chartManager.resize();
        });
    }

    /**
     * Set up WebSocket callbacks
     */
    setupWebSocketCallbacks() {
        // Handle incoming messages
        this.wsManager.onMessage((data) => {
            this.handleDataUpdate(data);
        });

        // Handle connection state changes
        this.wsManager.onStateChange((state, message) => {
            this.updateConnectionState(state, message);
        });

        // Handle connection established
        this.wsManager.onConnect(() => {
            console.log('Connected to ESP32');
            this.updateConnectionState('connected');
        });

        // Handle disconnection
        this.wsManager.onDisconnect(() => {
            console.log('Disconnected from ESP32');
            this.updateConnectionState('disconnected');
        });

        // Handle errors
        this.wsManager.onError((error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionState('error');
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Connection controls
        this.elements.connectBtn.addEventListener('click', () => {
            const url = this.elements.wsUrl.value.trim();
            if (url) {
                console.log('Attempting to connect to:', url);
                localStorage.setItem('wsUrl', url);
                this.wsManager.connect(url);
            } else {
                alert('Please enter a valid WebSocket URL');
            }
        });

        this.elements.disconnectBtn.addEventListener('click', () => {
            this.wsManager.disconnect();
        });

        // Data export
        this.elements.exportJsonBtn.addEventListener('click', () => {
            this.storageManager.exportJSON();
        });

        this.elements.exportCsvBtn.addEventListener('click', () => {
            this.storageManager.exportCSV();
        });

        // Clear history
        this.elements.clearHistoryBtn.addEventListener('click', () => {
            if (this.storageManager.clear()) {
                this.chartManager.clear();
                this.updateSessionInfo();
                this.resetDisplay();
            }
        });

        // Chart pause/resume
        this.elements.chartPauseBtn.addEventListener('click', () => {
            const isPaused = this.chartManager.togglePause();
            this.elements.chartPauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        });

        // Dismiss fall alert
        this.elements.dismissFallAlert.addEventListener('click', () => {
            this.elements.fallAlert.style.display = 'none';
        });

        // Enter key on WebSocket URL input
        this.elements.wsUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.connectBtn.click();
            }
        });
    }

    /**
     * Handle data update from WebSocket
     */
    handleDataUpdate(data) {
        // Update timestamp
        this.updateTimestamp();

        // Update health metrics
        this.updateHeartRate(data.heartRate);
        this.updateSpO2(data.spO2);

        // Update exercise tracking
        this.updateSquatCount(data.squatCount);
        this.updatePosture(data.postureStatus);

        // Update system status
        this.updateFingerDetection(data.fingerDetected);
        this.updateFallDetection(data.fallDetected);

        // Update charts
        this.chartManager.updateData(data.heartRate, data.spO2);

        // Store data
        this.storageManager.saveReading(data);

        // Update UI counters
        this.updateDataPointCount();
        this.updateSessionInfo();
    }

    /**
     * Update Heart Rate display
     */
    updateHeartRate(value) {
        if (value === null || value === undefined || isNaN(value)) {
            this.elements.heartRate.querySelector('.value-number').textContent = '--';
            this.elements.hrStatus.textContent = 'No data';
            this.elements.heartRate.className = 'metric-value';
            return;
        }

        const valueElement = this.elements.heartRate.querySelector('.value-number');
        valueElement.textContent = Math.round(value);

        // Color coding
        let status, className, trend;
        if (value >= 60 && value <= 100) {
            status = 'Normal';
            className = 'metric-value status-normal';
            trend = '';
        } else if (value >= 101 && value <= 120) {
            status = 'Elevated';
            className = 'metric-value status-warning';
            trend = '↑';
        } else {
            status = 'High';
            className = 'metric-value status-danger';
            trend = '↑↑';
        }

        // Trend arrow
        if (this.lastHeartRate !== null) {
            if (value > this.lastHeartRate + 2) {
                this.elements.hrTrend.textContent = '↑';
                this.elements.hrTrend.className = 'trend-arrow trend-up';
            } else if (value < this.lastHeartRate - 2) {
                this.elements.hrTrend.textContent = '↓';
                this.elements.hrTrend.className = 'trend-arrow trend-down';
            } else {
                this.elements.hrTrend.textContent = '→';
                this.elements.hrTrend.className = 'trend-arrow trend-stable';
            }
        }

        this.elements.heartRate.className = className;
        this.elements.hrStatus.textContent = status;
        this.lastHeartRate = value;
    }

    /**
     * Update SpO2 display
     */
    updateSpO2(value) {
        if (value === null || value === undefined || isNaN(value)) {
            this.elements.spO2.querySelector('.value-number').textContent = '--';
            this.elements.spO2Status.textContent = 'No data';
            this.elements.spO2.className = 'metric-value';
            return;
        }

        const valueElement = this.elements.spO2.querySelector('.value-number');
        valueElement.textContent = Math.round(value);

        // Color coding
        let status, className;
        if (value >= 95 && value <= 100) {
            status = 'Normal';
            className = 'metric-value status-normal';
        } else if (value >= 90 && value < 95) {
            status = 'Low';
            className = 'metric-value status-warning';
        } else {
            status = 'Critical';
            className = 'metric-value status-danger';
        }

        // Trend arrow
        if (this.lastSpO2 !== null) {
            if (value > this.lastSpO2 + 1) {
                this.elements.spO2Trend.textContent = '↑';
                this.elements.spO2Trend.className = 'trend-arrow trend-up';
            } else if (value < this.lastSpO2 - 1) {
                this.elements.spO2Trend.textContent = '↓';
                this.elements.spO2Trend.className = 'trend-arrow trend-down';
            } else {
                this.elements.spO2Trend.textContent = '→';
                this.elements.spO2Trend.className = 'trend-arrow trend-stable';
            }
        }

        this.elements.spO2.className = className;
        this.elements.spO2Status.textContent = status;
        this.lastSpO2 = value;
    }

    /**
     * Update Squat Count
     */
    updateSquatCount(count) {
        if (count === null || count === undefined || isNaN(count)) {
            this.elements.squatCount.textContent = '0';
            return;
        }

        this.elements.squatCount.textContent = count;

        // Update progress bar (assuming max 50 squats for visualization)
        const maxSquats = 50;
        const percentage = Math.min((count / maxSquats) * 100, 100);
        this.elements.squatProgress.style.width = `${percentage}%`;
    }

    /**
     * Update Posture Status
     */
    updatePosture(status) {
        const postureElement = this.elements.postureStatus;
        const iconElement = postureElement.querySelector('.posture-icon');
        const textElement = postureElement.querySelector('.posture-text');

        if (!status) {
            iconElement.textContent = '-';
            textElement.textContent = 'No data';
            postureElement.className = 'posture-value';
            return;
        }

        status = status.toUpperCase();

        if (status === 'GOOD') {
            iconElement.textContent = '✓';
            textElement.textContent = 'GOOD';
            postureElement.className = 'posture-value posture-good';
        } else if (status === 'BAD') {
            iconElement.textContent = '⚠';
            textElement.textContent = 'BAD';
            postureElement.className = 'posture-value posture-warning';
        } else if (status === 'FALL') {
            iconElement.textContent = '🚨';
            textElement.textContent = 'FALL';
            postureElement.className = 'posture-value posture-danger';
        } else {
            iconElement.textContent = '?';
            textElement.textContent = status;
            postureElement.className = 'posture-value';
        }
    }

    /**
     * Update Finger Detection
     */
    updateFingerDetection(detected) {
        const statusElement = this.elements.fingerDetected;
        const iconElement = statusElement.querySelector('.status-icon');
        const textElement = statusElement.querySelector('.status-text-value');

        if (detected === true) {
            iconElement.textContent = '✓';
            textElement.textContent = 'Detected';
            statusElement.className = 'status-value status-detected';
        } else if (detected === false) {
            iconElement.textContent = '✗';
            textElement.textContent = 'Not Detected';
            statusElement.className = 'status-value status-not-detected';
        } else {
            iconElement.textContent = '-';
            textElement.textContent = 'Unknown';
            statusElement.className = 'status-value';
        }
    }

    /**
     * Update Fall Detection
     */
    updateFallDetection(detected) {
        const statusElement = this.elements.fallDetected;
        const iconElement = statusElement.querySelector('.status-icon');
        const textElement = statusElement.querySelector('.status-text-value');

        if (detected === true) {
            iconElement.textContent = '🚨';
            textElement.textContent = 'FALL ALERT!';
            statusElement.className = 'status-value status-danger';
            
            // Show alert banner
            this.elements.fallAlert.style.display = 'block';
        } else {
            iconElement.textContent = '✓';
            textElement.textContent = 'No alert';
            statusElement.className = 'status-value status-normal';
        }
    }

    /**
     * Update Connection State
     */
    updateConnectionState(state, message = null) {
        const indicator = this.elements.statusIndicator;
        const text = this.elements.statusText;
        const errorMsg = this.elements.errorMessage;

        indicator.className = 'status-indicator';

        // Hide error message by default
        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
        }

        switch (state) {
            case 'connected':
                indicator.classList.add('status-connected');
                text.textContent = 'Connected';
                if (errorMsg) errorMsg.style.display = 'none';
                break;
            case 'connecting':
                indicator.classList.add('status-connecting');
                text.textContent = 'Connecting...';
                if (errorMsg) errorMsg.style.display = 'none';
                break;
            case 'disconnected':
                indicator.classList.add('status-disconnected');
                text.textContent = message || 'Disconnected';
                if (message && errorMsg) {
                    errorMsg.textContent = message;
                    errorMsg.style.display = 'block';
                }
                break;
            case 'error':
                indicator.classList.add('status-error');
                text.textContent = 'Error';
                if (message && errorMsg) {
                    errorMsg.textContent = message;
                    errorMsg.style.display = 'block';
                }
                break;
            default:
                indicator.classList.add('status-disconnected');
                text.textContent = 'Unknown';
        }

        // Update connection quality
        if (state === 'connected' && this.wsManager) {
            const latency = this.wsManager.getLatency();
            this.updateConnectionQuality(latency);
        }
    }

    /**
     * Update Connection Quality
     */
    updateConnectionQuality(latency) {
        const qualityElement = this.elements.connectionQuality;
        const indicator = qualityElement.querySelector('.quality-indicator');
        const textElement = qualityElement.querySelector('.status-text-value');

        indicator.className = 'quality-indicator';

        if (latency === 'Good') {
            indicator.classList.add('quality-good');
            textElement.textContent = 'Good';
        } else if (latency === 'Fair') {
            indicator.classList.add('quality-fair');
            textElement.textContent = 'Fair';
        } else if (latency === 'Poor') {
            indicator.classList.add('quality-poor');
            textElement.textContent = 'Poor';
        } else {
            textElement.textContent = 'N/A';
        }
    }

    /**
     * Update Last Update Timestamp
     */
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        this.elements.lastUpdate.textContent = timeString;
    }

    /**
     * Update Data Point Count
     */
    updateDataPointCount() {
        const stats = this.storageManager.getStats();
        this.elements.dataPointCount.textContent = stats.totalReadings;
    }

    /**
     * Update Session Info
     */
    updateSessionInfo() {
        const sessionStart = this.storageManager.getSessionStartTime();
        if (sessionStart) {
            this.elements.sessionStart.textContent = 
                this.storageManager.formatTimestamp(sessionStart);
        } else {
            this.elements.sessionStart.textContent = 'Not started';
        }

        const stats = this.storageManager.getStats();
        this.elements.totalReadings.textContent = stats.totalReadings;
    }

    /**
     * Reset display to default state
     */
    resetDisplay() {
        this.updateHeartRate(null);
        this.updateSpO2(null);
        this.updateSquatCount(0);
        this.updatePosture(null);
        this.updateFingerDetection(null);
        this.updateFallDetection(false);
        this.lastHeartRate = null;
        this.lastSpO2 = null;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardController();
});

