#!/bin/sh
# Write SHA256SUMS over every file in a package, then sign it.
#
#   sh tools/sign-package.sh packages/<name> [path/to/private/key]
#
# The default key is $HOME/.ssh/id_ed25519_signing, whose public half is the one
# line in SIGNING_KEYS and the key every commit here is signed with. Pass a path
# to use another. THIS SCRIPT READS A PRIVATE KEY -- it is the only file in this
# repository that does, it never prints it, never copies it, and never writes
# anything but SHA256SUMS and SHA256SUMS.sig.
#
# Namespace `file`, so the signature cannot be replayed as a git signature
# (namespace `git`) or as anything else: ssh-keygen binds the namespace into the
# signed blob, and a verifier asking for one namespace will not accept the other.
#
# The counterpart is `sh tools/verify-package.sh <dir>`, which needs no key at
# all -- only the repository's SIGNING_KEYS.

set -eu

DIR="${1:-}"
KEY="${2:-$HOME/.ssh/id_ed25519_signing}"

if [ -z "$DIR" ]; then
  echo "sign-package: give one package directory" >&2
  echo "  sh tools/sign-package.sh packages/<name> [key]" >&2
  exit 2
fi
if [ ! -d "$DIR" ]; then
  echo "sign-package: $DIR is not a directory" >&2
  exit 2
fi
if [ ! -f "$KEY" ]; then
  echo "sign-package: no private key at $KEY" >&2
  exit 2
fi
for tool in sha256sum ssh-keygen; do
  command -v "$tool" >/dev/null 2>&1 || { echo "sign-package: $tool not on PATH" >&2; exit 2; }
done

cd "$DIR"

# Every file except the two this script writes. Sorted, so the list is the same
# on any machine and a package rebuilt elsewhere produces the same SHA256SUMS
# bytes for the same contents.
find . -type f \
  ! -name SHA256SUMS \
  ! -name SHA256SUMS.sig \
  | sed 's|^\./||' | sort | while IFS= read -r f; do
    sha256sum "$f"
  done > SHA256SUMS

ssh-keygen -Y sign -f "$KEY" -n file SHA256SUMS >/dev/null 2>&1

echo "sign-package: $(grep -c . SHA256SUMS) file(s) listed in $DIR/SHA256SUMS, signed as $DIR/SHA256SUMS.sig"
