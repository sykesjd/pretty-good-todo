/**
 * PrettyGoodTodo NodeJS server: provides static content and API with which client page interacts
 */
'use strict';

const config = require('./config.js');
const startupOps = require('./startup.js');

/*
 * Connect to database then perform server startup operations
 */
console.log('Connecting to todo database...');
startupOps.connectToDB(config, () => {
    console.log('Connected to todo database successfully');
    console.log('Starting server...');
    startupOps.createServer();
    startupOps.initializeAPI();
    startupOps.startServer(config, (port) => {
        console.log('Server started and running on http://localhost:' + port + '/');
        startupOps.initializeShutdownHandler();
    });
});
