// Full generated-script execution with a minimal DOM, not browser rendering.
import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
export async function boot(filename='Revue.html',memory=new Map()){
 const html=fs.readFileSync(new URL('../'+filename,import.meta.url),'utf8'),nodes=new Map(),downloads=[];
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.handlers={};this.value='';this.checked=true;this.disabled=false;this.hidden=false;this.open=false;this.className='';this.style={setProperty(){}};const self=this;this.classList={toggle(k,on){const a=new Set(self.className.split(' ').filter(Boolean));const next=on??!a.has(k);if(next)a.add(k);else a.delete(k);self.className=[...a].join(' ');return next;},remove(k){this.toggle(k,false);}};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  append(...xs){this.children.push(...xs);}add(x){this.append(x);}replaceChildren(...xs){this.children=xs;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){(this.handlers[k]??=[]).push(f);}setPointerCapture(){}releasePointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:1072,height:this.id==='raw'?110:460};}
  getContext(){return new Proxy({},{get:()=>()=>{},set:()=>true});}querySelectorAll(){return [];}click(){return this.onclick?.();}
 }
 for(const match of html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g)){const n=new Element(match[1]);n.id=match[2];}
 const encoded=html.split('<script id="offline-data" type="application/json">')[1].split('</script>')[0];nodes.get('offline-data').textContent=encoded;
 for(const [id,value]of [['gain','1'],['filter','all'],['search',''],['height','comfort']])nodes.get(id).value=value;
 const listeners=[];const document={getElementById:id=>nodes.get(id)||null,createElement:tag=>new Element(tag),querySelector:()=>null,body:new Element('body'),documentElement:new Element('html'),addEventListener(type,fn,capture){listeners.push({type,fn,capture});}};
 const window={devicePixelRatio:1,addEventListener(){}};
 const c=vm.createContext({document,window,crypto:webcrypto,TextEncoder,Uint8Array,Float32Array,localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},atob:s=>Buffer.from(s,'base64').toString('binary'),Option:class extends Element{constructor(text,value){super('option');this.textContent=text;this.value=value;}},ResizeObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:test';},revokeObjectURL(){}},Blob,console});
 const script=html.split('<script>')[1].split('</script>')[0].replace('startCampaign().catch(report);','window.ready=startCampaign();');vm.runInContext(script,c);await window.ready;
 return {c,nodes,memory,downloads,state:vm.runInContext('state',c),run:code=>vm.runInContext(code,c),async pointer(id,type,x,y=70){for(const fn of nodes.get(id).handlers[type]||[])await fn({button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){}});},async drag(id,a,b){await this.pointer(id,'pointerdown',a);await this.pointer(id,'pointermove',b);await this.pointer(id,'pointerup',b);},async click(id,x){await this.pointer(id,'pointerdown',x);await this.pointer(id,'pointerup',x);}};
}
