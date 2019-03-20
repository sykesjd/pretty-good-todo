/**
 * Module providing NodeJS server with startup functions
 */
'use strict';

const express = require('express');
const favicon = require('serve-favicon');
const dbOps = require('./database.js');
let app, server;

/*
 * Startup functions provided to NodeJS server
 */
module.exports = {
    /*
     * Connect to database
     */
    connectToDB: (config, callback) => {
        dbOps.connect(config, () => callback());
    },
    /*
     * Create server to serve static content
     */
    createServer: () => {
        app = express();
        app.use(require('body-parser').json());
        app.use('/', express.static(__dirname + '/'));
        app.use(favicon(__dirname + '/favicon.ico'));
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
     * Start and return the express server
     */
    startServer: (config, callback) => {
        server = app.listen(config.port, () => callback(config.port));
    },
    /*
     * Initialize shutdown handler to close database connection and server operations
     */
    initializeShutdownHandler: () => {
        if (process.platform === 'win32') tools.initWinWorkaround();
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
        dbOps.disconnect();
        server.close();
        process.exit(0);
    }
};
