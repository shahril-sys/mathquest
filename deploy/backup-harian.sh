#!/usr/bin/env bash
# Sandaran harian + simpan 14 salinan terkini. Cron: 30 2 * * * /opt/mathquest/deploy/backup-harian.sh
# Salin folder sandaran ke luar pelayan (rclone/rsync) supaya selamat jika cakera rosak.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-/var/backups/mathquest}"
mkdir -p "$DEST"
node --disable-warning=ExperimentalWarning scripts/backup.js "$DEST"
ls -1dt "$DEST"/mathquest-* | tail -n +15 | xargs -r rm -rf
echo "Sandaran selesai: $(ls -1d "$DEST"/mathquest-* | wc -l) salinan di $DEST"
