// Mô phỏng Load Balancer trong Cloud Environment
class CloudLoadBalancer {
    constructor() {
      // Các node servers (instances)
      this.servers = [
        { id: 'server-1', status: 'healthy', load: 0, maxLoad: 100 },
        { id: 'server-2', status: 'healthy', load: 0, maxLoad: 100 }
      ];
      
      this.algorithm = 'round-robin'; // 'round-robin', 'least-connections', 'weighted'
      this.currentServerIndex = 0;
      this.totalRequests = 0;
      this.requestsHistory = []; // Lưu lịch sử phân phối request
      
      // Mô phỏng auto-scaling
      this.autoScalingEnabled = true;
      this.scaleUpThreshold = 80; // Scale up khi load > 80%
      this.scaleDownThreshold = 20; // Scale down khi load < 20%
      this.maxServers = 5;
      this.minServers = 2;
      
      // Scheduling health checks
      setInterval(() => this.performHealthChecks(), 10000);
      
      // Auto decrease load over time 
      setInterval(() => this.simulateLoadDecrease(), 5000);
      
      // Auto-scaling check
      setInterval(() => this.checkScaling(), 15000);
    }
    
    // Nhận và phân phối request đến server phù hợp
    handleRequest(requestId, load = 5) {
      this.totalRequests++;
      
      // Chọn server dựa trên thuật toán
      const server = this.selectServer();
      
      if (!server) {
        return { success: false, error: 'No available server' };
      }
      
      // Tăng load cho server
      server.load = Math.min(server.load + load, server.maxLoad);
      
      // Record request distribution
      this.requestsHistory.push({
        timestamp: new Date().toISOString(),
        requestId,
        serverId: server.id,
        load
      });
      
      // Chỉ giữ 100 request gần nhất
      if (this.requestsHistory.length > 100) {
        this.requestsHistory.shift();
      }
      
      return {
        success: true,
        serverId: server.id,
        serverLoad: server.load
      };
    }
    
    // Chọn server dựa trên thuật toán
    selectServer() {
      // Lọc các server healthy
      const healthyServers = this.servers.filter(server => server.status === 'healthy');
      
      if (healthyServers.length === 0) {
        return null;
      }
      
      let selectedServer;
      
      switch (this.algorithm) {
        case 'round-robin':
          // Round-robin algorithm
          selectedServer = healthyServers[this.currentServerIndex % healthyServers.length];
          this.currentServerIndex++;
          break;
          
        case 'least-connections':
          // Least connections algorithm - chọn server có ít load nhất
          selectedServer = healthyServers.reduce((min, server) => 
            server.load < min.load ? server : min, healthyServers[0]);
          break;
          
        case 'weighted':
          // Weighted algorithm - chọn server dựa trên khả năng còn lại
          const totalAvailable = healthyServers.reduce((sum, server) => 
            sum + (server.maxLoad - server.load), 0);
            
          if (totalAvailable <= 0) {
            // Tất cả servers đều đầy tải
            selectedServer = healthyServers[0];
          } else {
            // Chọn ngẫu nhiên dựa trên không gian còn lại
            let random = Math.random() * totalAvailable;
            for (const server of healthyServers) {
              const available = server.maxLoad - server.load;
              if (random < available) {
                selectedServer = server;
                break;
              }
              random -= available;
            }
            if (!selectedServer) selectedServer = healthyServers[0];
          }
          break;
          
        default:
          selectedServer = healthyServers[0];
      }
      
      return selectedServer;
    }
    
    // Thực hiện health check
    performHealthChecks() {
      this.servers.forEach(server => {
        // 1% chance of server failing health check
        if (Math.random() < 0.01) {
          server.status = 'unhealthy';
          
          // Auto-recovery sau 20-30s
          const recoveryTime = 20000 + Math.floor(Math.random() * 10000);
          setTimeout(() => {
            if (server.status === 'unhealthy') {
              server.status = 'healthy';
            }
          }, recoveryTime);
        }
      });
    }
    
    // Mô phỏng giảm load theo thời gian
    simulateLoadDecrease() {
      this.servers.forEach(server => {
        // Giảm load 5-15% mỗi 5 giây
        const decrease = Math.floor(Math.random() * 11) + 5;
        server.load = Math.max(0, server.load - decrease);
      });
    }
    
    // Kiểm tra và thực hiện auto-scaling
    checkScaling() {
      if (!this.autoScalingEnabled) return;
      
      // Tính trung bình load của tất cả server
      const healthyServers = this.servers.filter(server => server.status === 'healthy');
      const avgLoad = healthyServers.reduce((sum, server) => sum + server.load, 0) / healthyServers.length;
      
      // Scale up nếu load trung bình cao và chưa đạt max servers
      if (avgLoad > this.scaleUpThreshold && this.servers.length < this.maxServers) {
        this.addServer();
      } 
      // Scale down nếu load trung bình thấp và trên min servers
      else if (avgLoad < this.scaleDownThreshold && this.servers.length > this.minServers) {
        this.removeServer();
      }
    }
    
    // Thêm server mới
    addServer() {
      const serverId = `server-${this.servers.length + 1}`;
      this.servers.push({
        id: serverId,
        status: 'healthy',
        load: 0,
        maxLoad: 100
      });
      
      console.log(`[LOAD BALANCER] Added new server: ${serverId}`);
    }
    
    // Xóa bỏ server có ít load nhất
    removeServer() {
      // Sắp xếp theo load để tìm server có ít load nhất
      const sortedServers = [...this.servers].sort((a, b) => a.load - b.load);
      const serverToRemove = sortedServers[0];
      
      // Xóa server
      this.servers = this.servers.filter(server => server.id !== serverToRemove.id);
      
      console.log(`[LOAD BALANCER] Removed server: ${serverToRemove.id}`);
    }
    
    // Thay đổi thuật toán cân bằng tải
    setAlgorithm(algorithm) {
      if (['round-robin', 'least-connections', 'weighted'].includes(algorithm)) {
        this.algorithm = algorithm;
        return true;
      }
      return false;
    }
    
    // Kích hoạt/vô hiệu hóa auto-scaling
    toggleAutoScaling(enabled) {
      this.autoScalingEnabled = enabled;
      return this.autoScalingEnabled;
    }
    
    // Mô phỏng lỗi server
    simulateServerFailure(serverId) {
      const server = this.servers.find(s => s.id === serverId);
      if (server) {
        server.status = 'unhealthy';
        
        // Auto-recovery sau 30s
        setTimeout(() => {
          if (server.status === 'unhealthy') {
            server.status = 'healthy';
          }
        }, 30000);
        
        return true;
      }
      return false;
    }
    
    // Lấy thông tin trạng thái load balancer
    getStatus() {
      // Tính toán phân phối request
      const distribution = {};
      this.servers.forEach(server => {
        distribution[server.id] = this.requestsHistory.filter(r => r.serverId === server.id).length;
      });
      
      return {
        servers: this.servers,
        algorithm: this.algorithm,
        totalRequests: this.totalRequests,
        distribution,
        autoScalingEnabled: this.autoScalingEnabled,
        recentRequests: this.requestsHistory.slice(-10)
      };
    }
  }
  
  module.exports = new CloudLoadBalancer();