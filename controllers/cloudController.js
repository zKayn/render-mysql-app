const cloudScaler = require('../cloud/scaler');
const logger = require('../config/logger');
const os = require('os');
const { promisify } = require('util');
const fs = require('fs');
const readFileAsync = promisify(fs.readFile);
const path = require('path');
const cloudReplication = require('../cloud/replication');
const loadBalancer = require('../cloud/loadBalancer');

// Metrics giả lập cho cloud resources
const cloudMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    requestCount: 0,
    errorCount: 0,
    responseTime: []
};

// Cập nhật metrics
const updateMetrics = (req, res) => {
    // Tính CPU usage dựa trên system load
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0] / cpuCount;
    cloudMetrics.cpuUsage = Math.min(loadAvg * 100, 100);

    // Tính Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    cloudMetrics.memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Tăng request count
    cloudMetrics.requestCount++;

    // Lưu response time
    cloudMetrics.responseTime.push(Math.random() * 500 + 50); // giả lập 50-550ms
    if (cloudMetrics.responseTime.length > 100) {
        cloudMetrics.responseTime.shift(); // Giữ chỉ 100 điểm dữ liệu gần nhất
    }

    // Log lỗi nếu có
    const originalSend = res.send;
    res.send = function () {
        if (res.statusCode >= 400) {
            cloudMetrics.errorCount++;
            logger.error(`HTTP Error ${res.statusCode}`, {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode
            });
        }
        originalSend.apply(res, arguments);
    };

    // Mô phỏng cloud scaler
    cloudScaler.recordRequest();
};

// Lấy thông tin về trạng thái data replication
const getReplicationStatus = async (req, res) => {
    try {
        const status = cloudReplication.getReplicationStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách dữ liệu đã sao chép
const getReplicatedData = async (req, res) => {
    try {
        const data = cloudReplication.getReplicatedData();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mô phỏng sự cố ở một region
const simulateRegionOutage = async (req, res) => {
    try {
        const { region } = req.params;
        const result = cloudReplication.simulateRegionOutage(region);

        if (result) {
            res.json({ message: `Simulated outage in region ${region}` });
        } else {
            res.status(404).json({ error: `Region ${region} not found` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy metrics hiện tại
const getCloudMetrics = async (req, res) => {
    // Tính trung bình response time
    const avgResponseTime = cloudMetrics.responseTime.length
        ? cloudMetrics.responseTime.reduce((a, b) => a + b, 0) / cloudMetrics.responseTime.length
        : 0;

    // Lấy thông tin scaling
    const scalingStatus = cloudScaler.getStatus();

    res.json({
        system: {
            cpuUsage: cloudMetrics.cpuUsage.toFixed(2),
            memoryUsage: cloudMetrics.memoryUsage.toFixed(2),
            uptime: Math.floor(process.uptime()),
            platform: process.platform,
            nodeVersion: process.version
        },
        application: {
            requestCount: cloudMetrics.requestCount,
            errorCount: cloudMetrics.errorCount,
            avgResponseTime: avgResponseTime.toFixed(2),
            errorRate: cloudMetrics.requestCount ?
                ((cloudMetrics.errorCount / cloudMetrics.requestCount) * 100).toFixed(2) : 0
        },
        cloud: {
            instances: scalingStatus.currentInstances,
            maxInstances: scalingStatus.maxInstances,
            lastScaleAction: scalingStatus.lastScaleAction,
            estimatedRequestRate: scalingStatus.estimatedRequestRate
        }
    });
};

// Lấy log data
// Cập nhật hàm getCloudLogs
const getCloudLogs = async (req, res) => {
    try {
        const logs = await logger.getLogs();
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy thông tin về load balancer
const getLoadBalancerStatus = async (req, res) => {
    try {
        const status = loadBalancer.getStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Thay đổi thuật toán load balancer
const setLoadBalancerAlgorithm = async (req, res) => {
    try {
        const { algorithm } = req.body;
        const result = loadBalancer.setAlgorithm(algorithm);

        if (result) {
            res.json({ message: `Thuật toán đã được đổi thành ${algorithm}` });
        } else {
            res.status(400).json({ error: 'Thuật toán không hợp lệ' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Bật/tắt auto-scaling
const toggleAutoScaling = async (req, res) => {
    try {
        const { enabled } = req.body;
        const status = loadBalancer.toggleAutoScaling(enabled);

        res.json({
            message: `Auto-scaling đã được ${status ? 'bật' : 'tắt'}`,
            autoScalingEnabled: status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mô phỏng lỗi server
const simulateServerFailure = async (req, res) => {
    try {
        const { serverId } = req.params;
        const result = loadBalancer.simulateServerFailure(serverId);

        if (result) {
            res.json({ message: `Đã mô phỏng lỗi server ${serverId}` });
        } else {
            res.status(404).json({ error: `Server ${serverId} không tồn tại` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mô phỏng gửi request
const simulateRequest = async (req, res) => {
    try {
        const { load } = req.body;
        const requestId = `req-${Date.now()}`;
        const result = loadBalancer.handleRequest(requestId, load || 5);

        if (result.success) {
            res.json({
                message: `Request đã được xử lý bởi ${result.serverId}`,
                ...result
            });
        } else {
            res.status(503).json({ error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Thêm các hàm mới vào exports
module.exports = {
    updateMetrics,
    getCloudMetrics,
    getCloudLogs,
    getReplicationStatus,
    getReplicatedData,
    simulateRegionOutage,
    getLoadBalancerStatus,
    setLoadBalancerAlgorithm,
    toggleAutoScaling,
    simulateServerFailure,
    simulateRequest
};