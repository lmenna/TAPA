cd /Users/yglm/Documents/Development/TAPA/express-arbmon-server/
echo 'Copy express-arbmon-server to /usr/local/dist/'
cp -r bin /usr/local/dist/arbmon/express-arbmon-server/.
cp -r dist /usr/local/dist/arbmon/express-arbmon-server/.

echo 'Copy dependencies in node_modules to /usr/local/dist'
cp -r node_modules /usr/local/dist/arbmon/express-arbmon-server/.

echo 'Deployment complete.  You can now run the express-arbmon-server using the commands,'
echo 'cd /usr/local/dist/arbmon/express-arbmon-server'
echo 'source /Users/yglm/Documents/Development/PrivateScripts/bin/SetMongoEnv.sh && node bin/prod'
