/**
 * Module through which NodeJS server interfaces with MongoDB todo database
 * Todo object format:
 * 		{
 *			_id: 'someGUIDstr',
 *			date: dateObj, // newDate(date.toDateString())
 *			title: 'todoTitle',
 *			body: 'todoBody',
 *			done: bool
 *      }
 * Post request body has _id; put request body does not
 */
'use strict';

let db, todos;

/*
 * Database operations provided to NodeJS server
 */
module.exports = {
	/*
	 * Connect to and return the MongoDB database and todo collection
	 */
	connect: (callback) => {
		require('mongodb').MongoClient.connect('mongodb://localhost:27017/todos', {}, (error, database) => {
			if (error) throw error;
			db = database;
			todos = db.collection('todos');
			todos.createIndex({ date: 1 }, { expireAfterSeconds: tools.expiration() }, (err, res) => {
				if (err) throw err;
				callback();
			});
		});
	},
	/*
	 * Get todos scheduled on the given date
	 */
	getTodos: (date, callback) => {
		let theDate = tools.getAbsDate(date);
		todos.find({ 'date': theDate }).toArray().then((todoList) => callback(todoList));
	},
	/*
	 * Create todo from request body, adding a GUID
	 */
	createTodo: (body, callback) => {
		body._id = tools.guid();
		todos.insertOne(tools.todoFromBody(body), {}, (error, result) => {
			if (error) throw error;
			callback(result.result.ok === 1);
		});
	},
	/*
     * Update todo with ID from request body
	 */
	updateTodo: (id, body, callback) => {
		todos.updateOne({ _id: id }, { $set: tools.todoFromBody(body) }, {}, (error, result) => {
			if (error) throw error;
			callback(result.result.ok === 1);
		});
	},
	/*
     * Deletes todo with ID
	 */
	deleteTodo: (id, callback) => {
		todos.deleteOne({ _id: id }, {}, (error, result) => {
			if (error) throw error;
			callback(result.result.ok === 1);
		});
	},
	/*
	 * Move undone todos from the past to today
	 * Throws an error if operation unsuccessful
	 */
	rolloverTodos: () => {
		let today = tools.getAbsDate('today');
		todos.updateMany({ date: { $lt: today }, done: false }, { $set: { date: today } }, {}, (error, result) => {
			if (error) throw error;
			if (result.matchedCount > 0 && result.result.ok !== 1) {
				throw "Error rolling over undone todos to today";
			}
		});
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
	 * Specify the expiration time for records in seconds
	 */
	expiration: () => 60 * 60 * 24 * 60,
	/*
	 * Creates todo object from body of request
	 */
	todoFromBody: (body) => {
		let today = tools.getAbsDate('today');
		if (!body.done && new Date(body.date) < new Date(today)) {
			body.date = today;
		}
		return body;
	},
	/*
	 * Get todo date for given date object
	 */
	getAbsDate: (date) => {
		let theDate = (date === 'today' ? new Date((new Date()).toDateString()) : new Date(date))
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
