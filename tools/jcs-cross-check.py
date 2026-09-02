#!/usr/bin/env python3
"""Second-opinion JCS serialiser for tools/walk-digests.ts.

The walker canonicalizes with the repository's TypeScript JCS (the one the
adapters use). That serialiser is also the one every digest in this repository
was checked with, so agreement between it and itself proves nothing. This script
re-serialises the same values with the INDEPENDENT Python implementation in
tools/asqav_envelope_hash.py -- written for the -08 rerun, sharing no code with
the TypeScript one and depending on no third-party package -- and returns enough
for the walker to detect a disagreement before it compares any digest.

That module is imported unmodified: this file adds a batch protocol, it does not
reimplement or adjust the serialiser under test.

Protocol (line-delimited JSON, stdin -> stdout, one response per request):
  in : {"id": <string>, "value": <any JSON value>}
  out: {"id": <string>, "len": <byte length of the JCS bytes>,
        "sha256": <hex sha256 of the JCS bytes>, "jcs": <the JCS string>}
  out on failure: {"id": <string>, "error": <message>}

`jcs` is returned in full so a disagreement can be reported with both strings
rather than only with two digests that differ.
"""

import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from asqav_envelope_hash import jcs  # noqa: E402  (path set above)


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception as e:
            sys.stdout.write(json.dumps({"id": None, "error": "request is not JSON: %s" % e}) + "\n")
            sys.stdout.flush()
            continue
        rid = req.get("id")
        try:
            s = jcs(req["value"])
            b = s.encode("utf-8")
            out = {"id": rid, "len": len(b), "sha256": hashlib.sha256(b).hexdigest(), "jcs": s}
        except Exception as e:
            # Fail closed and say why: the walker treats this as a disagreement,
            # never as a pass.
            out = {"id": rid, "error": "%s: %s" % (type(e).__name__, e)}
        sys.stdout.write(json.dumps(out) + "\n")
        sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main())
