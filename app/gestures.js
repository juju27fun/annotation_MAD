// Two clicks in either order, or a drag, on either time-domain plot.
state.pendingBoundary=null;
function addInterval(a,b){
 const start=Math.min(a,b),end=Math.max(a,b);
 if(start===end){report(new Error('Les deux bornes doivent être différentes. Clique sur l’autre borne.'));return false;}
 const event={id:crypto.randomUUID(),start,end,kind:'particle',presence:'certain',boundary:'clear',censoring:'none',difficulty:'none',defaulted_fields:['presence','boundary','censoring','difficulty','kind'],comment:''};
 events().push(event);state.selected=event.id;state.pendingBoundary=null;changed();renderEvents();render();
 $('hint').textContent='Événement créé. Vérifie sa confiance, puis valide-le ou clique sur deux autres bornes pour en ajouter un.';
 return true;
}
const clickRenderEvents=renderEvents;
renderEvents=function(){clickRenderEvents();$('confirmEvent').disabled=!editable()||!events().some(e=>e.id===state.selected);$('addEvent').disabled=!editable();$('complete').textContent='Terminer la trace et continuer ↵';};
const clickAction=setAction;
setAction=function(action){state.pendingBoundary=null;clickAction(action);if(action==='draw')$('hint').textContent='Clique sur une borne puis sur l’autre, dans n’importe quel ordre · petit ou grand signal · un glisser fonctionne aussi';};
const clickLoadTrace=loadTrace;
loadTrace=async function(id){state.pendingBoundary=null;await clickLoadTrace(id);if(editable())setAction('draw');};
function startAnotherEvent(){
 if(!editable())return;
 state.selected=null;setAction('draw');renderEvents();render();
 $('hint').textContent='Nouvel événement : clique sur ses deux bornes, fin puis début ou l’inverse.';
}
async function confirmEvent(){
 if(!editable())return;
 if(state.pendingBoundary!==null)throw new Error('Clique sur la seconde borne avant de valider.');
 if(!events().some(e=>e.id===state.selected))throw new Error('Sélectionne ou dessine un événement.');
 await save();startAnotherEvent();$('saveStatus').textContent='Événement enregistré. Ajoute le suivant ou termine la trace.';
}
const clickFinishTrace=finishPractice;
finishPractice=async function(empty=false){if(state.pendingBoundary!==null)throw new Error('Clique sur la seconde borne ou appuie sur Échap pour annuler le dessin.');return clickFinishTrace(empty);};
installCanvas=function(name){
 const canvas=$(name);
 canvas.addEventListener('pointerdown',e=>{
  if(!state.trace||e.button!==0)return;
  if(!editable()&&state.action!=='zoom')return;
  const r=canvas.getBoundingClientRect(),g=geometry(canvas);if(e.clientX-r.left<g.left||e.clientX-r.left>g.right||e.clientY-r.top<g.top||e.clientY-r.top>g.bottom)return;
  canvas.setPointerCapture(e.pointerId);const s=sampleAt(canvas,e),tolerance=8*(viewFor(canvas)[1]-viewFor(canvas)[0])/(g.right-g.left);
  const event=events().find(v=>v.id===state.selected&&s>=v.start-tolerance&&s<=v.end+tolerance)||events().find(v=>s>=v.start-tolerance&&s<=v.end+tolerance);
  if(state.action==='adjust'&&event&&editable()){
   state.pendingBoundary=null;state.selected=event.id;state.drag={kind:Math.abs(s-event.start)<tolerance?'left':Math.abs(s-event.end)<tolerance?'right':'move',event,start:s,initial:[event.start,event.end]};renderEvents();
  }else state.drag={kind:'range',start:s,current:s,clientStart:e.clientX,clientCurrent:e.clientX,canvas:name};
  render();
 });
 canvas.addEventListener('pointermove',e=>{
  const d=state.drag;if(!d)return;const s=sampleAt(canvas,e);
  if(d.kind==='range'){d.current=s;d.clientCurrent=e.clientX;}
  else if(d.kind==='left')d.event.start=Math.min(d.event.end-1,s);
  else if(d.kind==='right')d.event.end=Math.max(d.event.start+1,s);
  else{const width=d.initial[1]-d.initial[0];d.event.start=Math.max(0,Math.min(state.trace.n_samples-width,d.initial[0]+s-d.start));d.event.end=d.event.start+width;}
  render();
 });
 canvas.addEventListener('pointerup',e=>{
  const d=state.drag;if(!d)return;state.drag=null;
  if(d.kind!=='range'){changed();renderEvents();render();return;}
  if(Number.isFinite(e.clientX)){d.current=sampleAt(canvas,e);d.clientCurrent=e.clientX;}
  const dragged=Math.abs(d.clientCurrent-d.clientStart)>=4;
  if(state.action==='zoom'){
   if(dragged&&d.start!==d.current)setView(Math.min(d.start,d.current),Math.max(d.start,d.current));
  }else if(editable()){
   if(dragged){state.pendingBoundary=null;addInterval(d.start,d.current);}
   else if(state.pendingBoundary===null){state.pendingBoundary=d.current;$('hint').textContent='Première borne posée. Clique sur l’autre borne, à gauche ou à droite · Échap pour annuler.';}
   else addInterval(state.pendingBoundary,d.current);
  }
  renderEvents();render();
 });
 canvas.addEventListener('pointercancel',()=>{if(state.drag?.event&&state.drag.initial)[state.drag.event.start,state.drag.event.end]=state.drag.initial;state.drag=null;render();});
 // No double-click reset: two boundary clicks must not trigger an unrelated zoom.
};
