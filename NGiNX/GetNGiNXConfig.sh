export AWSIP="3.17.59.196"
#export AWSUSER="ec2-user"
export AWSUSER="ubuntu"
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem $AWSUSER@"$AWSIP":/etc/nginx/sites-available/* ./etc/nginx/sites-available
