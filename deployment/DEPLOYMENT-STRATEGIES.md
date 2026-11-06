# Deployment strategies

This guide explains the supported ways to run Project Management System and
when to use each one. Every strategy uses MySQL; H2 and other embedded
databases are not supported.

## Strategy comparison

| Strategy | Best for | Database | HTTPS | Operational effort |
|---|---|---|---|---|
| Direct local development | Feature development and debugging | Local MySQL | Optional | Low |
| Local Podman Compose | Reproducible development or demos | MySQL container | Optional | Low |
| Single VM with Ansible | Recommended first production deployment | MySQL Podman container | Caddy | Medium |
| Single VM with external MySQL | Production when database is managed separately | External MySQL | Caddy | Medium |
| Managed containers/orchestrator | High availability and horizontal scale | Managed MySQL recommended | Platform/edge proxy | High |

## 1. Direct local development

Use this when actively debugging Java or React code.

### Backend

1. Start a MySQL 8 service.
2. Create the application database and credentials.
3. Configure the Spring datasource and required secrets.
4. Run:

```bash
cd project-management-system
./mvnw spring-boot:run
```

### Frontend

```bash
cd project-management-frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8080` in the frontend environment.

### Advantages

- Fastest edit-run-debug cycle.
- Easy IDE debugging.
- No image build or remote host required.

### Limitations

- The environment can differ from production.
- MySQL must be installed and maintained locally.
- Not suitable for serving users.

## 2. Local Podman Compose

Use this for a repeatable local stack or a temporary demonstration environment.

```bash
cd containerfiles
cp .env.example .env
podman compose up --build
```

This starts the backend and MySQL containers. The backend reaches MySQL through
the Compose service name, not `localhost`.

Stop the stack:

```bash
podman compose down
```

Remove the database volume as well:

```bash
podman compose down -v
```

Do not use `podman compose down -v` if the database contains data you need.

## 3. Recommended production: Ansible plus Podman on one VM

This is the recommended initial production strategy because it is simple,
repeatable, and does not require Kubernetes.

### Architecture

```text
Cloudflare DNS
      |
      v
Caddy HTTPS reverse proxy :443
      |
      v
Backend Podman container :8080 (bound to VM localhost)
      |
      v
MySQL Podman container
```

Both containers run on the `project-management` Podman network. systemd
manages their lifecycle and restarts them after failures or VM reboots.

### Requirements

Inside Fedora WSL:

```bash
sudo dnf install -y ansible-core podman openssh-clients
```

The local build requires Java 25:

```bash
java -version
./project-management-system/mvnw -version
```

Both must report Java 25.

The VM must provide:

- SSH access for the deployment user.
- A Linux distribution with systemd.
- Permission to install Podman and Caddy.
- Public inbound ports 80 and 443.
- DNS pointing the backend domain to the VM.

The playbook updates and upgrades the Ubuntu package state before installing
Podman and the reverse proxy. It uses Caddy's official repository for automatic
HTTPS when available. If Caddy cannot be installed, it installs Nginx and
Certbot as a fallback; run Certbot after DNS points to the VM:

```bash
sudo certbot --nginx \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  -d pms.backend.20030.xyz
```

Run the command after connecting to the VM, not from Fedora WSL:

```bash
ssh azureuser@20.40.57.73
```

Before running Certbot, confirm that the domain resolves to the VM and that
Azure allows inbound TCP ports 80 and 443. Validate the result with:

```bash
sudo nginx -t
sudo systemctl status nginx
curl -I https://pms.backend.20030.xyz
sudo certbot renew --dry-run
```

### Configuration files

Create and protect:

```text
deployment/.env.deploy
deployment/backend.env
```

The first file controls SSH, the domain, and database provisioning. The second
contains backend secrets. Both are ignored by Git.

For the default VM-local database:

```env
DEPLOY_DATABASE_MODE=podman
DEPLOY_DB_NAME=project_management
DEPLOY_DB_USER=app
DEPLOY_DB_PASSWORD=strong-password
DEPLOY_DB_ROOT_PASSWORD=strong-root-password
```

### Deploy

From Fedora WSL:

```bash
cd /mnt/d/IntelliJ/projects/Project-management-System
./deployment/deploy.sh
```

The script automatically loads `deployment/.env.deploy`, supports Windows
CRLF files, compiles with `-DskipTests`, builds the image, and invokes
Ansible. Tests are skipped in this preflight because the remote MySQL service
is created later in the deployment. This is not a switch to an embedded
database.

Redeployments stop the existing managed backend, MySQL, Caddy, and Nginx
services, remove the managed Podman containers, replace the reverse-proxy
configuration from the repository templates, and start the selected services
with the current image and environment values. The named MySQL data volume is
preserved.

### Validate

On the VM:

```bash
sudo systemctl status project-management-mysql
sudo systemctl status project-management-backend
sudo journalctl -u project-management-backend -f
sudo caddy validate --config /etc/caddy/Caddyfile
curl -I https://pms.backend.20030.xyz
```

### Advantages

- Low infrastructure complexity.
- MySQL data persists in a Podman volume.
- systemd handles startup and restart behavior.
- Caddy automates HTTPS certificates.
- Image builds are isolated from the local development Compose files.

### Limitations

- A single VM is a single point of failure.
- Backups must be configured separately.
- Scaling requires a new architecture.
- The image is transferred as an archive rather than pulled from a registry.

## 4. Single VM with external MySQL

Choose this when MySQL is already hosted by a managed database provider or a
separate database server.

Set:

```env
DEPLOY_DATABASE_MODE=external
DEPLOY_EXTERNAL_DATABASE_URL=jdbc:mysql://db.example:3306/project_management
DEPLOY_EXTERNAL_DATABASE_USERNAME=app
DEPLOY_EXTERNAL_DATABASE_PASSWORD=strong-password
```

The Ansible deployment does not create the local MySQL container. The VM must
be able to reach the external database over its private or secured network.

### Recommended safeguards

- Restrict the database firewall to the VM IP or private network.
- Use TLS for the database connection when supported.
- Create a database user with only the required privileges.
- Enable automated backups and test restoration.
- Do not place database credentials in Git.

### Advantages

- Database backups and maintenance can be delegated to a provider.
- Database storage is independent of the application VM.
- Easier future migration to a highly available database.

### Limitations

- Adds network dependency and possible latency.
- Requires correct firewall and DNS configuration.
- Usually has an additional monthly cost.

## 5. Managed containers or an orchestrator

Consider this only when the application needs multiple backend replicas,
rolling deployments, autoscaling, or multi-zone availability.

Typical components are:

- Container registry for versioned backend images.
- Managed MySQL.
- Container service or Kubernetes.
- Managed load balancer and TLS.
- Centralized logs, metrics, and secrets.

This strategy is not currently automated by this repository. Reuse the
production image contract and environment variables, but create a separate
platform-specific deployment definition.

### Advantages

- Horizontal scaling and rolling releases.
- Better failure isolation.
- Managed networking, secrets, and observability options.

### Limitations

- Higher cost and operational complexity.
- Requires registry and platform configuration.
- More moving parts to monitor and secure.

## Database and backup policy

For VM-local MySQL:

1. Keep the named Podman volume.
2. Schedule logical or physical backups outside the VM.
3. Copy backups to separate storage.
4. Encrypt backups and restrict access.
5. Perform restoration drills.

For external MySQL, enable the provider's automated backups and verify the
retention period meets the application's recovery requirements.

## Rollback approach

The deployment image is tagged with a UTC timestamp. Preserve the previous
image archive or publish images to a private registry before deploying.

For a failed release:

1. Inspect `journalctl -u project-management-backend`.
2. Keep the MySQL data volume unchanged.
3. Restore the previous backend image tag.
4. Restart the backend systemd service.
5. Verify the HTTPS endpoint and application logs.

Database schema changes should be backward-compatible so the previous image can
run during a rollback.

## Recommended path

1. Use direct local development while implementing features.
2. Use Podman Compose to reproduce the full stack locally.
3. Start production with Ansible, one VM, Caddy, and VM-local MySQL.
4. Move MySQL to an external managed service when backup and availability
   requirements increase.
5. Adopt a registry and managed container platform only when scaling justifies
   the extra complexity.
