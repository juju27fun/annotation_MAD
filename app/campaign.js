const simpleBlindLabels=blindLabels;
blindLabels=function(){
 simpleBlindLabels();
 $('reviewerSession').hidden=true;$('archiveTab').hidden=true;$('practiceTab').hidden=true;$('finalize').hidden=true;
 $('contextLabel').textContent=state.locked?'EXPORT IMPORTÉ · LECTURE SEULE':'ANNOTATION';
 $('notice').textContent='Deux clics pour un événement, dans le sens que tu veux · valider un événement reste sur la même trace.';
 $('inspectorLabel').textContent=events().length?'MES ÉVÉNEMENTS':'ANNOTER';
 $('export').textContent='Exporter le JSON';$('complete').textContent='Terminer la trace et continuer ↵';$('empty').textContent='Aucun événement · 0';$('uncertainTrace').textContent='Trace incertaine · I';
};
async function exportSimple(){
 await save();
 const complete=state.meta.practice.every(row=>state.practice[row.id]?.status==='completed');
 const p=complete&&blind?await api('/api/finalize',{method:'POST',body:JSON.stringify({revision:state.revision})}):await api('/api/export');
 downloadJson(p);
 $('saveStatus').textContent=complete?'JSON complet exporté. Envoie-le au coordinateur.':'JSON de sauvegarde exporté. Tu peux continuer la revue.';
}
async function startCampaign(){
 await ensureLocalSession();
 await init();
 $('addEvent').onclick=startAnotherEvent;$('confirmEvent').onclick=()=>confirmEvent().catch(report);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){state.pendingBoundary=null;setAction(state.action);render();}},true);
 if(window.matchMedia){
  const narrow=window.matchMedia('(max-width:800px)'),inspector=document.querySelector('aside.inspector'),main=document.querySelector('main'),plot=document.querySelector('.detail-card');
  const placeInspector=()=>{if(narrow.matches)plot.after(inspector);else main.append(inspector);};
  placeInspector();narrow.addEventListener('change',placeInspector);
 }
 $('reviewerSession').hidden=true;$('archiveTab').hidden=true;$('practiceTab').hidden=true;$('finalize').hidden=true;
 $('export').textContent='Exporter le JSON';$('export').onclick=()=>exportSimple().catch(report);$('resume').hidden=!blind;$('resume').onclick=()=>$('importJson').click();
 $('complete').textContent='Terminer la trace et continuer ↵';
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&editable()){e.preventDefault();e.stopImmediatePropagation();finishPractice(false).catch(report);}},true);
}
startCampaign().catch(report);
