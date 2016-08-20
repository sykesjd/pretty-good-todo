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
			let date = new Date($('#dateSel').val());
			date.setUTCHours(0, 0, 0, 0);
			$('#todos').empty().attr('data-date', date.toISOString());
			ajaxOps.getTodos($('#todos').attr('data-date'), (data) => {
				data.forEach((todo) => {
					let element = todoOps.todoEl(todo);
					todoOps.attachElListeners(element);
					element.appendTo('#todos');
				});
			});
		});
		$('#next').click(() => {
			$('#dateSel').val((i, val) => {
				let date = new Date(val);
				date.setDate(date.getDate() + 1);
				return date.toJSON().slice(0, 10);
			}).change();
		});
		$('#prev').click(() => {
			$('#dateSel').val((i, val) => {
				let date = new Date(val);
				date.setDate(date.getDate() - 1);
				return date.toJSON().slice(0, 10);
			}).change();
		});
		$('#editDate').change(() => {
			let date = new Date($('#editDate').val());
			date.setUTCHours(0, 0, 0, 0);
			$('#editDate').attr('data-date', date.toISOString());
		});
		$('#editNext').click(() => {
			$('#editDate').val((i, val) => {
				let date = new Date(val);
				date.setDate(date.getDate() + 1);
				return date.toJSON().slice(0, 10);
			}).change();
		});
		$('#editPrev').click(() => {
			$('#editDate').val((i, val) => {
				let date = new Date(val);
				date.setDate(date.getDate() - 1);
				return date.toJSON().slice(0, 10);
			}).change();
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
		let today = new Date();
		today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
		$('#dateSel').val(today.toJSON().slice(0,10)).change();
	}
};
