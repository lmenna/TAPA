source SetMongoEnv.sh
echo "Build system"
npm run build
echo "Getting coinmetrics data file."
cd ./data
curl -LO https://coinmetrics.io/data/all.zip
cd -
echo "Run loader into MongoDB"
node bin/prod
