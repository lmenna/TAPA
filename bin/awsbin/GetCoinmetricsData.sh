. ~/.bashrc
echo "Ensure right version of Node is installed"
nvm install 11
node --version
loaderDir=/home/ec2-user/TAPADataLoader
dataDir=/home/ec2-user/TAPADataLoader/data
cd $dataDir
echo "Getting data from coinmetrics"
curl -LO https://coinmetrics.io/data/all.zip
cd -
cd $loaderDir
npm run prod
cd -
