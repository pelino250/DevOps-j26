# FleeMa Terraform Infrastructure

Beginner-friendly Terraform configuration for provisioning AWS infrastructure.

## Overview

This directory contains Infrastructure as Code (IaC) for the FleeMa application using Terraform.

**What's provisioned:**
- VPC with public subnet
- EC2 instance (t3.micro) for running Docker Compose
- RDS PostgreSQL database (db.t3.micro)
- ElastiCache Redis cluster (cache.t3.micro)
- Security groups for network access
- All necessary networking (Internet Gateway, route tables)

## Prerequisites

### 1. Install Terraform

**macOS:**
```bash
brew install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Windows:**
Download from [terraform.io/downloads](https://www.terraform.io/downloads)

**Verify installation:**
```bash
terraform version
# Should show: Terraform v1.6.0 or later
```

### 2. Install AWS CLI

**macOS/Linux:**
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Verify:**
```bash
aws --version
# Should show: aws-cli/2.x.x
```

### 3. Configure AWS Credentials

**Create AWS account** (free tier eligible): [aws.amazon.com/free](https://aws.amazon.com/free/)

**Create IAM user** with programmatic access:
1. AWS Console → IAM → Users → Add user
2. Username: `terraform-fleema`
3. Access type: Programmatic access
4. Permissions: Attach `AdministratorAccess` (for learning; restrict in production)
5. Save Access Key ID and Secret Access Key

**Configure AWS CLI:**
```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region name: us-east-1
# Default output format: json
```

**Verify:**
```bash
aws sts get-caller-identity
# Should show your account details
```

## Quick Start

### Step 1: Copy Variables Template

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

### Step 2: Edit Variables

Edit `terraform.tfvars` with your values:
```hcl
aws_region     = "us-east-1"
project_name   = "fleema"
environment    = "dev"
your_ip_address = "YOUR.PUBLIC.IP.ADDRESS/32"  # Find at: https://whatismyip.com
db_password    = "change-me-strong-password"
ssh_key_name   = "fleema-dev-key"  # Will be created
```

**Find your IP address:**
```bash
curl https://checkip.amazonaws.com
# Add /32 suffix: e.g., 203.0.113.45/32
```

### Step 3: Initialize Terraform

```bash
terraform init
```

**What this does:**
- Downloads AWS provider plugin
- Creates `.terraform/` directory
- Prepares backend (local state)

### Step 4: Plan Infrastructure

```bash
terraform plan
```

**What this does:**
- Shows what will be created
- Validates configuration
- Estimates costs (look for "Plan:" output)

**Review the plan carefully!** Ensure:
- No unexpected resources
- Costs align with free tier
- Security groups are correct

### Step 5: Apply (Create Infrastructure)

```bash
terraform apply
```

Type `yes` when prompted.

**Duration:** 5-10 minutes (RDS takes longest)

**What happens:**
1. VPC and networking created (~30 seconds)
2. Security groups created (~10 seconds)
3. EC2 instance launched (~1 minute)
4. RDS database created (~5 minutes)
5. ElastiCache created (~2 minutes)

**Save the outputs!** Terraform will print:
- EC2 public IP
- RDS endpoint
- Redis endpoint

### Step 6: Verify Infrastructure

**Check AWS Console:**
- EC2 → Instances (see your instance running)
- RDS → Databases (see PostgreSQL instance)
- ElastiCache → Redis (see Redis cluster)
- VPC → Your VPCs (see `fleema-dev-vpc`)

**SSH into EC2:**
```bash
# SSH key was auto-generated and saved
ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## File Structure

```
terraform/
├── main.tf                    # All resources (simple, single file)
├── variables.tf               # Input variable definitions
├── outputs.tf                 # Output values after apply
├── terraform.tfvars.example   # Example variable values
├── terraform.tfvars           # Your actual values (gitignored)
└── README.md                  # This file
```

**Why single main.tf?**
For learning, keeping all resources in one file makes it easier to understand how they connect. Advanced setups use modules, but we'll start simple.

## Understanding the Configuration

### VPC (Virtual Private Cloud)
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"  # 65,536 IP addresses
}
```
**What it is:** Your private network in AWS
**Why needed:** Isolates your resources from others

### Subnet
```hcl
resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"  # 256 IP addresses
}
```
**What it is:** Subdivision of VPC
**Why public:** Has internet access (for EC2)

### Security Group (Firewall)
```hcl
resource "aws_security_group" "web" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow HTTP from anywhere
  }
}
```
**What it is:** Firewall rules for EC2
**Rules:** HTTP (80), HTTPS (443), SSH (22 from your IP only)

### EC2 Instance
```hcl
resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id  # Ubuntu 22.04
  instance_type = "t3.micro"  # 2 vCPU, 1GB RAM (free tier)
}
```
**What it is:** Virtual server
**Runs:** Docker, Docker Compose, FleeMa application

### RDS PostgreSQL
```hcl
resource "aws_db_instance" "postgres" {
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"  # 2 vCPU, 1GB RAM
}
```
**What it is:** Managed PostgreSQL database
**Why managed:** Automatic backups, patches, high availability

### ElastiCache Redis
```hcl
resource "aws_elasticache_cluster" "redis" {
  engine        = "redis"
  node_type     = "cache.t3.micro"
  num_cache_nodes = 1
}
```
**What it is:** Managed Redis cluster
**Used for:** Caching, session storage

## Common Commands

```bash
# Initialize (first time or after adding providers)
terraform init

# Format code (clean up formatting)
terraform fmt

# Validate configuration (check syntax)
terraform validate

# Plan changes (preview what will happen)
terraform plan

# Apply changes (create/update infrastructure)
terraform apply

# Show current state
terraform show

# List all resources
terraform state list

# Destroy all infrastructure (CAREFUL!)
terraform destroy

# Target specific resource
terraform apply -target=aws_instance.app
```

## Cost Estimate

**With AWS Free Tier (first 12 months):**
- EC2 t3.micro: $0 (750 hours/month free)
- RDS db.t3.micro: $0 (750 hours/month free)
- ElastiCache: ~$12/month (no free tier)
- Data transfer: $0 (<100GB free)
- **Total: ~$12/month**

**After free tier:**
- EC2: ~$8/month
- RDS: ~$15/month
- ElastiCache: ~$12/month
- **Total: ~$35/month**

**Stop resources when not in use:**
```bash
# Stop EC2 (saves ~$8/month)
aws ec2 stop-instances --instance-ids <instance-id>

# Destroy everything when done learning
terraform destroy
```

## Troubleshooting

### Error: "No valid credential sources"

**Cause:** AWS credentials not configured

**Solution:**
```bash
aws configure
# Enter your Access Key ID and Secret
```

### Error: "Instance type t3.micro not available"

**Cause:** Region doesn't support t3.micro

**Solution:** Change region in `terraform.tfvars`:
```hcl
aws_region = "us-west-2"  # Try different region
```

### Error: "Insufficient permissions"

**Cause:** IAM user lacks required permissions

**Solution:** Attach `AdministratorAccess` policy to IAM user (in AWS Console)

### Error: "Resource already exists"

**Cause:** Manual resource with same name exists

**Solution:**
```bash
# Import existing resource into Terraform state
terraform import aws_vpc.main vpc-xxxxxxxx

# Or delete manual resource in AWS Console
```

### State file locked

**Cause:** Previous operation didn't complete

**Solution:**
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

## Next Steps

After infrastructure is provisioned:
1. SSH into EC2 instance
2. Install Docker and Docker Compose (see Ansible playbook)
3. Deploy FleeMa application
4. Configure database connection

Proceed to: [Phase 3: Ansible Basics](../docs/devops/03-ansible-basics.md)

## Learning Resources

- [Terraform Tutorial](https://learn.hashicorp.com/terraform)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [FleeMa DevOps Guide](../docs/devops/02-terraform-basics.md)
