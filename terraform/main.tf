# ─────────────────────────────────────────────
# FleeMa Terraform Main Configuration
# Beginner-friendly: all resources in one file
# ─────────────────────────────────────────────

# ── Provider Configuration ───────────────────
# Tells Terraform to use AWS and which region

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.common_tags, {
      Environment = var.environment
    })
  }
}

# ── Data Sources ─────────────────────────────
# Query AWS for existing information

# Get latest Ubuntu 22.04 AMI (Amazon Machine Image)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu's official AWS account)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── VPC (Virtual Private Cloud) ──────────────
# Your isolated network in AWS

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # Needed for RDS endpoint DNS
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# ── Internet Gateway ─────────────────────────
# Allows VPC to communicate with the internet

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# ── Public Subnets ───────────────────────────
# Subnets with internet access (for EC2 and RDS)
# RDS requires at least 2 subnets in different AZs

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true # Auto-assign public IP to instances

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24" # Second subnet in different AZ
  availability_zone       = "${var.aws_region}b" # Different AZ
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-b"
  }
}

# ── Route Table ──────────────────────────────
# Directs network traffic (route to internet via IGW)

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0" # All traffic
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

# Associate route table with public subnets
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ── Security Groups (Firewalls) ──────────────

# Security group for EC2 instance (web server)
resource "aws_security_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-sg"
  description = "Security group for web server (allows HTTP, HTTPS, SSH)"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from anywhere
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS from anywhere
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow SSH from your IP only (security best practice)
  ingress {
    description = "SSH from your IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_address]
  }

  # Allow SSH from GitHub Actions (for automated deployments)
  # NOTE: For production, use AWS Systems Manager Session Manager instead
  ingress {
    description = "SSH from anywhere (GitHub Actions)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # -1 means all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-web-sg"
  }
}

# Security group for RDS database
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL (allows access from EC2 only)"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL from EC2 security group only
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

# Security group for ElastiCache Redis
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for Redis (allows access from EC2 only)"
  vpc_id      = aws_vpc.main.id

  # Allow Redis from EC2 security group only
  ingress {
    description     = "Redis from EC2"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-sg"
  }
}

# ── SSH Key Pair ─────────────────────────────
# Generate SSH key for EC2 access

resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "deployer" {
  key_name   = var.ssh_key_name
  public_key = tls_private_key.ssh.public_key_openssh

  tags = {
    Name = "${var.project_name}-${var.environment}-key"
  }
}

# Save private key to local file (for SSH access)
resource "local_file" "private_key" {
  content         = tls_private_key.ssh.private_key_pem
  filename        = pathexpand("~/.ssh/${var.ssh_key_name}.pem")
  file_permission = "0400" # Read-only for owner (security requirement)
}

# ── EC2 Instance ─────────────────────────────
# Virtual server for running FleeMa application

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public_a.id # Use first subnet for EC2
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.deployer.key_name

  root_block_device {
    volume_type           = "gp3" # General Purpose SSD (faster than gp2)
    volume_size           = var.ec2_volume_size
    delete_on_termination = true
    encrypted             = true # Security best practice
  }

  # User data script runs on first boot
  user_data = <<-EOF
              #!/bin/bash
              # Update system packages
              apt-get update
              apt-get upgrade -y

              # Install basic utilities
              apt-get install -y curl wget git unzip

              # Create application user
              useradd -m -s /bin/bash fleema
              usermod -aG sudo fleema

              # Note: Docker will be installed via Ansible
              # This keeps infrastructure and configuration separate
              EOF

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Require IMDSv2 (security)
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-app"
    Role = "application-server"
  }
}

# ── RDS Subnet Group ─────────────────────────
# RDS requires at least 2 subnets in different AZs

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

# ── RDS PostgreSQL Instance ──────────────────
# Managed PostgreSQL database

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "16" # Use major version only, AWS will use latest minor version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2 # Auto-scaling up to 2x
  storage_type          = "gp3"
  storage_encrypted     = true # Security best practice

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Security: not accessible from internet

  backup_retention_period = 0 # 0 = no backups (free tier compatible, change to 1-7 for backups)
  backup_window           = "03:00-04:00" # UTC
  maintenance_window      = "mon:04:00-mon:05:00" # UTC

  skip_final_snapshot       = true # For dev; set false for prod
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"

  # Performance Insights (free tier)
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres"
  }
}

# ── ElastiCache Subnet Group ─────────────────

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-subnet-group"
  }
}

# ── ElastiCache Redis Cluster ────────────────
# Managed Redis for caching and sessions

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-redis"
  }
}
