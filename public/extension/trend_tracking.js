/* =====================================================================
   Quality Rating & Complaint Analysis Tool - trend_tracking.js (v1.4.0)
   IMPROVEMENT #3: Trend Tracking (rating history over time).
   UI SCRIPT. Load AFTER summary.js / sku_core.js. Additive: injects its own
   section + persists a snapshot each scan (chrome.storage.local 'qc_trend_v1',
   one snapshot per product+platform+day) so you can see improving/worsening.
   ===================================================================== */
(function(){
  'use strict';
  var KEY='qc_trend_v1';
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
  function normId(s){ return String(s||'').replace(/[^a-z0-9]/gi,'').toLowerCase(); }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function threshold(){ var e=el('threshold'); var n=e?Number(e.value):4; return (isNaN(n)||!n)?4:n; }

  function platOf(r,url){
    var s=String(r||'').toLowerCase(), u=String(url||'').toLowerCase();
    if(s.indexOf('walmart')>-1&&(s.indexOf('canada')>-1||s.indexOf('.ca')>-1))return'WMCA';
    if(s.indexOf('walmart')>-1)return'WMUS';
    if(s.indexOf('amazon')>-1&&(s.indexOf('canada')>-1||s.indexOf('.ca')>-1))return'AMZCA';
    if(s.indexOf('amazon')>-1)return'AMZUS';
    if(s.indexOf('target')>-1)return'TARGET';
    if(s.indexOf('costco')>-1&&(s.indexOf('canada')>-1||s.indexOf('.ca')>-1))return'COSTCOCA';
    if(s.indexOf('costco')>-1)return'COSTCOUS';
    if(u.indexOf('walmart.ca')>-1)return'WMCA'; if(u.indexOf('walmart.com')>-1)return'WMUS';
    if(u.indexOf('amazon.ca')>-1)return'AMZCA'; if(u.indexOf('amazon.com')>-1)return'AMZUS';
    if(u.indexOf('target.com')>-1)return'TARGET';
    if(u.indexOf('costco.ca')>-1)return'COSTCOCA'; if(u.indexOf('costco.com')>-1)return'COSTCOUS'; return 'OTHER';
  }
  function idOf(rec){
    return normId(rec.upcNumber||rec.upc)||normId(rec.modelNumber||rec.model)||normId(rec.targetNumber||rec.tcin)||
           normId(rec.costcoNumber||rec.costco)||normId(rec.walmartNumber||rec.wm)||normId(rec.amazonNumber||rec.asin)||('name:'+normId(rec.name||rec.productName));
  }
  function nameOf(rec){ return rec.name||rec.productName||''; }

  function load(cb){ try{ chrome.storage.local.get([KEY],function(o){ cb((o&&o[KEY])||{}); }); }catch(e){ cb({}); } }
  function save(db,cb){ try{ var o={}; o[KEY]=db; chrome.storage.local.set(o,function(){ cb&&cb(); }); }catch(e){ cb&&cb(); } }

  function record(rec){
    if(rec.rating==null || isNaN(Number(rec.rating))) return;
    var id=idOf(rec), plat=platOf(rec.retailer, rec.url||rec.sourceUrl);
    load(function(db){
      var e=db[id]||(db[id]={name:nameOf(rec),plats:{}});
      if(nameOf(rec) && nameOf(rec).length>String(e.name).length) e.name=nameOf(rec);
      var arr=e.plats[plat]||(e.plats[plat]=[]);
      var d=today();
      arr=arr.filter(function(x){ return x.d!==d; });
      arr.push({d:d, rating:Number(rec.rating), count:(rec.reviewCount!=null?rec.reviewCount:null)});
      arr.sort(function(a,b){ return a.d<b.d?-1:1; });
      if(arr.length>24) arr=arr.slice(arr.length-24);
      e.plats[plat]=arr;
      save(db, render);
    });
  }

  function ingest(){
    var lp,dd; try{ lp=lastPayload; }catch(e){ try{ lp=window.lastPayload; }catch(e2){ lp=null; } }
    try{ dd=deepData; }catch(e3){ try{ dd=window.deepData; }catch(e4){ dd=null; } }
    if(lp){
      if(lp.mode==='search') (lp.products||[]).forEach(record);
      else if(lp.mode==='detail' && lp.meta) record({retailer:lp.meta.retailer,url:lp.meta.sourceUrl,name:lp.meta.productName,upcNumber:lp.meta.upcNumber,modelNumber:lp.meta.modelNumber,walmartNumber:lp.meta.walmartNumber,targetNumber:lp.meta.targetNumber,amazonNumber:lp.meta.amazonNumber,rating:lp.meta.rating,reviewCount:lp.meta.reviewCount});
    }
    if(dd&&dd.products) dd.products.forEach(function(r){ record({retailer:r.retailer,url:r._searchUrl||r.sourceUrl,name:r._searchName||r.productName,rating:(r.rating!=null?r.rating:r._searchRating),reviewCount:r.reviewCount}); });
  }

  var PLABEL={WMUS:'WM US',WMCA:'WM CA',AMZUS:'AMZ US',AMZCA:'AMZ CA',TARGET:'Target',OTHER:'Other'};
  function arrow(delta){
    if(delta==null) return '';
    if(delta<=-0.2) return '<span style="color:#b00020;font-weight:bold">&#9660; '+delta.toFixed(1)+'</span>';
    if(delta>=0.2)  return '<span style="color:#0a7a27;font-weight:bold">&#9650; +'+delta.toFixed(1)+'</span>';
    return '<span style="color:#805000">&#8596; '+(delta>=0?'+':'')+delta.toFixed(1)+'</span>';
  }

  function render(){
    var box=el('trBody'); if(!box) return;
    var th=threshold();
    load(function(db){
      var ids=Object.keys(db);
      if(!ids.length){ box.innerHTML='<i style="color:#805000">No history yet. Scan products over time and their rating trend builds here automatically.</i>'; return; }
      var html='<table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#eef6ff"><th style="text-align:left;padding:4px">Product</th><th style="padding:4px">Platform</th><th style="padding:4px">History (oldest &rarr; latest)</th><th style="padding:4px">Trend</th></tr>';
      ids.forEach(function(id){
        var e=db[id]; var plats=Object.keys(e.plats);
        plats.forEach(function(p,idx){
          var arr=e.plats[p]; if(!arr.length) return;
          var first=arr[0].rating, last=arr[arr.length-1].rating, delta=(arr.length>1)?(last-first):null;
          var series=arr.map(function(x){ var below=x.rating<th; return '<span title="'+esc(x.d)+'" style="'+(below?'color:#b00020;font-weight:bold':'')+'">'+x.rating+'</span>'; }).join(' &rsaquo; ');
          var warn=(last<th)?' <span style="background:#b00020;color:#fff;padding:0 4px;border-radius:3px">below '+th.toFixed(1)+'</span>':'';
          html+='<tr>'+(idx===0?('<td rowspan="'+plats.length+'" style="padding:4px;vertical-align:top">'+esc(e.name||id)+'</td>'):'')+
                '<td style="text-align:center;padding:4px">'+esc(PLABEL[p]||p)+'</td>'+
                '<td style="padding:4px">'+series+warn+'</td>'+
                '<td style="text-align:center;padding:4px">'+arrow(delta)+'</td></tr>';
        });
      });
      html+='</table>';
      box.innerHTML=html;
    });
  }

  function inject(){
    if(el('trendSection')) return;
    var anchor=el('skuSection')||el('xpSummarySection')||el('deepSection')||document.body;
    var sec=document.createElement('div');
    sec.id='trendSection';
    sec.style.cssText='margin-top:14px;border-top:2px solid #0a7a27;padding-top:10px';
    sec.innerHTML=[
      '<h3 style="color:#0a7a27;margin:6px 0">Rating Trend Tracking <span style="font-size:10px;background:#0a7a27;color:#fff;padding:1px 6px;border-radius:10px">v1.4.0</span></h3>',
      '<div class="note" style="font-size:12px">Each scan is saved (one snapshot per product / platform / day). Watch whether a rating is <b>worsening</b> (&#9660;) so you can act before it drops below 4.0 - not just react after.</div>',
      '<div style="display:flex;gap:8px;margin-bottom:6px"><button id="trRefresh">Refresh</button><button id="trClear">Clear History</button><button id="trExport">Export Trend CSV</button><span id="trStatus" style="font-size:12px;color:#555;align-self:center"></span></div>',
      '<div id="trBody"></div>'
    ].join('');
    (anchor.parentNode||document.body).insertBefore(sec, anchor.nextSibling);
    el('trRefresh').addEventListener('click', function(){ ingest(); render(); });
    el('trClear').addEventListener('click', function(){ save({}, function(){ render(); var s=el('trStatus'); if(s)s.textContent='History cleared.'; }); });
    el('trExport').addEventListener('click', exportCsv);
    watch();
    render();
  }

  function exportCsv(){
    load(function(db){
      var rows=[['Product','Platform','Date','Rating','ReviewCount']];
      Object.keys(db).forEach(function(id){ var e=db[id]; Object.keys(e.plats).forEach(function(p){ e.plats[p].forEach(function(x){ rows.push([e.name||id,p,x.d,x.rating,(x.count!=null?x.count:'')]); }); }); });
      var csv=rows.map(function(r){ return r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
      try{ var blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); chrome.downloads.download({url:URL.createObjectURL(blob),filename:'rating_trend_'+today()+'.csv',saveAs:true}); }catch(e){}
    });
  }

  function watch(){
    var deb, run=function(){ clearTimeout(deb); deb=setTimeout(function(){ ingest(); },500); };
    ['ratingBody','complaintBody','deepBody'].forEach(function(id){ var e=el(id); if(e) new MutationObserver(run).observe(e,{childList:true,subtree:true}); });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
