/**
 * PrettyGoodTodo NodeJS server: provides static content and API with which client page interacts
 */
'use strict';

const config = require('./config.js');
const startupOps = require('./startup.js');

/*
 * Connect to database then perform server startup operations
 */
try {
    (async () => {
        console.log(Date.now() + ': Connecting to todo database...');
        await startupOps.connectToDB(config);
        console.log(Date.now() + ': Connected to todo database successfully');
        console.log(Date.now() + ': Starting server...');
        startupOps.createServer();
        startupOps.initializeAPI();
        startupOps.startServer(config, (port) => {
            console.log(Date.now() + ': Server started and running on http://localhost:' + port + '/');
            startupOps.initializeShutdownHandler();
        });
    })();
} catch (e) {
    console.log(e);
    throw e;
}

