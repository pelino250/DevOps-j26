# FleeMa DevOps Learning Roadmap

A beginner-friendly, practical guide to implementing DevOps practices for the FleeMa fleet management platform.

## Philosophy

This DevOps implementation prioritizes **learning and understanding** over advanced complexity:
- Start simple, build incrementally
- Each phase teaches core DevOps concepts
- Real-world practices without overwhelming features
- Clear documentation explaining the "why" behind every decision
- Cost-optimized for learning (AWS free tier where possible)

## Learning Path Overview

### Month 1: Foundation

**Week 1: Container Registry**
- Learn container lifecycle management
- Automated image builds with GitHub Actions
- Basic security scanning with Trivy
- **Concepts:** Docker registries, semantic versioning, CI basics

**Week 2-3: Infrastructure as Code (Terraform)**
- Provision AWS infrastructure with Terraform
- Learn VPC, EC2, RDS, security groups
- Understand infrastructure as code principles
- **Concepts:** IaC, state management, AWS fundamentals

**Week 4: Configuration Management (Ansible)**
- Automate server setup and application deployment
- Deploy with Docker Compose on EC2
- Learn idempotency and playbooks
- **Concepts:** Configuration management, automation, SSH

### Month 2: Automation & Security

**Week 5: CI/CD Pipeline**
- Complete continuous integration pipeline
- Automated deployment workflow
- Health checks and verification
- **Concepts:** CI vs CD, deployment strategies, automation

**Week 6: Security Basics**
- Secrets management with AWS Parameter Store
- Security scanning (SAST, container scanning)
- AWS IAM and encryption
- **Concepts:** DevSecOps, defense in depth, secure by default

**Week 7: Monitoring Essentials**
- CloudWatch logging and metrics
- Application dashboards
- Basic alerting (email notifications)
- **Concepts:** Observability, metrics vs logs, SLIs/SLOs

**Week 8: Documentation & Best Practices**
- Complete runbooks and guides
- Troubleshooting documentation
- Team workflows and practices
- **Concepts:** Knowledge sharing, incident response

## Architecture Overview

### Current State
- Docker Compose local development
- GitHub Actions CI (lint + test)
- Manual deployment process
- No infrastructure automation

### Target State (After Implementation)
- GitHub Container Registry for images
- Terraform-managed AWS infrastructure
- Ansible-automated deployments
- Complete CI/CD pipeline
- Basic monitoring and alerting
- Security scanning integrated

## AWS Infrastructure (Simple Beginner Setup)

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Public Subnet (10.0.1.0/24)                 │ │
│  │                                                         │ │
│  │  ┌─────────────────┐                                   │ │
│  │  │   EC2 Instance  │  (t3.micro - Docker Compose)      │ │
│  │  │   - Backend     │                                   │ │
│  │  │   - Frontend    │                                   │ │
│  │  │   - Nginx       │                                   │ │
│  │  └────────┬────────┘                                   │ │
│  │           │                                             │ │
│  └───────────┼─────────────────────────────────────────────┘ │
│              │                                               │
│  ┌───────────┼───────────────┐  ┌────────────────────────┐  │
│  │   RDS PostgreSQL          │  │  ElastiCache Redis     │  │
│  │   (db.t3.micro)           │  │  (cache.t3.micro)      │  │
│  │   Single AZ               │  │  Single node           │  │
│  └───────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                  Internet Gateway
                           │
                       Internet
```

## Cost Estimate

| Service | Specs | Monthly Cost | Free Tier |
|---------|-------|--------------|-----------|
| EC2 | t3.micro | ~$8 | 750 hours/month (12 months) |
| RDS PostgreSQL | db.t3.micro | ~$15 | 750 hours/month (12 months) |
| ElastiCache Redis | cache.t3.micro | ~$12 | None |
| Data Transfer | <10GB | Free | 100GB/month |
| CloudWatch | Basic metrics | ~$3 | 10 metrics, 5GB logs |
| **Total** | | **~$38/month** | **~$5-10/month with free tier** |

**Note:** First 12 months with AWS free tier: approximately $5-10/month

## Implementation Phases

### Phase 1: Container Registry (Week 1)
- [ ] Setup GitHub Container Registry (GHCR)
- [ ] Create build-and-push workflow
- [ ] Add Trivy security scanning
- [ ] Implement semantic versioning
- **Deliverable:** Automated container builds with security scanning

### Phase 2: Terraform Basics (Week 2-3)
- [ ] Create Terraform configuration (single main.tf)
- [ ] Provision VPC and networking
- [ ] Deploy EC2 instance with Docker
- [ ] Setup RDS PostgreSQL and ElastiCache Redis
- **Deliverable:** Complete AWS infrastructure provisioned via code

### Phase 3: Ansible Automation (Week 4)
- [ ] Create setup playbook (install Docker, configure server)
- [ ] Create deploy playbook (deploy application)
- [ ] Test deployment automation
- **Deliverable:** Automated deployment process

### Phase 4: CI/CD Pipeline (Week 5)
- [ ] Enhance CI pipeline (lint, test, build, scan, push)
- [ ] Create CD pipeline (deploy on tag/manual)
- [ ] Add health checks
- **Deliverable:** Complete CI/CD workflow

### Phase 5: Security Basics (Week 6)
- [ ] Setup AWS Parameter Store for configs
- [ ] Add secrets management to deployment
- [ ] Enable AWS security features (encryption, IAM roles)
- [ ] Add security scanning to CI
- **Deliverable:** Secure deployment pipeline

### Phase 6: Monitoring (Week 7)
- [ ] Setup CloudWatch logging
- [ ] Create application dashboard
- [ ] Configure basic alerts (SNS + email)
- **Deliverable:** Basic observability

### Phase 7: Documentation (Week 8)
- [ ] Write deployment guide
- [ ] Create troubleshooting runbook
- [ ] Document architecture
- **Deliverable:** Complete documentation

## Documentation Index

### Getting Started
1. [Container Registry Setup](01-container-registry.md)
2. [Terraform Basics](02-terraform-basics.md)
3. [Ansible Basics](03-ansible-basics.md)

### Automation
4. [CI/CD Pipeline](04-ci-cd-pipeline.md)
5. [Security Basics](05-security-basics.md)
6. [Monitoring Basics](06-monitoring-basics.md)

### Operations
7. [Deployment Guide](deployment-guide.md)
8. [Troubleshooting Guide](troubleshooting.md)
9. [Cost Optimization](cost-optimization.md)

## Learning Resources

### External Resources
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Ansible Getting Started](https://docs.ansible.com/ansible/latest/getting_started/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### FleeMa-Specific
- [Project Architecture](../architecture.md)
- [Development Guide](../../CLAUDE.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

## Prerequisites

### Required Tools
- AWS Account (free tier eligible)
- GitHub Account
- Local development environment:
  - Terraform (>= 1.5)
  - Ansible (>= 2.15)
  - AWS CLI (>= 2.0)
  - Docker (>= 24.0)

### Required Knowledge
- Basic Linux command line
- Git fundamentals
- Docker basics (containers, images)
- Basic Python/JavaScript (for understanding the application)

**No prior AWS, Terraform, or Ansible experience required** - we'll learn step by step.

## Getting Help

### Common Issues
See [Troubleshooting Guide](troubleshooting.md) for common problems and solutions.

### Questions
- Check existing documentation in `docs/devops/`
- Review comments in configuration files (well-documented for learning)
- Open GitHub issue with `[DevOps]` prefix

## Success Criteria

By the end of this learning path, you will be able to:
- [ ] Explain infrastructure as code and why it matters
- [ ] Provision AWS infrastructure with Terraform
- [ ] Automate deployments with Ansible
- [ ] Implement complete CI/CD pipeline
- [ ] Apply basic security practices
- [ ] Monitor application health
- [ ] Troubleshoot common deployment issues
- [ ] Document infrastructure and processes

## Next Steps

Start with [Phase 1: Container Registry Setup](01-container-registry.md) to begin your DevOps learning journey.
