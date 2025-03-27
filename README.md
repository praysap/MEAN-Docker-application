# **User Log Management System Hosted on AWS EC2**

This guide provides step-by-step instructions to deploy an **Angular application** on an **AWS EC2 instance** using **PM2**, **Apache2 Web Server**, and **Let's Encrypt SSL**.

## **Table of Contents**
1. [Install Node.js, NPM, and Git](#install-nodejs-npm-and-git)
2. [Install Angular](#install-angular)
3. [Install MySQL](#install-mysql)
4. [Install Apache2](#install-apache2)
5. [Configure Apache2 Proxy](#configure-apache2-proxy)
6. [Install Dependencies & Start Server](#install-dependencies--start-server)
7. [Install SSL Certificate](#install-ssl-certificate)
8. [Apache Configuration Files](#apache-configuration-files)

---

## **1. Install Node.js, NPM, and Git**
```sh
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs
sudo apt install git
```

## **2. Install Angular**
```sh
npm install -g @angular/cli
ng version
```

### **Clone the project from your repository**
```sh
git clone <your-repo-url>
```

## **3. Install MySQL**
```sh
sudo apt install mysql-server
sudo systemctl start mysql
```

### **Create Database**
```sql
CREATE DATABASE hws;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Admin@123!';
FLUSH PRIVILEGES;
```
```sh
sudo systemctl restart mysql
```

## **4. Install Apache2**
```sh
sudo apt install apache2
sudo systemctl start apache2
sudo systemctl status apache2
```

## **5. Configure Apache2 Proxy**
```sh
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod ssl
```

### **Disable default configuration & enable new configuration**
```sh
a2dissite 000-default.conf
a2ensite newzyanmonster.conf
a2ensite zyanmonster-ssl.conf
systemctl reload apache2
apachectl configtest
systemctl restart apache2
```

## **6. Install Dependencies & Start Server**
```sh
sudo npm i pm2 -g
pm2 start index
```

## **7. Install SSL Certificate**
```sh
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d zyanmonster.live
```

### **Navigate to SSL Certificate Directory**
```sh
cd /etc/letsencrypt/live/zyanmonster.live/
```

## **8. Apache Configuration Files**
### **newzyanmonster.conf (Port 80)**
```apache
<VirtualHost *:80>
  ServerAdmin vipulsawalw
  DocumentRoot /var/www/html/client
  ServerName zyanmonster.live

  ErrorLog ${APACHE_LOG_DIR}/zyanmonster-error.log
  CustomLog ${APACHE_LOG_DIR}/zyanmonster-access.log common

  KeepAlive On
  ProxyPreserveHost On
  ProxyPass /node http://127.0.0.1:3000
  ProxyPassReverse /node http://127.0.0.1:3000

  RewriteEngine On
  RewriteCond %{SERVER_PORT} 80
  Redirect permanent / https://zyanmonster.live/

  <Directory "/var/www/html/client/">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

### **zyanmonster-ssl.conf (Port 443 - HTTPS)**
```apache
<VirtualHost *:443>
  ServerAdmin vipulsawalw
  DocumentRoot /var/www/html/client
  ServerName zyanmonster.live

  # SSL Configuration
  SSLEngine on
  SSLCertificateFile /etc/letsencrypt/live/zyanmonster.live/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/zyanmonster.live/privkey.pem

  # Logs
  ErrorLog ${APACHE_LOG_DIR}/zyanmonster-ssl-error.log
  CustomLog ${APACHE_LOG_DIR}/zyanmonster-ssl-access.log common

  # Proxy Configuration
  KeepAlive On
  ProxyPreserveHost On
  ProxyPass /node http://127.0.0.1:3000
  ProxyPassReverse /node http://127.0.0.1:3000

  # Directory Permissions
  <Directory "/var/www/html/client/">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

---

## **🎯 Conclusion**
By following these steps, you have successfully **deployed an Angular application on an AWS EC2 instance** with **Apache2, PM2, and SSL encryption**. Your application is now accessible securely over HTTPS.

🔹 **Next Steps:**
- Set up **Auto-Scaling** for high availability.
- Monitor logs using **AWS CloudWatch**.
- Optimize server performance with **caching mechanisms**.

📌 **Happy Deploying! 🚀**

