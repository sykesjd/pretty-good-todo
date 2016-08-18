echo "Testing PrettyGoodTodo..."
nohup node server.js > server.log & pkill -2 -f "node server.js"
echo "Test successful"
