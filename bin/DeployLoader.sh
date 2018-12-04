tar -zcf outbox/TAPADataLoader.tar.gz TAPADataLoader
echo ec2-user@$AWSIP:inbox
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem outbox/TAPADataLoader.tar.gz ec2-user@"$AWSIP":inbox
