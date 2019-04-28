/**
 * AJAX operations for the client page
 */
'use strict';

const ajaxOps = {
    /*
     * Get todos for the given date
     */
    getTodos: (date, callback, error) => {
        $.ajax({
            url: location.origin + apiURLs.GET + date,
            type: 'get',
            success: (data) => callback(data),
            error: () => error()
        });
    },
    /*
     * Create todo from data in new todo form
     */
    createTodo: (callback, error) => {
        $.ajax({
            url: location.origin + apiURLs.PUT,
            type: 'put',
            data: JSON.stringify(ajaxTools.newTodo()),
            headers: {
                'Content-Type': 'application/json'
            },
            success: () => callback(),
            error: () => error()
        });
    },
    /*
     * Update a given todo
     */
    updateTodo: (li, editBoxUsed, callback, error) => {
        $.ajax({
            url: location.origin + apiURLs.POST + li.attr('data-id'),
            type: 'post',
            data: JSON.stringify(ajaxTools.todoFromEl(li, editBoxUsed)),
            headers: {
                'Content-Type': 'application/json'
            },
            success: () => callback(),
            error: () => error()
        });
    },
    /*
     * Delete a given todo
     */
    deleteTodo: (li, callback, error) => {
        $.ajax({
            url: location.origin + apiURLs.DELETE + li.attr('data-id'),
            type: 'delete',
            success: () => callback(),
            error: () => error()
        });
    }
};

/*
 * URL bases for the API endpoints
 */
const apiURLs = {
    GET: '/v1/todos/',
    PUT: '/v1/new',
    POST: '/v1/update/',
    DELETE: '/v1/delete/'
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
            'date': $('#dateSel').val(),
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
            'date': $(editBoxUsed ? '#editDate' : '#dateSel').val(),
            'title': li.attr('data-title'),
            'body': li.attr('data-body'),
            'done': li.attr('data-checked') === 'true',
            'order': parseInt(li.attr('data-order'))
        };
    }
};
