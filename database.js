/**
 * Module through which NodeJS server interfaces with MongoDB todo database
 */
'use strict';

let db, todos, backup;

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
			backup = new (require('mongo-dumper').DatabaseToFileDumper)({
				hosts: 'localhost:27017',
				output: {
					timestampLabel: 'YYYY-MM-DD_HH-mm-ss',
					prefix: 'backups/todos'
				}
			});
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
		todos.find({ 'date': theDate }).toArray().then((todoList) => {
			todoList.sort((a,b) => a.order - b.order);
			callback(todoList);
		});
	},
	/*
	 * Create todo from request body, adding a GUID and ordering
	 */
	createTodo: (body, callback) => {
		body._id = tools.guid();
		body = tools.todoFromBody(body);
		todos.find({ 'date': body.date }).toArray().then((dateTodos) => {
			body.order = dateTodos.length + 1;
			todos.insertOne(body, {}, (error, result) => {
				if (error) throw error;
				callback(result.result.ok === 1);
			});
		});
	},
	/*
     * Update todo with ID from request body
	 */
	updateTodo: (id, body, callback) => {
		body = tools.todoFromBody(body);
		todos.find({ '_id': id}).toArray().then((todo) => {
			if (todo.length === 0) {
				throw 'Todo to update not found';
			} else {
				if (todo[0].date !== body.date) {
					todos.find({ 'date': todo[0].date }).toArray().then((oldDateTodos) => {
						oldDateTodos.forEach((odt) => {
							if (odt.order > todo[0].order) {
								todos.updateOne({ '_id': odt._id }, { $set: { 'order': odt.order - 1 } }, {}, (e, r) => {
									if (e) throw e;
									if (result.result.ok !== 1) throw 'Error redating';
								});
							}
						});
					});
					todos.find({ 'date': body.date }).toArray().then((newDateTodos) => {
						body.order = newDateTodos.length + 1;
						todos.updateOne({ '_id': id }, { $set: body }, {}, (error, result) => {
							if (error) throw error;
							callback(result.result.ok === 1);
						});
					});
				} else {
					todos.updateOne({ '_id': id }, { $set: body }, {}, (error, result) => {
						if (error) throw error;
						callback(result.result.ok === 1);
					});
				}
			}
		});
	},
	/*
     * Deletes todo with ID
	 */
	deleteTodo: (id, callback) => {
		todos.find({ '_id': id }).toArray().then((todo) => {
			if (todo.length === 0) {
				throw 'Todo to delete not found';
			} else {
				todos.find({ 'date': todo[0].date }).toArray().then((dateTodos) => {
					dateTodos.forEach((dt) => {
						if (dt.order > todo[0].order) {
							todos.updateOne({ '_id': dt._id }, { $set: { 'order': dt.order - 1 } }, {}, (e, r) => {
								if (e) throw e;
								if (r.result.ok !== 1) throw 'Error adjusting todos around deleted todo';
							});
						}
					});
					todos.deleteOne({ _id: id }, {}, (error, result) => {
						if (error) throw error;
						callback(result.result.ok === 1);
					});
				});
			}
		});
	},
	/*
	 * Move undone todos from the past to today
	 * Throws an error if operation unsuccessful
	 */
	rolloverTodos: (callback) => {
		let today = tools.getAbsDate('today');
		let success = true;
		todos.find({ 'date': today }).toArray().then((existingTodos) => {
			todos.find({ 'date': { $lt: today}, 'done': false }).toArray().then((rollingOver) => {
				rollingOver.forEach((r, i) => {
					todos.updateOne({ '_id': r._id }, { $set: { 'date': today, 'order': existingTodos.length + i } }, {}, (error, result) => {
						if (error) throw error;
						success = success && (result.matchedCount === 0 || result.result.ok === 1);
					});
				});
				callback(success);
			});
		});
	},
	/*
	 * Backs up the todo database
	 */
	backup: () => {
		backup.transport();
	},
	/*
	 * Close the connection to the database
	 */
	disconnect: () => {
		backup.transport();
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
