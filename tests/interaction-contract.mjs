// Unit tests on input handlers with plain objects. No browser rendering implied.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../app/app.js',import.meta.url),'utf8').replace('init().catch(report);','');
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{id,checked:true,value:'',disabled:false,handlers:{},classList:{toggle(){}},getBoundingClientRect:()=>({left:0,top:0,width:1072,height:460}),setPointerCapture(){},addEventListener(name,handler){this.handlers[name]=handler;}});return nodes.get(id);}
const context=vm.createContext({document:{getElementById:node},window:{},console,crypto:{randomUUID:()=>`test-${Math.random()}`},setTimeout:()=>1,clearTimeout(){}});
vm.runInContext(source,context);
vm.runInContext(`render=()=>{};renderEvents=()=>{};save=async()=>{};state.trace={id:'ESSAI-01',n_samples:16384,fs_hz:2000000};state.mode='practice';state.annotation=emptyRecord();state.lastSnapshot=JSON.stringify(state.annotation);state.view=[2000,6000];installCanvas('raw');installCanvas('filtered');`,context);
const state=vm.runInContext('state',context);
function drag(id,x1,x2){const n=node(id);n.handlers.pointerdown({button:0,pointerId:1,clientX:x1,clientY:100});n.handlers.pointermove({clientX:x2,clientY:100});n.handlers.pointerup({});}
// Overview remains in full-trace coordinates after a detail zoom.
assert.equal(vm.runInContext("sampleAt(document.getElementById('raw'),{clientX:556})",context),8192);
assert.equal(vm.runInContext("sampleAt(document.getElementById('filtered'),{clientX:556})",context),4000);
vm.runInContext("state.action='draw'",context);
drag('raw',306,556);
assert.equal(state.annotation.events.length,0);
assert.deepEqual(Array.from(state.view),[4096,8192]);
// Draw an interval in the filtered detail and then shift it in adjust mode.
drag('filtered',306,556);
assert.equal(state.annotation.events.length,1);assert.equal(state.annotation.events[0].presence,'certain');assert.equal(state.annotation.events[0].boundary,'clear');assert.equal(state.annotation.events[0].defaulted_fields.includes('presence'),true);
assert.deepEqual([state.annotation.events[0].start,state.annotation.events[0].end],[5120,6144]);
vm.runInContext("state.action='adjust'",context);
drag('filtered',431,531);
assert.deepEqual([state.annotation.events[0].start,state.annotation.events[0].end],[5530,6554]);
vm.runInContext('undoEdit()',context);
assert.deepEqual([state.annotation.events[0].start,state.annotation.events[0].end],[5120,6144]);
vm.runInContext('undoEdit()',context);
assert.equal(state.annotation.events.length,0);
// Frozen history cannot acquire events even if a stale draw mode exists.
vm.runInContext("state.mode='history';state.action='draw';",context);
drag('filtered',306,556);
assert.equal(state.annotation.events.length,0);
console.log('PASS: overview/detail coordinates, draw, adjust, undo and read-only history. No browser rendering tested.');
