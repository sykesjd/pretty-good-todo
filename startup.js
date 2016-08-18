/**
 * Module providing NodeJS server with startup functions
 */
'use strict';

const express = require('express');
const dbOps = require('./database.js');
const port = 3000;
let app, server, midnightOp;

/*
 * Startup functions provided to NodeJS server
 */
module.exports = {
	/*
	 * Connect to and roll over todos in database
	 */
	connectToDB: (callback) => {
		dbOps.connect(() => {
			dbOps.rolloverTodos();
			callback();
		});
	},
	/*
	 * Create server to serve static content
	 */
	createServer: () => {
		app = express();
		app.use(require('body-parser').json());
		app.use('/', express.static(__dirname + '/'));
	},
	/*
	 * Attach API listeners to server
	 */
	initializeAPI: () => {
		tools.initGET();
		tools.initPUT();
		tools.initPOST();
		tools.initDELETE();
	},
	/*
	 * Initialize operation occurring every midnight to roll over undone todos
	 */
	initializeMidnightOp: () => {
		midnightOp = require('node-schedule').scheduleJob({ hour: 0, minute: 0 }, () => dbOps.rolloverTodos());
	},
	/*
	 * Start and return the express server
	 */
	startServer: (callback) => {
		server = app.listen(port, () => callback(port));
	},
	/*
	 * Initialize shutdown handler to close database connection and server operations
	 */
	initializeShutdownHandler: () => {
		if (process.platform === 'win32') {
		  	tools.initWinWorkaround();
		}
		process.on('SIGINT', () => tools.shutdown());
	}
};

/*
 * Helper functions for the startup operations above
 */
const tools = {
	/*
	 * Initialize endpoint to GET todos for a given date
	 */
	initGET: () => {
		app.get('/v1/todos/:date', (req, res) => {
			dbOps.getTodos(req.params['date'], (todoList) => res.send(todoList));
		});
	},
	/*
	 * Initialize endpoint to PUT a new todo
	 */
	initPUT: () => {
		app.put('/v1/new/', (req, res) => {
			dbOps.createTodo(req.body, (success) => {
				res.status(success ? 201 : 400);
				res.send(success ? '' : 'Unable to create todo');
			});
		});
	},
	/*
	 * Initialize endpoint to POST an update to an existing todo with a given ID
	 */
	initPOST: () => {
		app.post('/v1/update/:todoID', (req, res) => {
			dbOps.updateTodo(req.params['todoID'], req.body, (success) => {
				res.status(success ? 200 : 404);
				res.send(success ? '' : 'Unable to update todo');
			});
		});
	},
	/*
	 * Initialize endpoint to DELETE a todo with a given ID
	 */
	initDELETE: () => {
		app.delete('/v1/delete/:todoID', (req, res) => {
			dbOps.deleteTodo(req.params['todoID'], (success) => {
				res.status(success ? 200 : 404);
				res.send(success ? '' : 'Unable to delete todo');
			});
		});
	},
	/*
	 * Initialize shutdown workaround for win32 systems
	 */
	initWinWorkaround: () => {
		const rl = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.on('SIGINT', () => process.emit('SIGINT'));
	},
	/*
	 * Shutdown procedure: close database connection and server operations
	 */
	shutdown: () => {
		console.log('Shutting down...');
		midnightOp.cancel();
		dbOps.disconnect();
		server.close();
		process.exit(0);
	}
};
