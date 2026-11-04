/* =====================================================================
   Quality Rating & Complaint Analysis Tool - sku_validation.js (v1.4.2)
   Robust Watchlist UI. Supports pipe, comma, Chinese comma, and TAB input.
   ===================================================================== */
(function(){
  'use strict';
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[c];}); }

  function inject(){
    var SKU=window.QCSKU;
    if(!SKU || el('skuSection')) return;
    var anchor=el('xpSummarySection') || el('deepSection') || document.body.lastElementChild || document.body;
    var sec=document.createElement('div');
    sec.id='skuSection';
    sec.style.cssText='margin-top:14px;border-top:2px solid #0f6cbd;padding-top:10px';
    sec.innerHTML=[
      '<h3 style="color:#0f6cbd;margin:6px 0">SKU Validation &amp; Watchlist <span style="font-size:10px;background:#0f6cbd;color:#fff;padding:1px 6px;border-radius:10px">v1.4.2</span></h3>',
      '<div class="note" style="font-size:12px">Track exact items for precise matching. Input supports <b>|</b>, English comma, Chinese comma, or TAB copied from Excel. Field order remains Name, UPC, Model, WM#, TCIN, ASIN.</div>',
      '<label style="font-size:12px;font-weight:600">My Tracked SKUs, one item per line</label>',
      '<textarea id="wlText" rows="5" style="box-sizing:border-box;width:100%;font-family:Consolas,monospace;font-size:12px;padding:6px" placeholder="Make It Mini Lord of the Rings,,,6000207908091&#10;Make It Mini Lord of the Rings | | | 6000207908091"></textarea>',
      '<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><button id="wlSave" class="primary">Save Watchlist</button><button id="wlReload">Reload</button><span id="wlStatus" style="font-size:12px;color:#555"></span></div>',
      '<label style="font-size:12px;font-weight:600">Open exact product, paste full URL or UPC / TCIN / WM# / ASIN</label>',
      '<div style="display:flex;gap:8px;margin:4px 0 6px;flex-wrap:wrap"><input id="pxInput" type="text" style="flex:1;min-width:180px;padding:6px"><select id="pxSite" style="padding:6px"><option value="target">Target</option><option value="walmart_us">Walmart US</option><option value="walmart_ca">Walmart CA</option><option value="amazon_us">Amazon US</option><option value="amazon_ca">Amazon CA</option></select><button id="pxOpen" class="primary">Open</button></div>',
      '<div id="wlMatch" style="font-size:12px;margin-top:8px"></div>'
    ].join('');
    if(anchor===document.body) document.body.appendChild(sec);
    else anchor.insertAdjacentElement('afterend',sec);

    el('wlSave').addEventListener('click',function(){
      var items=SKU.parseWatchlistText(el('wlText').value);
      SKU.saveWatchlist(items);
      el('wlStatus').textContent='Saved '+items.length+' item(s).';
      renderMatch();
    });
    el('wlReload').addEventListener('click',function(){
      SKU.loadWatchlist(function(items){ el('wlText').value=SKU.watchlistToText(items); el('wlStatus').textContent='Loaded '+items.length+' item(s).'; renderMatch(); });
    });
    el('pxOpen').addEventListener('click',openExact);
    SKU.loadWatchlist(function(items){ el('wlText').value=SKU.watchlistToText(items); renderMatch(); });
    watch();
  }

  function openExact(){
    var raw=(el('pxInput').value||'').trim(); if(!raw) return;
    var site=el('pxSite').value, id=raw.replace(/[^a-z0-9]/gi,''), url='';
    if(/^https?:\/\//i.test(raw)) url=raw;
    else if(site==='target') url='https://www.target.com/s?searchTerm='+encodeURIComponent(raw);
    else if(site==='walmart_us') url=/^\d{5,}$/.test(id)?'https://www.walmart.com/reviews/product/'+id:'https://www.walmart.com/search?q='+encodeURIComponent(raw);
    else if(site==='walmart_ca') url=/^\d{5,}$/.test(id)?'https://www.walmart.ca/reviews/product/'+id:'https://www.walmart.ca/en/search?q='+encodeURIComponent(raw);
    else if(site==='amazon_us') url=/^[A-Z0-9]{10}$/i.test(id)?'https://www.amazon.com/product-reviews/'+id:'https://www.amazon.com/s?k='+encodeURIComponent(raw);
    else if(site==='amazon_ca') url=/^[A-Z0-9]{10}$/i.test(id)?'https://www.amazon.ca/product-reviews/'+id:'https://www.amazon.ca/s?k='+encodeURIComponent(raw);
    if(url) chrome.tabs.create({url:url,active:true});
  }

  function renderMatch(){
    var SKU=window.QCSKU, box=el('wlMatch'); if(!SKU || !box) return;
    var wl=SKU.getWatchlist(), lp=null;
    try{ lp=lastPayload; }catch(e){ lp=window.lastPayload||null; }
    if(!wl.length){ box.innerHTML='<i style="color:#805000">No watchlist saved yet.</i>'; return; }
    if(!lp){ box.innerHTML='<b>'+wl.length+'</b> tracked item(s) loaded.'; return; }
    var recs=lp.mode==='search'?(lp.products||[]):(lp.mode==='detail'&&lp.meta?[{name:lp.meta.productName,upcNumber:lp.meta.upcNumber,modelNumber:lp.meta.modelNumber,walmartNumber:lp.meta.walmartNumber,targetNumber:lp.meta.targetNumber,amazonNumber:lp.meta.amazonNumber,rating:lp.meta.rating,reviewCount:lp.meta.reviewCount}]:[]);
    var found={};
    recs.forEach(function(r){ var m=SKU.matchToWatchlist(r,wl); if(m)(found[m.item.name]=found[m.item.name]||[]).push({r:r,by:m.by}); });
    var html='<h3 style="margin:8px 0 4px">Watchlist match on this page</h3><table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#eef6ff"><th>Tracked item</th><th>Matched by</th><th>Rating</th><th>Reviews</th></tr>';
    wl.forEach(function(w){ var hits=found[w.name]||[]; if(hits.length) hits.forEach(function(h){ html+='<tr><td>'+esc(w.name)+'</td><td>'+esc(h.by)+'</td><td>'+esc(h.r.rating!=null?h.r.rating:'-')+'</td><td>'+esc(h.r.reviewCount!=null?h.r.reviewCount:'-')+'</td></tr>'; }); else html+='<tr><td>'+esc(w.name)+'</td><td>not found here</td><td>-</td><td>-</td></tr>'; });
    box.innerHTML=html+'</table>';
  }

  function watch(){ var deb,run=function(){clearTimeout(deb);deb=setTimeout(renderMatch,300);}; ['ratingBody','complaintBody','deepBody'].forEach(function(id){var n=el(id);if(n)new MutationObserver(run).observe(n,{childList:true,subtree:true});}); }
  function start(){ if(window.QCSKU) inject(); else setTimeout(start,100); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
