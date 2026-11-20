#!/bin/zsh
# Publish files to one Mapa státu site — AWS 472542740583 (profile startups), eu-north-1.
# Bucket and distribution come from Terraform outputs (infra/).
#
#   ./deploy.sh <site> <dir|file> [prefix]
#     site:   www (mapastatu.cz) | digitalizace | dopady | kompetitivnost | krizoverizeni |
#             krizovescenare | simulace | situace | zakony
#     prefix: path inside the site, e.g. intelligence/clenove (default: site root)
#
#   ./deploy.sh www app                          # RPP Explorer -> https://mapastatu.cz/
#   ./deploy.sh krizoverizeni ../Resilience/krizove-rizeni/v1
#
# Never deletes: the www bucket holds several projects (app, intelligence/, prototypy/, ...).
# HTML goes with no-cache, everything else max-age=300. Files over 9.5 MB are uploaded gzip-encoded
# (the front door passes at most 10 MB per response).
set -euo pipefail
[ $# -ge 2 ] || { sed -n '2,13p' "$0"; exit 2; }
SITE=$1; SRC=$2; PREFIX=${3:-}
PREFIX=${PREFIX#/}; PREFIX=${PREFIX%/}
export AWS_PROFILE=startups
TF="$(cd "$(dirname "$0")" && pwd)/infra"
B=$(terraform -chdir="$TF" output -json buckets | jq -er --arg s "$SITE" '.[$s]')
D=$(terraform -chdir="$TF" output -json distribution_ids | jq -er --arg s "$SITE" '.[$s]')
DEST="s3://$B${PREFIX:+/$PREFIX}"
[ "$SITE" = www ] && [ -z "$PREFIX" ] && [ -f "$SRC/index.html" ] && ~/.claude/skills/web-accessibility/scripts/doc-a11y "$SRC/index.html" | tail -1 || true

if [ -f "$SRC" ]; then
  aws s3 cp "$SRC" "$DEST/$(basename "$SRC")" --cache-control "no-cache"
else
  aws s3 sync "$SRC" "$DEST" --exclude ".*" --exclude "*/.*" --exclude "*.md" --exclude "test/*" \
    --exclude "*.html" --cache-control "public, max-age=300"
  aws s3 sync "$SRC" "$DEST" --exclude "*" --include "*.html" --cache-control "no-cache" --content-type "text/html; charset=utf-8"
  # big files: gzip-encode
  find "$SRC" -type f -size +9500k | while read -r f; do
    rel=${f#$SRC/}; ct=$(case "$f" in *.json) echo application/json;; *.js) echo text/javascript;; *) echo application/octet-stream;; esac)
    gzip -9c "$f" | aws s3 cp - "$DEST/$rel" --content-encoding gzip --content-type "$ct" --cache-control "public, max-age=300"
  done
fi
aws cloudfront create-invalidation --distribution-id "$D" --paths "/${PREFIX:+$PREFIX/}*" --query Invalidation.Id --output text
