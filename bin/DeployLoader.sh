tar -zcf outbox/TAPADataLoader.tar.gz TAPADataLoader
echo $AWSUSER@$AWSIP:inbox
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem outbox/TAPADataLoader.tar.gz $AWSUSER@"$AWSIP":inbox
