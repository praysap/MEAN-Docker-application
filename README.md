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

 
# Three-tier application with MySQL Docker Setup

This is a simple MEAN that interacts with a MySQL database.

## Prerequisites

Before you begin, make sure you have the following installed:

- Docker
- Git (optional, for cloning the repository)

## Setup

1. Clone this repository (if you haven't already):

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```

2. Navigate to the project directory:

   ```bash
   cd your-repo-name
   ```

3. Create a `.env` file in the project directory to store your MySQL environment variables:

   ```bash
   touch .env
   ```

4. Open the `.env` file and add your MySQL configuration:

   ```
   MYSQL_HOST=mysql
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DB=your_database
   ```

## Usage

1. Start the containers using Docker Compose:

   ```bash
   docker-compose up --build
   ```



## Cleaning Up

To stop and remove the Docker containers, press `Ctrl+C` in the terminal where the containers are running, or use the following command:

```bash
docker-compose down
```

```bash
docker-compose stop
```

## To run this Three-tier application using  without docker-compose

- First create a docker image from Dockerfile
```bash
docker build -t praysap/user-backend:latest .
```

```bash
docker build -t praysap/user-frontend:latest .
```

- To pull the official MySQL 8.0 image from Docker Hub.
```bash
docker pull mysql:8.0
```

- Now, make sure that you have created a network using following command
```bash
docker network create threetier
```

- Attach both the containers in the same network, so that they can communicate with each other

- MySQL container 

```bash
docker run -d  
 --name mysql 
 --network=threetier 
 -e MYSQL_DATABASE=hws 
 -e MYSQL_ROOT_PASSWORD=root 
 -p 3306:3306 mysql:8.0

```
- Backend container

```bash
docker run -d  
 --name user-backend 
 --network=threetier 
 -e MYSQL_HOST=mysql 
 -e MYSQL_USER=root 
 -e MYSQL_PASSWORD=root 
 -e MYSQL_DB=hws 
 -p 3000:3000 
 praysap/user-backend:latest

```

- frontend container

```bash
docker run -d  
 --name user-frontend 
 --network=threetier 
 -e API_URL="http://3.91.227.132:3000" 
 -p 80:80 
 praysap/user-frontend:latest

```

- To to access the running Docker container with container ID and open an interactive bash shell inside it.

```bash
docker exec -it {container-ID} bash

```
📌 **Happy Deploying! 🚀**

