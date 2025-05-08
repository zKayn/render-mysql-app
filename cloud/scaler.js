// Mô phỏng auto-scaling trong cloud
class CloudScaler {
    constructor() {
      this.instanceCount = 1;
      this.maxInstances = 10;
      this.minInstances = 1;
      this.requestThreshold = 10; // Số request/phút để thêm instance
      this.requestCounter = 0;
      this.lastScalingTime = Date.now();
      this.scalingCooldown = 60000; // 1 phút cooldown giữa các lần scaling
      this.lastScaleAction = null;
    }
  
    // Mô phỏng request gửi đến
    recordRequest() {
      this.requestCounter++;
      
      // Kiểm tra mỗi 10 giây
      if (Date.now() - this.lastScalingTime > 10000) {
        this.evaluateScaling();
      }
    }
  
    // Đánh giá nhu cầu scaling
    evaluateScaling() {
      const requestRate = this.requestCounter * 6; // Ước tính requests/phút
      const now = Date.now();
      
      // Kiểm tra xem có thể scale hay không (cooldown)
      if (now - this.lastScalingTime < this.scalingCooldown) {
        return;
      }
      
      // Scale up nếu vượt ngưỡng và chưa đạt max
      if (requestRate > this.requestThreshold && this.instanceCount < this.maxInstances) {
        this.scaleUp();
      } 
      // Scale down nếu thấp hơn 50% ngưỡng và trên min
      else if (requestRate < this.requestThreshold * 0.5 && this.instanceCount > this.minInstances) {
        this.scaleDown();
      }
      
      // Reset counter
      this.requestCounter = 0;
      this.lastScalingTime = now;
    }
  
    scaleUp() {
      this.instanceCount++;
      this.lastScaleAction = {
        action: 'scale_up',
        timestamp: new Date().toISOString(),
        newCount: this.instanceCount
      };
      console.log(`[CLOUD] Scaled up to ${this.instanceCount} instances due to high traffic`);
    }
  
    scaleDown() {
      this.instanceCount--;
      this.lastScaleAction = {
        action: 'scale_down',
        timestamp: new Date().toISOString(),
        newCount: this.instanceCount
      };
      console.log(`[CLOUD] Scaled down to ${this.instanceCount} instances due to low traffic`);
    }
  
    getStatus() {
      return {
        currentInstances: this.instanceCount,
        maxInstances: this.maxInstances,
        lastScaleAction: this.lastScaleAction,
        estimatedRequestRate: this.requestCounter * 6, // per minute
      };
    }
  }
  
  module.exports = new CloudScaler();