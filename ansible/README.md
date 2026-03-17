# FleeMa Ansible Automation

Beginner-friendly Ansible playbooks for automated server setup and application deployment.

## Overview

This directory contains Ansible automation for:
- **setup.yml** - One-time server configuration (install Docker, configure firewall)
- **deploy.yml** - Deploy/update FleeMa application (pull images, start containers)

## What is Ansible?

Ansible is a **configuration management** tool that automates server setup and deployment tasks.

**Think of it as:**
- A remote control for servers
- Automated SSH commands with logic
- Infrastructure automation without coding

**Why use Ansible?**
- **Idempotent** - Safe to run multiple times (won't break if run twice)
- **Agentless** - No software to install on servers (uses SSH)
- **Simple** - YAML syntax, easy to read and write
- **Powerful** - Manage 1 or 1000 servers the same way

## Prerequisites

### 1. Install Ansible

**macOS:**
```bash
brew install ansible
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ansible
```

**Verify installation:**
```bash
ansible --version
# Should show: ansible [core 2.15+]
```

### 2. Provision EC2 Instance

Run Terraform first to create AWS infrastructure:
```bash
cd ../terraform
terraform apply
```

Save the outputs:
- EC2 public IP
- RDS endpoint
- Redis endpoint

### 3. Configure Inventory

Edit `inventory.ini` and replace placeholders:

```ini
[fleema_app]
fleema-dev ansible_host=YOUR_EC2_PUBLIC_IP

[fleema_app:vars]
db_host=YOUR_RDS_ENDPOINT
redis_host=YOUR_REDIS_ENDPOINT
```

### 4. Test SSH Connection

```bash
# Verify you can SSH into EC2
ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Test Ansible connectivity
ansible fleema_app -m ping
```

Expected output:
```
fleema-dev | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

## Quick Start

### Step 1: Server Setup (One-Time)

Run the setup playbook to install Docker and configure the server:

```bash
ansible-playbook playbooks/setup.yml
```

**What this does:**
1. Updates system packages
2. Installs Docker and Docker Compose
3. Creates application user (`fleema`)
4. Configures firewall (UFW)
5. Sets up log rotation
6. Installs Python Docker modules

**Duration:** 5-10 minutes

**Output:** You'll see each task execute with OK/CHANGED/FAILED status

### Step 2: Deploy Application

Deploy FleeMa application:

```bash
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=YOUR_DB_PASSWORD github_username=YOUR_GITHUB_USERNAME"
```

**What this does:**
1. Pulls latest images from GHCR
2. Creates Docker network
3. Starts backend container
4. Runs database migrations
5. Starts frontend container
6. Starts Nginx reverse proxy
7. Runs health checks

**Duration:** 2-5 minutes

**Verify deployment:**
```bash
# Open in browser
open http://YOUR_EC2_PUBLIC_IP

# Or curl
curl http://YOUR_EC2_PUBLIC_IP/api/v1/
```

## File Structure

```
ansible/
├── ansible.cfg              # Ansible configuration
├── inventory.ini            # Server connection details
├── vars.yml                 # Variables (image names, ports, etc.)
├── playbooks/
│   ├── setup.yml            # One-time server setup
│   └── deploy.yml           # Application deployment
└── README.md                # This file
```

**Why simple structure?**
For learning, we keep it flat:
- No roles (added complexity)
- No dynamic inventory (static is easier)
- All logic in playbooks (easy to read)

Advanced setups use roles and modules, but we start simple.

## Understanding Ansible Concepts

### Inventory

**What:** List of servers to manage
**Where:** `inventory.ini`

```ini
[group_name]
server_name ansible_host=IP_ADDRESS

[group_name:vars]
variable_name=value
```

**Groups:** Organize servers (e.g., `web_servers`, `db_servers`)
**Variables:** Config shared by all servers in group

### Playbooks

**What:** YAML files defining tasks to execute
**Where:** `playbooks/*.yml`

```yaml
---
- name: Description of what this playbook does
  hosts: group_name  # Which servers from inventory
  become: yes  # Use sudo

  tasks:
    - name: Install Docker
      apt:
        name: docker-ce
        state: present
```

**Structure:**
- Play: Collection of tasks for specific hosts
- Task: Single action (install package, copy file, etc.)
- Module: Built-in function (`apt`, `docker_container`, `copy`, etc.)

### Variables

**What:** Reusable values
**Where:** `vars.yml`, `inventory.ini`, `--extra-vars`

**Precedence (highest to lowest):**
1. `--extra-vars` (command line)
2. `vars_files` in playbook
3. Inventory group vars
4. Playbook vars

### Modules

**What:** Built-in functions for common tasks

**Common modules:**
- `apt` - Install packages (Ubuntu/Debian)
- `docker_container` - Manage Docker containers
- `copy` - Copy files to servers
- `template` - Copy files with variable substitution
- `command` / `shell` - Run shell commands
- `service` - Manage system services

**Example:**
```yaml
- name: Install nginx
  apt:
    name: nginx
    state: present  # ensure installed
    update_cache: yes  # apt update first
```

### Idempotency

**What:** Running same playbook multiple times produces same result

**Example:**
```yaml
- name: Create directory
  file:
    path: /app
    state: directory
```

- First run: Creates directory (CHANGED)
- Second run: Directory exists, nothing to do (OK)
- Result: Always have /app directory

**Why important:** Safe to re-run deployments without breaking things

## Common Commands

```bash
# Test connectivity
ansible fleema_app -m ping

# Run ad-hoc command
ansible fleema_app -m command -a "docker ps"

# Check playbook syntax
ansible-playbook playbooks/setup.yml --syntax-check

# Dry run (don't make changes)
ansible-playbook playbooks/setup.yml --check

# Run playbook
ansible-playbook playbooks/setup.yml

# Run with extra variables
ansible-playbook playbooks/deploy.yml --extra-vars "image_tag=v1.0.0"

# Limit to specific hosts
ansible-playbook playbooks/deploy.yml --limit fleema-dev

# Increase verbosity (for debugging)
ansible-playbook playbooks/deploy.yml -vvv
```

## Deployment Scenarios

### Initial Deployment

```bash
# 1. Setup server (once)
ansible-playbook playbooks/setup.yml

# 2. Deploy application
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=XXX github_username=YYY"
```

### Update to New Version

```bash
# Deploy specific version
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=XXX github_username=YYY image_tag=v1.1.0"
```

### Development Deployment

```bash
# Deploy latest dev build
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=XXX github_username=YYY image_tag=dev"
```

### Verify Deployment

```bash
# Check container status
ansible fleema_app -m command -a "docker ps"

# Check application logs
ansible fleema_app -m command -a "docker logs fleema-backend"

# Test API endpoint
ansible fleema_app -m uri -a "url=http://localhost/api/v1/"
```

## Variables Reference

### Required Variables (deploy.yml)

```bash
db_password          # PostgreSQL password
github_username      # Your GitHub username (for GHCR)
```

### Optional Variables

```bash
image_tag=dev        # Image version (default: dev)
github_token=XXX     # GitHub PAT (for private repos)
django_secret_key=XXX  # Django secret (auto-generated if not set)
```

### Inventory Variables (inventory.ini)

```ini
ansible_host         # EC2 public IP
db_host              # RDS endpoint
redis_host           # ElastiCache endpoint
environment=dev      # Environment name
```

## Troubleshooting

### Error: "Failed to connect to host"

**Cause:** SSH connection failed

**Solutions:**
1. Check EC2 is running: `aws ec2 describe-instances`
2. Verify IP in `inventory.ini` is correct
3. Check SSH key: `ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@IP`
4. Check security group allows SSH from your IP

### Error: "Permission denied (publickey)"

**Cause:** SSH key not found or wrong permissions

**Solutions:**
```bash
# Check key exists
ls -la ~/.ssh/fleema-dev-key.pem

# Fix permissions
chmod 400 ~/.ssh/fleema-dev-key.pem

# Verify key path in inventory.ini
grep ansible_ssh_private_key_file inventory.ini
```

### Error: "Missing sudo password"

**Cause:** `become: yes` requires sudo, but key-based sudo not configured

**Solution:** Add to inventory:
```ini
ansible_become_password=PASSWORD
```

Or run with `-K`:
```bash
ansible-playbook playbooks/setup.yml -K
```

### Error: "Docker login failed"

**Cause:** No GitHub token for private repos

**Solutions:**
1. Make repos public (easiest for learning)
2. Create GitHub Personal Access Token:
   - GitHub → Settings → Developer settings → PAT
   - Scopes: `read:packages`
   - Pass via `--extra-vars "github_token=ghp_xxx"`

### Playbook hangs at task

**Cause:** Task waiting for user input or network timeout

**Solutions:**
- Increase timeout in `ansible.cfg`
- Run with `-vvv` for detailed output
- Check firewall allows required ports

### Containers not starting

**Debug steps:**
```bash
# SSH into server
ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@IP

# Check Docker logs
docker logs fleema-backend
docker logs fleema-frontend

# Check container status
docker ps -a

# Verify network
docker network ls
docker network inspect fleema-network

# Test database connection
docker exec fleema-backend python manage.py check --database default
```

## Best Practices

### Security

1. **Never commit passwords:** Use `--extra-vars` or Ansible Vault
2. **Use Ansible Vault for secrets:**
   ```bash
   ansible-vault create secrets.yml
   ansible-playbook deploy.yml --vault-password-file .vault_pass
   ```
3. **Limit SSH access:** Only allow your IP in security group
4. **Use SSH keys:** Never password-based SSH

### Maintenance

1. **Test playbooks with --check before applying**
2. **Version control all playbooks**
3. **Document custom variables**
4. **Keep Ansible updated:** `pip install --upgrade ansible`

### Organization

1. **One playbook = one purpose** (setup OR deploy, not both)
2. **Use meaningful task names** (shows in output)
3. **Group related tasks** (network, database, application)
4. **Add comments** for complex logic

## Next Steps

After successful deployment:
1. Access application at `http://YOUR_EC2_IP`
2. Create Django superuser (admin access)
3. Configure HTTPS with Let's Encrypt
4. Setup monitoring and logging
5. Automate with CI/CD (GitHub Actions triggers Ansible)

Proceed to: [Phase 4: CI/CD Pipeline](../docs/devops/04-ci-cd-pipeline.md)

## Learning Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Module Index](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [FleeMa DevOps Guide](../docs/devops/03-ansible-basics.md)
