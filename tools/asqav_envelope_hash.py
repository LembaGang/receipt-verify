#!/usr/bin/env python3
"""Recompute the Asqav counterparty_binding.envelope_hash under both candidate scopes.

Written for the -08 rerun (B-24). The point of this file is to be independent of
the TypeScript adapter in src/: it shares no code with it, and it depends on no
third-party package, so agreement between the two is evidence rather than an
artefact of a shared bug.

RFC 8785 (JCS) is implemented here directly rather than imported. `jcs` and
`canonicaljson` are both absent from this machine and the rerun's binding rules
forbid calling any third-party endpoint other than the git clone, so installing
one was not available. The implementation below covers the subset RFC 8785
defines and FAILS CLOSED (raises) on any input it cannot serialise to the
standard exactly -- non-finite floats, integers outside the IEEE754 safe range,
and non-JSON types.

The control that this JCS is correct: the run asserts our serialiser reproduces,
byte for byte, the `canonical` string the SDK publishes alongside each vector. A
wrong serialiser fails that assertion; it is the input that would turn this
check red.

Usage:
  python tools/asqav_envelope_hash.py --vectors <path/to/conformance/vectors.json>
"""

import argparse
import base64
import hashlib
import json
import sys

SAFE_INT = 2 ** 53


def _esc(s):
    """RFC 8785 s3.2.2.2 string serialisation (the JSON.stringify escape set)."""
    out = ['"']
    for ch in s:
        o = ord(ch)
        if ch == '"':
            out.append('\\"')
        elif ch == '\\':
            out.append('\\\\')
        elif o == 0x08:
            out.append('\\b')
        elif o == 0x09:
            out.append('\\t')
        elif o == 0x0A:
            out.append('\\n')
        elif o == 0x0C:
            out.append('\\f')
        elif o == 0x0D:
            out.append('\\r')
        elif o < 0x20:
            out.append('\\u%04x' % o)
        else:
            out.append(ch)
    out.append('"')
    return ''.join(out)


def _num(n):
    """RFC 8785 s3.2.2.3 number serialisation. Fails closed outside what it can guarantee."""
    if isinstance(n, bool):                      # bool is an int subclass in Python
        raise TypeError('bool reached the number serialiser')
    if isinstance(n, int):
        if abs(n) >= SAFE_INT:
            raise ValueError('integer outside the IEEE754 safe range: %d' % n)
        return str(n)
    if isinstance(n, float):
        if n != n or n in (float('inf'), float('-inf')):
            raise ValueError('non-finite number is not valid JSON')
        if n == int(n) and abs(n) < SAFE_INT:
            return str(int(n))
        # repr() is shortest-round-trip in Python, as ECMAScript Number::toString is.
        # The two agree on ordinary magnitudes; refuse the exponent ranges where the
        # notations diverge rather than emit bytes we cannot stand behind.
        a = abs(n)
        if a >= 1e21 or a < 1e-6:
            raise ValueError('number in an exponent range where ES6 and Python notation may diverge: %r' % n)
        return repr(n)
    raise TypeError('not a number: %r' % (n,))


def _key(k):
    """RFC 8785 sorts member names by UTF-16 code unit, not by code point."""
    return k.encode('utf-16-be')


def jcs(value):
    """Serialise `value` to RFC 8785 canonical JSON as a str."""
    if value is None:
        return 'null'
    if value is True:
        return 'true'
    if value is False:
        return 'false'
    if isinstance(value, str):
        return _esc(value)
    if isinstance(value, (int, float)):
        return _num(value)
    if isinstance(value, list):
        return '[' + ','.join(jcs(v) for v in value) + ']'
    if isinstance(value, dict):
        items = sorted(value.items(), key=lambda kv: _key(kv[0]))
        return '{' + ','.join(_esc(k) + ':' + jcs(v) for k, v in items) + '}'
    raise TypeError('not JSON-serialisable under RFC 8785: %r' % (value,))


def jcs_bytes(value):
    return jcs(value).encode('utf-8')


def digest(value):
    b = jcs_bytes(value)
    h = hashlib.sha256(b).digest()
    return b, h.hex(), base64.b64encode(h).decode(), base64.urlsafe_b64encode(h).decode()


def find(vectors, name):
    for v in vectors:
        if v.get('name') == name:
            return v
    raise SystemExit('vector not found: %s' % name)


def chain_check(root):
    """Check the byte-for-byte claim -08 s5.3 makes about its own published vectors.

    -08 line 1039: the vectors asqav-03-chain-link (payload scope) and
    acta-02-chain-link (whole-receipt scope) "corroborate it byte-for-byte".
    Each vector's previousReceiptHash is recomputed here under BOTH scopes, so
    the check can distinguish "the claimed scope matches" from "either would".
    """
    import os
    print('== -08 s5.3 line 1039: the two chain vectors, recomputed under both scopes ==')
    cases = [
        ('asqav-03-chain-link', 'payload member R', 'payload'),
        ('acta-02-chain-link', 'whole receipt incl. signature', 'whole'),
    ]
    all_ok = True
    for name, claimed, scope in cases:
        d = os.path.join(root, name)
        pred = json.load(open(os.path.join(d, 'predecessor.json'), encoding='utf-8'))
        rcpt = json.load(open(os.path.join(d, 'receipt.json'), encoding='utf-8'))
        stated = rcpt['payload']['previousReceiptHash']
        h_payload = hashlib.sha256(jcs_bytes(pred['payload'])).hexdigest()
        h_whole = hashlib.sha256(jcs_bytes(pred)).hexdigest()
        got = h_payload if scope == 'payload' else h_whole
        other = h_whole if scope == 'payload' else h_payload
        ok = (stated == got)
        all_ok = all_ok and ok
        print('  %-22s claimed scope: %s' % (name, claimed))
        print('    stated previousReceiptHash : %s' % stated)
        print('    SHA-256(JCS(payload))      : %s' % h_payload)
        print('    SHA-256(JCS(whole receipt)): %s' % h_whole)
        print('    matches claimed scope      : %s' % ok)
        print('    the other scope also match : %s' % (stated == other))
    print('  RESULT: %s' % ('both vectors corroborate the scope -08 assigns them'
                            if all_ok else 'AT LEAST ONE VECTOR DOES NOT MATCH ITS CLAIMED SCOPE'))
    return all_ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vectors', required=True)
    ap.add_argument('--conformance-dir', help='verifier/conformance-vectors of the SDK checkout')
    ap.add_argument('--envelope-vector', default='counterparty_binding_envelope_byte_equality')
    ap.add_argument('--binding-vector', default='counterparty_binding_happy_path')
    args = ap.parse_args()

    doc = json.load(open(args.vectors, encoding='utf-8'))
    vecs = doc['vectors']

    print('vectors.json: version=%s canonicalization=%r hash_algorithm=%r vectors=%d'
          % (doc.get('version'), doc.get('canonicalization'), doc.get('hash_algorithm'), len(vecs)))
    print()

    # -- Control: our JCS must reproduce every published `canonical` string exactly.
    print('== CONTROL: our RFC 8785 serialiser vs the SDK-published `canonical` bytes ==')
    ok = bad = skipped = 0
    for v in vecs:
        if 'canonical' not in v or 'input' not in v:
            skipped += 1
            continue
        try:
            mine = jcs(v['input'])
        except Exception as e:                       # fail closed, loudly
            print('  ERROR %-52s %s' % (v['name'], e))
            bad += 1
            continue
        if mine == v['canonical']:
            ok += 1
        else:
            bad += 1
            print('  MISMATCH %-49s' % v['name'])
            print('    ours: %s' % mine[:160])
            print('    sdk : %s' % v['canonical'][:160])
    print('  reproduced %d/%d published canonical strings (%d skipped, %d mismatched)'
          % (ok, ok + bad, skipped, bad))
    print()

    env = find(vecs, args.envelope_vector)
    binding = find(vecs, args.binding_vector)

    e = env['input']
    for k in ('payload', 'signature', 'anchors'):
        if k not in e:
            raise SystemExit('envelope vector lacks member %r; the scopes below would be meaningless' % k)

    three_key = {'payload': e['payload'], 'signature': e['signature'], 'anchors': e['anchors']}
    minus_anchors = {'payload': e['payload'], 'signature': e['signature']}

    b_a, hex_a, b64_a, b64u_a = digest(three_key)
    b_b, hex_b, b64_b, b64u_b = digest(minus_anchors)

    # The value actually published in B's receipt.
    published_b64 = binding['input']['counterparty_binding']['envelope_hash']
    published_hex = base64.b64decode(published_b64).hex()

    print('== T4.2: envelope_hash recomputed both ways from the peer envelope bytes ==')
    print('peer envelope vector : %s' % env['name'])
    print('binding vector       : %s' % binding['name'])
    print()
    print('(a) JCS of the three-key object {payload, signature, anchors}   [what -08 s5.7 states]')
    print('    canonical bytes : %d' % len(b_a))
    print('    sha256 hex      : %s' % hex_a)
    print('    sha256 base64   : %s' % b64_a)
    print()
    print('(b) JCS of the object minus anchors {payload, signature}        [what -08 s4 line 657 states]')
    print('    canonical bytes : %d' % len(b_b))
    print('    sha256 hex      : %s' % hex_b)
    print('    sha256 base64   : %s' % b64_b)
    print()
    print('published envelope_hash in %s' % binding['name'])
    print('    base64          : %s' % published_b64)
    print('    hex             : %s' % published_hex)
    print()

    match = None
    if published_hex == hex_a:
        match = '(a) three-key object, anchors INCLUDED'
    elif published_hex == hex_b:
        match = '(b) envelope minus anchors'
    print('MATCH: %s' % (match if match else 'NEITHER scope reproduces the published envelope_hash'))

    # The vector's own pinned sha256 is over its whole `input`, which for the
    # envelope vector is the three-key object. Report it as a cross-check.
    print()
    print('cross-check: the envelope vector own pinned `sha256` field')
    print('    pinned          : %s' % env['sha256'])
    print('    equals (a)      : %s' % (env['sha256'] == hex_a))
    print('    equals (b)      : %s' % (env['sha256'] == hex_b))

    decl = env.get('counterparty_binding', {})
    if decl:
        print()
        print('cross-check: the envelope vector own declared counterparty_binding block')
        for k, val in sorted(decl.items()):
            print('    %-24s %s' % (k, val))

    if args.conformance_dir:
        print()
        chain_check(args.conformance_dir)

    return 0 if bad == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
