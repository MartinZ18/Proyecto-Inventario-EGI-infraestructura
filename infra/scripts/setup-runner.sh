#!/usr/bin/env bash
# ============================================================
# Descarga, configura e instala el runner de GitHub Actions
# como servicio systemd en LinuxEGI.
#
# Uso:
#   bash setup-runner.sh --token TOKEN
#
# El TOKEN se obtiene en GitHub:
#   MartinZ18/Proyecto-Inventario-EGI-infraestructura
#   -> Settings -> Actions -> Runners -> New self-hosted runner
#   (Linux x64) -> copiar el token de un solo uso
# ============================================================
set -euo pipefail

RUNNER_VERSION="2.335.1"
RUNNER_DIR="$HOME/actions-runner"
REPO_URL="https://github.com/MartinZ18/Proyecto-Inventario-EGI-infraestructura"
RUNNER_NAME="linuxegi-$(hostname)"
TOKEN=""

for arg in "$@"; do
    case $arg in
        --token) shift; TOKEN="$1"; shift ;;
        --token=*) TOKEN="${arg#*=}" ;;
    esac
done

if [[ -z "$TOKEN" ]]; then
    echo "Error: se requiere --token TOKEN"
    echo "Obtenerlo en: $REPO_URL -> Settings -> Actions -> Runners -> New self-hosted runner"
    exit 1
fi

log() { echo -e "\n\033[1;36m=== $* ===\033[0m"; }
ok()  { echo -e "\033[1;32m[OK]\033[0m $*"; }

# ---- Detener runner anterior si existe ----------------------
if systemctl is-active --quiet actions.runner.* 2>/dev/null; then
    log "Deteniendo runner anterior"
    sudo ./svc.sh stop 2>/dev/null || true
    sudo ./svc.sh uninstall 2>/dev/null || true
fi

pkill -f "Runner.Listener run" 2>/dev/null || true

# ---- Descargar y extraer ------------------------------------
log "Preparando directorio $RUNNER_DIR"
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

TARBALL="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
if [[ ! -f "$TARBALL" ]]; then
    echo "Descargando runner v${RUNNER_VERSION}..."
    curl -fsSL -o "$TARBALL" \
      "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TARBALL}"
    tar xzf "$TARBALL"
    ok "Runner extraído"
else
    ok "Tarball ya existe, reutilizando"
    tar xzf "$TARBALL"
fi

# ---- Configurar ---------------------------------------------
log "Configurando runner"
./config.sh \
    --unattended \
    --url "$REPO_URL" \
    --token "$TOKEN" \
    --labels minikube \
    --name "$RUNNER_NAME"
ok "Runner configurado como '$RUNNER_NAME'"

# ---- Instalar como servicio systemd -------------------------
log "Instalando como servicio systemd"
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
ok "Runner corriendo como servicio (arranca automáticamente en cada boot)"

echo ""
echo "============================================================"
echo " Runner '$RUNNER_NAME' registrado y activo."
echo " Labels: self-hosted, Linux, X64, minikube"
echo ""
echo " Verificar en GitHub:"
echo " $REPO_URL/settings/actions/runners"
echo "============================================================"
