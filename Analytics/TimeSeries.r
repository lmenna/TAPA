# To use mongolite the machine needs SSL support
# Ubuntu use libssl-dev and libsasl2-dev:
# > sudo apt-get install -y libssl-dev libsasl2-dev
# AWS Linux, Fedora, CentOS or RHEL use openssl-devel and cyrus-sasl-devel:
# > sudo yum install openssl-devel cyrus-sasl-devel
install.packages("mongolite")
library(mongolite)

shiftedCor <- function(array1, arrayToShift, shift) {
  shifted <- head(tail(arrayToShift, 365+shift), 365)
  return(cor.test(as.numeric(shifted), as.numeric(array1), use="complete.obs"))
}

urlMongo <- "mongodb://etherdev:didi22@ds117250.mlab.com:17250/crypto"
m <- mongo("marketdata.transaction_prices", url = urlMongo)
r = m$find(query="{}")
xem <- r$data[1][[1]]
eth <- r$data[2][[1]]
btc <- r$data[3][[1]]

head(eth$date)
head(eth$txCount)
# Convert date string to a date object
eth$dateObj <- as.Date(as.character(eth$date), format="%Y-%m-%d")
head(eth$dateObj)
# Convert strings to numbers for the txCount
eth$txCountNum <- as.numeric(eth$txCount)
head(eth$txCountNum)
# Take only most recent year of data
eth_year <- tail(eth,365)
btc_year <- tail(btc,365)
xem_year <- tail(xem,365)
print("head(eth_year)")
head(eth_year)
ct_eth <- cor.test(as.numeric(eth$txCount), as.numeric(eth$`price(USD)`), use="complete.obs")
print("eth price transaction correlation")
ct_eth
ct_eth_year <- cor.test(as.numeric(eth_year$txCount), as.numeric(eth_year$`price(USD)`), use="complete.obs")
print("eth_year price transaction correlation")
ct_eth_year
# Shift the ETH data by one day forward
for(x in 1:10) {
  eth_shift <- head(tail(eth, 365+x), 365)
  ct_eth_shift <- cor.test(as.numeric(eth_shift$txCount), as.numeric(eth_year$`price(USD)`), use="complete.obs")
  print(x)
  print(ct_eth_shift)
}
shiftWithFunction <- shiftedCor(eth_year$`price(USD)`, eth$txCount, 0)
print(shiftWithFunction)
shiftWithFunction <- shiftedCor(eth_year$`price(USD)`, eth$txCount, 6)
print(shiftWithFunction)
