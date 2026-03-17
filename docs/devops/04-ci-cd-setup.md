# Phase 4: CI/CD Pipeline Setup

**Objective:** Automate build, test, and deployment processes using GitHub Actions.

**Time Estimate:** 2-3 hours

---

## Table of Contents
1. [Overview](#overview)
2. [Current Workflow](#current-workflow)
3. [Setup GitHub Secrets](#setup-github-secrets)
4. [Workflow Explanation](#workflow-explanation)
5. [Testing the Pipeline](#testing-the-pipeline)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The CI/CD pipeline automatically:
- Builds Docker images on every push to `dev` or `main`
- Scans images for security vulnerabilities with Trivy
- Pushes images to GitHub Container Registry (GHCR)
- Deploys to AWS EC2 automatically (dev branch only)
- Verifies deployment health

**Pipeline Flow:**
```
Push to dev → Build Backend → Build Frontend → Deploy to EC2 → Verify
                ↓                  ↓
           Security Scan     Security Scan
```

---

## Current Workflow

Location: `.github/workflows/build-and-push.yml`

**Jobs:**
1. **build-backend** - Builds and pushes backend Docker image
2. **build-frontend** - Builds and pushes frontend Docker image
3. **deploy** - Deploys to EC2 (only on `dev` branch push)

**Triggers:**
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev`
- Version tags (`v*.*.*`)

---

## Setup GitHub Secrets

Before the deployment job can run, you need to add secrets to your GitHub repository.

### Step 1: Navigate to Repository Settings

1. Go to your repository: `https://github.com/pelino250/FleeMa`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add Required Secrets

Add each of the following secrets:

#### EC2_SSH_PRIVATE_KEY
**Value:** Contents of your SSH private key

```bash
cat ~/.ssh/fleema-dev-key.pem
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines).

#### EC2_HOST
**Value:** Your EC2 public IP address

```bash
# Get from Terraform output
cd terraform
terraform output ec2_public_ip
```

Current value: `44.199.209.136`

#### DB_HOST
**Value:** RDS endpoint without port

```bash
# Get from Terraform output
cd terraform
terraform output rds_address
```

Current value: `fleema-dev-db.cwvio46a8nzz.us-east-1.rds.amazonaws.com`

#### REDIS_HOST
**Value:** Redis endpoint without port

```bash
# Get from Terraform output
cd terraform
terraform output redis_endpoint
```

Current value: `fleema-dev-redis.ftz3yt.0001.use1.cache.amazonaws.com`

#### DB_PASSWORD
**Value:** Your database password

From `terraform/terraform.tfvars`:
```
FleeM4DevP4ss2024
```

### Step 3: Verify Secrets

After adding all secrets, you should see:
- EC2_SSH_PRIVATE_KEY
- EC2_HOST
- DB_HOST
- REDIS_HOST
- DB_PASSWORD

---

## Workflow Explanation

### Build Jobs (Parallel Execution)

**build-backend** and **build-frontend** run simultaneously:

1. Checkout code
2. Login to GitHub Container Registry (GHCR)
3. Extract metadata (tags, labels)
4. Build and push Docker image
5. Run Trivy security scan
6. Upload scan results to GitHub Security

**Image Tags:**
- `dev` - On push to dev branch
- `latest` - On push to main branch
- `v1.0.0` - On version tag
- `dev-abc1234` - Branch + commit SHA

### Deploy Job (After Build Success)

**Only runs when:**
- Event is `push` (not pull request)
- Branch is `dev`
- Both build jobs succeeded

**Deployment Steps:**

1. **Checkout code** - Get latest Ansible playbooks
2. **Install Ansible** - Install on GitHub Actions runner
3. **Setup SSH** - Configure SSH key for EC2 access
4. **Create inventory** - Generate Ansible inventory from secrets
5. **Run deployment** - Execute Ansible playbook
6. **Verify deployment** - Check application health (5 minute timeout)
7. **Deployment summary** - Add summary to workflow run

---

## Testing the Pipeline

### Test 1: Trigger Build Only (Pull Request)

```bash
# Create feature branch
git checkout -b test-ci-cd
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger CI build"
git push origin test-ci-cd

# Create PR on GitHub
gh pr create --title "Test CI/CD" --body "Testing build pipeline"
```

**Expected:** Build jobs run, deployment job skips

### Test 2: Trigger Full Pipeline (Push to dev)

```bash
# Make a small change
git checkout dev
echo "# CI/CD enabled" >> docs/devops/README.md
git add docs/devops/README.md
git commit -m "docs: add CI/CD note"
git push origin dev
```

**Expected:**
1. Build jobs run (2-3 minutes each)
2. Deploy job runs (3-5 minutes)
3. Application updates automatically

### Test 3: Verify Deployment

After workflow completes:

```bash
# Check application health
curl http://44.199.209.136/api/v1/

# Should return:
# {"detail":"Authentication credentials were not provided."}
```

Or visit in browser: http://44.199.209.136

---

## Monitoring Deployments

### View Workflow Runs

```bash
# List recent runs
gh run list --repo pelino250/FleeMa --limit 5

# View specific run
gh run view <run-id> --log
```

### View Deployment Logs

```bash
# SSH into EC2
ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@44.199.209.136

# Check container logs
sudo docker logs fleema-backend --tail 50
sudo docker logs fleema-frontend --tail 50
sudo docker logs fleema-nginx --tail 50
```

---

## Troubleshooting

### Deployment Job Fails: "Permission denied (publickey)"

**Cause:** SSH key secret not configured correctly

**Fix:**
1. Verify `EC2_SSH_PRIVATE_KEY` secret contains full private key
2. Check key has correct permissions locally:
   ```bash
   chmod 600 ~/.ssh/fleema-dev-key.pem
   ```

### Deployment Job Fails: "Could not resolve host"

**Cause:** `EC2_HOST` secret incorrect or EC2 instance stopped

**Fix:**
1. Check EC2 instance is running in AWS Console
2. Verify public IP hasn't changed:
   ```bash
   cd terraform
   terraform output ec2_public_ip
   ```
3. Update `EC2_HOST` secret if IP changed

### Deployment Verification Times Out

**Cause:** Application not starting or healthcheck failing

**Fix:**
1. Check backend container logs:
   ```bash
   ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@44.199.209.136
   sudo docker logs fleema-backend --tail 100
   ```
2. Common issues:
   - Database connection failure (check `DB_PASSWORD` secret)
   - Environment variable mismatch
   - Image pull failure (check GHCR permissions)

### Ansible Playbook Fails

**Cause:** Missing variables or configuration error

**Fix:**
1. View Ansible output in workflow logs
2. Test playbook locally:
   ```bash
   cd ansible
   ansible-playbook playbooks/deploy.yml \
     --extra-vars "db_password=XXX github_username=pelino250" \
     --check  # Dry run mode
   ```

### Database Migration Errors

**Cause:** Migration conflicts or database connectivity

**Fix:**
1. Check database is accessible:
   ```bash
   ssh -i ~/.ssh/fleema-dev-key.pem ubuntu@44.199.209.136
   sudo docker exec fleema-backend python manage.py showmigrations
   ```
2. Manual migration if needed:
   ```bash
   sudo docker exec fleema-backend python manage.py migrate --noinput
   ```

---

## Security Best Practices

### Secrets Management

1. **Never commit secrets** to the repository
2. **Rotate secrets regularly** (every 90 days)
3. **Use least privilege** - Only grant necessary permissions
4. **Audit secret access** - Review GitHub Actions logs

### SSH Key Security

```bash
# Generate new key for production
ssh-keygen -t ed25519 -C "fleema-prod" -f ~/.ssh/fleema-prod-key

# Add to EC2
ssh-copy-id -i ~/.ssh/fleema-prod-key.pub ubuntu@PROD_IP
```

### Environment Separation

**Development (dev branch):**
- Auto-deploy on every push
- Less strict security
- Test environment

**Production (main branch):**
- Manual approval required
- Strict security scanning
- Production environment

To add manual approval for production:

```yaml
deploy-prod:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [build-backend, build-frontend]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  environment:
    name: production
    url: https://fleema.example.com
  steps:
    # Same deployment steps...
```

Then configure environment protection rules in GitHub Settings.

---

## Advanced Features

### Blue-Green Deployment

Deploy new version alongside old, switch traffic when ready:

```yaml
- name: Deploy new version (blue)
  run: |
    ansible-playbook playbooks/deploy.yml \
      --extra-vars "container_suffix=blue"

- name: Health check blue deployment
  run: |
    # Verify health on new containers

- name: Switch traffic to blue
  run: |
    ansible-playbook playbooks/switch-traffic.yml \
      --extra-vars "active_version=blue"

- name: Remove old green containers
  run: |
    ansible-playbook playbooks/cleanup.yml \
      --extra-vars "remove_version=green"
```

### Rollback on Failure

Automatically rollback if deployment verification fails:

```yaml
- name: Verify deployment
  id: verify
  run: |
    # Health checks...

- name: Rollback on failure
  if: failure() && steps.verify.outcome == 'failure'
  run: |
    echo "Deployment failed, rolling back..."
    ansible-playbook playbooks/rollback.yml
```

### Deployment Notifications

Send Slack/Discord notifications on deployment:

```yaml
- name: Notify deployment success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{
        "text": "Deployment successful: ${{ github.sha }}"
      }'
```

---

## Cost Optimization

### GitHub Actions Minutes

- Free tier: 2,000 minutes/month
- Current usage: ~10 minutes per deployment
- Estimated: ~200 deployments/month on free tier

**Optimization tips:**
1. Use workflow caching for dependencies
2. Skip deployment on documentation-only changes
3. Use self-hosted runners for unlimited minutes

### AWS Costs

- EC2 t3.micro: Free tier eligible
- RDS db.t3.micro: Free tier eligible
- ElastiCache: ~$12/month (no free tier)
- Data transfer: Minimal for dev environment

**Total monthly cost:** ~$12 with free tier

---

## Next Steps

1. **Phase 5:** Add comprehensive testing (unit, integration, E2E)
2. **Phase 6:** Implement monitoring and alerting (CloudWatch, Prometheus)
3. **Phase 7:** Add production environment with manual approval
4. **Phase 8:** Implement infrastructure as code testing (Terraform validate, tflint)

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [Docker Security](https://docs.docker.com/engine/security/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

**Last Updated:** 2026-03-15
**Status:** Active
