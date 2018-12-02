tar -zcvf cryptosite.tar.gz cryptosite
scp -i ~/Documents/AWS/WebAppT1.pem cryptosite.tar.gz ec2-user@3.16.108.222:inbox
