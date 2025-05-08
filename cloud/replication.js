// Mô phỏng Data Replication trong Cloud Environment
class CloudReplication {
    constructor() {
      // Mô phỏng các regions
      this.regions = [
        { name: 'asia-southeast1', status: 'active', latency: 20 },
        { name: 'us-central1', status: 'active', latency: 150 },
        { name: 'europe-west1', status: 'active', latency: 200 }
      ];
      
      // Số lượng bản sao cho mỗi dữ liệu
      this.replicationFactor = 2;
      
      // Cache mô phỏng
      this.dataCache = new Map();
      
      // Simulation state
      this.simulationActive = false;
      
      // Replication history
      this.replicationLogs = [];
      
      // Replication stats
      this.stats = {
        totalReplications: 0,
        successfulReplications: 0,
        failedReplications: 0
      };
    }
    
    // Mô phỏng việc lưu dữ liệu vào nhiều regions
    async replicateData(key, data) {
      // Chọn regions cho replication
      const targetRegions = this.selectRegionsForReplication();
      
      // Lưu vào cache
      this.dataCache.set(key, {
        data,
        regions: targetRegions.map(r => r.name),
        timestamp: new Date().toISOString()
      });
      
      // Mô phỏng việc ghi dữ liệu vào các regions
      const replicationPromises = targetRegions.map(region => 
        this.simulateWrite(key, data, region)
      );
      
      try {
        const results = await Promise.allSettled(replicationPromises);
        
        // Đếm số lượng thành công/thất bại
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;
        
        // Cập nhật stats
        this.stats.totalReplications += results.length;
        this.stats.successfulReplications += successful;
        this.stats.failedReplications += failed;
        
        // Ghi log
        this.replicationLogs.push({
          key,
          timestamp: new Date().toISOString(),
          targetRegions: targetRegions.map(r => r.name),
          successful,
          failed
        });
        
        // Chỉ giữ 100 log gần nhất
        if (this.replicationLogs.length > 100) {
          this.replicationLogs.shift();
        }
        
        return {
          success: successful > 0,
          replicatedTo: targetRegions
            .filter((_, index) => results[index].status === 'fulfilled')
            .map(r => r.name)
        };
      } catch (error) {
        console.error('Replication error:', error);
        return { success: false, error: error.message };
      }
    }
    
    // Mô phỏng việc đọc dữ liệu từ region gần nhất
    async readData(key) {
      const cachedData = this.dataCache.get(key);
      
      if (!cachedData) {
        return { success: false, error: 'Data not found' };
      }
      
      // Tìm region có độ trễ thấp nhất trong số các region có dữ liệu
      const availableRegions = this.regions.filter(r => 
        r.status === 'active' && cachedData.regions.includes(r.name)
      );
      
      if (availableRegions.length === 0) {
        return { success: false, error: 'No available region has this data' };
      }
      
      // Chọn region có độ trễ thấp nhất
      const nearestRegion = availableRegions.reduce((min, current) => 
        current.latency < min.latency ? current : min
      , availableRegions[0]);
      
      // Mô phỏng việc đọc dữ liệu
      try {
        const result = await this.simulateRead(key, nearestRegion);
        return {
          success: true,
          data: cachedData.data,
          readFrom: nearestRegion.name,
          latency: result.latency
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    // Mô phỏng việc chọn regions để nhân bản
    selectRegionsForReplication() {
      // Lọc regions đang hoạt động
      const activeRegions = this.regions.filter(r => r.status === 'active');
      
      // Nếu không đủ regions hoạt động
      if (activeRegions.length <= this.replicationFactor) {
        return activeRegions;
      }
      
      // Chọn ngẫu nhiên regions để sao chép
      const selectedRegions = [];
      const regionsCopy = [...activeRegions];
      
      for (let i = 0; i < this.replicationFactor; i++) {
        const randomIndex = Math.floor(Math.random() * regionsCopy.length);
        selectedRegions.push(regionsCopy[randomIndex]);
        regionsCopy.splice(randomIndex, 1);
      }
      
      return selectedRegions;
    }
    
    // Mô phỏng việc ghi dữ liệu vào một region
    async simulateWrite(key, data, region) {
      return new Promise((resolve, reject) => {
        // Mô phỏng độ trễ
        setTimeout(() => {
          // Mô phỏng tỉ lệ lỗi 5%
          if (Math.random() < 0.05) {
            reject(new Error(`Write to ${region.name} failed`));
            return;
          }
          
          resolve({
            success: true,
            region: region.name,
            latency: region.latency + Math.floor(Math.random() * 50) // Thêm độ biến động
          });
        }, region.latency);
      });
    }
    
    // Mô phỏng việc đọc dữ liệu từ một region
    async simulateRead(key, region) {
      return new Promise((resolve, reject) => {
        // Mô phỏng độ trễ
        setTimeout(() => {
          // Mô phỏng tỉ lệ lỗi 2%
          if (Math.random() < 0.02) {
            reject(new Error(`Read from ${region.name} failed`));
            return;
          }
          
          resolve({
            success: true,
            region: region.name,
            latency: region.latency + Math.floor(Math.random() * 30) // Thêm độ biến động
          });
        }, region.latency);
      });
    }
    
    // Mô phỏng sự cố ở một region
    simulateRegionOutage(regionName) {
      const region = this.regions.find(r => r.name === regionName);
      if (region) {
        region.status = 'down';
        
        // Ghi log
        this.replicationLogs.push({
          timestamp: new Date().toISOString(),
          event: 'region_outage',
          region: regionName
        });
        
        // Tự động phục hồi sau 30s
        setTimeout(() => {
          region.status = 'active';
          
          // Ghi log phục hồi
          this.replicationLogs.push({
            timestamp: new Date().toISOString(),
            event: 'region_recovery',
            region: regionName
          });
        }, 30000);
        
        return true;
      }
      return false;
    }
    
    // Lấy thông tin về trạng thái replication
    getReplicationStatus() {
      return {
        activeRegions: this.regions.filter(r => r.status === 'active').length,
        totalRegions: this.regions.length,
        replicationFactor: this.replicationFactor,
        regions: this.regions,
        stats: this.stats,
        recentLogs: this.replicationLogs.slice(-10) // 10 logs gần nhất
      };
    }
    
    // Lấy danh sách các dữ liệu đã được sao chép
    getReplicatedData() {
      const result = [];
      
      for (const [key, value] of this.dataCache.entries()) {
        result.push({
          key,
          timestamp: value.timestamp,
          regions: value.regions
        });
      }
      
      return result;
    }
  }
  
  module.exports = new CloudReplication();