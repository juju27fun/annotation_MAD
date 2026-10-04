"""Rebuild standalone files without network or any scientific computation."""
import gzip,hashlib,json,tomllib,html,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def digest(v):return hashlib.sha256(canonical(v).encode()).hexdigest()
def read(p):return json.loads((ROOT/p).read_text())
def make_guide():
 blocks=[]
 for block in (ROOT/'docs/CONSIGNES.md').read_text().strip().split('\n\n'):
  if block.startswith('!['):
   m=re.fullmatch(r'!\[(.*?)\]\(([^)]+)\)',block)
   blocks.append('<img alt="'+html.escape(m[1],quote=True)+'" src="'+html.escape(m[2],quote=True)+'" style="width:100%;height:auto">');continue
  if block.startswith('# '):blocks.append('<h1>'+html.escape(block[2:])+'</h1>')
  elif block.startswith('## '):blocks.append('<h2>'+html.escape(block[3:])+'</h2>')
  elif block.startswith('- '):blocks.append('<ul>'+''.join('<li>'+html.escape(line[2:])+'</li>' for line in block.splitlines())+'</ul>')
  else:blocks.append('<p>'+html.escape(block)+'</p>')
 (ROOT/'docs/CONSIGNES.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consignes de revue</title><style>body{max-width:900px;margin:40px auto;padding:20px;font:16px/1.65 system-ui;color:#254b40;background:#f5f7f5}h2{margin-top:2em}a{color:#216b52}li{margin:.5em 0}</style><a href="../index.html">Retour à l’accueil</a>'+''.join(blocks)+'</html>')
def main():
 make_guide()
 manifest=read('MANIFEST.json');contract=read('CONTRACT.json');protocol=read('COLLECTION_PROTOCOL.json');reviewers=read('REVIEWERS.json')
 for c in tomllib.loads((ROOT/'paper/claims.toml').read_text()).values():
  value=read(c['source'])
  for part in c['measured'].split('.'):value=value[part]
  assert value==c['expect']
 assert len(manifest['records'])==read('data/measurements.json')['trace_count']
 sources=['docs/CONSIGNES.html','MANIFEST.json','CONTRACT.json','COLLECTION_PROTOCOL.json','REVIEWERS.json','docs/CONSIGNES.md','docs/exemple-synthetique.png','app/app.js','app/style.css','app/index.html','app/offline.js','app/campaign.js','app/ergonomics.js','app/gestures.js','data/review.json.gz','data/practice.json.gz','scripts/build.py']
 release={'release_id':protocol['release_id'],'interface_version':contract['interface_version'],'manifest_sha256':digest(manifest),'contract_sha256':digest(contract),'protocol_sha256':digest(protocol),'source_hashes':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in sources}}
 release['release_sha256']=digest(release)
 (ROOT/'RELEASE.json').write_text(json.dumps(release,indent=2)+'\n')
 for name,out in [('review','Revue.html'),('practice','Essai.html')]:
  obj=json.loads(gzip.decompress((ROOT/'data'/f'{name}.json.gz').read_bytes()));assert not obj['history']
  meta=obj['meta'];meta.update(version=contract['interface_version'],release_id=release['release_id'],release_sha256=release['release_sha256'],protocol_sha256=release['protocol_sha256'],reviewers=reviewers if name=='review' else {},claims={},counts={})
  if name=='review':meta.update(practice=manifest['records'],records=[],display=manifest['display'],manifest_sha256=release['manifest_sha256'],contract_sha256=release['contract_sha256'])
  html=(ROOT/'app/index.html').read_text().replace('<link rel="stylesheet" href="/style.css">','<style>'+(ROOT/'app/style.css').read_text()+'</style>')
  app=(ROOT/'app/app.js').read_text().replace('init().catch(report);','')
  scripts=(ROOT/'app/offline.js').read_text()+'\n'+app+'\n'+(ROOT/'app/ergonomics.js').read_text()+'\n'+(ROOT/'app/gestures.js').read_text()+'\n'+(ROOT/'app/campaign.js').read_text()
  encoded=json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
  html=html.replace('<script src="/app.js"></script>',f'<script id="offline-data" type="application/json">{encoded}</script><script>{scripts}</script>')
  (ROOT/out).write_text(html)
  if name=='review':(ROOT/'index.html').write_text(html)
 files=sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(x.startswith('.') or x in ('__pycache__','node_modules') for x in p.relative_to(ROOT).parts) and p.name!='SHA256SUMS')
 (ROOT/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in files))
 print('Built',release['release_id'],release['release_sha256'])
if __name__=='__main__':main()
