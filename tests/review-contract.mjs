// Isolated storage/collection tests; no real annotations or browser rendering.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),html=fs.readFileSync(new URL('Revue.html',root),'utf8');
const encoded=html.split('<script id="offline-data" type="application/json">')[1].split('</script>')[0],bundle=JSON.parse(encoded);
const source=fs.readFileSync(new URL('app/offline.js',root),'utf8');
function setup(memory=new Map()){
 const c=vm.createContext({window:{},document:{getElementById:()=>({textContent:encoded}),addEventListener(){}},localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array,Float32Array,TextEncoder,crypto:webcrypto});vm.runInContext(source,c);return {api:c.window.offlineApi,memory,c};
}
const ids=[];
for(let iteration=0;iteration<2;iteration++){
 const {api,memory,c}=setup();
 c.startAnotherEvent=()=>{};c.confirmEvent=async()=>{};c.api=api;c.blindLabels=()=>{};c.$=()=>({});c.init=async()=>{c.initialized=true;};c.report=e=>{throw e;};
 vm.runInContext(fs.readFileSync(new URL('app/campaign.js',root),'utf8').replace('startCampaign().catch(report);',''),c);
 await vm.runInContext('startCampaign()',c);assert.equal(c.initialized,true);
 let current=await api('/api/practice');assert.match(current.reviewer,/^session-[a-f0-9-]{36}$/);ids.push(current.reviewer);assert.equal(current.reviewer_name,'');assert.equal(Object.keys(current.records).length,0);
 await assert.rejects(api('/api/finalize',{body:'{"revision":0}'}),/non terminée/);
 for(const [i,row]of bundle.meta.practice.entries()){
  const event={id:'fixture',start:100,end:1200,kind:'particle',presence:'certain',boundary:'clear',censoring:'none',difficulty:'none',defaulted_fields:['presence','boundary','kind','censoring','difficulty'],comment:''};
  const record={events:i===0?[event]:[],status:'completed',empty_confirmed:i>1,trace_assessment:i===1?'uncertain':'interpretable',comment:''};
  current=await api('/api/practice',{method:'POST',body:JSON.stringify({id:row.id,record,revision:current.revision})});
 }
 const resumed=await setup(memory).api('/api/practice');assert.equal(resumed.reviewer,current.reviewer);assert.equal(Object.keys(resumed.records).length,bundle.meta.practice.length);
 const final=await api('/api/finalize',{body:JSON.stringify({revision:current.revision})});assert.equal(final.complete,true);assert.equal(final.locked,true);
 // Export is immutable but the working copy stays editable, without resetting data.
 assert.equal((await api('/api/practice')).locked,false);
 const edited=JSON.parse(JSON.stringify(current.records[bundle.meta.practice[0].id]));edited.events[0].presence='uncertain';edited.events[0].defaulted_fields=edited.events[0].defaulted_fields.filter(x=>x!=='presence');edited.status='in_progress';
 const saved=await api('/api/practice',{method:'POST',body:JSON.stringify({id:bundle.meta.practice[0].id,record:edited,revision:current.revision})});assert.equal(saved.records[bundle.meta.practice[0].id].events[0].presence,'uncertain');assert.equal(final.records[bundle.meta.practice[0].id].events[0].presence,'certain');
 const imported=await setup().api('/api/import',{body:JSON.stringify({payload:final})});assert.equal(imported.receipt.payload_sha256,final.receipt.payload_sha256);
 const bad=JSON.parse(JSON.stringify(final));bad.records[bundle.meta.practice[0].id].events[0].start++;await assert.rejects(setup().api('/api/import',{body:JSON.stringify({payload:bad})}),/reçu invalide/);
 execFileSync(process.env.PYTHON_BIN||'python',['-B','-c',"import json,sys;from pathlib import Path;sys.path.insert(0,'scripts');from validate_review_export import validate;r=lambda p:json.loads(Path(p).read_text());assert validate(json.load(sys.stdin),r('MANIFEST.json'),r('CONTRACT.json'),True,r('RELEASE.json'),r('REVIEWERS.json'))['complete']"],{cwd:root,input:JSON.stringify(final),encoding:'utf8'});
}
assert.notEqual(ids[0],ids[1]);assert.equal(Object.keys(bundle.history).length,0);
assert.equal(fs.readFileSync(new URL('index.html',root),'utf8'),html);
new vm.Script(html.split('<script>')[1].split('</script>')[0]);
console.log('PASS: immediate anonymous startup, unique/resumed sessions, complete JSON snapshots, edits after export, immutable prior export, import/checksum and Python validation.');
