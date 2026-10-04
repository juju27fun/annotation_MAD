// Exercise the shipped entry point and actual export button without browser storage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {boot} from './ui_harness.mjs';

const root=new URL('../',import.meta.url);
for(const filename of ['Revue.html','index.html','Essai.html']){
  const html=fs.readFileSync(new URL(filename,root),'utf8');
  for(const [,href] of html.matchAll(/\bhref="([^"]+)"/g)){
    if(href.startsWith('#'))continue;
    assert.ok(!/^(https?:|\/)/.test(href),'Entry point must not require remote assets: '+href);
    assert.ok(fs.existsSync(new URL(href,root)),href);
  }
}
const ui=await boot('index.html');
const id=ui.state.trace.id;
await ui.click('raw',700);await ui.click('raw',400);
const flatten=n=>[n,...(n.children||[]).flatMap(flatten)];
const choice=flatten(ui.nodes.get('eventDetails')).find(n=>n.dataset?.field==='presence'&&n.dataset.value==='uncertain');
assert.ok(choice);await choice.onclick();
await ui.nodes.get('confirmEvent').onclick();
await ui.click('raw',950);await ui.click('raw',850);
await ui.nodes.get('confirmEvent').onclick();
await ui.nodes.get('complete').onclick();
await ui.nodes.get('export').onclick();
assert.equal(ui.downloads.length,1);
const payload=JSON.parse(await ui.downloads[0].text());
assert.equal(payload.complete,false);
assert.equal(payload.records[id].events.length,2);
assert.equal(payload.records[id].events[0].presence,'uncertain');
assert.equal(payload.records[id].events[1].presence,'certain');
execFileSync(process.env.PYTHON_BIN||'python',['-B','-c',
  "import json,sys;from pathlib import Path;sys.path.insert(0,'scripts');from validate_review_export import validate;r=lambda p:json.loads(Path(p).read_text());validate(json.load(sys.stdin),r('MANIFEST.json'),r('CONTRACT.json'),False,r('RELEASE.json'),r('REVIEWERS.json'))"
],{cwd:root,input:JSON.stringify(payload),encoding:'utf8'});
const resumed=await boot('index.html',ui.memory);
assert.equal(resumed.state.practice[id].events.length,2);
assert.equal(resumed.state.practice[id].events[0].presence,'uncertain');
assert.equal(resumed.state.practice[id].status,'completed');
const practice=await boot('Essai.html');
assert.equal(practice.run('editable()'),true);
assert.ok(!practice.state.meta.practice.some(row=>row.id===id));
assert.equal(practice.state.annotation.events.length,0);
console.log('PASS: shipped entry links, startup, two events, confidence edit, export button/JSON validation, restored session, isolated synthetic exercise (simulated DOM).');
