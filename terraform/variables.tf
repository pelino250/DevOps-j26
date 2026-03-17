# ─────────────────────────────────────────────
# FleeMa Terraform Variables
# Define all input variables with descriptions
# ─────────────────────────────────────────────

# ── General Configuration ────────────────────

variable "aws_region" {
  description = "AWS region to deploy resources (e.g., us-east-1, us-west-2)"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "fleema"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ── Network Configuration ────────────────────

variable "vpc_cidr" {
  description = "CIDR block for VPC (10.0.0.0/16 = 65,536 IP addresses)"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet (10.0.1.0/24 = 256 IP addresses)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "AWS availability zone (e.g., us-east-1a)"
  type        = string
  default     = "us-east-1a"
}

# ── Security Configuration ───────────────────

variable "your_ip_address" {
  description = "Your public IP address for SSH access (format: x.x.x.x/32). Find at: https://checkip.amazonaws.com"
  type        = string
  # No default - user must provide for security
}

variable "ssh_key_name" {
  description = "Name for SSH key pair (will be created if doesn't exist)"
  type        = string
  default     = "fleema-dev-key"
}

# ── EC2 Configuration ────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type (t3.micro = 2 vCPU, 1GB RAM, free tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "ec2_volume_size" {
  description = "Root EBS volume size in GB (30GB free tier eligible)"
  type        = number
  default     = 30
}

# ── RDS Configuration ────────────────────────

variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro = 2 vCPU, 1GB RAM, free tier eligible)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "fleema"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "fleema_admin"
}

variable "db_password" {
  description = "PostgreSQL master password (min 8 characters, use strong password!)"
  type        = string
  sensitive   = true
  # No default - user must provide for security
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB (20GB free tier eligible)"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16.1"
}

# ── ElastiCache Configuration ────────────────

variable "redis_node_type" {
  description = "ElastiCache node type (cache.t3.micro = 2 vCPU, 0.5GB RAM)"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes (1 for dev, 2+ for prod high availability)"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

# ── Tags ─────────────────────────────────────

variable "common_tags" {
  description = "Common tags applied to all resources (for cost tracking and organization)"
  type        = map(string)
  default = {
    Project     = "FleeMa"
    ManagedBy   = "Terraform"
    Purpose     = "DevOps Learning"
  }
}
