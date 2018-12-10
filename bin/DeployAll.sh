export AWSIP="18.222.138.192"
echo "DeployRunMeFirst"
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem OnAWSRunMeFirst.sh ec2-user@"$AWSIP":
echo "DeployLoader"
./bin/DeployLoader.sh
echo "DeploySite"
./bin/DeploySite.sh
echo "DeployScripts"
./bin/DeployScripts.sh
echo "DeployAnalytics"
./bin/DeployAnalytics.sh
