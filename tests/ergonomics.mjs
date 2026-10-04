// Tests of rendered control objects and callbacks, not a browser layout test.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const nodes=new Map();
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.disabled=false;this.open=false;this.value='';this.className='';}
 set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
 append(...x){this.children.push(...x);}replaceChildren(...x){this.children=x;}setAttribute(k,v){this.attributes[k]=v;}add(x){this.children.push(x);}
}
for(const id of ['eventList','eventDetails','reviewProgress','complete','hint','undo','saveStatus']){const n=new Element();n.id=id;}
const c=vm.createContext({document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag)},Option:function(text,value){this.text=text;this.value=value;},window:{},setTimeout:()=>1,clearTimeout(){}});
let source=fs.readFileSync(new URL('../app/app.js',import.meta.url),'utf8').replace('init().catch(report);','');vm.runInContext(source,c);
vm.runInContext("render=()=>{};state.mode='practice';state.reviewerReady=true;state.trace={n_samples:16384,fs_hz:2000000};state.meta={mode:'blind',practice:[{id:'x'}]};state.annotation={events:[{id:'e',start:100,end:1200,kind:'particle',presence:'certain',boundary:'clear',censoring:'none',difficulty:'none',defaulted_fields:['presence','boundary','censoring','difficulty','kind'],comment:''}],status:'in_progress'};state.selected='e';state.lastSnapshot=JSON.stringify(state.annotation);",c);
vm.runInContext(fs.readFileSync(new URL('../app/ergonomics.js',import.meta.url),'utf8'),c);
vm.runInContext('renderEvents()',c);
const flatten=n=>[n,...(n.children||[]).flatMap(flatten)];
function choices(){return flatten(nodes.get('eventDetails')).filter(n=>(n.className||'').split(' ').includes('choice'));}
let buttons=choices();assert.equal(buttons.length,4);assert.equal(buttons.filter(b=>b.attributes['aria-pressed']==='true').length,2);assert.equal(buttons.every(b=>!b.disabled),true);
assert.equal(buttons.find(b=>b.dataset.field==='presence'&&b.dataset.value==='certain').attributes['aria-pressed'],'true');
buttons.find(b=>b.dataset.field==='presence'&&b.dataset.value==='uncertain').onclick();
const event=vm.runInContext('events()[0]',c);assert.equal(event.presence,'uncertain');assert.equal(event.defaulted_fields.includes('presence'),false);assert.deepEqual([event.start,event.end],[100,1200]);
assert.equal(choices().find(b=>b.dataset.field==='presence'&&b.dataset.value==='uncertain').attributes['aria-pressed'],'true');assert.ok(nodes.get('eventList').children[0].textContent.includes('Incertaine'));
assert.equal(nodes.get('eventOptions').open,false);
vm.runInContext('state.annotation.events=[];state.selected=null;renderEvents()',c);assert.equal(choices().length,4);assert.equal(choices().every(b=>b.disabled),true);
console.log('PASS: visible selected defaults, enabled confidence choices, uncertainty callback, default provenance, unchanged bounds, event badge and empty-state preview.');
