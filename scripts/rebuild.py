"""Rebuild the corrected deployment from the exact uploaded v15.5 ZIP and verified changes.
Usage: python scripts/rebuild.py path/to/daily-table-v15.5-cloudflare-upload.zip OUTPUT_DIR
No network access or credentials are used. OUTPUT_DIR must not already exist.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, sys, zipfile
root = Path(__file__).resolve().parents[1]
if len(sys.argv) != 3:
    raise SystemExit(__doc__)
archive, output = Path(sys.argv[1]), Path(sys.argv[2])
manifest = json.loads((root/'reference/rebuild-manifest.json').read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
if sha(archive.read_bytes()) != manifest['baselineSHA256']:
    raise SystemExit('Wrong baseline: use the exact v15.5 archive supplied for this repair.')
if output.exists():
    raise SystemExit('Output directory already exists; choose a new path.')
with zipfile.ZipFile(archive) as z:
    payload = {}
    for info in z.infolist():
        p = PurePosixPath(info.filename)
        if p.is_absolute() or '..' in p.parts or '\\' in info.filename:
            raise SystemExit('Unsafe archive member.')
        if info.is_dir() or info.filename in manifest['removed']:
            continue
        if (info.external_attr >> 16) & 0o170000 == 0o120000:
            raise SystemExit('Symlink archive member not allowed.')
        payload[info.filename] = z.read(info.filename)
for name, expected in manifest['changes'].items():
    content = (root/'changes'/name).read_bytes()
    if sha(content) != expected:
        raise SystemExit('Changed repair payload: '+name)
    payload[name] = content
if set(payload) != set(manifest['files']):
    raise SystemExit('File list mismatch.')
for name, content in payload.items():
    if sha(content) != manifest['files'][name]:
        raise SystemExit('Rebuild hash mismatch: '+name)
output.mkdir(parents=True)
for name, content in payload.items():
    target = output/name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
print(json.dumps({'files':len(payload),'allFilesVerified':True,'output':str(output)}))
