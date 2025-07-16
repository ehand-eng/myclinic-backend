const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message, data = null, requestId = null) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(data && { data }),
    ...(requestId && { requestId })
  };
  
  return JSON.stringify(logEntry);
};

// Write to log file
const writeToFile = (level, message, data = null, requestId = null) => {
  try {
    const logEntry = formatMessage(level, message, data, requestId);
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${date}-${level.toLowerCase()}.log`);
    
    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Console output with colors
const consoleOutput = (level, message, data = null, requestId = null) => {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (level.toUpperCase()) {
    case 'ERROR':
      color = colors.red;
      break;
    case 'WARN':
      color = colors.yellow;
      break;
    case 'INFO':
      color = colors.green;
      break;
    case 'DEBUG':
      color = colors.cyan;
      break;
  }
  
  const requestInfo = requestId ? ` [${requestId}]` : '';
  const dataInfo = data ? ` ${JSON.stringify(data)}` : '';
  
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}${requestInfo}: ${message}${dataInfo}${colors.reset}`);
};

// Main logging function
const log = (level, message, data = null, requestId = null) => {
  const levelNum = LOG_LEVELS[level.toUpperCase()];
  
  if (levelNum <= CURRENT_LOG_LEVEL) {
    consoleOutput(level, message, data, requestId);
    writeToFile(level, message, data, requestId);
  }
};

// Generate request ID
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Express middleware for request logging
const requestLogger = (req, res, next) => {
  const requestId = generateRequestId();
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  log('INFO', `${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  }, requestId);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    const level = status >= 400 ? 'WARN' : 'INFO';
    
    log(level, `${req.method} ${req.path} - ${status} (${duration}ms)`, {
      statusCode: status,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    }, requestId);
  });
  
  next();
};

// Export logging functions
module.exports = {
  error: (message, data = null, requestId = null) => log('ERROR', message, data, requestId),
  warn: (message, data = null, requestId = null) => log('WARN', message, data, requestId),
  info: (message, data = null, requestId = null) => log('INFO', message, data, requestId),
  debug: (message, data = null, requestId = null) => log('DEBUG', message, data, requestId),
  requestLogger,
  generateRequestId,
  LOG_LEVELS
}; 