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


# Automation of data extraction from Mongo result set
start_time <- Sys.time()
tickers <- c("eth", "btc", "ltc", "xem", "eos", "maid", "bat", "dgb")
for(ticker in tickers) {
  curIdx <- match(ticker, r$header$ticker)
  curDataSet <- r$data[curIdx][[1]]
  ct <- cor.test(as.numeric(curDataSet$txCount), as.numeric(curDataSet$`price(USD)`), use="complete.obs")
  write_to_mongo(ticker, ct$estimate[[1]], toString(ct))
  print(ticker)
  print(ct)
}
end_time <- Sys.time()
print(end_time - start_time)
