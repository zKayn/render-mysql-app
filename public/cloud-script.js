// API Base URL (tự động phát hiện URL hiện tại)
const API_URL = window.location.origin;
let responseTimeChart;
let metricsUpdateInterval;
let responseTimeData = {
    labels: [],
    values: []
};

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    fetchInitialData();
    
    // Set up auto-refresh
    metricsUpdateInterval = setInterval(fetchMetrics, 5000);
    
    // Set up event listeners
    document.getElementById('refreshLogs').addEventListener('click', fetchLogs);
    document.getElementById('logLevel').addEventListener('change', filterLogs);
});

// Thiết lập biểu đồ
function setupCharts() {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');
    responseTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (ms)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Request'
                    }
                }
            }
        }
    });
}

// Lấy dữ liệu ban đầu
async function fetchInitialData() {
    await fetchMetrics();
    await fetchLogs();
}

// Lấy metrics
async function fetchMetrics() {
    try {
        const response = await fetch(`${API_URL}/cloud/metrics`);
        const data = await response.json();
        
        updateDashboardMetrics(data);
        updateResponseTimeChart(data);
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
}

// Cập nhật metrics trên dashboard
function updateDashboardMetrics(data) {
    // CPU Usage
    const cpuUsage = parseFloat(data.system.cpuUsage);
    document.getElementById('cpuUsage').textContent = `${cpuUsage}%`;
    document.getElementById('cpuBar').style.width = `${cpuUsage}%`;
    document.getElementById('cpuBar').style.backgroundColor = getColorForPercentage(cpuUsage);
    
    // Memory Usage
    const memoryUsage = parseFloat(data.system.memoryUsage);
    document.getElementById('memoryUsage').textContent = `${memoryUsage}%`;
    document.getElementById('memoryBar').style.width = `${memoryUsage}%`;
    document.getElementById('memoryBar').style.backgroundColor = getColorForPercentage(memoryUsage);
    
    // Instances
    document.getElementById('instanceCount').textContent = `${data.cloud.instances} ví dụ`;
    
    if (data.cloud.lastScaleAction) {
        const action = data.cloud.lastScaleAction.action === 'mở rộng quy mô' ? 'tăng quy mô' : 'giảm quy mô';
        const time = new Date(data.cloud.lastScaleAction.timestamp).toLocaleTimeString();
        document.getElementById('scaleStatus').textContent = 
            `Hành động cuối cùng: ${action} tại ${time}`;
    }
    
    // Request Rate
    document.getElementById('requestRate').textContent = 
        `${data.cloud.estimatedRequestRate} req/min`;
}

// Cập nhật biểu đồ Response Time
function updateResponseTimeChart(data) {
    const newDataPoint = parseFloat(data.application.avgResponseTime);
    
    // Add new data point with current time
    const now = new Date().toLocaleTimeString();
    
    if (responseTimeData.labels.length >= 20) {
        responseTimeData.labels.shift();
        responseTimeData.values.shift();
    }
    
    responseTimeData.labels.push(now);
    responseTimeData.values.push(newDataPoint);
    
    // Update chart
    responseTimeChart.data.labels = responseTimeData.labels;
    responseTimeChart.data.datasets[0].data = responseTimeData.values;
    responseTimeChart.update();
}

// Lấy logs
async function fetchLogs() {
    try {
        const response = await fetch(`${API_URL}/cloud/logs`);
        const data = await response.json();
        
        const logFilter = document.getElementById('logLevel').value;
        renderLogs(data.logs, logFilter);
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

// Hiển thị logs
function renderLogs(logs, filterLevel = 'all') {
    const logsTableBody = document.getElementById('logsTableBody');
    logsTableBody.innerHTML = '';
    
    // Filter logs if needed
    if (filterLevel !== 'all') {
        logs = logs.filter(log => log.level === filterLevel);
    }
    
    // Sắp xếp logs mới nhất lên đầu
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = `log-${log.level}`;
        
        const time = new Date(log.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td>${time}</td>
            <td>${log.level}</td>
            <td>${log.message}</td>
            <td>${formatLogData(log.data)}</td>
        `;
        
        logsTableBody.appendChild(row);
    });
}

// Lọc logs
function filterLogs() {
    const filterLevel = document.getElementById('logLevel').value;
    fetchLogs();
}

// Format log data
function formatLogData(data) {
    if (!data || Object.keys(data).length === 0) return '';
    
    return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>');
}

// Lấy màu dựa trên phần trăm
function getColorForPercentage(percentage) {
    if (percentage < 50) return '#4CAF50'; // green
    if (percentage < 80) return '#FFC107'; // yellow/amber
    return '#F44336'; // red
}

// Cleanup khi người dùng rời khỏi trang
window.addEventListener('beforeunload', () => {
    clearInterval(metricsUpdateInterval);
});