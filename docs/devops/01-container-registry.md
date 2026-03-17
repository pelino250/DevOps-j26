# Phase 1: Container Registry Setup

## Overview

**Goal:** Learn container lifecycle management and automated image builds

**Duration:** Week 1 (4-6 hours)

**What you'll learn:**
- What is a container registry and why use one
- GitHub Container Registry (GHCR) setup
- Automated image builds with GitHub Actions
- Container security scanning basics
- Semantic versioning for images

## What is a Container Registry?

A container registry is a repository for storing and distributing Docker images, similar to how GitHub stores code.

**Why use a registry?**
- **Version control** for Docker images (like Git for code)
- **Distribution** - easy deployment to multiple servers
- **Security scanning** - detect vulnerabilities before deployment
- **Caching** - faster builds and deployments
- **Collaboration** - team members share same images

**Popular registries:**
- **GitHub Container Registry (GHCR)** - Free, GitHub-integrated (we'll use this)
- **Docker Hub** - Most popular, free tier limited
- **AWS ECR** - AWS-native, pay-per-use
- **Google GCR** - Google Cloud, similar to ECR

## Why GitHub Container Registry (GHCR)?

For learning DevOps, GHCR is perfect because:
- **Free** for public and private repositories
- **Integrated** with GitHub Actions (no extra credentials)
- **Simple** authentication with GitHub tokens
- **Learning-friendly** - clear documentation
- **No lock-in** - easy to switch to ECR later

## Architecture: Before vs After

### Before (Current State)
```
Developer → docker build → Local image → docker-compose up
                              ↓
                         (lost after rebuild)
```

**Problems:**
- Images only exist locally
- Can't deploy to remote servers easily
- No version history
- No security scanning

### After (With GHCR)
```
Developer → Git push → GitHub Actions → Build → Scan → GHCR
                                                          ↓
Production server ← docker pull ← Tagged image (v1.0.0)
```

**Benefits:**
- Images stored centrally
- Versioned (v1.0.0, v1.0.1, etc.)
- Scanned for vulnerabilities
- Easy deployment anywhere

## Implementation Steps

### Step 1: Enable GHCR for Repository

GHCR is automatically enabled for all GitHub repositories. No manual activation needed.

### Step 2: Create GitHub Actions Workflow

We'll create a workflow that:
1. Builds backend and frontend images
2. Scans for vulnerabilities with Trivy
3. Pushes to GHCR with proper tags
4. Runs on every push to `main` and `dev` branches

**File:** `.github/workflows/build-and-push.yml`

```yaml
name: Build and Push to GHCR

on:
  push:
    branches: [main, dev]
    tags: ['v*.*.*']
  pull_request:
    branches: [main, dev]

env:
  REGISTRY: ghcr.io
  # github.repository = "owner/repo" → lowercase for GHCR
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}

jobs:
  build-backend:
    name: Build Backend Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write  # Required for GHCR push
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided by GitHub

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}/fleema-backend
          tags: |
            # Tag as 'latest' on main branch
            type=raw,value=latest,enable={{is_default_branch}}
            # Tag as 'dev' on dev branch
            type=raw,value=dev,enable=${{ github.ref == 'refs/heads/dev' }}
            # Tag with version on git tags (v1.0.0 → 1.0.0)
            type=semver,pattern={{version}}
            # Tag with commit SHA (for traceability)
            type=sha,prefix={{branch}}-

      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}  # Only push on push/tag
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_PREFIX }}/fleema-backend:latest
          format: 'sarif'
          output: 'trivy-backend-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-backend-results.sarif'

  build-frontend:
    name: Build Frontend Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}/fleema-frontend
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=raw,value=dev,enable=${{ github.ref == 'refs/heads/dev' }}
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-

      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_PREFIX }}/fleema-frontend:latest
          format: 'sarif'
          output: 'trivy-frontend-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-frontend-results.sarif'
```

### Step 3: Understanding the Workflow

**Let's break down each section:**

#### Triggers (`on:`)
```yaml
on:
  push:
    branches: [main, dev]  # Run on commits to main or dev
    tags: ['v*.*.*']       # Run on version tags (v1.0.0)
  pull_request:            # Run on PRs (build but don't push)
```

#### Permissions
```yaml
permissions:
  contents: read   # Read repository code
  packages: write  # Push to GHCR (GitHub Packages)
```

#### Login to GHCR
```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}  # Your GitHub username
    password: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided token
```

**No manual secret needed!** GitHub provides `GITHUB_TOKEN` automatically.

#### Image Tagging Strategy
```yaml
tags: |
  type=raw,value=latest,enable={{is_default_branch}}  # main → latest
  type=raw,value=dev,enable=${{ github.ref == 'refs/heads/dev' }}  # dev → dev
  type=semver,pattern={{version}}  # v1.0.0 → 1.0.0
  type=sha,prefix={{branch}}-  # Commit SHA for traceability
```

**Why multiple tags?**
- `latest` - Always points to most recent production build
- `dev` - Latest development build
- `v1.0.0` - Specific version (for rollbacks)
- `main-abc123` - Exact commit (for debugging)

#### Security Scanning (Trivy)
```yaml
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/owner/fleema-backend:latest
    format: 'sarif'  # Standard format for GitHub Security tab
```

**What Trivy checks:**
- OS package vulnerabilities (apt, yum packages)
- Application dependencies (pip, npm packages)
- Known CVEs (Common Vulnerabilities and Exposures)
- Severity: LOW, MEDIUM, HIGH, CRITICAL

### Step 4: Test the Workflow

1. **Create the workflow file:**
   ```bash
   # File already created in this guide
   git add .github/workflows/build-and-push.yml
   git commit -m "feat(devops): add GHCR image build and push workflow"
   ```

2. **Push to dev branch:**
   ```bash
   git push origin dev
   ```

3. **Check GitHub Actions:**
   - Go to repository → Actions tab
   - See workflow running
   - Verify both jobs (backend + frontend) complete

4. **View published images:**
   - Go to repository → Packages tab (right sidebar)
   - See `fleema-backend` and `fleema-frontend` packages
   - Check tags: `dev`, commit SHA

5. **Check security scan results:**
   - Go to repository → Security tab → Code scanning
   - Review vulnerabilities found by Trivy

### Step 5: Pull Images Locally

Test pulling images from GHCR:

```bash
# Authenticate with GHCR (one-time setup)
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull backend image
docker pull ghcr.io/YOUR_USERNAME/fleema-backend:dev

# Pull frontend image
docker pull ghcr.io/YOUR_USERNAME/fleema-frontend:dev

# Run with docker-compose (update image names)
docker-compose up
```

## Semantic Versioning

**Format:** `vMAJOR.MINOR.PATCH` (e.g., v1.0.0)

- **MAJOR** (1.x.x) - Breaking changes (incompatible API changes)
- **MINOR** (x.1.x) - New features (backward-compatible)
- **PATCH** (x.x.1) - Bug fixes (backward-compatible)

**Example progression:**
- v1.0.0 - Initial release
- v1.0.1 - Bug fix
- v1.1.0 - New feature (customer management)
- v2.0.0 - Breaking change (API restructure)

**Creating a release:**
```bash
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release"
git push origin v1.0.0
```

This triggers the workflow and creates images tagged as `1.0.0`.

## Security Scanning Deep Dive

### What Trivy Scans

1. **OS vulnerabilities** (Debian, Alpine packages)
2. **Application dependencies** (requirements.txt, package.json)
3. **Config issues** (misconfigurations)
4. **Secrets** (exposed API keys, passwords)

### Reading Scan Results

**Example output:**
```
Total: 45 (LOW: 20, MEDIUM: 15, HIGH: 8, CRITICAL: 2)

CRITICAL:
- CVE-2023-1234 in libssl1.1 (upgrade to 1.1.1w)
- CVE-2023-5678 in python3.12 (upgrade to 3.12.1)
```

**What to do:**
- **CRITICAL/HIGH** - Fix immediately (update dependencies)
- **MEDIUM** - Plan to fix (next sprint)
- **LOW** - Monitor, fix when convenient

**Updating dependencies:**
```bash
# Backend
cd backend
pip install --upgrade package-name
pip freeze > requirements.txt

# Frontend
cd frontend
npm update package-name
```

## Troubleshooting

### Issue: "Permission denied" when pushing to GHCR

**Solution:** Check workflow permissions
```yaml
permissions:
  contents: read
  packages: write  # Must be present
```

### Issue: "Image not found" when pulling

**Possible causes:**
1. Image name typo (check exact name in Packages tab)
2. Not authenticated (`docker login ghcr.io`)
3. Private repo (need GitHub PAT with `read:packages`)

**Solution:**
```bash
# Create GitHub PAT: Settings → Developer settings → PAT → Generate
# Scopes: read:packages, write:packages
export GITHUB_PAT=ghp_xxxx
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Issue: Trivy scan fails with timeout

**Solution:** Increase timeout
```yaml
- uses: aquasecurity/trivy-action@master
  with:
    timeout: '10m'  # Default is 5m
```

## Next Steps

**Phase 1 complete!** You now have:
- Automated container builds on every commit
- Images stored in GHCR with proper versioning
- Security scanning integrated into CI
- Understanding of container registries

**Proceed to:** [Phase 2: Terraform Basics](02-terraform-basics.md) to provision AWS infrastructure.

## Further Learning

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Semantic Versioning](https://semver.org/)
