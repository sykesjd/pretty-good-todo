/**
 * Module through which NodeJS server interfaces with MongoDB todo database
 */
'use strict';

const ObjectId = require('mongodb').ObjectID;
let db, todos, lastRollover;

/*
 * Database operations provided to NodeJS server
 */
module.exports = {
    /*
     * Connect to and return the MongoDB database and todo collection
     */
    connect: async (config) => {
        db = await require('mongodb').MongoClient.connect(config.connectionString, {});
        todos = db.db().collection(config.collectionName);
        if (!(await tools.rolloverTodos()))
            throw 'Error rolling over todos';
    },
    /*
     * Get todos scheduled on the given date, rolling over if necessary
     */
    getTodos: async (date) => {
        let theDate = tools.getDateString(date);
        if (lastRollover < tools.getDateString('today') && !(await tools.rolloverTodos()))
            throw 'Error rolling over todos';
        return await tools.get(theDate);
    },
    /*
     * Create todo from request body, adding ordering
     */
    createTodo: async (body) => {
        body = tools.todoFromBody(body);
        let dateTodos = await todos.find({ 'date': body.date }).toArray();
        body.order = dateTodos.length + 1;
        await todos.insertOne(body, {});
        return true;
    },
    /*
     * Update todo with ID from request body
     */
    updateTodo: async (id, body) => {
        if (id !== body._id)
            return false;
        body = tools.todoFromBody(body);
        let todo = await todos.find({ '_id': ObjectId(id) }).toArray();
        if (todo.length === 0)
            throw 'Todo to update not found';
        if (todo[0].date !== body.date) {
            let oldDateTodos = await todos.find({ 'date': todo[0].date }).toArray();
            for (let odt of oldDateTodos)
                if (odt.order > todo[0].order)
                    await tools.adjustTodo(odt);
            let newDateTodos = await todos.find({ 'date': body.date }).toArray();
            body.order = newDateTodos.length + 1;
        }
        return await tools.post(id, body);
    },
    /*
     * Deletes todo with ID
     */
    deleteTodo: async (id) => {
        let todo = await todos.find({ '_id': ObjectId(id) }).toArray();
        if (todo.length === 0)
            throw 'Todo to delete not found';
        let dateTodos = await todos.find({ 'date': todo[0].date }).toArray();
        for (let dt of dateTodos)
            if (dt.order > todo[0].order)
                await tools.adjustTodo(dt);
        await todos.deleteOne({ '_id': ObjectId(id) }, {});
        return true;
    },
    /*
     * Close the connection to the database
     */
    disconnect: () => {
        db.close();
    }
};

/*
 * Helper functions for the database operations above
 */
const tools = {
    /*
     * Move undone todos from the past to today and delete done todos older than 60 days
     */
    rolloverTodos: async () => {
        let today = tools.getDateString('today');
        let expDate = new Date(today);
        expDate.setDate(expDate.getDate() - 60);
        let existingTodos = await todos.find({ 'date': today }).toArray();
        let rollingOver = await todos.find({ 'date': { $lt: today }, 'done': false }).toArray();
        for (let i = 0; i < rollingOver.length; i++)
            await todos.updateOne({ '_id': ObjectId(rollingOver[i]._id) }, { $set: { 'date': today, 'order': existingTodos.length + i + 1 } }, {});
        await todos.deleteMany({ 'date': { $lt: expDate.toISOString() }, 'done': true }, {});
        lastRollover = today;
        return true;
    },
    /*
     * Perform get operation on the database
     */
    get: async (theDate) => {
        let todoList = await todos.find({ 'date': theDate }).toArray();
        return todoList.sort((a,b) => a.order - b.order);
    },
    /*
     * Perform post operation on the database
     */
    post: async (id, body) => {
        if (body._id)
            delete body._id; // delete necessary to prevent immutability error
        await todos.updateOne({ '_id': ObjectId(id) }, { $set: body }, {});
        return true;
    },
    /*
     * Decrement order of given todo
     */
    adjustTodo: async (dt) => {
        await todos.updateOne({ '_id': ObjectId(dt._id) }, { $set: { 'order': dt.order - 1 } }, {});
    },
    /*
     * Creates todo object from body of request
     */
    todoFromBody: (body) => {
        let today = tools.getDateString('today');
        if (!body.done && body.date < today)
            body.date = today;
        return body;
    },
    /*
     * Get todo date for given date object
     */
    getDateString: (date) => {
        let theDate = (date === 'today' ? new Date((new Date()).toDateString()) : new Date(date));
        return theDate.toJSON().slice(0, 10);
    }
};
