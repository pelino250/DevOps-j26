# ─────────────────────────────────────────────
# FleeMa Terraform Outputs
# Values displayed after terraform apply
# ─────────────────────────────────────────────

# ── EC2 Instance Outputs ─────────────────────

output "ec2_public_ip" {
  description = "Public IP address of EC2 instance (use for SSH and web access)"
  value       = aws_instance.app.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID (use with AWS CLI: aws ec2 describe-instances)"
  value       = aws_instance.app.id
}

output "ssh_command" {
  description = "SSH command to connect to EC2 instance"
  value       = "ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_instance.app.public_ip}"
}

# ── Database Outputs ─────────────────────────

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (hostname:port for database connection)"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS hostname only (without port)"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS port (default: 5432)"
  value       = aws_db_instance.postgres.port
}

output "database_connection_string" {
  description = "PostgreSQL connection string for application (password excluded for security)"
  value       = "postgresql://${var.db_username}:PASSWORD@${aws_db_instance.postgres.endpoint}/${var.db_name}"
  sensitive   = false
}

# ── Redis Outputs ────────────────────────────

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint (hostname:port for cache connection)"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port (default: 6379)"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}

output "redis_connection_string" {
  description = "Redis connection string for application"
  value       = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}/0"
}

# ── Network Outputs ──────────────────────────

output "vpc_id" {
  description = "VPC ID (use to find resources in AWS Console)"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "Public subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

# ── Application URLs ─────────────────────────

output "application_url" {
  description = "Application URL (after deployment)"
  value       = "http://${aws_instance.app.public_ip}"
}

output "api_url" {
  description = "API URL (after deployment)"
  value       = "http://${aws_instance.app.public_ip}/api/v1/"
}

# ── Next Steps ───────────────────────────────

output "next_steps" {
  description = "What to do after infrastructure is created"
  value = <<-EOT

  ✓ Infrastructure created successfully!

  Next steps:
  1. SSH into EC2: ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_instance.app.public_ip}
  2. Run Ansible setup playbook to install Docker
  3. Deploy FleeMa application with Ansible deploy playbook
  4. Access application at: http://${aws_instance.app.public_ip}

  Database connection details:
  - Host: ${aws_db_instance.postgres.address}
  - Port: ${aws_db_instance.postgres.port}
  - Database: ${var.db_name}
  - Username: ${var.db_username}
  - Password: (stored in terraform.tfvars)

  Redis connection:
  - Host: ${aws_elasticache_cluster.redis.cache_nodes[0].address}
  - Port: ${aws_elasticache_cluster.redis.cache_nodes[0].port}

  See: ../docs/devops/03-ansible-basics.md for deployment guide
  EOT
}

# ── Cost Tracking ────────────────────────────

output "estimated_monthly_cost" {
  description = "Estimated monthly cost (approximate, with AWS free tier)"
  value = <<-EOT

  Estimated monthly costs (US East 1):
  - EC2 ${var.ec2_instance_type}: $0 (750h free tier) / $8 after
  - RDS ${var.db_instance_class}: $0 (750h free tier) / $15 after
  - ElastiCache ${var.redis_node_type}: ~$12 (no free tier)
  - Data transfer: $0 (100GB free tier)
  - Total: ~$12/month with free tier, ~$35/month after

  Note: Costs may vary. Check AWS billing dashboard regularly.
  EOT
}
