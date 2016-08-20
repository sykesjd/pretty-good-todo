pkill -2 -f "node pgt-server.js"
nohup node pgt-server.js > pgt-server.log &
echo "PrettyGoodTodo restarted"
