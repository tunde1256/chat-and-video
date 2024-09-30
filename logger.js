const { createLogger, transports, format } = require('winston');

const logger = createLogger({
    level: 'info',  // Sets the default log level to 'info'
    format: format.combine(
        format.timestamp(),  // Adds a timestamp to each log entry
        format.json()        // Logs messages in JSON format
    ),
    transports: [
        new transports.Console(),  // Outputs logs to the console
        new transports.File({ filename: 'error.log', level: 'error' }), // Error logs only
        new transports.File({ filename: 'combined.log' }) // Combined logs including all levels
    ]
});

// Create a stream object with a 'write' function for morgan
logger.stream = {
    write: function(message) {
        // Log messages from morgan at 'info' level
        logger.info(message.trim());
    }
};

module.exports = logger;
