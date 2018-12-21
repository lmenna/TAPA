tar -zcf outbox/cryptosite.tar.gz cryptosite
scp -i /Users/yglm/Documents/AWS/WebAppT1.pem outbox/cryptosite.tar.gz $AWSUSER@$AWSIP:inbox
