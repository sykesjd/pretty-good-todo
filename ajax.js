/**
 * AJAX operations for the client page
 */
'use strict';

const ajaxOps = {
	/*
	 * Get todos for the given date
	 */
	getTodos: (date, callback) => {
		$.ajax({
			url: apiURLs.GET + date,
			type: 'get',
			success: (data) => callback(data),
			error: () => {
				$('#errorReport').text('Error fetching todos; reload the page');
			}
		});
	},
	/*
	 * Create todo from data in new todo form
	 */
	createTodo: (callback) => {
		$.ajax({
			url: apiURLs.PUT,
			type: 'put',
			data: JSON.stringify(ajaxTools.newTodo()),
			headers: {
				'Content-Type': 'application/json'
			},
			success: () => callback(),
			error: () => {
				$('#errorReport').text('Error creating todo; reload the page');
			}
		});
	},
	/*
	 * Update a given todo
	 */
	updateTodo: (li, editBoxUsed, callback) => {
		$.ajax({
			url: apiURLs.POST + li.attr('data-id'),
			type: 'post',
			data: JSON.stringify(ajaxTools.todoFromEl(li, editBoxUsed)),
			headers: {
				'Content-Type': 'application/json'
			},
			success: () => callback(),
			error: () => {
				$('#errorReport').text('Error updating todo; reload the page');
			}
		});
	},
	/*
	 * Delete a given todo
	 */
	deleteTodo: (li, callback) => {
		$.ajax({
			url: apiURLs.DELETE + li.attr('data-id'),
			type: 'delete',
			success: () => callback(),
			error: () => {
				$('#errorReport').text('Error deleting todo; reload the page');
			}
		});
	}
};

/*
 * URL bases for the API endpoints
 */
const apiURLs = {
	GET: 'http://localhost:3000/v1/todos/',
	PUT: 'http://localhost:3000/v1/new',
	POST: 'http://localhost:3000/v1/update/',
	DELETE: 'http://localhost:3000/v1/delete/'
};

/*
 * Helper functions for the AJAX operations above
 */
const ajaxTools = {
	/*
	 * Create new todo object from new todo form
	 */
	newTodo: () => {
		return {
			'date': $('#todos').attr('data-date'),
			'title': $('#newTitle').val(),
			'body': $('#newMessage').val(),
			'done': false
		};
	},
	/*
	 * Create todo object from todo li data
	 */
	todoFromEl: (li, editBoxUsed) => {
		return {
			'_id': li.attr('data-id'),
			'date': $(editBoxUsed ? '#editDate' : '#todos').attr('data-date'),
			'title': li.attr('data-title'),
			'body': li.attr('data-body'),
			'done': li.attr('data-checked') === 'true',
			'order': parseInt(li.attr('data-order'))
		};
	}
};
