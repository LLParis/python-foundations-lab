"""Register this repository's limited native host for the local Chrome bridge."""
import base64
import hashlib
import json
from pathlib import Path
import sys
import winreg

root = Path(__file__).resolve().parents[2]
manifest = json.loads((root / 'tools/browser-extension/manifest.json').read_text())
digest = hashlib.sha256(base64.b64decode(manifest['key'])).hexdigest()[:32]
extension_id = ''.join(chr(ord('a') + int(c, 16)) for c in digest)
directory = root / '.arena/browser'
directory.mkdir(parents=True, exist_ok=True)
launcher = directory / 'native-host.cmd'
launcher.write_text('@echo off\n"' + sys.executable + '" "' + str(root / 'tools/browser-bridge/native_host.py') + '" %*\n', encoding='utf-8')
host = directory / 'host.json'
host.write_text(json.dumps({'name': 'com.llparis.learning_arena',
    'description': 'Learning Arena review request bridge', 'path': str(launcher),
    'type': 'stdio', 'allowed_origins': ['chrome-extension://' + extension_id + '/']}, indent=2), encoding='utf-8')
with winreg.CreateKey(winreg.HKEY_CURRENT_USER, r'Software\Google\Chrome\NativeMessagingHosts\com.llparis.learning_arena') as key:
    winreg.SetValueEx(key, '', 0, winreg.REG_SZ, str(host))
print('Local host registered. Load this folder in Chrome:')
print(root / 'tools/browser-extension')
print('Extension ID: ' + extension_id)
