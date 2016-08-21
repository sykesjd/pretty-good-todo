# pretty-good-todo

PrettyGoodTodo is a local-use knock-off of GoodTodo, a todo application which allows you to assign dates to your todos and focus on only the todos for one day at a time.

This application is intended for use by a single user per instance and does not aim to be a production application for a multi-user base. It merely provides a simple alternative for those not wishing to pay GoodTodo's subscription fees.

This work is protected under the Creative Commons BY-NC-SA 4.0 license, which stipulates that this work can be shared and adapted upon freely so long as the original creator is attributed, it is used for non-commercial purposes, and it is shared under the same license. Contact me if you have any questions regarding these conditions.

## Installation

This application uses MongoDB as the back-end for storing todo data. Before installing this application, you must install an instance of MongoDB on your local machine and ensure it is running in the background as a service.

Once you have installed MongoDB, clone this repository then navigate into this directory and execute the command `npm install`. Once the installation is complete, you can start the application by executing the command `npm start`, which will start up a NodeJS server as a background process. To terminate that process, execute the command `npm stop`.

> **Note**: if you are using Windows, please use PowerShell instead of the standard command line.

## Overview

### Client-Facing Application

After executing `npm start`, navigate to `localhost:3000` in your browser to view the PrettyGoodTodo client. On this page, you will be presented with a list of today's todos. Above the list of todos is the navigation for date selection, where you can go to the next or previous day or select a day directly in the date field. On the right side of the list of todos is a form for creating a new todo, where you enter the name of the todo and an optional message to accompany the todo.

On each todo, you will see a checkbox for indicating whether the todo has been completed; an information icon for toggling viewing the message accompanying the todo; an edit icon for editing the todo, at which point the 'new todo' form becomes an 'edit todo' form; and a delete icon for deleting the todo entirely.

### Server Todo API

In addition to serving static content to `localhost:3000`, the NodeJS server also provides the API through which the client page interfaces with the todo database. The API has the following endpoints:

- `v1/todos/{date}`: GET todos for the given date
- `v1/new`: PUT a new todo using the data from the request body
- `v1/update/{todoID}`: POST an update to the existing todo with the given ID using the data from the request body
- `v1/delete/{todoID}`: DELETE the todo with the given ID

You can test these endpoints apart from the client interface using an application such as Postman.

### Todo Rollover Behavior

Like GoodTodo, this application rolls over undone todos from past days into the current day. This action is performed at application startup and when the GET endpoint is invoked on a day after the last rollover.

### Automated Database backups

The MongoDB todo database is automatically backed up by this application on every daily rollover and on application shutdown. Backups are placed in a `backups` directory and can be used to transfer a database from one computer to another (see MongoDB documentation).

## Contents

- `pgt-server.js`: the main NodeJS server script - connects to the database and starts up the server and API
- `startup.js`: module used by the NodeJS server containing startup operations
- `database.js`: module used by the NodeJS application to interface with MongoDB
- `import.js`: NodeJS script to import data from GoodTodo
- `index.html`: the client-facing application page
- `index.js`: the client-side script used by `index.html` to attach event listeners and initialize the page to show today's todos
- `ajax.js`: client-side script through which the client application interfaces with the server's API
- Shell scripts: scripts used by the npm package to start, stop, and test this application (hence the necessity for PowerShell on Windows); located in the `scripts` directory

### Using a different database

If you wish to use a different back-end than MongoDB, then you must create your own `database.js` with the following functions exported:

- `connect(callback)`: connects to your database then executes `callback()`
- `getTodos(date, callback)`: gets the todos for the given date from your database and returns the list of todos via `callback(todoList)`
- `createTodo(body, callback)`: adds a todo to your database from the data in the request body and returns whether the operation was successful via `callback(success)`
	- Request body format (your function must add fields `_id` and `order`):
		```
		{
			'date': 'dateISOString',
			'title': 'todoTitle',
			'body': 'todoBody',
			'done': false
		}
		```
- `updateTodo(id, body, callback)`: updates the todo with the given id in your database using the data in the request body and returns whether the operation was successful via `callback(success)`
	- Request body format:
		```
		{
			'_id': 'GUID',
			'date': 'dateISOString',
			'title': 'todoTitle',
			'body': 'todoBody',
			'done': bool,
			'order': int
		}
		```
- `deleteTodo(id, callback)`: deletes the todo with the given id from your database and returns whether the operation was successful via `callback(success)`
- `disconnect()`: closes the connection to your database

## Importing from GoodTodo

This repository contains a script to import your GoodTodo data into the PrettyGoodTodo todo database. To import your GoodTodo data, perform the following steps:

1. After logging into GoodTodo, go to Preferences -> One-Time Email Export.
2. Under "Send in which format?", select "Comma-separated data, in an attachment".
3. Under "Select the range of todos to export", select "All of your todos - past, present, and future".
4. Click "Send Export", then log into your email to find the resulting email.
5. Download the CSV attachment in the email into this directory.
6. Navigate to this directory in your command line and execute the command `node import.js <csvFileName>`, replacing `<csvFileName>` with the name of your CSV file.

Upon completion of the import script, your todos should be viewable in PrettyGoodTodo.
