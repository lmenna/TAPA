cd /Users/yglm/Documents/Development/TAPA/arbmon/
echo 'Copy arbmon to /usr/local/dist/'
cp -r lib /usr/local/dist/arbmon/build-analytics/.

echo 'Copy dependencies in node_modules to /usr/local/dist'
cp -r node_modules /usr/local/dist/arbmon/build-analytics/.

echo 'Deployment complete.  You can now run arbmon using the command.'
echo '/Users/yglm/Documents/Development/PrivateScripts/bin/RunArbMonitor.sh'
