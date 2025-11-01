/**
 * Local Storage Manager
 * Handles data persistence, export functionality, and session tracking
 */

class StorageManager {
    constructor() {
        this.storageKey = 'athleteMonitorSession';
        this.maxStorageItems = 1000; // Maximum readings to store
        this.sessionData = this.loadSessionData();
        this.sessionStartTime = null;
    }

    /**
     * Load session data from localStorage
     */
    loadSessionData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure data array exists
                if (!parsed.data) {
                    parsed.data = [];
                }
                return parsed;
            }
        } catch (error) {
            console.error('Error loading session data:', error);
        }
        
        return {
            data: [],
            metadata: {
                sessionStart: null,
                sessionEnd: null,
                totalReadings: 0,
                exportTimestamp: null
            }
        };
    }

    /**
     * Save data reading to storage
     */
    saveReading(data) {
        const timestamp = Date.now();
        const reading = {
            timestamp: timestamp,
            date: new Date(timestamp).toISOString(),
            ...data
        };

        this.sessionData.data.push(reading);

        // Limit storage size
        if (this.sessionData.data.length > this.maxStorageItems) {
            this.sessionData.data.shift(); // Remove oldest
        }

        // Update metadata
        if (!this.sessionData.metadata.sessionStart) {
            this.sessionData.metadata.sessionStart = timestamp;
            this.sessionStartTime = timestamp;
        }
        this.sessionData.metadata.totalReadings = this.sessionData.data.length;
        this.sessionData.metadata.lastUpdate = timestamp;

        this.persist();
    }

    /**
     * Persist data to localStorage
     */
    persist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.sessionData));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Clearing old data...');
                this.clearOldData();
            }
        }
    }

    /**
     * Clear old data if storage is full
     */
    clearOldData() {
        // Keep only last 500 readings
        const keepCount = 500;
        if (this.sessionData.data.length > keepCount) {
            this.sessionData.data = this.sessionData.data.slice(-keepCount);
            this.sessionData.metadata.totalReadings = this.sessionData.data.length;
            this.persist();
        }
    }

    /**
     * Get all session data
     */
    getAllData() {
        return this.sessionData;
    }

    /**
     * Get last N readings
     */
    getLastReadings(count = 10) {
        return this.sessionData.data.slice(-count);
    }

    /**
     * Clear all session data
     */
    clear() {
        if (confirm('Are you sure you want to clear all session data?')) {
            this.sessionData = {
                data: [],
                metadata: {
                    sessionStart: null,
                    sessionEnd: null,
                    totalReadings: 0,
                    exportTimestamp: null
                }
            };
            this.sessionStartTime = null;
            this.persist();
            return true;
        }
        return false;
    }

    /**
     * Export data as JSON
     */
    exportJSON() {
        const exportData = {
            ...this.sessionData,
            exportTimestamp: Date.now(),
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `athlete-monitor-session-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Update export timestamp
        this.sessionData.metadata.exportTimestamp = Date.now();
        this.persist();
    }

    /**
     * Export data as CSV
     */
    exportCSV() {
        if (this.sessionData.data.length === 0) {
            alert('No data to export');
            return;
        }

        // CSV Headers
        const headers = [
            'Timestamp',
            'Date',
            'Heart Rate (BPM)',
            'SpO2 (%)',
            'Squat Count',
            'Posture Status',
            'Finger Detected',
            'Fall Detected'
        ];

        // CSV Rows
        const rows = this.sessionData.data.map(reading => [
            reading.timestamp,
            reading.date,
            reading.heartRate,
            reading.spO2,
            reading.squatCount,
            reading.postureStatus,
            reading.fingerDetected ? 'Yes' : 'No',
            reading.fallDetected ? 'Yes' : 'No'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `athlete-monitor-session-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Get session statistics
     */
    getStats() {
        const data = this.sessionData.data;
        
        if (data.length === 0) {
            return {
                totalReadings: 0,
                sessionStart: null,
                avgHeartRate: null,
                avgSpO2: null,
                maxSquats: 0
            };
        }

        const heartRates = data.map(r => r.heartRate).filter(v => !isNaN(v));
        const spO2Values = data.map(r => r.spO2).filter(v => !isNaN(v));
        const squatCounts = data.map(r => r.squatCount);

        return {
            totalReadings: data.length,
            sessionStart: this.sessionData.metadata.sessionStart,
            avgHeartRate: heartRates.length > 0 ? 
                Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null,
            avgSpO2: spO2Values.length > 0 ? 
                Math.round(spO2Values.reduce((a, b) => a + b, 0) / spO2Values.length) : null,
            maxSquats: squatCounts.length > 0 ? Math.max(...squatCounts) : 0,
            minHeartRate: heartRates.length > 0 ? Math.min(...heartRates) : null,
            maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : null
        };
    }

    /**
     * Get session start time
     */
    getSessionStartTime() {
        return this.sessionStartTime || this.sessionData.metadata.sessionStart;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Not started';
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
}

