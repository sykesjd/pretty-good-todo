/**
 * PrettyGoodTodo NodeJS server: provides static content and API with which client page interacts
 */
'use strict';

const startupOps = require('./startup.js');

/*
 * Connect to database then perform server startup operations
 */
console.log('Connecting to todo database...');
startupOps.connectToDB(() => {
	console.log('Connected to todo database successfully');
	console.log('Starting server...');
	startupOps.createServer();
	startupOps.initializeAPI();
	startupOps.initializeMidnightOp();
	startupOps.startServer((port) => {
		console.log('Server started and running on http://localhost:' + port + '/');
		startupOps.initializeShutdownHandler();
	});
});
