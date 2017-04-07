echo "Testing PrettyGoodTodo..."
forever start --minUptime 1000 --spinSleepTime 1000 --uid "pgt" -o pgt-server.log -a -l forever.log pgt-server.js
forever stop pgt-server.js
echo "Test successful"
