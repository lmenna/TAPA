source ./bin/SetEnv.sh
echo "DeployRunMeFirst"
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem OnAWSRunMeFirst.sh $AWSUSER@"$AWSIP":
echo "DeployLoader"
./bin/DeployLoader.sh
echo "DeploySite"
./bin/DeploySite.sh
echo "DeployScripts"
./bin/DeployScripts.sh
echo "DeployAnalytics"
./bin/DeployAnalytics.sh
