/**
 * Client side startup: attach event listeners and go to today
 */
'use strict';

$(() => {
	startup.attachDateListeners();
	startup.attachButtonListeners();
	startup.gotoToday();
});

/*
 * Startup functions for the client page
 */
const startup = {
	/*
	 * Attach listeners to date controls
	 */
	attachDateListeners: () => {
		$('#dateSel').change((e) => {
			$('#todos').empty().attr('data-date', dateTools.toISODate($('#dateSel').val()));
			ajaxOps.getTodos($('#todos').attr('data-date'), (data) => {
				data.forEach((todo) => {
					let element = todoOps.todoEl(todo);
					todoOps.attachElListeners(element);
					element.appendTo('#todos');
				});
			});
		});
		$('#next').click(() => {
			$('#dateSel').val((i, val) => dateTools.incDate(val)).change();
		});
		$('#prev').click(() => {
			$('#dateSel').val((i, val) => dateTools.decDate(val)).change();
		});
		$('#editDate').change(() => {
			$('#editDate').attr('data-date', dateTools.toISODate($('#editDate').val()));
		});
		$('#editNext').click(() => {
			$('#editDate').val((i, val) => dateTools.incDate(val)).change();
		});
		$('#editPrev').click(() => {
			$('#editDate').val((i, val) => dateTools.decDate(val)).change();
		});
	},
	/*
	 * Attach listeners to form buttons
	 */
	attachButtonListeners: () => {
		$('#editCancel').click(() => {
			$('#editSubmit').unbind('click');
			$('#edit').hide();
			$('#new').show();
		});
		$('#newSubmit').click(() => {
			if ($('#newTitle').val() !== '') {
				ajaxOps.createTodo(() => {
					$('#newTitle').val('');
					$('#newMessage').val('');
					$('#dateSel').change();
				});
			}
		});
	},
	/*
	 * Set date to today and fetch today's todos
	 */
	gotoToday: () => {
		$('#dateSel').val(dateTools.getToday()).change();
	}
};

/*
 * Date manipulation functions used by the startup operations
 */
const dateTools = {
	/*
	 * Get today in date field value form
	 */
	getToday: () => {
		let today = new Date();
		today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
		return today.toJSON().slice(0,10);
	},
	/*
	 * Get ISO string for the value of a date field
	 */
	toISODate: (dateVal) => {
		let date = new Date(dateVal);
		date.setUTCHours(0, 0, 0, 0);
		return date.toISOString();
	},
	/*
	 * Increment a date field's value
	 */
	incDate: (val) => {
		let date = new Date(val);
		date.setDate(date.getDate() + 1);
		return date.toJSON().slice(0, 10);
	},
	/*
	 * Decrement a date field's value
	 */
	decDate: (val) => {
		let date = new Date(val);
		date.setDate(date.getDate() - 1);
		return date.toJSON().slice(0, 10);
	}
};
