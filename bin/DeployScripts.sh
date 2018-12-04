cd bin
tar -zcf ../outbox/awsbin.tar.gz awsbin
cd -
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem outbox/awsbin.tar.gz ec2-user@"$AWSIP":inbox
