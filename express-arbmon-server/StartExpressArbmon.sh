echo 'Start the express server for Arbmon'
cd /usr/local/dist/arbmon/express-arbmon-server
source /Users/yglm/Documents/Development/PrivateScripts/bin/SetMongoEnv.sh && node bin/prod
echo
echo 'Enter https://localhost:3000/ to view the arbitrage monitor.'
 