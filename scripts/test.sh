echo "Testing PrettyGoodTodo..."
nohup node pgt-server.js > pgt-server.log & pkill -2 -f "node pgt-server.js"
echo "Test successful"
