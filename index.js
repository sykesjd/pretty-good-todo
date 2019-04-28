/**
 * Client side startup: attach event listeners and go to today
 */
'use strict';

$(() => {
    startup.attachDateListeners();
    startup.attachButtonListeners();
    startup.attachKeyboardListeners();
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
            $('#todos').empty();
            ajaxOps.getTodos($('#dateSel').val(), (data) => {
                data.forEach((todo) => {
                    let element = todoOps.todoEl(todo);
                    todoOps.attachElListeners(element);
                    element.appendTo('#todos');
                });
            }, () => $('#errorReport').text('Error retrieving todos; reload the page'));
        });
        $('#next').click(() => {
            $('#dateSel').val((i, val) => dateTools.incDate(val)).change();
        });
        $('#prev').click(() => {
            $('#dateSel').val((i, val) => dateTools.decDate(val)).change();
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
                }, () => $('#errorReport').text('Error creating todo; reload the page'));
            }
        });
    },
    /*
     * Attach listeners to keyboard events
     */
    attachKeyboardListeners: () => {
        $(document).keydown((key) => {
            if ($('input').is(':focus') || $('textarea').is(':focus')) return;
            switch(key.which) {
                case keys.LARROW:
                case keys.K:
                    $($('#edit').is(':visible') ? '#editPrev' : '#prev').click();
                    break;
                case keys.RARROW:
                case keys.J:
                    $($('#edit').is(':visible') ? '#editNext' : '#next').click();
                    break;
                case keys.ESCAPE:
                case keys.T:
                    $($('#edit').is(':visible') ? '#editDate' : '#dateSel').val(dateTools.getToday()).change();
                    break;
            }
        });
    },
    /*
     * Set date to today and fetch today's todos
     */
    gotoToday: () => {
        $(document).trigger(jQuery.Event('keydown', { which: keys.T }));
    }
};

/*
 * Keycodes for event-handling keys
 */
const keys = {
    ESCAPE: 27,
    LARROW: 37,
    RARROW: 39,
    J: 74,
    K: 75,
    T: 84
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
     * Increment a date field's value
     */
    incDate: (val) => {
        let date = new Date(val);
        date.setUTCHours(date.getHours() + 24);
        return date.toJSON().slice(0, 10);
    },
    /*
     * Decrement a date field's value
     */
    decDate: (val) => {
        let date = new Date(val);
        date.setUTCHours(date.getHours() - 24);
        return date.toJSON().slice(0, 10);
    }
};
