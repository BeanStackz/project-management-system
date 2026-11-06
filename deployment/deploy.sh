#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/project-management-system"
ANSIBLE_DIR="${ROOT_DIR}/deployment/ansible"
BUILD_DIR="${ROOT_DIR}/deployment/.build"
DEPLOY_CONFIG_FILE="${DEPLOY_CONFIG_FILE:-${ROOT_DIR}/deployment/.env.deploy}"
IMAGE_NAME="${IMAGE_NAME:-project-management-backend}"
IMAGE_TAG="${IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
ARCHIVE="${BUILD_DIR}/${IMAGE_NAME}-${IMAGE_TAG}.tar"
INVENTORY="${BUILD_DIR}/inventory.ini"

if [[ -f "${DEPLOY_CONFIG_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  # Normalize CRLF files created or edited on Windows before sourcing them.
  source <(sed 's/\r$//' "${DEPLOY_CONFIG_FILE}")
  set +a
fi

DATABASE_MODE="${DEPLOY_DATABASE_MODE:-podman}"
RESET_DATABASE="${DEPLOY_RESET_DATABASE:-false}"

required_vars=(
  DEPLOY_HOST
  DEPLOY_USER
  DEPLOY_ENV_FILE
)
for variable in "${required_vars[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    printf 'Missing required environment variable: %s\n' "${variable}" >&2
    exit 1
  fi
done

if [[ -z "${DEPLOY_SSH_KEY:-}" && -z "${DEPLOY_SSH_PASSWORD:-}" ]]; then
  printf 'Set DEPLOY_SSH_KEY or DEPLOY_SSH_PASSWORD for SSH authentication.\n' >&2
  exit 1
fi

command -v ansible-playbook >/dev/null || { printf 'ansible-playbook is required in WSL.\n' >&2; exit 1; }
command -v podman >/dev/null || { printf 'podman is required in WSL.\n' >&2; exit 1; }
[[ -f "${DEPLOY_ENV_FILE}" ]] || { printf 'Deployment environment file not found: %s\n' "${DEPLOY_ENV_FILE}" >&2; exit 1; }
if [[ "${DATABASE_MODE}" != "podman" && "${DATABASE_MODE}" != "external" ]]; then
  printf 'DEPLOY_DATABASE_MODE must be podman or external.\n' >&2
  exit 1
fi
if [[ "${DATABASE_MODE}" == "external" && -z "${DEPLOY_EXTERNAL_DATABASE_URL:-}" ]]; then
  printf 'DEPLOY_EXTERNAL_DATABASE_URL is required when DEPLOY_DATABASE_MODE=external.\n' >&2
  exit 1
fi
if [[ "${RESET_DATABASE}" != "true" && "${RESET_DATABASE}" != "false" ]]; then
  printf 'DEPLOY_RESET_DATABASE must be true or false.\n' >&2
  exit 1
fi
if [[ "${RESET_DATABASE}" == "true" && "${DATABASE_MODE}" != "podman" ]]; then
  printf 'DEPLOY_RESET_DATABASE=true is supported only with DEPLOY_DATABASE_MODE=podman.\n' >&2
  exit 1
fi

mkdir -p "${BUILD_DIR}"
trap 'rm -rf "${BUILD_DIR}"' EXIT

printf '[1/5] Verifying and compiling backend...\n'
(
  cd "${BACKEND_DIR}"
  # Tests require the MySQL service that is created on the remote VM later.
  # Keep compilation and packaging in the deployment preflight, but do not
  # start database-dependent tests before that service exists.
  ./mvnw -B -DskipTests verify
)

printf '[2/5] Building Podman image %s...\n' "${IMAGE_REF}"
podman build --pull=missing -f "${ROOT_DIR}/deployment/Containerfile" -t "${IMAGE_REF}" "${BACKEND_DIR}"

printf '[3/5] Exporting image...\n'
podman save --format oci-archive -o "${ARCHIVE}" "${IMAGE_REF}"

if [[ "${DATABASE_MODE}" == "podman" ]]; then
  : "${DEPLOY_DB_PASSWORD:?Set DEPLOY_DB_PASSWORD for the Podman MySQL database}"
  : "${DEPLOY_DB_ROOT_PASSWORD:?Set DEPLOY_DB_ROOT_PASSWORD for the Podman MySQL database}"
fi

BACKEND_ENV_FILE="${BUILD_DIR}/backend.env"
grep -Ev '^(SPRING_DATASOURCE_URL|SPRING_DATASOURCE_USERNAME|SPRING_DATASOURCE_PASSWORD)=' "${DEPLOY_ENV_FILE}" > "${BACKEND_ENV_FILE}"
if [[ "${DATABASE_MODE}" == "podman" ]]; then
  printf 'SPRING_DATASOURCE_URL=jdbc:mysql://project-management-mysql:3306/%s?createDatabaseIfNotExist=true&allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC\n' "${DEPLOY_DB_NAME:-project_management}" >> "${BACKEND_ENV_FILE}"
  printf 'SPRING_DATASOURCE_USERNAME=%s\n' "${DEPLOY_DB_USER:-app}" >> "${BACKEND_ENV_FILE}"
  printf 'SPRING_DATASOURCE_PASSWORD=%s\n' "${DEPLOY_DB_PASSWORD}" >> "${BACKEND_ENV_FILE}"
else
  printf 'SPRING_DATASOURCE_URL=%s\n' "${DEPLOY_EXTERNAL_DATABASE_URL}" >> "${BACKEND_ENV_FILE}"
  printf 'SPRING_DATASOURCE_USERNAME=%s\n' "${DEPLOY_EXTERNAL_DATABASE_USERNAME:?Set DEPLOY_EXTERNAL_DATABASE_USERNAME for external MySQL}" >> "${BACKEND_ENV_FILE}"
  printf 'SPRING_DATASOURCE_PASSWORD=%s\n' "${DEPLOY_EXTERNAL_DATABASE_PASSWORD:?Set DEPLOY_EXTERNAL_DATABASE_PASSWORD for external MySQL}" >> "${BACKEND_ENV_FILE}"
fi

printf '[4/5] Preparing SSH inventory...\n'
{
  printf '[backend]\n%s ansible_user=%s' "${DEPLOY_HOST}" "${DEPLOY_USER}"
  if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
    printf ' ansible_ssh_private_key_file=%s' "${DEPLOY_SSH_KEY}"
  fi
  if [[ -n "${DEPLOY_SSH_PASSWORD:-}" ]]; then
    printf ' ansible_password=%s' "${DEPLOY_SSH_PASSWORD}"
  fi
  printf '\n'
} > "${INVENTORY}"
chmod 600 "${INVENTORY}"

printf '[5/5] Deploying to %s...\n' "${DEPLOY_HOST}"
extra_vars=(
  "-e" "image_archive=${ARCHIVE}"
  "-e" "image_ref=${IMAGE_REF}"
  "-e" "remote_app_dir=${REMOTE_APP_DIR:-/opt/project-management}"
  "-e" "backend_domain=${BACKEND_DOMAIN:-pms.backend.20030.xyz}"
  "-e" "deploy_env_file=${BACKEND_ENV_FILE}"
  "-e" "database_mode=${DATABASE_MODE}"
  "-e" "database_name=${DEPLOY_DB_NAME:-project_management}"
  "-e" "database_user=${DEPLOY_DB_USER:-app}"
  "-e" "database_password=${DEPLOY_DB_PASSWORD:-}"
  "-e" "database_root_password=${DEPLOY_DB_ROOT_PASSWORD:-}"
  "-e" "reset_database=${RESET_DATABASE}"
)
ansible-playbook -i "${INVENTORY}" "${ANSIBLE_DIR}/deploy.yml" "${extra_vars[@]}"

printf 'Deployment completed: https://%s\n' "${BACKEND_DOMAIN:-pms.backend.20030.xyz}"
