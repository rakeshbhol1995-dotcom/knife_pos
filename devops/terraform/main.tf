# Terraform Configuration — petpooja Infrastructure (Free-Tier & Budget Friendly)
# Designed for ap-south-1 (Mumbai) Region

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "ap-south-1" # Mumbai Region
}

# 1. Automatic SSH Key Pair Generation
resource "tls_private_key" "petpooja_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "petpooja-key"
  public_key = tls_private_key.petpooja_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.petpooja_key.private_key_pem
  filename        = "${path.module}/petpooja-key.pem"
  file_permission = "0600"
}

# 2. VPC Configuration
resource "aws_vpc" "petpooja_vpc" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "petpooja-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.petpooja_vpc.id
  tags = {
    Name = "petpooja-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.petpooja_vpc.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = "ap-south-1b"
  map_public_ip_on_launch = true
  tags = {
    Name = "petpooja-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "rt" {
  vpc_id = aws_vpc.petpooja_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "petpooja-rt"
  }
}

resource "aws_route_table_association" "rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.rt.id
}

# 3. Security Group
resource "aws_security_group" "petpooja_sg" {
  name        = "petpooja-server-sg"
  description = "Allow Web traffic and SSH for petpooja"
  vpc_id      = aws_vpc.petpooja_vpc.id

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Port 80"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Port 443"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Alternative Proxy Port 8080"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Node.js Backend server Port 5000"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 4. Latest Ubuntu 22.04 LTS AMI Data Source
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 5. EC2 Instance Configuration (100% Free-Tier & Self-Bootstrapped)
resource "aws_instance" "petpooja_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro" # 100% Free-Tier
  key_name      = aws_key_pair.generated_key.key_name

  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.petpooja_sg.id]

  root_block_device {
    volume_size           = 30 # Max AWS Free Tier allocation
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # User data to automatically boot and install database and dependencies
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # 1. Setup 4 GB Swap space to prevent out of memory issues
              fallocate -l 4G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # Update packages
              apt-get update -y
              apt-get install -y gnupg curl git unzip

              # 2. Install Node.js 20 LTS and NPM
              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs nginx

              # Install PM2 globally
              npm install -g pm2

              # 3. Install MongoDB Community Server 7.0
              curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg --yes
              echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
              apt-get update -y
              apt-get install -y mongodb-org

              systemctl daemon-reload
              systemctl start mongod
              systemctl enable mongod

              # 4. Create deployment workspace directory
              mkdir -p /var/www/petpooja
              chown -R ubuntu:ubuntu /var/www/petpooja

              echo "=== EC2 Instance Bootstrapped Successfully ===" > /var/log/bootstrap.log
              EOF

  tags = {
    Name = "petpooja-ec2-server"
  }
}

# Output public IP
output "ec2_public_ip" {
  value       = aws_instance.petpooja_server.public_ip
  description = "The public IP of your new EC2 Web Server"
}
