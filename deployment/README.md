# Ansible deployment

This directory is intentionally separate from `containerfiles/`, which remains
for local Compose use.

For a comparison of local, VM-based, external-database, and orchestrated
deployment options, see
[`DEPLOYMENT-STRATEGIES.md`](./DEPLOYMENT-STRATEGIES.md).

## One-time setup in Fedora WSL

Fedora WSL is a separate Linux environment. It does not need to be attached to
PowerShell or Command Prompt; launch it directly from Windows Terminal, or
start it from PowerShell with:

```powershell
wsl --list --verbose
wsl --distribution Fedora
```

If the distribution has a different registered name, use that exact name from
`wsl --list --verbose`.

Inside Fedora WSL, install the deployment tools:

```bash
sudo dnf install -y ansible-core podman openssh-clients
```

Verify the tools:

```bash
ansible-playbook --version
podman --version
ssh -V
```

If you will authenticate with an SSH password instead of a key, also install
`sshpass`:

```bash
sudo dnf install -y sshpass
```

Open the repository from Fedora WSL:

```bash
cd /mnt/d/IntelliJ/projects/Project-management-System
```

The script builds the image locally with Podman, so Podman must work inside
Fedora WSL. If Podman reports that no machine or connection is available,
initialize and start a Podman machine:

```bash
podman machine init
podman machine start
podman info
```

Only run `podman machine init` once.

Create deployment variables:

```bash
cp deployment/.env.deploy.example deployment/.env.deploy
chmod 600 deployment/.env.deploy
```

The repository already contains ignored local files named
`deployment/.env.deploy` and `deployment/backend.env`. Edit them with:

```bash
nano deployment/.env.deploy
nano deployment/backend.env
chmod 600 deployment/.env.deploy deployment/backend.env
```

Set `DEPLOY_ENV_FILE=deployment/backend.env` in `.env.deploy`, or replace it
with an absolute Fedora WSL path. Do not commit either file.

For SSH key authentication, store the key inside the Fedora WSL home directory
when possible:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
```

Test access before deploying:

```bash
ssh deploy@203.0.113.10
```

Replace the user and address with the values in `.env.deploy`.

For SSH key authentication, set `DEPLOY_SSH_KEY`. For password authentication,
set `DEPLOY_SSH_PASSWORD`; key authentication is recommended for unattended
deployments.

## Deploy

From the repository root in WSL:

```bash
set -a
source deployment/.env.deploy
set +a
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

The script also automatically loads `deployment/.env.deploy` when that file
exists, so the `set -a` and `source` commands are optional. They are useful
when you want to inspect or override deployment variables in the current
shell. Windows CRLF line endings are supported.

The script:

1. Runs `./mvnw -DskipTests verify`. Tests are skipped during the local
   preflight because the MySQL service is created on the remote VM during
   deployment; no embedded database is used.
2. Builds the backend image from `deployment/Containerfile`.
3. Exports the image as an OCI archive.
4. Uses Ansible over SSH to install/verify Podman and Caddy.
5. Loads the image on the VM.
6. Installs and starts a restart-on-failure systemd service.
7. Configures Caddy for `pms.backend.20030.xyz` and HTTPS.

The playbook updates the Ubuntu package index and upgrades installed packages
before provisioning the runtime. It installs Caddy from the official Caddy
repository when possible. If Caddy cannot be installed, it provisions Nginx as
a reverse-proxy fallback and installs Certbot; the fallback initially serves
HTTP and should be issued a certificate with Certbot after DNS and ports 80/443
are ready.

Each deployment is a fresh managed-service redeploy. Before applying the
current image and environment values, Ansible stops the existing backend,
MySQL, Caddy, and Nginx services, removes the managed Podman containers, and
overwrites the Caddy or Nginx configuration from the current repository
templates. The MySQL data volume is preserved; only the MySQL container is
recreated.

Database reset is disabled by default. To intentionally drop and recreate the
configured application database during a deployment, set this in
`deployment/.env.deploy`:

```env
DEPLOY_RESET_DATABASE=true
```

This deletes all application records while preserving the MySQL Podman volume,
container, database user, and root credentials. The reset is supported only
when `DEPLOY_DATABASE_MODE=podman`. Set it back to `false` after the reset to
prevent accidental deletion on a later deployment.

By default, the deployment creates a persistent MySQL Podman container on the
VM and connects the backend to it:

```env
DEPLOY_DATABASE_MODE=podman
DEPLOY_DB_NAME=project_management
DEPLOY_DB_USER=app
DEPLOY_DB_PASSWORD=strong-database-password
DEPLOY_DB_ROOT_PASSWORD=strong-root-password
```

To use an externally managed MySQL instance instead:

```env
DEPLOY_DATABASE_MODE=external
DEPLOY_EXTERNAL_DATABASE_URL=jdbc:mysql://db.example:3306/project_management
DEPLOY_EXTERNAL_DATABASE_USERNAME=app
DEPLOY_EXTERNAL_DATABASE_PASSWORD=strong-database-password
```

In external mode, the MySQL Podman service is not created and the backend uses
the supplied database URL.

The default mode creates two long-running Podman containers managed by
systemd: `project-management-mysql` and `project-management-backend`. MySQL
data is stored in the persistent Podman volume
`project-management-mysql-data`.

Cloudflare DNS must point the hostname to the VM. For end-to-end HTTPS,
Cloudflare should use **Full (strict)** and the VM must be reachable on ports
80 and 443.

### Nginx HTTPS fallback

Use this only when the deployment output says that Caddy could not be
installed and Nginx was selected as the reverse proxy. First confirm that:

- `pms.backend.20030.xyz` resolves to the VM public IP.
- Azure NSG/firewall rules allow inbound TCP ports 80 and 443.
- The backend deployment completed successfully.
- Nginx is serving the domain over HTTP.

SSH into the VM:

```bash
ssh azureuser@20.40.57.73
```

Run Certbot on the VM:

```bash
sudo certbot --nginx \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  -d pms.backend.20030.xyz
```

Verify Nginx and HTTPS:

```bash
sudo nginx -t
sudo systemctl status nginx
curl -I https://pms.backend.20030.xyz
```

Certbot updates the Nginx configuration and schedules certificate renewal.
Check renewal without changing the live certificate:

```bash
sudo certbot renew --dry-run
```

Check the deployment remotely with:

```bash
sudo systemctl status project-management-backend
sudo journalctl -u project-management-backend -f
sudo caddy validate --config /etc/caddy/Caddyfile  # Caddy deployment
sudo nginx -t                                      # Nginx fallback
```
