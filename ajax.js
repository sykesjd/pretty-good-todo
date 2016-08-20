/**
 * AJAX operations for the client page
 */
'use strict';

const ajaxOps = {
	/*
	 * Get todos for the given date
	 */
	getTodos: (date) => {
		$.ajax({
			url: apiURLs.GET + date,
			type: 'get',
			success: (data) => {
				data.forEach((todo) => {
					let element = tools.todoEl(todo);
					tools.attachElListeners(element);
					element.appendTo('#todos');
				});
			},
			error: () => {
				$('#errorReport').text('Error fetching todos; reload the page');
			}
		});
	},
	/*
	 * Create todo from data in new todo form
	 */
	createTodo: (callback) => {
		let todo = tools.newTodo();
		$.ajax({
			url: apiURLs.PUT,
			type: 'put',
			data: JSON.stringify(todo),
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
	updateTodo: (li, callback) => {
		let todo = tools.todoFromEl(li);
		$.ajax({
			url: apiURLs.POST + todo._id,
			type: 'post',
			data: JSON.stringify(todo),
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
const tools = {
	/*
	 * Attach event listeners to a newly-created todo li
	 */
	attachElListeners: (element) => {
		element.find('input[type="checkbox"]').change((e) => {
			element.attr('data-checked', e.target.checked);
			ajaxOps.updateTodo(element, () => $('#dateSel').change());
		});
		element.find('.glyphicon-chevron-up').click(() => {
			let previous = element.prev();
			if (previous.length > 0) {
				previous.attr('data-order', parseInt(previous.attr('data-order')) + 1);
				element.attr('data-order', parseInt(element.attr('data-order')) - 1);
				ajaxOps.updateTodo(previous, () => {
					ajaxOps.updateTodo(element, () => $('#dateSel').change());
				});
			}
		});
		element.find('.glyphicon-chevron-down').click(() => {
			let next = element.next();
			if (next.length > 0) {
				next.attr('data-order', parseInt(next.attr('data-order')) - 1);
				element.attr('data-order', parseInt(element.attr('data-order')) + 1);
				ajaxOps.updateTodo(next, () => {
					ajaxOps.updateTodo(element, () => $('#dateSel').change());
				});
			}
		});
		element.find('.glyphicon-info-sign').click(() => {
			element.find('.message').toggle();
		});
		element.find('.glyphicon-edit').click((e) => {
			$('#new').hide();
			$('#edit').show();
			$('#editTitle').val(element.attr('data-title'));
			$('#editMessage').val(element.attr('data-body'));
			$('#editSubmit').click(() => {
				if ($('#editTitle').val() !== '') {
					tools.updateEditedTodo(element);
				}
			});
		});
		element.find('.glyphicon-remove-sign').click(() => {
			ajaxOps.deleteTodo(element, () => $('#dateSel').change());
		});
	},
	/*
	 * Update todo data in its li from edit todo form and update todo
	 */
	updateEditedTodo: (element) => {
		element.attr('data-title', $('#editTitle').val()).attr('data-body', $('#editMessage').val());
		ajaxOps.updateTodo(element, () => {
			$('#editSubmit').unbind('click');
			$('#edit').hide();
			$('#new').show();
			$('#dateSel').change();
		});
	},
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
	todoFromEl: (li) => {
		return {
			'_id': li.attr('data-id'),
			'date': $('#todos').attr('data-date'),
			'title': li.attr('data-title'),
			'body': li.attr('data-body'),
			'done': li.attr('data-checked') === 'true',
			'order': parseInt(li.attr('data-order'))
		};
	},
	/*
	 * Create todo li from todo object
	 */
	todoEl: (todo) => $('<li class="list-group-item" data-id = "' + todo._id + '" data-title="' + todo.title + '"\
							data-body="' + todo.body + '" data-checked="' + todo.done + '" data-order="' + todo.order + '">\
						<span class="checkbox">\
							<label>\
								<input type="checkbox"' + (todo.done ? ' checked' : '') + ' />' + todo.title + '\
							</label>\
							<span class="pull-right">\
								<span class="glyphicon glyphicon-chevron-up"></span>\
								<span class="glyphicon glyphicon-chevron-down"></span>\
								<span class="glyphicon glyphicon-info-sign"></span>\
								<span class="glyphicon glyphicon-edit"></span>\
								<span class="glyphicon glyphicon-remove-sign"></span>\
							</span>\
						</span>\
						<p class="message">' + todo.body.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</p>\
					   </li>')
};
