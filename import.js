/**
 * NodeJS script to import GoodTodo data into PrettyGoodTodo
 */
'use strict';

/*
 * Ensure file name is provided
 */
if (process.argv.length < 3) {
	console.log('Usage: node import.js <csvFileName>');
	process.exit(-1);
}

const dbOps = require('./database.js');
let queue = require('seq-queue').createQueue(1000);
let count = 0;

/*
 * Connect to database then process CSV file
 */
dbOps.connect(() => {
	require('fast-csv').fromPath(process.argv[2], { headers: true })
		.on('data', (data) => tools.parseTodo(data))
		.on('end', () => tools.shutdown());
});

/*
 * CSV event handlers and helper functions
 */
const tools = {
	/*
	 * Parse CSV record as a todo and add to database
	 */
	parseTodo: (data) => {
		count++;
		let newTodo = {
			'date': tools.translateDate(data['Todo Date']),
			'title': data['Title'],
			'body': data['Body'],
			'done': data['Status'] === 'Done'
		};
		queue.push((task) => {
			dbOps.createTodo(newTodo, (success) => {
				if (!success) throw 'Error importing todo';
				task.done();
			});
		});
	},
	/*
	 * Helper function for parseTodo: translate date from CSV record to ISO string date
	 */
	translateDate: (string) => {
		let date = new Date(string);
		date.setUTCHours(0, 0, 0, 0);
		return date.toISOString();
	},
	/*
	 * Shutdown process after all records processed
	 */
	shutdown: () => {
		queue.push((task) => {
			console.log('Imported ' + count + ' todo' + (count == 1 ? '' : 's'));
			dbOps.disconnect();
			queue.close();
			process.exit(0);
		});
	}
};
