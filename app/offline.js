// Offline data adapter. Blind payloads contain no historical annotations.
const offlineBundle=JSON.parse(document.getElementById('offline-data').textContent);
const blind=offlineBundle.meta.mode==='blind';
const baseKey='mad-independent-'+offlineBundle.meta.release_sha256+'-'+offlineBundle.meta.mode;
let activeReviewer=blind?(localStorage.getItem(baseKey+'-active')||''):'';
const key=()=>baseKey+'-'+(blind?activeReviewer:'practice');
const clone=v=>JSON.parse(JSON.stringify(v));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
async function digest(v){const bytes=new TextEncoder().encode(canonical(v));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
const freshPractice=()=>({schema_version:2,scope:blind?'independent_full_trace_review':'practice_only_synthetic',reviewer:blind?activeReviewer:'essai-local',reviewer_name:blind?'':'Essai synthétique',release_id:offlineBundle.meta.release_id,release_sha256:offlineBundle.meta.release_sha256,protocol_sha256:offlineBundle.meta.protocol_sha256,interface_version:offlineBundle.meta.version,manifest_sha256:offlineBundle.meta.manifest_sha256||null,contract_sha256:offlineBundle.meta.contract_sha256||null,revision:0,locked:false,complete:false,records:{}});
function getPractice(){try{const raw=localStorage.getItem(key());return raw?JSON.parse(raw):freshPractice();}catch(e){throw new Error('Sauvegarde locale illisible ou indisponible. Ne pas effacer les données ; reprendre depuis un export JSON.');}}
function persist(p){try{localStorage.setItem(key(),JSON.stringify(p));}catch(e){throw new Error('Échec de sauvegarde locale : conserver cette fenêtre ouverte.');}return clone(p);}
function validatePracticeRecord(record,n){
 if(!record||!Array.isArray(record.events)||record.events.length>200||!['in_progress','completed'].includes(record.status))throw new Error('Annotation invalide');
 if(!['interpretable','uncertain','unusable'].includes(record.trace_assessment||'interpretable'))throw new Error('État de trace invalide');
 if(blind&&typeof record.empty_confirmed!=='boolean')throw new Error('Déclaration d’absence manquante');
 const ids=new Set();for(const e of record.events){
  if(typeof e.id!=='string'||!e.id||ids.has(e.id))throw new Error('Identifiant invalide');ids.add(e.id);
  if(!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.start>=e.end||e.end>n)throw new Error('Bornes invalides');
  for(const [field,values]of Object.entries({presence:['certain','uncertain'],boundary:['clear','uncertain'],censoring:['none','left','right','both'],difficulty:['none','overlap','artifact','unresolved_count','other']}))if(!values.includes(e[field]))throw new Error('Champ invalide : '+field);
  if(blind&&(e.kind===undefined||!Array.isArray(e.defaulted_fields)))throw new Error('Nature et provenance des défauts obligatoires');
  if(e.kind!==undefined&&!['particle','artifact'].includes(e.kind))throw new Error('Nature invalide');
  if(e.defaulted_fields!==undefined&&(!Array.isArray(e.defaulted_fields)||e.defaulted_fields.some(k=>!['presence','boundary','censoring','difficulty','kind'].includes(k))))throw new Error('Provenance des défauts invalide');
  if(typeof (e.comment||'')!=='string'||(e.comment||'').length>5000)throw new Error('Commentaire invalide');
 }
 if(record.empty_confirmed&&record.events.some(e=>e.kind!=='artifact'))throw new Error('Trace vide avec passages');
 if(record.empty_confirmed&&(record.trace_assessment||'interpretable')!=='interpretable')throw new Error('Absence certaine incompatible avec trace incertaine');
 if(record.status==='completed'&&!record.events.some(e=>e.kind!=='artifact')&&!record.empty_confirmed&&(record.trace_assessment||'interpretable')==='interpretable')throw new Error('Confirmer explicitement la trace vide');
}
function validatePayload(p){
 if(!p||p.schema_version!==2||p.scope!=='independent_full_trace_review'||p.manifest_sha256!==offlineBundle.meta.manifest_sha256||p.contract_sha256!==offlineBundle.meta.contract_sha256)throw new Error('Cet export ne correspond pas à ce jeu et à ce contrat.');
 if(typeof p.reviewer!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(p.reviewer)||!p.records||typeof p.records!=='object'||Array.isArray(p.records)||!Number.isInteger(p.revision)||p.revision<0)throw new Error('Session invalide');
 if(typeof p.reviewer_name!=='string')throw new Error('Métadonnée de session invalide');
 for(const field of ['release_id','release_sha256','protocol_sha256','interface_version'])if(p[field]!==offlineBundle.meta[field==='interface_version'?'version':field])throw new Error('Version de campagne incompatible');
 const rows=new Map(offlineBundle.meta.practice.map(r=>[r.id,r]));
 for(const [id,r]of Object.entries(p.records)){const row=rows.get(id);if(!row)throw new Error('Trace étrangère au jeu');validatePracticeRecord(r,row.n_samples);for(const field of ['signal_sha256','raw_sha256','n_samples','fs_hz'])if(r[field]!==row[field])throw new Error('Provenance de trace incorrecte');for(const field of ['started_at','updated_at'])if(typeof r[field]!=='string'||!Number.isFinite(Date.parse(r[field])))throw new Error('Horodatage manquant');if(r.status==='completed'&&(typeof r.completed_at!=='string'||!Number.isFinite(Date.parse(r.completed_at))))throw new Error('Validation non horodatée');}
 if(p.complete||p.locked){if(p.complete!==true||p.locked!==true||Object.keys(p.records).length!==rows.size||Object.values(p.records).some(r=>r.status!=='completed'))throw new Error('Revue finale incomplète');}
}
async function verifyReceipt(p){if(!p.locked)return;if(!p.receipt)throw new Error('Reçu manquant');const core={...p};delete core.receipt;if(p.receipt.payload_sha256!==await digest(core))throw new Error('Empreinte du reçu invalide');}
window.offlineApi=async(path,options={})=>{
 if(path==='/api/meta')return offlineBundle.meta;
 if(path==='/api/session'&&blind){const req=JSON.parse(options.body);if(!/^session-[a-f0-9-]{36}$/.test(req.reviewer))throw new Error('Session locale invalide');const previous=getPractice();if(activeReviewer&&activeReviewer!==req.reviewer&&Object.keys(previous.records).length)throw new Error('Une autre identité est déjà associée à ce fichier : conserver un fichier distinct par reviewer.');activeReviewer=req.reviewer;localStorage.setItem(baseKey+'-active',activeReviewer);const p=getPractice();validatePayload(p);await verifyReceipt(p);return p;}
 if(path==='/api/practice'&&options.method==='POST'){
  const req=JSON.parse(options.body),row=offlineBundle.meta.practice.find(r=>r.id===req.id);if(!row)throw new Error('La référence historique est immuable.');
  if(blind&&!activeReviewer)throw new Error('Identifier le reviewer avant de commencer');
  const current=getPractice();if(current.locked)throw new Error('Cette revue est finalisée et immuable');if(req.revision!==current.revision)throw new Error('Un autre onglet a sauvegardé. Recharger avant de modifier.');
  validatePracticeRecord(req.record,row.n_samples);const now=new Date().toISOString();const old=current.records[req.id];
  current.revision++;current.updated_at=now;current.records[req.id]={...req.record,started_at:old?.started_at||now,updated_at:now,completed_at:req.record.status==='completed'?now:null,signal_sha256:row.signal_sha256,...(blind?{raw_sha256:row.raw_sha256,n_samples:row.n_samples,fs_hz:row.fs_hz}:{})};
  return persist(current);
 }
 if(path==='/api/finalize'&&blind){const req=JSON.parse(options.body),p=getPractice();if(!activeReviewer)throw new Error('Reviewer manquant');if(p.locked){await verifyReceipt(p);return p;}if(req.revision!==p.revision)throw new Error('La sauvegarde a changé ; recharger.');const missing=offlineBundle.meta.practice.filter(r=>p.records[r.id]?.status!=='completed');if(missing.length)throw new Error(`${missing.length} trace(s) non terminée(s).`);validatePayload(p);p.revision++;p.locked=true;p.complete=true;p.finalized_at=new Date().toISOString();p.receipt={payload_sha256:await digest(p),algorithm:'SHA-256 of recursively key-sorted JSON, UTF-8'};return clone(p);}
 if(path==='/api/import'&&blind){const p=JSON.parse(options.body).payload;validatePayload(p);await verifyReceipt(p);const current=getPractice();if(Object.keys(current.records).length&&canonical(current)!==canonical(p))throw new Error('La session contient déjà des annotations. Import refusé pour éviter un écrasement.');const targetKey=baseKey+'-'+p.reviewer;const stored=localStorage.getItem(targetKey);const existing=stored?JSON.parse(stored):null;if(existing&&Object.keys(existing.records).length&&canonical(existing)!==canonical(p))throw new Error('Cette identité possède déjà une autre sauvegarde.');localStorage.setItem(targetKey,JSON.stringify(p));localStorage.setItem(baseKey+'-active',p.reviewer);activeReviewer=p.reviewer;return clone(p);}
 if(path==='/api/practice'||path==='/api/export'){try{const p=getPractice();if(blind&&activeReviewer){validatePayload(p);await verifyReceipt(p);}return p;}catch(e){if(blind||path==='/api/export')throw e;return freshPractice();}}
 if(path.startsWith('/api/history/')){const h=offlineBundle.history[path.slice('/api/history/'.length)];if(!h)throw new Error('Référence non disponible');return h;}
 if(path.startsWith('/api/trace/')){const t=offlineBundle.traces[path.slice('/api/trace/'.length)];if(!t)throw new Error('Trace non disponible');const result={...t};for(const field of ['raw','filtered']){const bytes=Uint8Array.from(atob(t[field]),c=>c.charCodeAt(0));result[field]=new Float32Array(bytes.buffer);}return result;}
 throw new Error('Ressource non disponible');
};

async function ensureLocalSession(){
 if(!blind)return getPractice();
 const current=getPractice();
 if(current.reviewer){validatePayload(current);await verifyReceipt(current);return current;}
 return window.offlineApi('/api/session',{method:'POST',body:JSON.stringify({reviewer:'session-'+crypto.randomUUID()})});
}
