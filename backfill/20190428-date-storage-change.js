(async () => {
    console.log('Connecting to todo database...');
    const config = require('../config.js');
    let db = await require('mongodb').MongoClient.connect(config.connectionString, {});
    let todos = db.collection(config.collectionName);
    console.log('Connected to todo database successfully');
    console.log('Updating date format on todos...');
    let todosToUpdate = await todos.find().toArray();
    for (let todo of todosToUpdate) {
        let newTodo = {
            date: todo.date.slice(0, 10).toString(),
            title: todo.title,
            body: todo.body,
            done: todo.done,
            order: todo.order
        };
        await todos.insertOne(newTodo, {});
        await todos.deleteOne({ '_id': todo._id }, {});
    }
    console.log('Date format updated on todos');
    process.exit(0);
})();
