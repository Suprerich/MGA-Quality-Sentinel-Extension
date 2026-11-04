/* =====================================================================
   Quality Rating & Complaint Analysis Tool - sku_core.js (v1.4.0)
   IMPROVEMENT #1 (core): SKU Validation helpers shared by the UI.
   UI SCRIPT (popup/sidepanel). Load BEFORE summary.js so summary.js can use
   window.QCSKU for watchlist-aware, series-safe cross-platform grouping.

   Matching priority: UPC > model > platform id (WM#/TCIN/ASIN) > strict name
   (token overlap >=0.60 AND a series/number guard). The series guard blocks
   merges when two names carry DIFFERENT distinctive tokens (trailing numbers
   or unique series words like "prez"/"princess"), even if generic tokens
   overlap - this stops same-brand variants being merged.
   ===================================================================== */
(function(){
  'use strict';
  var STORE_KEY='qc_watchlist_v1';

  var STOP=new Set(('the a an of for and with to in on at set pack piece pieces toy toys kids kid child '+
    'children year years age ages plus new official brand edition series exclusive by amp inch cm '+
    'assorted style styles color colors mga surprise make it mini').split(' '));

  function norm(n){ return String(n||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(); }
  function tokens(n){ return new Set(norm(n).split(' ').filter(function(w){ return w.length>=3 && !STOP.has(w); })); }
  function overlap(a,b){ if(!a||!b||!a.size||!b.size) return 0; var i=0; a.forEach(function(x){ if(b.has(x)) i++; }); return i/Math.min(a.size,b.size); }

  function distinctive(tks){ var out=new Set(); tks.forEach(function(w){ if(/\d/.test(w) || w.length>=4) out.add(w); }); return out; }
  function seriesConflict(a,b){
    var da=distinctive(a), db=distinctive(b);
    if(!da.size || !db.size) return false;
    var aOnly=false, bOnly=false;
    da.forEach(function(x){ if(!db.has(x)) aOnly=true; });
    db.forEach(function(x){ if(!da.has(x)) bOnly=true; });
    return aOnly && bOnly;
  }

  function normId(s){ return String(s||'').replace(/[^a-z0-9]/gi,'').toLowerCase(); }

  function parseWatchlistText(text){
    var items=[];
    String(text||'').split(/\r?\n/).forEach(function(line){
      var t=line.trim(); if(!t || t[0]==='#') return;
      var p=t.split('|').map(function(x){ return x.trim(); });
      var it={ name:p[0]||'', upc:normId(p[1]), model:normId(p[2]), wm:normId(p[3]), tcin:normId(p[4]), asin:normId(p[5]), costco:normId(p[6]) };
      if(it.name || it.upc || it.model || it.wm || it.tcin || it.asin || it.costco){ it.tokens=tokens(it.name); items.push(it); }
    });
    return items;
  }
  function watchlistToText(items){
    return (items||[]).map(function(i){
      return [i.name||'', i.upc||'', i.model||'', i.wm||'', i.tcin||'', i.asin||'', i.costco||''].join(' | ').replace(/(\s*\|\s*)+$/,'');
    }).join('\n');
  }

  function recIdentity(rec){
    rec=rec||{};
    return {
      upc:    normId(rec.upcNumber || rec.upc),
      model:  normId(rec.modelNumber || rec.model),
      wm:     normId(rec.walmartNumber || rec.wm),
      tcin:   normId(rec.targetNumber || rec.tcin),
      asin:   normId(rec.amazonNumber || rec.asin),
      costco: normId(rec.costcoNumber || rec.costco),
      name:   rec.name || rec.productName || '',
      tokens: tokens(rec.name || rec.productName || '')
    };
  }

  function matchToWatchlist(rec, watchlist){
    var id=recIdentity(rec); var wl=watchlist||getWatchlist();
    if(!wl || !wl.length) return null;
    for(var i=0;i<wl.length;i++){ var w=wl[i]; if(id.upc && w.upc && id.upc===w.upc) return {item:w,score:1,by:'UPC'}; }
    for(var i2=0;i2<wl.length;i2++){ var w2=wl[i2]; if(id.model && w2.model && id.model===w2.model) return {item:w2,score:1,by:'Model'}; }
    for(var i3=0;i3<wl.length;i3++){ var w3=wl[i3];
      if(id.wm && w3.wm && id.wm===w3.wm)         return {item:w3,score:1,by:'WM#'};
      if(id.tcin && w3.tcin && id.tcin===w3.tcin) return {item:w3,score:1,by:'TCIN'};
      if(id.asin && w3.asin && id.asin===w3.asin) return {item:w3,score:1,by:'ASIN'};
      if(id.costco && w3.costco && id.costco===w3.costco) return {item:w3,score:1,by:'Costco#'};
    }
    var best=null,bs=0;
    for(var i4=0;i4<wl.length;i4++){ var w4=wl[i4];
      if(!w4.tokens || !w4.tokens.size) continue;
      if(seriesConflict(id.tokens, w4.tokens)) continue;
      var ov=overlap(id.tokens, w4.tokens);
      if(ov>bs){ bs=ov; best=w4; }
    }
    if(best && bs>=0.6) return {item:best,score:bs,by:'Name'};
    return null;
  }

  function sameProduct(a,b){
    var ia=recIdentity(a), ib=recIdentity(b);
    if(ia.upc && ib.upc)       return ia.upc===ib.upc;
    if(ia.model && ib.model)   return ia.model===ib.model;
    if(ia.tcin && ib.tcin)     return ia.tcin===ib.tcin;
    if(ia.wm && ib.wm)         return ia.wm===ib.wm;
    if(ia.asin && ib.asin)     return ia.asin===ib.asin;
    if(ia.costco && ib.costco) return ia.costco===ib.costco;
    if(seriesConflict(ia.tokens, ib.tokens)) return false;
    return overlap(ia.tokens, ib.tokens) >= 0.6;
  }

  var _cache=[];
  function getWatchlist(){ return _cache.slice(); }
  function loadWatchlist(cb){
    try{ chrome.storage.local.get([STORE_KEY], function(o){ _cache=(o&&o[STORE_KEY])||[]; _cache=_cache.map(function(i){ i.tokens=tokens(i.name); return i; }); cb&&cb(_cache); }); }
    catch(e){ cb&&cb(_cache); }
  }
  function saveWatchlist(items){
    _cache=(items||[]).map(function(i){ i.tokens=tokens(i.name); return i; });
    var plain=_cache.map(function(i){ return {name:i.name,upc:i.upc,model:i.model,wm:i.wm,tcin:i.tcin,asin:i.asin,costco:i.costco}; });
    try{ var obj={}; obj[STORE_KEY]=plain; chrome.storage.local.set(obj, function(){}); }catch(e){}
  }

  window.QCSKU={
    parseWatchlistText:parseWatchlistText, watchlistToText:watchlistToText,
    matchToWatchlist:matchToWatchlist, sameProduct:sameProduct,
    seriesConflict:seriesConflict, overlap:overlap, tokens:tokens,
    recIdentity:recIdentity, getWatchlist:getWatchlist,
    loadWatchlist:loadWatchlist, saveWatchlist:saveWatchlist
  };
})();
