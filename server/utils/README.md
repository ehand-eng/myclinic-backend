# Logging Framework Documentation

## Overview

This lightweight logging framework provides comprehensive logging capabilities for the server-side application with the following features:

- **Multiple log levels**: ERROR, WARN, INFO, DEBUG
- **Request tracking**: Unique request IDs for tracing requests across the application
- **Performance monitoring**: Request duration tracking
- **Structured logging**: JSON format for easy parsing
- **File and console output**: Logs are written to both console and daily log files
- **Color-coded console output**: Different colors for different log levels
- **Express middleware**: Automatic request/response logging

## Features

### 🎯 **Log Levels**
- **ERROR** (0): Critical errors that need immediate attention
- **WARN** (1): Warning messages for potential issues
- **INFO** (2): General information about application flow
- **DEBUG** (3): Detailed debugging information

### 📊 **Request Tracking**
- Unique request ID for each incoming request
- Request duration monitoring
- Request/response logging with status codes
- User agent and IP address tracking

### 📁 **File Logging**
- Daily log files organized by log level
- JSON format for easy parsing and analysis
- Automatic log directory creation
- Separate files for each log level

### 🎨 **Console Output**
- Color-coded output for different log levels
- Timestamp and request ID display
- Structured data logging

## Usage

### Basic Logging

```javascript
const logger = require('./utils/logger');

// Different log levels
logger.error('Critical error occurred', { error: 'details' });
logger.warn('Warning message', { warning: 'details' });
logger.info('Information message', { info: 'details' });
logger.debug('Debug information', { debug: 'details' });
```

### Request-Specific Logging

```javascript
// In your route handlers
router.get('/example', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Processing request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path
    });
    
    // Your logic here
    
    const duration = Date.now() - startTime;
    logger.info('Request completed successfully', {
      requestId: req.requestId,
      duration: `${duration}ms`
    });
    
    res.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Express Middleware Integration

The framework includes a request logger middleware that automatically logs all incoming requests and responses:

```javascript
const { requestLogger } = require('./utils/logger');

// Add to your Express app
app.use(requestLogger);
```

## Configuration

### Environment Variables

Set the log level using the `LOG_LEVEL` environment variable:

```bash
# In your .env file
LOG_LEVEL=INFO  # Options: ERROR, WARN, INFO, DEBUG
```

### Log Files

Log files are automatically created in the `server/logs/` directory with the following naming convention:
- `YYYY-MM-DD-error.log` - Error level logs
- `YYYY-MM-DD-warn.log` - Warning level logs  
- `YYYY-MM-DD-info.log` - Info level logs
- `YYYY-MM-DD-debug.log` - Debug level logs

## Log Format

### Console Output
```
[2024-01-15T10:30:45.123Z] INFO [abc123def456]: Request completed successfully {"duration":"150ms"}
```

### File Output (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Request completed successfully",
  "data": {
    "duration": "150ms",
    "requestId": "abc123def456"
  },
  "requestId": "abc123def456"
}
```

## Best Practices

### 1. **Use Appropriate Log Levels**
- **ERROR**: Only for actual errors that need immediate attention
- **WARN**: For potential issues or unexpected but handled situations
- **INFO**: For normal application flow and important events
- **DEBUG**: For detailed debugging information

### 2. **Include Context**
Always include relevant context in your log messages:

```javascript
logger.info('User login successful', {
  requestId: req.requestId,
  userId: user.id,
  email: user.email,
  userAgent: req.get('User-Agent')
});
```

### 3. **Performance Monitoring**
Track performance for database operations and external API calls:

```javascript
const startTime = Date.now();
// ... your operation
const duration = Date.now() - startTime;
logger.info('Database query completed', {
  requestId: req.requestId,
  query: 'findUsers',
  duration: `${duration}ms`,
  resultCount: users.length
});
```

### 4. **Error Logging**
Always include error details and stack traces:

```javascript
} catch (error) {
  logger.error('Database operation failed', {
    requestId: req.requestId,
    operation: 'createUser',
    error: error.message,
    stack: error.stack,
    inputData: userData
  });
}
```

## Integration with Existing Code

The logging framework has been integrated into the `doctorRoutes.js` file as an example. You can apply the same pattern to other route files:

1. Import the logger: `const logger = require('../utils/logger');`
2. Add request tracking with `req.requestId`
3. Log at the start and end of each operation
4. Include performance metrics and relevant context
5. Use appropriate log levels for different types of messages

## Monitoring and Analysis

The JSON log format makes it easy to analyze logs using tools like:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Custom log analysis scripts**
- **Cloud logging services** (AWS CloudWatch, Google Cloud Logging)

## Performance Considerations

- Log files are written synchronously to ensure no log loss
- Console output is immediate for real-time monitoring
- Log level filtering reduces unnecessary processing
- Request IDs are lightweight and don't impact performance 