# To use mongolite the machine needs SSL support
# Ubuntu use libssl-dev and libsasl2-dev:
# > sudo apt-get install -y libssl-dev libsasl2-dev
# AWS Linux, Fedora, CentOS or RHEL use openssl-devel and cyrus-sasl-devel:
# > sudo yum install openssl-devel cyrus-sasl-devel
# Install mongolite when running this from Rstudio not from Rscript
#install.packages("mongolite")

library(mongolite)

write_to_mongo <- function(cryptoCCY, value, fullText) {
  str <- c("{\"ticker\": \"")
  str <- paste(str,cryptoCCY,"\",\"tx_price_cor\":", sep="")
  str <- paste(str, value)
  str <- paste(str, ", \"text\": \"", fullText, "\"}", sep="")
  print(str)
  jsonlite::fromJSON(str)
  m2 <- mongo("marketdata.correlations", url = urlMongo)
  m2$insert(str)
}

urlMongo <- "mongodb://etherdev:didi22@ds117250.mlab.com:17250/crypto"
m <- mongo("marketdata.transaction_prices", url = urlMongo)
r = m$find(query="{}")
str(r)
r$header
r$header$ticker
r$header$ticker[1]
str(head(r$data))

eth <- r$data[14][[1]]
btc <- r$data[15][[1]]
xem <- r$data[6][[1]]
ethcor <- cor(as.numeric(eth$txCount), as.numeric(eth$`price(USD)`), use="complete.obs")
btccor <- cor(as.numeric(btc$txCount), as.numeric(btc$`price(USD)`), use="complete.obs")
xemcor <- cor(as.numeric(xem$txCount), as.numeric(xem$`price(USD)`), use="complete.obs")
cor.test(as.numeric(eth$txCount), as.numeric(eth$`price(USD)`), use="complete.obs")
cor.test(as.numeric(btc$txCount), as.numeric(btc$`price(USD)`), use="complete.obs")
cor.test(as.numeric(xem$txCount), as.numeric(xem$`price(USD)`), use="complete.obs")
ct_eth <- cor.test(as.numeric(eth$txCount), as.numeric(eth$`price(USD)`), use="complete.obs")
ct_btc <- cor.test(as.numeric(btc$txCount), as.numeric(btc$`price(USD)`), use="complete.obs")
ct_xem <- cor.test(as.numeric(xem$txCount), as.numeric(xem$`price(USD)`), use="complete.obs")
print("ETH correlation summary")
ct_eth$estimate[[1]]
ct_eth$conf.int[1]
ct_eth$conf.int[2]
print("BTC correlation summary")
ct_btc$estimate[[1]]
ct_btc$conf.int[1]
ct_btc$conf.int[2]
print("XEM correlation summary")
ct_xem$estimate[[1]]
ct_xem$conf.int[1]
ct_xem$conf.int[2]
print("Write correlations to the DB")

# Automation of data extraction from Mongo result set
tickers <- c("eth", "btc", "ltc", "xem")
for(ticker in tickers) {
  curIdx <- match(ticker, r$header$ticker)
  curDataSet <- r$data[curIdx][[1]]
  ct <- cor.test(as.numeric(curDataSet$txCount), as.numeric(curDataSet$`price(USD)`), use="complete.obs")
  write_to_mongo(ticker, ct$estimate[[1]], toString(ct))
  print(ticker)
  print(ct)
}

#write_to_mongo("eth", ct_eth$estimate[[1]], toString(ct_eth))
#write_to_mongo("btc", ct_btc$estimate[[1]], toString(ct_btc))
#write_to_mongo("xem", ct_xem$estimate[[1]], toString(ct_xem))
