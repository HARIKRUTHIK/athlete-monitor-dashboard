/**
 * Chart.js Manager
 * Handles real-time chart initialization and updates
 */

class ChartManager {
    constructor() {
        this.heartRateChart = null;
        this.spO2Chart = null;
        this.maxDataPoints = 120; // 2 minutes at 500ms intervals
        this.isPaused = false;
        this.heartRateData = [];
        this.spO2Data = [];
        this.timeLabels = [];
    }

    /**
     * Initialize both charts
     */
    initialize() {
        this.initializeHeartRateChart();
        this.initializeSpO2Chart();
    }

    /**
     * Initialize Heart Rate chart
     */
    initializeHeartRateChart() {
        const ctx = document.getElementById('heartRateChart');
        if (!ctx) {
            console.error('Heart Rate chart canvas not found');
            return;
        }

        this.heartRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animation for real-time updates
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `Heart Rate: ${context.parsed.y} BPM`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 150,
                        title: {
                            display: true,
                            text: 'BPM'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            callback: function(value, index) {
                                return index % 20 === 0 ? index : '';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize SpO2 chart
     */
    initializeSpO2Chart() {
        const ctx = document.getElementById('spO2Chart');
        if (!ctx) {
            console.error('SpO2 chart canvas not found');
            return;
        }

        this.spO2Chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'SpO2 (%)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animation for real-time updates
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `SpO2: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 85,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            callback: function(value, index) {
                                return index % 20 === 0 ? index : '';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update charts with new data
     */
    updateData(heartRate, spO2) {
        if (this.isPaused) {
            return;
        }

        const now = new Date();
        const timeLabel = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Add new data
        this.heartRateData.push(heartRate);
        this.spO2Data.push(spO2);
        this.timeLabels.push(timeLabel);

        // Remove oldest data if exceeding max
        if (this.heartRateData.length > this.maxDataPoints) {
            this.heartRateData.shift();
            this.spO2Data.shift();
            this.timeLabels.shift();
        }

        // Update Heart Rate chart
        if (this.heartRateChart) {
            this.heartRateChart.data.labels = this.timeLabels;
            this.heartRateChart.data.datasets[0].data = this.heartRateData;
            
            // Update color based on value
            const colors = this.getHeartRateColor(heartRate);
            this.heartRateChart.data.datasets[0].borderColor = colors.border;
            this.heartRateChart.data.datasets[0].backgroundColor = colors.background;
            
            this.heartRateChart.update('none'); // 'none' mode for instant updates
        }

        // Update SpO2 chart
        if (this.spO2Chart) {
            this.spO2Chart.data.labels = this.timeLabels;
            this.spO2Chart.data.datasets[0].data = this.spO2Data;
            
            // Update color based on value
            const colors = this.getSpO2Color(spO2);
            this.spO2Chart.data.datasets[0].borderColor = colors.border;
            this.spO2Chart.data.datasets[0].backgroundColor = colors.background;
            
            this.spO2Chart.update('none'); // 'none' mode for instant updates
        }
    }

    /**
     * Get color for heart rate value
     */
    getHeartRateColor(value) {
        if (value >= 60 && value <= 100) {
            return {
                border: '#10b981', // Green
                background: 'rgba(16, 185, 129, 0.1)'
            };
        } else if (value >= 101 && value <= 120) {
            return {
                border: '#f59e0b', // Yellow
                background: 'rgba(245, 158, 11, 0.1)'
            };
        } else {
            return {
                border: '#ef4444', // Red
                background: 'rgba(239, 68, 68, 0.1)'
            };
        }
    }

    /**
     * Get color for SpO2 value
     */
    getSpO2Color(value) {
        if (value >= 95 && value <= 100) {
            return {
                border: '#10b981', // Green
                background: 'rgba(16, 185, 129, 0.1)'
            };
        } else if (value >= 90 && value < 95) {
            return {
                border: '#f59e0b', // Yellow
                background: 'rgba(245, 158, 11, 0.1)'
            };
        } else {
            return {
                border: '#ef4444', // Red
                background: 'rgba(239, 68, 68, 0.1)'
            };
        }
    }

    /**
     * Toggle chart pause/resume
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    /**
     * Clear all chart data
     */
    clear() {
        this.heartRateData = [];
        this.spO2Data = [];
        this.timeLabels = [];

        if (this.heartRateChart) {
            this.heartRateChart.data.labels = [];
            this.heartRateChart.data.datasets[0].data = [];
            this.heartRateChart.update();
        }

        if (this.spO2Chart) {
            this.spO2Chart.data.labels = [];
            this.spO2Chart.data.datasets[0].data = [];
            this.spO2Chart.update();
        }
    }

    /**
     * Resize charts (call on window resize)
     */
    resize() {
        if (this.heartRateChart) {
            this.heartRateChart.resize();
        }
        if (this.spO2Chart) {
            this.spO2Chart.resize();
        }
    }
}

