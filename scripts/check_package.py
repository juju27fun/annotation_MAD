"""Read-only package integrity gate. Does not use labels or run a detector."""
import base64,gzip,hashlib,json,re,tomllib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def read(p):return json.loads((ROOT/p).read_text())
def main():
 manifest=read('MANIFEST.json');contract=read('CONTRACT.json');release=read('RELEASE.json')
 assert release['manifest_sha256']==digest(manifest)
 assert release['contract_sha256']==digest(contract)
 assert release['protocol_sha256']==digest(read('COLLECTION_PROTOCOL.json'))
 assert release['release_sha256']==digest({k:v for k,v in release.items() if k!='release_sha256'})
 for name,expected in release['source_hashes'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name
 for line in (ROOT/'SHA256SUMS').read_text().splitlines():
  expected,name=line.split('  ',1);assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name
 for c in tomllib.loads((ROOT/'paper/claims.toml').read_text()).values():
  value=read(c['source'])
  for part in c['measured'].split('.'):value=value[part]
  assert value==c['expect']
 source=json.loads(gzip.decompress((ROOT/'data/review.json.gz').read_bytes()))
 html=(ROOT/'Revue.html').read_text();packed=json.loads(html.split('<script id="offline-data" type="application/json">')[1].split('</script>')[0])
 assert packed['history']=={} and packed['meta']['records']==[] and packed['meta']['claims']=={}
 assert len({r['id'] for r in manifest['records']})==len(manifest['records'])==read('data/measurements.json')['trace_count']
 assert {r['id'] for r in manifest['records']}==set(source['traces'])==set(packed['traces'])
 for row in manifest['records']:
  t=packed['traces'][row['id']];assert t==source['traces'][row['id']]
  assert len(base64.b64decode(t['raw']))==row['n_samples']*4
  assert len(base64.b64decode(t['filtered']))==row['n_samples']*4
  assert hashlib.sha256(base64.b64decode(t['raw'])).hexdigest()==row['raw_sha256']
  assert row['n_samples']==t['n_samples'] and row['fs_hz']==t['fs_hz']
 for name in ['Revue.html','Essai.html']:
  text=(ROOT/name).read_text();assert '<script src=' not in text and '<link rel="stylesheet"' not in text
  assert '<style>'+(ROOT/'app/style.css').read_text()+'</style>' in text
  data=text.split('<script id="offline-data" type="application/json">')[1].split('</script>')[0]
  for forbidden in ['BUD-','human_events','historical_id','case_id','original_signal_path','annotations_auteur','matched_candidate']:assert forbidden not in data,(name,forbidden)
 # Historical labels and export files must never be packaged, including in compressed data.
 for p in ROOT.rglob('*'):
  if any(x.startswith('.') or x in ('node_modules','__pycache__') for x in p.relative_to(ROOT).parts):continue
  assert not (p.name.startswith('annotations') and p.suffix=='.json'),str(p)
 assert not (ROOT/'private').exists() and not (ROOT/'responses').exists()
 print('PASS: manifest, source/release/file hashes, complete unique cohort, raw float32 checksums, unchanged display data, no references or response files, embedded styles/scripts and claims.')
if __name__=='__main__':main()
