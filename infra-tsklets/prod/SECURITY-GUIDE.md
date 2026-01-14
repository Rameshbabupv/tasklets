# Podman Container Security Guide

Understanding security when running applications in Podman containers.

## Table of Contents
1. [How Container Isolation Works](#how-container-isolation-works)
2. [What Podman Protects Against](#what-podman-protects-against)
3. [What Podman Does NOT Protect Against](#what-podman-does-not-protect-against)
4. [Rootless vs Rootful](#rootless-vs-rootful)
5. [Security Best Practices](#security-best-practices)
6. [Hardening Your Deployment](#hardening-your-deployment)

---

## How Container Isolation Works

### Process Isolation
```bash
# Container processes are isolated from host
podman exec tsklets-app ps aux
# Only sees container processes, not host processes
```

### Filesystem Isolation
```
Container sees:              Host has:
/app/                        /opt/tsklets/
/var/lib/postgresql/data     /home/youruser/
/etc/                        /etc/
  ↑ Different filesystems    ↑ Isolated
```

**Key Point:** Container CANNOT access host files unless you explicitly mount them.

### Network Isolation
```
Host Network:     192.168.1.100
                      ↓
Bridge Network:   172.28.0.0/16 (isolated)
                      ↓
Containers:       172.28.0.2, 172.28.0.3
```

Only exposed ports (4010, 4020, 4030) are accessible from outside.

### User Namespace (Rootless Mode)

**This is Podman's biggest security advantage:**

```
Inside Container          On Host System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
root (UID 0)       →      youruser (UID 1000)
postgres (UID 70)  →      youruser (UID 100069)
node (UID 1000)    →      youruser (UID 101999)
```

**What this means:**
- Even if attacker gets "root" inside container
- They're actually just YOU on the host (not real root)
- Can't modify system files like `/etc/passwd`
- Can't install kernel modules
- Can't bind to privileged ports (< 1024) on host

---

## What Podman Protects Against

### ✅ Filesystem Access
**Scenario:** Malicious code tries to read `/etc/shadow`

```javascript
// Inside container - YOUR APP CODE
const fs = require('fs')
fs.readFile('/etc/shadow', (err, data) => {
  // Only sees container's /etc/shadow (doesn't exist or is fake)
  // CANNOT read host's real /etc/shadow
})
```

**Result:** ✅ Host protected

---

### ✅ Process Manipulation
**Scenario:** Attacker tries to kill host processes

```bash
# Inside container
pkill nginx  # Only kills nginx inside container (if exists)
# CANNOT kill nginx on host
```

**Result:** ✅ Host protected

---

### ✅ Privilege Escalation
**Scenario:** Exploit gives "root" access in container

```bash
# Attacker gets root inside container
whoami  # Shows: root
id      # Shows: uid=0(root)

# But tries to modify host
echo "malware" > /host/etc/cron.daily/backdoor
# ❌ DENIED: No access to host filesystem
```

**Result:** ✅ Host protected

---

### ✅ Resource Exhaustion (with limits)
**Scenario:** Malicious code tries to consume all RAM

```yaml
# With resource limits:
deploy:
  resources:
    limits:
      memory: 2G  # Max 2GB RAM
```

**Result:** ✅ Host protected (container killed if exceeds)

---

## What Podman Does NOT Protect Against

### ❌ Application Vulnerabilities

**Scenario:** SQL Injection in YOUR code

```javascript
// YOUR CODE - VULNERABLE
app.get('/user/:id', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`
  // ❌ SQL injection possible
})
```

**Result:** ❌ Container isolation doesn't fix bad code

**Solution:** Write secure code (use parameterized queries)

---

### ❌ Weak Authentication

**Scenario:** Default/weak passwords

```
Username: admin
Password: admin123  // ❌ Weak password
```

**Result:** ❌ Container can't fix weak passwords

**Solution:** Enforce strong passwords, 2FA

---

### ❌ Data Leaks via API

**Scenario:** API exposes sensitive data

```javascript
// YOUR CODE - LEAKING DATA
app.get('/api/users', (req, res) => {
  res.json(users)  // ❌ Exposing all users without auth check
})
```

**Result:** ❌ Container doesn't prevent data leaks in your logic

**Solution:** Implement proper authorization

---

### ❌ DDoS Attacks

**Scenario:** 10,000 requests/second

```
Attacker → Your App
Container: "I'll process all 10,000 requests!"
```

**Result:** ❌ Container doesn't prevent DDoS

**Solution:** Rate limiting (already in your app), firewall rules

---

## Rootless vs Rootful

### Rootless Mode (RECOMMENDED - What You're Using)

```bash
# Check if rootless
podman info | grep rootless
# Should show: rootless: true
```

**Security Benefits:**
- ✅ Container root ≠ host root
- ✅ No daemon running as root
- ✅ User namespace isolation
- ✅ Can't damage system even with exploit
- ✅ Safe for multi-user systems

**Trade-offs:**
- ⚠️ Can't bind to ports < 1024 on host (doesn't affect you - using 4010+)
- ⚠️ Some advanced features limited (doesn't affect typical apps)

### Rootful Mode (NOT RECOMMENDED)

```bash
# If rootful (DON'T DO THIS)
sudo podman run ...
```

**Security Risks:**
- ❌ Container root = host root
- ❌ Daemon runs as root
- ❌ Compromise = system compromise
- ❌ Can damage host system

**When to use:** Only if you absolutely need privileged operations

---

## Security Best Practices

### 1. Don't Expose Database Port

**❌ Current (Insecure):**
```yaml
postgres:
  ports:
    - "5432:5432"  # Anyone on LAN can connect directly
```

**✅ Secure:**
```yaml
postgres:
  # No ports section - only app container can access
  networks:
    - tsklets-network
```

### 2. Set Resource Limits

**Prevents resource exhaustion attacks:**

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

### 3. Use Environment Variables for Secrets

**❌ Never hardcode:**
```yaml
environment:
  - JWT_SECRET=mysecret123  # ❌ Bad
```

**✅ Use env file:**
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}  # ✅ Good
```

### 4. Keep Images Updated

```bash
# Update regularly
podman pull ghcr.io/rameshbabupv/tasklets:latest
podman-compose restart
```

### 5. Use Health Checks

**Already in your config:**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "..."]
  interval: 30s
```

This auto-restarts crashed containers.

### 6. Run as Non-Root User Inside Container

**Your Dockerfile should:**
```dockerfile
# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# App now runs as appuser, not root
```

---

## Hardening Your Deployment

### Network Security

**Option 1: Internal Network Only (Most Secure)**
```yaml
networks:
  tsklets-network:
    driver: bridge
    internal: true  # Blocks all external internet access
```

**Use when:** App doesn't need to download anything from internet

---

**Option 2: Whitelist Outbound (Balanced)**
```bash
# Use firewall to whitelist specific domains
sudo firewall-cmd --permanent --direct --add-rule ipv4 filter OUTPUT 0 \
  -m owner --uid-owner $(id -u) -d fonts.googleapis.com -j ACCEPT
```

**Use when:** App needs specific external services

---

### Filesystem Security

**Read-only root filesystem:**
```yaml
app:
  read_only: true  # Prevents file modifications
  tmpfs:
    - /tmp  # Allow writes only to /tmp
```

**Trade-off:** App can't write config files or logs to disk

---

### Monitoring and Auditing

**1. Check container logs regularly:**
```bash
podman logs tsklets-app | grep -i error
```

**2. Monitor resource usage:**
```bash
podman stats tsklets-app
```

**3. Scan images for vulnerabilities:**
```bash
podman scan ghcr.io/rameshbabupv/tasklets:latest
```

---

## Quick Security Checklist

Before deploying to production:

- [ ] Using rootless Podman (not sudo)
- [ ] Database port NOT exposed (5432)
- [ ] Strong DB password (min 16 chars, generated)
- [ ] Strong JWT secret (min 32 chars, random)
- [ ] Resource limits set (CPU/RAM)
- [ ] CORS configured (only allow your IP)
- [ ] Firewall rules configured (only necessary ports)
- [ ] Health checks enabled
- [ ] Images kept updated
- [ ] Regular backups configured

---

## Real-World Security Levels

### Your Current Setup (Good for LAN):
```
Security Level: ████████░░ 80%

✅ Container isolation (rootless)
✅ Network isolation
✅ Health checks
✅ No exposed volumes
⚠️ Database port exposed (minor risk on LAN)
⚠️ HTTP only (acceptable for internal)
```

### Production Internet-Facing (Would Need):
```
Security Level: ██████████ 100%

✅ All of the above
✅ Database port hidden
✅ HTTPS/TLS encryption
✅ Nginx reverse proxy
✅ Rate limiting
✅ WAF (Web Application Firewall)
✅ Regular security audits
```

---

## Summary

**What you SHOULD worry about:**
1. Writing secure application code
2. Using strong passwords/secrets
3. Keeping software updated
4. Regular backups

**What you DON'T need to worry about (Podman handles it):**
1. Container escaping to host
2. Other containers attacking each other
3. Resource exhaustion (with limits)
4. Filesystem isolation

**Bottom Line:**
Podman containers provide **strong isolation** for your application. They're much more secure than running apps directly on the host. However, **security is a shared responsibility** - Podman protects the infrastructure, but you must write secure application code.

For your internal LAN deployment, the current security level is **appropriate and safe**.
