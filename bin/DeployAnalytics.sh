tar -zcf outbox/Analytics.tar.gz Analytics
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem outbox/Analytics.tar.gz $AWSUSER@"$AWSIP":inbox
