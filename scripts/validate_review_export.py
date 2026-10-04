"""Validate an independent export without computing reviewer agreement."""
from datetime import datetime
import argparse
import hashlib
import json
import re
from pathlib import Path

def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def digest(v):return hashlib.sha256(canonical(v).encode()).hexdigest()

def validate(payload,manifest,contract,require_complete=False,release=None,reviewers=None):
    if payload.get('schema_version')!=2 or payload.get('scope')!='independent_full_trace_review':
        raise ValueError('Not an independent annotation export')
    if payload.get('manifest_sha256')!=digest(manifest) or payload.get('contract_sha256')!=digest(contract):
        raise ValueError('Wrong dataset or contract')
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,64}',payload.get('reviewer','')):raise ValueError('Missing reviewer')
    if reviewers is not None:
        who=reviewers.get(payload.get('reviewer'))
        if not re.fullmatch(r'session-[a-f0-9-]{36}',payload.get('reviewer','')) or not isinstance(payload.get('reviewer_name'),str):raise ValueError('Wrong local session')
    if release is not None:
        for field in ('release_id','release_sha256','protocol_sha256','interface_version'):
            if payload.get(field)!=release[field]:raise ValueError('Wrong release: '+field)
    rows={r['id']:r for r in manifest['records']};records=payload.get('records')
    if not isinstance(records,dict) or set(records)-set(rows):raise ValueError('Foreign or malformed records')
    if type(payload.get('revision')) is not int or payload['revision']<0:raise ValueError('Invalid revision')
    completed=[];uncertain=[]
    for rid,rec in records.items():
        source=rows[rid]
        for key in ('signal_sha256','raw_sha256','n_samples','fs_hz'):
            if rec.get(key)!=source[key]:raise ValueError('Trace provenance mismatch')
        if rec.get('status') not in ('in_progress','completed'):raise ValueError('Invalid status')
        assessment=rec.get('trace_assessment','interpretable')
        if assessment not in ('interpretable','uncertain','unusable'):raise ValueError('Invalid trace assessment')
        if type(rec.get('empty_confirmed')) is not bool:raise ValueError('Missing explicit absence flag')
        for key in ('started_at','updated_at')+ (('completed_at',) if rec['status']=='completed' else ()):
            stamp=rec.get(key)
            if not isinstance(stamp,str):raise ValueError('Missing timestamp')
            datetime.fromisoformat(stamp.replace('Z','+00:00'))
        events=rec.get('events');seen=set()
        if not isinstance(events,list):raise ValueError('Invalid events')
        for e in events:
            if not isinstance(e.get('id'),str) or not e['id'] or e['id'] in seen:raise ValueError('Duplicate event')
            seen.add(e['id']);a,b=e.get('start'),e.get('end')
            if type(a) is not int or type(b) is not int or not 0<=a<b<=source['n_samples']:raise ValueError('Invalid bounds')
            for key,values in {'kind':('particle','artifact'),'presence':('certain','uncertain'),
                'boundary':('clear','uncertain'),'censoring':('none','left','right','both'),
                'difficulty':('none','overlap','artifact','unresolved_count','other')}.items():
                if e.get(key) not in values:raise ValueError('Missing or invalid '+key)
            defaults=e.get('defaulted_fields')
            if not isinstance(defaults,list) or set(defaults)-set(contract['defaults']):raise ValueError('Missing default provenance')
        passages=[e for e in events if e['kind']=='particle']
        if rec.get('empty_confirmed') and (passages or assessment!='interpretable'):raise ValueError('Contradictory empty trace')
        if rec['status']=='completed':
            if not passages and not rec.get('empty_confirmed') and assessment=='interpretable':raise ValueError('Implicit empty trace')
            if not rec.get('completed_at'):raise ValueError('Missing completion timestamp')
            completed.append(rid)
        if assessment!='interpretable':uncertain.append(rid)
    missing=sorted(set(rows)-set(completed))
    if payload.get('locked') or payload.get('complete') or require_complete:
        if missing or payload.get('locked') is not True or payload.get('complete') is not True:raise ValueError('Incomplete final review')
        core={k:v for k,v in payload.items() if k!='receipt'}
        if payload.get('receipt',{}).get('payload_sha256')!=digest(core):raise ValueError('Receipt checksum mismatch')
    return {'valid':True,'complete':not missing,'missing_or_unfinished':missing,'uncertain_or_unusable_traces':uncertain,'scope':'structure and identity only; no agreement calculation'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('export',type=Path);p.add_argument('--bundle',type=Path,required=True);p.add_argument('--complete',action='store_true');a=p.parse_args()
    print(json.dumps(validate(json.loads(a.export.read_text()),json.loads((a.bundle/'MANIFEST.json').read_text()),json.loads((a.bundle/'CONTRACT.json').read_text()),a.complete,json.loads((a.bundle/'RELEASE.json').read_text()),json.loads((a.bundle/'REVIEWERS.json').read_text())),indent=2))
