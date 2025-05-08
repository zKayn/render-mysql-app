const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const appendFileAsync = promisify(fs.appendFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

// Tạo thư mục logs nếu không tồn tại
const ensureLogDirectoryExists = async () => {
  // Kiểm tra xem có đang chạy trên Render không
  const isRender = process.env.RENDER === 'true';
  
  if (!isRender) {
    // Chỉ tạo thư mục logs khi chạy local
    const logDir = path.join(__dirname, '../logs');
    if (!(await existsAsync(logDir))) {
      await mkdirAsync(logDir, { recursive: true });
    }
    return logDir;
  }
  
  // Trên Render, không cần thư mục logs
  return null;
};

// Mảng in-memory để lưu logs khi chạy trên Render
const memoryLogs = [];

// Logger để ghi lại hoạt động của ứng dụng
class CloudLogger {
  constructor() {
    this.logFileName = `app-${new Date().toISOString().slice(0, 10)}.log`;
    this.isRender = process.env.RENDER === 'true';
  }

  async log(level, message, data = {}) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        data,
      };
      
      if (this.isRender) {
        // Lưu vào bộ nhớ nếu chạy trên Render
        memoryLogs.push(logEntry);
        
        // Giới hạn số lượng logs lưu trong bộ nhớ
        if (memoryLogs.length > 1000) {
          memoryLogs.shift();
        }
      } else {
        // Ghi vào file nếu chạy ở local
        const logDir = await ensureLogDirectoryExists();
        if (logDir) {
          const logFilePath = path.join(logDir, this.logFileName);
          await appendFileAsync(logFilePath, JSON.stringify(logEntry) + '\n');
        }
      }
      
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    } catch (err) {
      console.error('Error writing to log:', err);
    }
  }

  async info(message, data) {
    return this.log('info', message, data);
  }

  async error(message, data) {
    return this.log('error', message, data);
  }

  async warning(message, data) {
    return this.log('warning', message, data);
  }

  async performance(action, duration) {
    return this.log('hiệu suất', `${action} hoàn thành vào ${duration}ms`, { duration });
  }
  
  // Lấy logs từ bộ nhớ hoặc từ file
  async getLogs() {
    if (this.isRender) {
      // Trả về từ bộ nhớ nếu chạy trên Render
      return memoryLogs;
    } else {
      // Đọc từ file nếu chạy ở local
      try {
        const logDir = path.join(__dirname, '../logs');
        const logFile = path.join(logDir, this.logFileName);
        
        if (await existsAsync(logFile)) {
          const logData = await promisify(fs.readFile)(logFile, 'utf8');
          return logData
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        }
        return [];
      } catch (err) {
        console.error('Error reading logs:', err);
        return [];
      }
    }
  }
}

module.exports = new CloudLogger();