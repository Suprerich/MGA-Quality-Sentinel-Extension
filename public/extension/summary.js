/* =====================================================================
   Quality Rating & Complaint Analysis Tool - summary.js (v1.4.0a)
   Cross-Platform Summary + Email Table.
   v1.4.0  : grouping is series-safe + watchlist-aware (via window.QCSKU).
   v1.4.0a : Key Findings now reads as a natural sentence, e.g.
             "Main complaints are related to function issues, not working,
              broken parts and quality concerns."
             (was: "Function issue (3), Damage (1)")
   UI/columns/buttons/email/CSV output unchanged.
   ===================================================================== */
(function(){
  'use strict';
  function getLastPayload(){ try{ return lastPayload; }catch(e){ try{ return window.lastPayload; }catch(e2){ return null; } } }
  function getDeepData(){ try{ return deepData; }catch(e){ try{ return window.deepData; }catch(e2){ return null; } } }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }

  var PLAT_ORDER=['WMUS','WMCA','AMZUS','AMZCA','TARGET','COSTCOUS','COSTCOCA'];
  var PLAT_LABEL={WMUS:'Walmart US',WMCA:'Walmart CA',AMZUS:'Amazon US',AMZCA:'Amazon CA',TARGET:'Target',COSTCOUS:'Costco US',COSTCOCA:'Costco Canada'};
  function platFromRetailer(r){ r=String(r||'').toLowerCase();
    if(r.indexOf('walmart')>-1&&(r.indexOf('canada')>-1||r.indexOf('.ca')>-1))return'WMCA';
    if(r.indexOf('walmart')>-1)return'WMUS';
    if(r.indexOf('amazon')>-1&&(r.indexOf('canada')>-1||r.indexOf('.ca')>-1))return'AMZCA';
    if(r.indexOf('amazon')>-1)return'AMZUS';
    if(r.indexOf('target')>-1)return'TARGET';
    if(r.indexOf('costco')>-1&&(r.indexOf('canada')>-1||r.indexOf('.ca')>-1))return'COSTCOCA';
    if(r.indexOf('costco')>-1)return'COSTCOUS'; return null; }
  function platFromUrl(u){ u=String(u||'').toLowerCase();
    if(u.indexOf('walmart.ca')>-1)return'WMCA'; if(u.indexOf('walmart.com')>-1)return'WMUS';
    if(u.indexOf('amazon.ca')>-1)return'AMZCA'; if(u.indexOf('amazon.com')>-1)return'AMZUS';
    if(u.indexOf('target.com')>-1)return'TARGET';
    if(u.indexOf('costco.ca')>-1)return'COSTCOCA'; if(u.indexOf('costco.com')>-1)return'COSTCOUS'; return null; }

  var groups=[];

  function findGroup(rec){
    var SKU=window.QCSKU;
    if(SKU){
      var wl=SKU.getWatchlist();
      if(wl && wl.length){
        var m=SKU.matchToWatchlist(rec, wl);
        if(m){ for(var i=0;i<groups.length;i++){ if(groups[i]._wl===m.item.name) return groups[i]; } return null; }
      }
      for(var j=0;j<groups.length;j++){ if(groups[j]._wl) continue; if(SKU.sameProduct(rec, groups[j]._probe)) return groups[j]; }
      return null;
    }
    for(var k=0;k<groups.length;k++){ var g=groups[k]; if(rec.upcNumber && g.upc && String(rec.upcNumber)===String(g.upc)) return g; }
    return null;
  }

  function addRecord(rec){
    if(!rec.platform || (!rec.name && !rec.url)) return;
    var SKU=window.QCSKU;
    var g=findGroup(rec);
    if(!g){
      g={ name:rec.name||'', upc:rec.upc||'', model:rec.model||'', platforms:{}, complaints:[], _seen:{}, _probe:{name:rec.name,upcNumber:rec.upc,modelNumber:rec.model,walmartNumber:rec.wm,targetNumber:rec.tcin,amazonNumber:rec.asin,costcoNumber:rec.costco}, _wl:null };
      if(SKU){ var wl=SKU.getWatchlist(); if(wl&&wl.length){ var m=SKU.matchToWatchlist(rec,wl); if(m){ g._wl=m.item.name; g.name=m.item.name; } } }
      groups.push(g);
    }
    if(rec.upc&&!g.upc)g.upc=rec.upc;
    if(rec.model&&!g.model)g.model=rec.model;
    if(!g._wl && rec.name && String(rec.name).length>String(g.name).length) g.name=rec.name;
    if(rec.rating!=null || !g.platforms[rec.platform]){
      g.platforms[rec.platform]={ rating:(rec.rating!=null?rec.rating:null), count:(rec.count!=null?rec.count:null), url:rec.url||'' };
    }
    (rec.complaints||[]).forEach(function(c){
      if(!c.comment) return;
      var key=rec.platform+'|'+String(c.comment).slice(0,120);
      if(g._seen[key]) return; g._seen[key]=1;
      g.complaints.push({ issue:c.issue, sentiment:c.sentiment, reviewRating:c.reviewRating, comment:c.comment, platform:rec.platform });
    });
  }

  function ingest(){
    var lp=getLastPayload();
    if(lp){
      if(lp.mode==='search'){
        (lp.products||[]).forEach(function(p){ addRecord({
          platform:platFromRetailer(p.retailer)||platFromUrl(p.url),
          rating:(typeof p.rating==='number'?p.rating:null),
          count:(p.reviewCount!=null?p.reviewCount:null),
          url:p.url, name:p.name||'', upc:p.upcNumber||'', model:p.modelNumber||'',
          wm:p.walmartNumber||'', tcin:p.targetNumber||'', asin:p.amazonNumber||'', costco:p.costcoNumber||'', complaints:[] }); });
      } else if(lp.mode==='detail' && lp.meta){
        var m=lp.meta;
        addRecord({
          platform:platFromRetailer(m.retailer)||platFromUrl(m.sourceUrl),
          rating:(typeof m.rating==='number'?m.rating:null),
          count:(m.reviewCount!=null?m.reviewCount:null),
          url:m.sourceUrl, name:m.productName||'', upc:m.upcNumber||'', model:m.modelNumber||'',
          wm:m.walmartNumber||'', tcin:m.targetNumber||'', asin:m.amazonNumber||'', costco:m.costcoNumber||'',
          complaints:(lp.complaints||[]).map(function(c){ return {issue:c.issueType,sentiment:c.sentiment,reviewRating:c.reviewRating,comment:c.comment}; }) });
      }
    }
    var dd=getDeepData();
    if(dd&&dd.products){
      dd.products.forEach(function(r){ addRecord({
        platform:platFromRetailer(r.retailer)||platFromUrl(r._searchUrl||r.sourceUrl),
        rating:(r.rating!=null?r.rating:r._searchRating),
        count:(r.reviewCount!=null?r.reviewCount:null),
        url:r._searchUrl||r.sourceUrl, name:r._searchName||r.productName||'', upc:'', model:'',
        complaints:(r.complaints||[]).map(function(c){ return {issue:c.issueType,sentiment:c.sentiment,reviewRating:c.reviewRating,comment:c.comment}; }) }); });
    }
    render();
  }

  var QUALITY={'Safety':1,'Function issue':1,'Missing parts':1,'Damage':1,'Quality':1,'Packaging':1,'Assembly / Instruction':1,'Size / Appearance mismatch':1};
  function threshold(){ var el=document.getElementById('threshold'); var n=el?Number(el.value):4; return (isNaN(n)||!n)?4:n; }
  function focusOnly(){ var el=document.getElementById('xpFocusLow'); return el?el.checked:true; }
  function belowPlatforms(g,th){ return PLAT_ORDER.filter(function(p){ return g.platforms[p]&&g.platforms[p].rating!=null&&g.platforms[p].rating<th; }); }
  function isBelow(g,th){ return belowPlatforms(g,th).length>0; }
  function qualityNeg(g){ return (g.complaints||[]).filter(function(c){
    var star=(typeof c.reviewRating==='number')?c.reviewRating:null;
    var lowStar=(star!=null&&star<=2); var isQ=!!QUALITY[c.issue]; var neg=c.sentiment==='NEGATIVE';
    return lowStar || ((isQ||neg)&&star==null) || (isQ&&neg); }); }

  /* ---- v1.4.0a natural-language Key Findings ------------------------- */
  var ISSUE_PHRASE={
    'Function issue':'function issues',
    'Damage':'broken parts',
    'Quality':'quality concerns',
    'Missing parts':'missing parts',
    'Safety':'safety concerns',
    'Packaging':'packaging damage',
    'Assembly / Instruction':'assembly difficulty',
    'Size / Appearance mismatch':'items not as described',
    'Delivery':'delivery problems',
    'Value':'value-for-money concerns'
  };
  /* a representative keyword to surface right after certain categories,
     so the sentence sounds concrete ("function issues, not working, ...") */
  var ISSUE_SIGNAL={
    'Function issue':['not working','stopped working',"doesn't work","won't turn on",'turns off'],
    'Damage':['broken','cracked'],
    'Quality':['cheap','flimsy']
  };
  function countIssues(comps){ var m={}; comps.forEach(function(c){ if(c.issue) m[c.issue]=(m[c.issue]||0)+1; }); return m; }
  function hasText(comps, kw){ for(var i=0;i<comps.length;i++){ if(String(comps[i].comment||'').toLowerCase().indexOf(kw)!==-1) return true; } return false; }
  function joinAnd(arr){
    arr=arr.filter(function(x,i){ return x && arr.indexOf(x)===i; });   /* dedupe */
    if(arr.length<=1) return arr[0]||'';
    if(arr.length===2) return arr[0]+' and '+arr[1];
    return arr.slice(0,-1).join(', ')+' and '+arr[arr.length-1];
  }
  /* Build a natural phrase like:
     "function issues, not working, broken parts and quality concerns" */
  function complaintPhrase(comps){
    if(!comps.length) return '';
    var m=countIssues(comps);
    var order=Object.keys(m).sort(function(a,b){ return m[b]-m[a]; });
    var parts=[];
    order.forEach(function(iss){
      var phrase=ISSUE_PHRASE[iss]||String(iss).toLowerCase();
      parts.push(phrase);
      var sig=ISSUE_SIGNAL[iss];
      if(sig){ for(var i=0;i<sig.length;i++){ if(hasText(comps,sig[i])){ parts.push(sig[i]); break; } } }
    });
    return joinAnd(parts.slice(0,5));
  }

  function buildKeyFindings(th){
    var rows=groups.filter(function(g){ return focusOnly()?isBelow(g,th):true; });
    var bullets=[];
    rows.forEach(function(g){
      var bp=belowPlatforms(g,th); if(focusOnly()&&!bp.length) return;
      var lowest=null,lowP=null;
      PLAT_ORDER.forEach(function(p){ var c=g.platforms[p]; if(c&&c.rating!=null&&(lowest==null||c.rating<lowest)){ lowest=c.rating; lowP=p; } });
      var phrase=complaintPhrase(qualityNeg(g));
      if(bp.length){
        var s=g.name+' is rated below '+th.toFixed(1)+' on '+bp.map(function(p){ return PLAT_LABEL[p]; }).join(', ');
        if(lowest!=null) s+=' (lowest '+lowest+' on '+PLAT_LABEL[lowP]+')';
        s+='. ';
        s+= phrase ? ('Main complaints are related to '+phrase+'.') : 'No specific quality complaint text captured yet \u2014 open the item page & Deep Analyze to pull reviews.';
        bullets.push(s);
      } else { bullets.push(g.name+': no platform is rated below '+th.toFixed(1)+' (all OK).'); }
    });
    if(!bullets.length) bullets.push('No items rated below '+th.toFixed(1)+' captured yet. Scan the product/search pages, then Deep Analyze the ALERT items.');
    return bullets;
  }
  /* -------------------------------------------------------------------- */

  function cellText(c){ if(!c||c.rating==null) return 'N/A'; return c.rating+(c.count!=null?(' ('+c.count+')'):''); }

  function render(){
    var th=threshold();
    var tbody=document.getElementById('xpBody'); var kf=document.getElementById('xpKeyFinding');
    if(!tbody||!kf) return;
    var rows=groups.filter(function(g){ return focusOnly()?isBelow(g,th):true; });
    tbody.innerHTML='';
    rows.forEach(function(g){
      var bp=belowPlatforms(g,th);
      var tr=document.createElement('tr');
      var html='<td style="padding:4px">'+esc(g.name)+(g.upc?('<div style="font-size:10px;color:#888">UPC '+esc(g.upc)+'</div>'):'')+'</td>';
      PLAT_ORDER.forEach(function(p){ var c=g.platforms[p]; var below=c&&c.rating!=null&&c.rating<th;
        html+='<td style="text-align:center;padding:4px'+(below?';color:#b00020;font-weight:bold':'')+'">'+esc(cellText(c))+'</td>'; });
      html+='<td style="text-align:center;padding:4px;font-weight:bold'+(bp.length?';color:#b00020':'')+'">'+bp.length+'</td>';
      tr.innerHTML=html; tbody.appendChild(tr);
    });
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="7" style="padding:6px;color:#805000">No items yet'+(focusOnly()?(' below '+th.toFixed(1)):'')+'. Scan pages to populate.</td></tr>'; }
    var bullets=buildKeyFindings(th);
    kf.innerHTML='<ul style="margin:4px 0 0 18px">'+bullets.map(function(b){ return '<li>'+esc(b)+'</li>'; }).join('')+'</ul>';
    var st=document.getElementById('xpStatus');
    if(st) st.textContent=groups.length+' item(s) tracked across platforms'+(focusOnly()?('; showing '+rows.length+' below '+th.toFixed(1)):'')+'. Captured '+new Date().toLocaleString();
  }

  function buildEmailHtml(){
    var th=threshold(); var rows=groups.filter(function(g){ return focusOnly()?isBelow(g,th):true; });
    var head=['Item'].concat(PLAT_ORDER.map(function(p){ return PLAT_LABEL[p]; })).concat(['Below '+th.toFixed(1)+' #']);
    var h='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:13px">';
    h+='<tr style="background:#1E2761;color:#fff">'+head.map(function(c){ return '<th>'+esc(c)+'</th>'; }).join('')+'</tr>';
    rows.forEach(function(g){ var bp=belowPlatforms(g,th);
      h+='<tr><td>'+esc(g.name)+'</td>';
      PLAT_ORDER.forEach(function(p){ var c=g.platforms[p]; var below=c&&c.rating!=null&&c.rating<th;
        h+='<td align="center"'+(below?' style="color:#b00020;font-weight:bold"':'')+'>'+esc(cellText(c))+'</td>'; });
      h+='<td align="center"><b>'+bp.length+'</b></td></tr>'; });
    h+='</table>';
    var bullets=buildKeyFindings(th);
    h+='<p style="font-family:Calibri,Arial,sans-serif;font-size:13px"><b>Key Findings</b></p><ul style="font-family:Calibri,Arial,sans-serif;font-size:13px">'+bullets.map(function(b){ return '<li>'+esc(b)+'</li>'; }).join('')+'</ul>';
    h+='<p style="font-family:Calibri,Arial,sans-serif;font-size:11px;color:#666">Captured: '+esc(new Date().toLocaleString())+' | Threshold &lt; '+th.toFixed(1)+' | Ratings shown as "avg (review count)".</p>';
    return h;
  }
  function buildEmailPlain(){
    var th=threshold(); var rows=groups.filter(function(g){ return focusOnly()?isBelow(g,th):true; });
    var head=['Item'].concat(PLAT_ORDER.map(function(p){ return PLAT_LABEL[p]; })).concat(['Below'+th.toFixed(1)]);
    var lines=[head.join('\t')];
    rows.forEach(function(g){ var r=[g.name]; PLAT_ORDER.forEach(function(p){ r.push(cellText(g.platforms[p])); }); r.push(belowPlatforms(g,th).length); lines.push(r.join('\t')); });
    lines.push(''); lines.push('Key Findings:'); buildKeyFindings(th).forEach(function(b){ lines.push(' - '+b); });
    lines.push(''); lines.push('Captured: '+new Date().toLocaleString()+' | Threshold < '+th.toFixed(1));
    return lines.join('\n');
  }
  function copyEmailTable(){
    var html=buildEmailHtml(), plain=buildEmailPlain(); var st=document.getElementById('xpStatus');
    try{
      if(navigator.clipboard&&window.ClipboardItem){
        navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]).then(function(){ if(st)st.textContent='Copied! Paste (Ctrl+V) into Outlook. ('+new Date().toLocaleTimeString()+')'; });
      } else { navigator.clipboard.writeText(plain); if(st)st.textContent='Copied as plain text.'; }
    }catch(e){ try{ navigator.clipboard.writeText(plain); if(st)st.textContent='Copied as plain text.'; }catch(err){ if(st)st.textContent='Copy failed.'; } }
  }

  function injectUI(){
    if(document.getElementById('xpSummarySection')) return;
    var anchor=document.getElementById('deepSection')||document.body;
    var sec=document.createElement('div'); sec.id='xpSummarySection';
    sec.style.cssText='margin-top:14px;border-top:2px solid #1E2761;padding-top:10px';
    sec.innerHTML=[
      '<h3 style="color:#1E2761;margin:6px 0">Cross-Platform Summary &amp; Email Table <span style="font-size:10px;background:#1E2761;color:#fff;padding:1px 6px;border-radius:10px">v1.4.0</span></h3>',
      '<div class="note" style="font-size:12px">Auto-collects every Scan / Deep-Analyze into one WMUS / WMCA / Amazon US-CA / Target matrix. Series-safe grouping (v1.4.0) + watchlist-aware, so same-brand variants are no longer merged.</div>',
      '<label class="checkbox" style="font-size:12px"><input id="xpFocusLow" type="checkbox" checked> Only show items below threshold (focus &lt; 4.0)</label>',
      '<div style="display:flex;gap:8px;margin:6px 0"><button id="xpCopyEmail" class="primary">\uD83D\uDCCB Copy as Email Table</button><button id="xpRefresh">Refresh</button><button id="xpClear">Clear Summary</button></div>',
      '<div id="xpStatus" style="font-size:12px;color:#555;margin-bottom:6px">No items yet. Run Scan / Search &amp; Scan / Deep Analyze - results collect here automatically.</div>',
      '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#eef6ff"><th style="text-align:left;padding:4px">Item</th><th style="padding:4px">WMUS</th><th style="padding:4px">WMCA</th><th style="padding:4px">Amazon US</th><th style="padding:4px">Amazon CA</th><th style="padding:4px">Target</th><th style="padding:4px">Below 4.0 #</th></tr></thead><tbody id="xpBody"></tbody></table></div>',
      '<h3 style="margin:10px 0 4px">Key Findings <span style="font-size:11px;color:#888">(1&#9733; &amp; 2&#9733; quality issues, items &lt; 4.0)</span></h3>',
      '<div id="xpKeyFinding"></div>'
    ].join('');
    (anchor.parentNode||document.body).insertBefore(sec, anchor.nextSibling);
    document.getElementById('xpCopyEmail').addEventListener('click', copyEmailTable);
    document.getElementById('xpRefresh').addEventListener('click', ingest);
    document.getElementById('xpClear').addEventListener('click', function(){ groups=[]; render(); var st=document.getElementById('xpStatus'); if(st)st.textContent='Summary cleared.'; });
    document.getElementById('xpFocusLow').addEventListener('change', render);
    render();
  }

  function watch(){
    var deb, run=function(){ clearTimeout(deb); deb=setTimeout(ingest,400); };
    ['ratingBody','complaintBody','deepBody'].forEach(function(id){ var el=document.getElementById(id); if(el) new MutationObserver(run).observe(el,{childList:true,subtree:true}); });
  }

  function init(){
    if(window.QCSKU && window.QCSKU.loadWatchlist){ window.QCSKU.loadWatchlist(function(){ injectUI(); watch(); ingest(); }); }
    else { injectUI(); watch(); ingest(); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
