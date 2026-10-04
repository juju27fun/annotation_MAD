// Annotation first: visible defaults, large choices and a short validate/export loop.
function confidenceChoice(parent,event,field,title,options,disabled=false){
 const fieldset=document.createElement('fieldset');fieldset.className='confidence-group';
 const legend=document.createElement('legend');legend.textContent=title;fieldset.append(legend);
 const buttons=document.createElement('div');buttons.className='choice-row';
 for(const [value,label]of options){
  const button=document.createElement('button');button.type='button';button.dataset.field=field;button.dataset.value=value;
  const selected=event[field]===value;button.className='choice'+(selected?' selected':'')+(value==='uncertain'?' doubt':'');
  button.textContent=(selected?'✓ ':'')+label;button.setAttribute('aria-pressed',String(selected));button.disabled=disabled;
  button.onclick=()=>{if(!editable())return;event[field]=value;event.defaulted_fields=(event.defaulted_fields||[]).filter(k=>k!==field);changed();renderEvents();render();};buttons.append(button);
 }
 fieldset.append(buttons);parent.append(fieldset);
}
renderEvents=function(){
 const oldOpen=$('eventOptions')?.open||false;
 const box=$('eventList');box.replaceChildren();
 for(const [i,event]of events().entries()){
  const button=document.createElement('button');button.className='event-chip'+(state.selected===event.id?' active':'')+(event.presence==='uncertain'?' uncertain':'');
  button.textContent=`${i+1} · ${event.presence==='uncertain'?'Incertaine':'Certaine'}`;button.onclick=()=>{state.selected=event.id;renderEvents();render();};box.append(button);
 }
 const panel=$('eventDetails');panel.replaceChildren();
 const event=events().find(e=>e.id===state.selected);
 const heading=document.createElement('h2');heading.textContent=event?'Confiance de l’événement':'Dessine un événement';panel.append(heading);
 const helper=document.createElement('p');helper.className='defaults-help';helper.textContent=event?'Déjà renseigné : ne change que les exceptions.':'Glisse sur le signal. Ces valeurs seront déjà sélectionnées.';panel.append(helper);
 const values=event||{presence:'certain',boundary:'clear'};
 confidenceChoice(panel,values,'presence','Présence',[['certain','Certaine'],['uncertain','Incertaine']],!event||!editable());
 confidenceChoice(panel,values,'boundary','Bornes',[['clear','Nettes'],['uncertain','Incertaines']],!event||!editable());
 if(!event)return;
 const summary=document.createElement('p');summary.className='event-summary';
 summary.textContent=`${fmt(event.start/state.trace.fs_hz*1000)} → ${fmt(event.end/state.trace.fs_hz*1000)} ms · ${event.censoring==='none'?'pas de censure':'censure signalée'} · ${event.difficulty==='none'?'pas de difficulté':'difficulté signalée'}`;panel.append(summary);
 const details=document.createElement('details');details.id='eventOptions';details.open=oldOpen;
 const title=document.createElement('summary');title.textContent='Autres détails et bornes précises';details.append(title);
 for(const [field,label,choices]of [['kind','Nature',[['particle','Passage'],['artifact','Artefact']]],['censoring','Censure',[['none','Aucune'],['left','Début de trace'],['right','Fin de trace'],['both','Deux côtés']]],['difficulty','Difficulté',[['none','Aucune'],['overlap','Chevauchement'],['artifact','Artefact'],['unresolved_count','Nombre indéterminé'],['other','Autre']]]]){
  const labelNode=document.createElement('label');labelNode.textContent=label;labelNode.htmlFor=field;
  const select=document.createElement('select');select.id=field;for(const [value,text]of choices)select.add(new Option(text,value));select.value=event[field];select.disabled=!editable();
  select.onchange=()=>{event[field]=select.value;event.defaulted_fields=(event.defaulted_fields||[]).filter(k=>k!==field);changed();renderEvents();};details.append(labelNode,select);
 }
 const bounds=document.createElement('div');bounds.className='bounds';
 for(const [field,label]of [['start','Début · échantillons'],['end','Fin · échantillons']]){
  const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type='number';input.value=event[field];input.min='0';input.max=String(state.trace.n_samples);input.step='1';input.disabled=!editable();
  input.onchange=()=>{const value=Number(input.value);if(!Number.isInteger(value)||value<0||value>state.trace.n_samples||(field==='start'?value>=event.end:value<=event.start)){input.value=event[field];report(new Error('Le début doit précéder la fin, dans les limites de la trace.'));return;}event[field]=value;changed();renderEvents();render();};wrap.append(input);bounds.append(wrap);
 }
 details.append(bounds);
 const commentLabel=document.createElement('label');commentLabel.textContent='Commentaire de l’événement';const comment=document.createElement('textarea');comment.rows=2;comment.value=event.comment||'';comment.disabled=!editable();comment.oninput=()=>{event.comment=comment.value;changed();};details.append(commentLabel,comment);
 panel.append(details);
 const remove=document.createElement('button');remove.textContent='Supprimer cet événement';remove.className='remove-event';remove.disabled=!editable();remove.onclick=()=>{state.annotation.events=events().filter(x=>x.id!==event.id);state.selected=events()[0]?.id||null;changed();renderEvents();render();};panel.append(remove);
};
metrics=function(){
 const total=state.meta.practice.length,done=Object.values(state.practice).filter(r=>r.status==='completed').length;
 $('reviewProgress').textContent=`${done} / ${total} traces validées`;
};
const compactLoadTrace=loadTrace;
loadTrace=async function(id){await compactLoadTrace(id);$('traceTitle').textContent='Trace '+(state.rows.findIndex(r=>r.id===id)+1);$('traceInfo').textContent=state.meta.mode==='blind'?'Inspecter toute la trace et dessiner chaque passage.':'Essai synthétique · hors évaluation';};
const compactChanged=changed;
changed=function(){compactChanged();$('complete').textContent='Valider et continuer ↵';};
// Keep draw/adjust/zoom controls, but do not require opening menus for confidence.
const compactAction=setAction;
setAction=function(action){compactAction(action);if(action==='draw')$('hint').textContent='Glisser pour dessiner · A pour ajuster · Entrée pour valider · les champs à droite sont déjà remplis';};
