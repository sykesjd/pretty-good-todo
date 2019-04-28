/**
 * Module through which NodeJS server interfaces with MongoDB todo database
 */
'use strict';

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
        todos = db.collection(config.collectionName);
        if (!(await tools.rolloverTodos()))
            throw 'Error rolling over todos';
    },
    /*
     * Get todos scheduled on the given date, rolling over if necessary
     */
    getTodos: async (date) => {
        let theDate = tools.getAbsDate(date);
        if (new Date(lastRollover) < new Date(tools.getAbsDate('today')) && !(await tools.rolloverTodos()))
            throw 'Error rolling over todos';
        return await tools.get(theDate);
    },
    /*
     * Create todo from request body, adding a GUID and ordering
     */
    createTodo: async (body) => {
        body._id = tools.guid();
        body = tools.todoFromBody(body);
        let dateTodos = await todos.find({ 'date': body.date }).toArray();
        body.order = dateTodos.length + 1;
        let insertResult = await todos.insertOne(body, {});
        return insertResult.result.ok === 1;
    },
    /*
     * Update todo with ID from request body
     */
    updateTodo: async (id, body) => {
        if (id !== body._id)
            return false;
        body = tools.todoFromBody(body);
        let todo = await todos.find({ '_id': id }).toArray();
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
        let todo = await todos.find({ '_id': id }).toArray();
        if (todo.length === 0)
            throw 'Todo to delete not found';
        let dateTodos = await todos.find({ 'date': todo[0].date }).toArray();
        for (let dt of dateTodos)
            if (dt.order > todo[0].order)
                await tools.adjustTodo(dt);
        let deleteResult = await todos.deleteOne({ '_id': id }, {});
        return deleteResult.result.ok === 1;
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
        lastRollover = tools.getAbsDate('today');
        let success = true;
        let expDate = new Date(lastRollover);
        expDate.setDate(expDate.getDate() - 60);
        let existingTodos = await todos.find({ 'date': lastRollover }).toArray();
        let rollingOver = await todos.find({ 'date': { $lt: lastRollover }, 'done': false }).toArray();
        for (let i = 0; i < rollingOver.length; i++) {
            let updateResult = await todos.updateOne({ '_id': rollingOver[i]._id }, { $set: { 'date': lastRollover, 'order': existingTodos.length + i + 1 } }, {});
            success = success && (updateResult.matchedCount === 0 || updateResult.result.ok === 1);
        }
        let deleteResult = await todos.deleteMany({ 'date': { $lt: expDate.toISOString() }, 'done': true }, {});
        return success && (deleteResult.matchedCount === 0 || deleteResult.result.ok === 1);
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
        let updateResult = await todos.updateOne({ '_id': id }, { $set: body }, {});
        return updateResult.result.ok === 1;
    },
    /*
     * Decrement order of given todo
     */
    adjustTodo: async (dt) => {
        let adjustResult = await todos.updateOne({ '_id': dt._id }, { $set: { 'order': dt.order - 1 } }, {});
        if (adjustResult.result.ok !== 1)
            throw 'Error adjusting surrounding todos';
    },
    /*
     * Creates todo object from body of request
     */
    todoFromBody: (body) => {
        let today = tools.getAbsDate('today');
        if (!body.done && new Date(body.date) < new Date(today))
            body.date = today;
        return body;
    },
    /*
     * Get todo date for given date object
     */
    getAbsDate: (date) => {
        let theDate = (date === 'today' ? new Date((new Date()).toDateString()) : new Date(date));
        theDate.setUTCHours(0, 0, 0, 0);
        return theDate.toISOString();
    },
    /*
     * Helper function for createTodo: create a GUID string
     */
    guid: () => tools.s4() + tools.s4() + '-' + tools.s4() + '-' + tools.s4()
                    + '-' + tools.s4() + '-' + tools.s4() + tools.s4() + tools.s4(),
    /*
     * Helper function for guid: create string of four hex digits
     */
    s4: () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
};
