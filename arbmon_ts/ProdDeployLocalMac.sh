cd /Users/yglm/Documents/Development/TAPA/arbmon_ts/
echo 'Copy arbmon_ts to /usr/local/dist/'
cp -r lib /usr/local/dist/arbmon/build-analytics_ts/.

echo 'Copy dependencies in node_modules to /usr/local/dist/'
cp -r node_modules /usr/local/dist/arbmon/build-analytics_ts/.

echo 'Deployment complete.  You can now run arbmon using the command.'
echo '/usr/local/dist/arbmon/bin/RunArbMonitor_ts.sh'
