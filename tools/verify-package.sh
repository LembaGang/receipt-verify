#!/bin/sh
# Verify one evidence package: every digest, every file, and the signature over
# the digest list.
#
#   sh tools/verify-package.sh packages/<name>
#
# Exit 0 only when ALL of the following hold. Exit 1 on the first failure, and
# exit 2 when the check itself could not be made -- which is not a pass either.
#
#   1. SHA256SUMS and SHA256SUMS.sig are both present.
#   2. Every path SHA256SUMS lists exists and hashes to the value listed.
#   3. Every file in the package EXCEPT SHA256SUMS and SHA256SUMS.sig is listed
#      in SHA256SUMS. Without this the list is a claim about the files someone
#      remembered to put in it, and a file added afterwards -- an extra
#      "receipt", a second statement -- would travel inside a package whose
#      verification passes while asserting nothing about it.
#   4. SHA256SUMS.sig verifies against SIGNING_KEYS, the repository's own
#      allowed_signers file, under namespace `file`.
#
# What a pass does NOT establish. That the CONTENTS are true: a package can be
# internally perfect and still describe a settlement that never happened. What
# it establishes is that these exact bytes are the bytes the holder of the key in
# SIGNING_KEYS signed for, and that nothing in the directory has moved since. The
# statement.md inside each package says what its contents do and do not show.
#
# Uses the same method tools/verify-history.sh does -- `ssh-keygen -Y verify`
# directly, against the repository's own SIGNING_KEYS -- so a fresh clone with no
# git configuration can run it.

set -eu

DIR="${1:-}"
if [ -z "$DIR" ]; then
  echo "verify-package: give one package directory" >&2
  echo "  sh tools/verify-package.sh packages/<name>" >&2
  exit 2
fi

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
KEYS="$REPO_ROOT/SIGNING_KEYS"
PRINCIPAL="127877551+LembaGang@users.noreply.github.com"

if [ ! -d "$DIR" ]; then
  echo "verify-package: $DIR is not a directory" >&2
  exit 2
fi
if [ ! -f "$KEYS" ]; then
  echo "verify-package: $KEYS not found; nothing to verify against" >&2
  exit 2
fi
for tool in sha256sum ssh-keygen; do
  command -v "$tool" >/dev/null 2>&1 || { echo "verify-package: $tool not on PATH" >&2; exit 2; }
done

cd "$DIR"
echo "verify-package: $DIR"

if [ ! -f SHA256SUMS ]; then
  echo "verify-package: FAILED -- no SHA256SUMS in $DIR" >&2
  exit 1
fi
if [ ! -f SHA256SUMS.sig ]; then
  echo "verify-package: FAILED -- no SHA256SUMS.sig in $DIR" >&2
  exit 1
fi

# ---- 2. every listed digest --------------------------------------------------
if OUT=$(sha256sum -c SHA256SUMS 2>&1); then
  N=$(grep -c . SHA256SUMS)
  echo "digests   OK        $N file(s) hash to the values SHA256SUMS lists"
else
  echo "$OUT" | grep -v ': OK$' || true
  echo "verify-package: FAILED -- a file does not hash to its listed value" >&2
  exit 1
fi

# ---- 3. no file in the package is unlisted -----------------------------------
# `find` rather than a glob: a package nests artefacts/ one level down, and a
# glob would silently not look there.
UNLISTED=""
for f in $(find . -type f | sed 's|^\./||' | sort); do
  case "$f" in
    SHA256SUMS|SHA256SUMS.sig) continue ;;
  esac
  if ! awk '{ sub(/^\*/, "", $2); print $2 }' SHA256SUMS | grep -Fxq "$f"; then
    UNLISTED="$UNLISTED $f"
  fi
done
if [ -n "$UNLISTED" ]; then
  echo "verify-package: FAILED -- in the package and not in SHA256SUMS:$UNLISTED" >&2
  exit 1
fi
echo "coverage  OK        every file in the package except SHA256SUMS and its signature is listed"

# ---- 4. the signature over the digest list -----------------------------------
if OUT=$(ssh-keygen -Y verify -f "$KEYS" -I "$PRINCIPAL" -n file -s SHA256SUMS.sig < SHA256SUMS 2>&1); then
  echo "signature OK        SHA256SUMS verifies against SIGNING_KEYS as $PRINCIPAL"
else
  echo "$OUT" >&2
  echo "verify-package: FAILED -- SHA256SUMS.sig does not verify against $KEYS" >&2
  exit 1
fi

echo "verify-package: $DIR verifies"
exit 0
