/**
 * Operations for creating and adding event listeners to a todo list item
 */
'use strict';

const todoOps = {
	/*
	 * Attach event listeners to a newly-created todo li
	 */
	attachElListeners: (element) => {
		element.find('input[type="checkbox"]').change((e) => todoTools.markCompletion(e, element));
		element.find('.glyphicon-chevron-up').click(() => todoTools.moveUp(element));
		element.find('.glyphicon-chevron-down').click(() => todoTools.moveDown(element));
		element.find('.glyphicon-info-sign').click(() => element.find('.message').toggle());
		element.find('.glyphicon-edit').click((e) => todoTools.editTodo(element));
		element.find('.glyphicon-remove-sign').click(() => todoTools.deleteTodo(element));
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
						<span class="message container">\
							<p>' + todo.body.replace(/(?:\r\n|\r|\n)/g, '</p><p>') + '</p>\
						</span>\
					   </li>')
};

/*
 * Helper functions for the todo operations above
 */
const todoTools = {
	/*
	 * Handle checkbox event for a todo element
	 */
	markCompletion: (e, todoEl) => {
		todoEl.attr('data-checked', e.target.checked);
		ajaxOps.updateTodo(todoEl, false,
			() => $('#dateSel').change(),
			() => $('#errorReport').text('Error updating todo status; reload the page'));
	},
	/*
	 * Move a todo up in priority
	 */
	moveUp: (todoEl) => {
		let previous = todoEl.prev();
		if (previous.length > 0) {
			previous.attr('data-order', parseInt(previous.attr('data-order')) + 1);
			todoEl.attr('data-order', parseInt(todoEl.attr('data-order')) - 1);
			ajaxOps.updateTodo(previous, false, () => {
				ajaxOps.updateTodo(todoEl, false,
					() => $('#dateSel').change(),
					() => $('#errorReport').text('Error reordering todos; reload the page'));
			}, () => $('#errorReport').text('Error reordering todos; reload the page'));
		}
	},
	/*
	 * Move a todo down in priority
	 */
	moveDown: (todoEl) => {
		let next = todoEl.next();
		if (next.length > 0) {
			next.attr('data-order', parseInt(next.attr('data-order')) - 1);
			todoEl.attr('data-order', parseInt(todoEl.attr('data-order')) + 1);
			ajaxOps.updateTodo(next, false, () => {
				ajaxOps.updateTodo(todoEl, false,
					() => $('#dateSel').change(),
					() => $('#errorReport').text('Error reordering todos; reload the page'));
			}, () => $('#errorReport').text('Error reordering todos; reload the page'));
		}
	},
	/*
	 * Initialize the edit dialog for a todo
	 */
	editTodo: (todoEl) => {
		$('#new').hide();
		$('#edit').show();
		$('#editTitle').val(todoEl.attr('data-title'));
		$('#editMessage').val(todoEl.attr('data-body'));
		$('#editDate').val($('#dateSel').val()).attr('data-date', $('#todos').attr('data-date'));
		$('#editSubmit').click(() => {
			if ($('#editTitle').val() !== '') {
				todoEl.attr('data-title', $('#editTitle').val()).attr('data-body', $('#editMessage').val());
				ajaxOps.updateTodo(todoEl, true, () => {
					$('#editSubmit').unbind('click');
					$('#edit').hide();
					$('#new').show();
					$('#dateSel').change();
				}, () => $('#errorReport').text('Error updating todo; reload the page'));
			}
		});
	},
	/*
	 * Delete the chosen todo
	 */
	deleteTodo: (todoEl) => {
		ajaxOps.deleteTodo(todoEl,
			() => $('#dateSel').change(),
			() => $('#errorReport').text('Error deleting todo; reload the page'));
	}
};
