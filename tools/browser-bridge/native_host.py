"""Chrome native messaging: transport review requests only, never execute code."""
import json
import os
from pathlib import Path
import re
import struct
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / '.arena' / 'browser'


def read(name):
    try:
        return json.loads((DATA / (name + '.json')).read_text(encoding='utf-8-sig'))
    except (OSError, ValueError):
        return {}


def write(name, value):
    DATA.mkdir(parents=True, exist_ok=True)
    target = DATA / (name + '.json')
    temp = target.with_suffix('.' + uuid.uuid4().hex + '.tmp')
    temp.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, target)


def pending():
    request = read('request')
    if request.get('expiresAt', 0) < time.time() * 1000:
        return None
    if not re.fullmatch(r'[a-f0-9-]{36}', request.get('requestId', '')):
        return None
    if not re.fullmatch(r'[a-zA-Z0-9-]{1,120}', request.get('attemptId', '')):
        return None
    local = json.loads((ROOT / '.arena' / 'local.json').read_text(encoding='utf-8-sig'))
    if request.get('url') != local.get('tutorUrl', '').rstrip('/'):
        return None
    if not re.fullmatch(r'https://chatgpt\.com/c/[a-f0-9-]+', request['url']):
        return None
    daily = json.loads((ROOT / '.arena' / 'daily.json').read_text(encoding='utf-8-sig'))
    review = daily.get('lastReview', {})
    if not review.get('published') or review.get('id') != request['attemptId'] or review.get('commit') != request.get('commit'):
        return None
    if not isinstance(request.get('text'), str) or len(request['text']) > 5000:
        return None
    return request


def handle(message):
    write('health', {'at': int(time.time() * 1000), 'version': 1})
    request = pending()
    operation = message.get('op')
    if operation == 'poll':
        if request and read('receipt').get('requestId') == request['requestId']:
            request = None
        if request and (DATA / ('claim-' + request['requestId'])).exists():
            request = None
        return {'request': request}
    if not request or message.get('requestId') != request['requestId']:
        return {'ok': False}
    if operation == 'claim':
        try:
            with (DATA / ('claim-' + request['requestId'])).open('x') as file:
                file.write('claimed\n')
        except FileExistsError:
            return {'ok': False}
        write('receipt', {'requestId': request['requestId'], 'attemptId': request['attemptId'], 'status': 'sending'})
        return {'ok': True}
    if operation == 'report' and message.get('status') in ('sent', 'blocked', 'uncertain'):
        if not (DATA / ('claim-' + request['requestId'])).exists():
            return {'ok': False}
        write('receipt', {'requestId': request['requestId'], 'attemptId': request['attemptId'],
                          'status': message['status'], 'detail': str(message.get('detail', ''))[:300],
                          'at': int(time.time() * 1000)})
        return {'ok': True}
    return {'ok': False}


def main():
    manifest = json.loads((ROOT / 'tools' / 'browser-extension' / 'manifest.json').read_text())
    import base64
    import hashlib
    digest = hashlib.sha256(base64.b64decode(manifest['key'])).hexdigest()[:32]
    extension_id = ''.join(chr(ord('a') + int(c, 16)) for c in digest)
    if len(sys.argv) < 2 or sys.argv[1] != 'chrome-extension://' + extension_id + '/':
        return
    if sys.platform == 'win32':
        import msvcrt
        msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    source, destination = sys.stdin.buffer, sys.stdout.buffer
    while True:
        header = source.read(4)
        if len(header) != 4:
            break
        size = struct.unpack('<I', header)[0]
        if size > 16384:
            break
        payload = source.read(size)
        if len(payload) != size:
            break
        message = json.loads(payload)
        try:
            response = handle(message)
        except (OSError, ValueError, KeyError):
            response = {'ok': False, 'error': 'Local review request unavailable'}
        response['rpc'] = message.get('rpc')
        encoded = json.dumps(response).encode('utf-8')
        destination.write(struct.pack('<I', len(encoded)) + encoded)
        destination.flush()


if __name__ == '__main__':
    main()
