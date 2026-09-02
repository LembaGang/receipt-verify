#!/bin/sh
# Verify that every commit in a range carries a good SSH signature from a key in
# SIGNING_KEYS.
#
# Why this exists: every commit here is SSH-signed, and until SIGNING_KEYS was
# added to the repository only the laptop that made them could check that. A
# reviewer with a clone, and CI, must be able to verify the history from the
# repository alone.
#
# It calls `ssh-keygen -Y verify` directly rather than `git verify-commit`, so it
# does not depend on the checker having `gpg.ssh.allowedSignersFile` configured
# -- a fresh clone and a CI runner have not. That is the same method the Lead
# ratifications used.
#
# Usage:
#   sh tools/verify-history.sh                 # the whole history
#   sh tools/verify-history.sh --range A..B    # a range, as git rev-list takes it
#
# Exit 0 when every commit in the range verifies. Exit 1 on the first commit that
# does not, including any commit carrying no signature at all: an unsigned commit
# is a failure, never a skip.

set -eu

cd "$(dirname "$0")/.."

KEYS="SIGNING_KEYS"
RANGE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --range)
      if [ $# -lt 2 ]; then
        echo "verify-history: --range needs an argument" >&2
        exit 2
      fi
      RANGE="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "verify-history: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [ ! -f "$KEYS" ]; then
  echo "verify-history: $KEYS not found; cannot verify anything" >&2
  exit 2
fi

if ! command -v ssh-keygen >/dev/null 2>&1; then
  echo "verify-history: ssh-keygen not on PATH" >&2
  exit 2
fi

# Default range: the whole history. rev-list with no range needs an explicit ref.
if [ -z "$RANGE" ]; then
  COMMITS=$(git rev-list --reverse HEAD)
  WHAT="the full history"
else
  COMMITS=$(git rev-list --reverse "$RANGE")
  WHAT="$RANGE"
fi

if [ -z "$COMMITS" ]; then
  echo "verify-history: no commits in $WHAT"
  exit 0
fi

TMP=$(mktemp -d)
# Clean up the signature and payload files whatever happens: they are extracts of
# commit objects, but there is no reason to leave them lying in the temp dir.
trap 'rm -rf "$TMP"' EXIT INT TERM

TOTAL=0
echo "verify-history: $WHAT, against $KEYS"

for SHA in $COMMITS; do
  TOTAL=$((TOTAL + 1))
  SUBJECT=$(git show -s --format='%s' "$SHA")
  SIGNER=$(git show -s --format='%ce' "$SHA")

  # Split the commit object into the signed payload and the SSHSIG block. The
  # signature sits in a `gpgsig` header whose continuation lines are indented by
  # one space; the payload is the object with that header removed entirely.
  git cat-file commit "$SHA" | awk -v sig="$TMP/sig" '
    /^gpgsig / { insig = 1; sub(/^gpgsig /, ""); print > sig; next }
    insig && /^ /  { sub(/^ /, ""); print >> sig; next }
    { insig = 0; print }
  ' > "$TMP/payload"

  if [ ! -s "$TMP/sig" ]; then
    echo "UNSIGNED  $SHA  $SUBJECT"
    echo "verify-history: FAILED -- $SHA carries no signature" >&2
    exit 1
  fi

  if OUT=$(ssh-keygen -Y verify -f "$KEYS" -I "$SIGNER" -n git -s "$TMP/sig" < "$TMP/payload" 2>&1); then
    echo "Good      $SHA  $SIGNER  $SUBJECT"
  else
    echo "BAD       $SHA  $SIGNER  $SUBJECT"
    echo "$OUT" >&2
    echo "verify-history: FAILED -- $SHA did not verify against $KEYS" >&2
    exit 1
  fi

  rm -f "$TMP/sig" "$TMP/payload"
done

echo "verify-history: $TOTAL/$TOTAL commits verified against $KEYS"
exit 0
