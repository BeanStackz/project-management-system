# Project Management System

A full-stack project management application for organizing projects, issues,
collaborators, conversations, and subscriptions in one workspace.

## What it provides

- User registration and JWT-based authentication.
- Project creation and ownership management.
- Collaborators and invitation workflow.
- Issue creation, tracking, comments, assignment, and status management.
- Project chat and messages.
- Subscription plans with frontend and backend feature enforcement.
- Razorpay payment and subscription upgrade flow.
- Current-plan display in the account menu and pricing interface.
- Responsive React interface with mobile navigation.
- MySQL-backed Spring Boot API.

The backend is authoritative for plan limits and permissions. Frontend plan
gates improve the user experience, but API authorization is enforced again on
the server.

## Plan behavior

| Capability | Free | Monthly Pro | Annual Pro |
|---|---:|---:|---:|
| Owned active projects | 1 | Unlimited | Unlimited |
| Basic issues | Yes | Yes | Yes |
| Project chat | Yes | Yes | Yes |
| Collaborators and invitations | No | Yes | Yes |
| Issue assignment | No | Yes | Yes |
| Advanced issue tracking | No | Yes | Yes |
| Priority support | Manual support | Manual support | Manual support |

The free-project limit counts projects owned by the user. A project where the
user is only a collaborator does not consume the user's owned-project limit.
Upgrading overrides the current subscription plan from the upgrade date.

## Repository layout

```text
project-management-frontend/   React, TypeScript, Vite frontend
project-management-system/     Spring Boot, Java, MySQL backend
containerfiles/                Local Podman Compose setup
deployment/                    Remote Ansible, Podman, systemd, and Caddy setup
```

The `containerfiles/` directory is for local development. The `deployment/`
directory is isolated for remote VM deployments and uses its own
[`Containerfile`](./deployment/Containerfile).

## Prerequisites

- Node.js and npm.
- Java 25 JDK.
- MySQL 8 or compatible MySQL service.
- Podman, if using the local container workflow.
- Fedora WSL, Ansible, Podman, and SSH, if using the remote deployment workflow.

H2 and other embedded databases are not supported. Development, testing, and
deployment use MySQL.

## Run the frontend locally

```bash
cd project-management-frontend
npm install
```

Create a local environment file based on
[`\.env.example`](./project-management-frontend/.env.example), then start Vite:

```bash
npm run dev
```

The frontend uses `VITE_API_URL` for the backend URL. The default local backend
URL is `http://localhost:8080`.

Useful frontend commands:

```bash
npm run typecheck
npm run build
npm run lint
```

## Run the backend locally with MySQL

Make sure MySQL is running and create the database/user required by the
application. Then configure the backend datasource and secrets through the
Spring profile/environment values.

From the backend directory:

```bash
cd project-management-system
./mvnw spring-boot:run
```

On Windows, use:

```powershell
cd project-management-system
.\mvnw.cmd spring-boot:run
```

The API listens on `http://localhost:8080` by default.

## Run the complete local stack with Podman

The local Compose workflow starts MySQL and the backend together:

```bash
cd containerfiles
cp .env.example .env
podman compose up --build
```

On PowerShell:

```powershell
cd containerfiles
Copy-Item .env.example .env
podman compose up --build
```

The local backend is available at `http://localhost:8080`. Stop the stack with:

```bash
podman compose down
```

See [`containerfiles/README.md`](./containerfiles/README.md) for local
container configuration.

## Remote deployment

The recommended production strategy is a single Linux VM deployed through
Ansible. The workflow:

1. Compiles and packages the backend with Java 25.
2. Builds a production Podman image locally.
3. Exports and uploads the image to the VM.
4. Provisions Podman and Caddy.
5. Runs MySQL and the backend as systemd-managed Podman containers.
6. Exposes the backend through HTTPS using Caddy.

The default remote mode provisions MySQL on the VM. An external MySQL mode is
also available. Follow [`deployment/README.md`](./deployment/README.md) and
[`deployment/DEPLOYMENT-STRATEGIES.md`](./deployment/DEPLOYMENT-STRATEGIES.md).

## Configuration and secrets

Never commit real credentials. Local deployment files are ignored:

```text
deployment/.env.deploy
deployment/backend.env
```

Use the provided example files as templates. Set a strong JWT secret, database
passwords, mail credentials, payment credentials, and the frontend callback
URL before using the application.

## Verification

Before a frontend change:

```bash
cd project-management-frontend
npm run typecheck
npm run build
```

Before a backend deployment:

```bash
cd project-management-system
./mvnw -DskipTests verify
```

The deployment preflight skips test execution because the remote MySQL service
does not exist until the Ansible playbook runs. It does not use H2.

## License

Add the project license and copyright information here when they are finalized.
