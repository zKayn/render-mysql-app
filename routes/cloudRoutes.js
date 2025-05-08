const express = require('express');
const router = express.Router();
const { 
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
  } = require('../controllers/cloudController');

// Cloud monitoring routes
router.get('/metrics', getCloudMetrics);
router.get('/logs', getCloudLogs);

// Cloud replication routes
router.get('/replication/status', getReplicationStatus);
router.get('/replication/data', getReplicatedData);
router.post('/replication/simulate-outage/:region', simulateRegionOutage);

// Routes cho load balancer
router.get('/loadbalancer/status', getLoadBalancerStatus);
router.post('/loadbalancer/algorithm', setLoadBalancerAlgorithm);
router.post('/loadbalancer/autoscaling', toggleAutoScaling);
router.post('/loadbalancer/failure/:serverId', simulateServerFailure);
router.post('/loadbalancer/request', simulateRequest);

module.exports = router;