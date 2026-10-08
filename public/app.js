const state = { mode:'buy', data:null, filter:'all' };
const $ = (s) => document.querySelector(s);
const money = (n) => n == null ? '—' : new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);

for (const b of document.querySelectorAll('.mode')) b.addEventListener('click',()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;$('#sellCard').style.display=state.mode==='sell'?'block':'block';});
for (const b of document.querySelectorAll('.filter')) b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderResults();});
$('#searchBtn').addEventListener('click',runSearch);
$('#newSearch').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$('#watchBtn').addEventListener('click',()=>$('#alertForm').scrollIntoView({behavior:'smooth'}));
$('#alertForm').addEventListener('submit',saveAlert);
$('#query').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});

async function runSearch(){
  const button=$('#searchBtn'); button.disabled=true; button.textContent='Analizando…';
  const payload={query:$('#query').value,location:$('#location').value,category:$('#category').value,mode:state.mode,maxPrice:parseNum($('#maxPrice').value),year:parseNum($('#year').value)};
  try{
    const res=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'No se pudo buscar');
    state.data=data; $('#results').classList.remove('hidden'); $('#results').scrollIntoView({behavior:'smooth',block:'start'}); renderResults();
  }catch(e){alert(e.message)} finally{button.disabled=false;button.textContent='Buscar'}
}
function parseNum(v){const n=Number(String(v||'').replace(/[^0-9]/g,''));return Number.isFinite(n)&&n?n:null}
function renderResults(){
 const d=state.data;if(!d)return; const m=d.market;
 $('#resultsTitle').textContent=`Mercado para “${d.input.query}”`;
 $('#resultsSub').textContent=`${d.input.location||'Argentina'} · actualizado ${new Date(d.generatedAt).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})}`;
 $('#marketMedian').textContent=money(m.median); $('#marketRange').textContent=`Rango central ${money(m.lower)} — ${money(m.upper)}`;
 $('#buyPrice').textContent=money(m.recommendedBuy); $('#fastSale').textContent=money(m.fastSale); $('#resultCount').textContent=d.count;
 $('#recommendedSale').textContent=money(m.recommendedSale);
 $('#insights').innerHTML=d.insights.map(x=>`<div style="margin-top:3px;opacity:.82;font-size:12px">• ${esc(x)}</div>`).join('');
 $('#sourceStatus').textContent=d.sourceHealth.map(s=>`${s.ok?'✓':'×'} ${s.name} (${s.count})`).join(' · ');
 let items=d.results;
 if(state.filter==='good') items=items.filter(x=>x.opportunity>=62); else if(state.filter==='cheap') items=[...items].sort((a,b)=>a.price-b.price);
 $('#resultList').innerHTML=items.map(card).join('') || '<div class="metric">No hay resultados con ese filtro.</div>';
}
function card(x){const cls=x.opportunity>=80?'good':x.opportunity>=62?'good':x.opportunity>=45?'mid':'high';const delta=x.marketDiffPct;const deltaText=delta<=0?`${Math.abs(delta)}% debajo del mercado`:`${delta}% sobre el mercado`;return `<article class="result-card"><div class="thumb">${x.thumbnail?`<img src="${escAttr(x.thumbnail)}" loading="lazy" />`:'🚗'}</div><div><div class="source">${esc(x.sourceName)} · ${esc(x.location||'Argentina')}</div><h3>${esc(x.title)}</h3><div class="meta">${x.year||'Año —'} · ${x.km?x.km.toLocaleString('es-AR')+' km':'km —'} · ${esc(deltaText)}</div></div><div class="price"><span class="badge ${cls}">${esc(x.label)} · ${x.opportunity}</span><strong>${money(x.price)}</strong>${x.permalink&&x.permalink!=='#'?`<a href="${escAttr(x.permalink)}" target="_blank" rel="noopener" style="font-size:11px;color:#6b7280">Ver publicación ↗</a>`:''}</div></article>`}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function escAttr(v){return esc(v)}
async function saveAlert(e){e.preventDefault(); const msg=$('#alertMsg'); try{const res=await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:$('#query').value,location:$('#location').value,category:$('#category').value,mode:state.mode,maxPrice:parseNum($('#maxPrice').value),year:parseNum($('#year').value),email:$('#alertEmail').value})});const data=await res.json();if(!res.ok)throw new Error(data.error||'No se pudo crear');msg.textContent='✅ Alerta guardada. Próximo paso: conectar envío automático.'}catch(err){msg.textContent='⚠️ '+err.message}}
