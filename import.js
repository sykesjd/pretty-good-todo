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

dbOps.connect(() => {
	require('fast-csv').fromPath(process.argv[2], { headers: true })
		.on('data', (data) => tools.parseTodo(data))
		.on('end', () => tools.shutdown());
});

const tools = {
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
	translateDate: (string) => {
		let date = new Date(string);
		date.setUTCHours(0, 0, 0, 0);
		return date.toISOString();
	},
	shutdown: () => {
		queue.push((task) => {
			console.log('Importing ' + count + ' todos');
			dbOps.disconnect();
			queue.close();
			process.exit(0);
		});
	}
};
