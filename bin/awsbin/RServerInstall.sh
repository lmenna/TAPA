#!/bin/bash
#
# Note: Run this using sudo
#
#install R
yum install -y R

#install RStudio-Server 1.0.153 (2017-07-20)
wget https://download2.rstudio.org/rstudio-server-rhel-1.1.463-x86_64.rpm
yum install -y --nogpgcheck rstudio-server-rhel-1.1.463-x86_64.rpm
rm rstudio-server-rhel-1.1.463-x86_64.rpm

#install shiny and shiny-server (2017-08-25)
R -e "install.packages('shiny', repos='http://cran.rstudio.com/')"
wget https://download3.rstudio.org/centos5.9/x86_64/shiny-server-1.5.4.869-rh5-x86_64.rpm
yum install -y --nogpgcheck shiny-server-1.5.4.869-rh5-x86_64.rpm
rm shiny-server-1.5.4.869-rh5-x86_64.rpm

#add user=ruser with rpass
sudo useradd ruser
sudo echo rpass | sudo passwd --stdin ruser

#Needed to run mongolite. (For Fedora, CentOS or RHEL use openssl-devel and cyrus-sasl-devel:)
sudo yum install openssl-devel cyrus-sasl-devel
