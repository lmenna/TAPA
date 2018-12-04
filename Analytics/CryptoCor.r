library(mongolite)

write_to_mongo <- function(cryptoCCY, value, fullText) {
  str <- c("{\"ticker\": \"")
  str <- paste(str,cryptoCCY,"\",\"tx_price_cor\":", sep="")
  str <- paste(str, value)
  str <- paste(str, ", \"text\": \"", fullText, "\"}", sep="")
  print(str)
  jsonlite::fromJSON(str)
  m2 <- mongo("marketdata.correlations", url = "mongodb://etherdev:didi22@ds121834.mlab.com:21834/crypto")
  m2$insert(str)
}

m <- mongo("marketdata.transaction_prices", url = "mongodb://etherdev:didi22@ds121834.mlab.com:21834/crypto")
r = m$find(query="{}")
str(r)
r$header
r$header$ticker
r$header$ticker[1]
str(r$data)
eth <- r$data[1][[1]]
btc <- r$data[2][[1]]
xem <- r$data[3][[1]]
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
print(toString(ct_eth))
print("Write correlations to the DB")
write_to_mongo("eth", ct_eth$estimate[[1]], toString(ct_eth))
write_to_mongo("btc", ct_btc$estimate[[1]], toString(ct_btc))
write_to_mongo("xem", ct_xem$estimate[[1]], toString(ct_xem))
