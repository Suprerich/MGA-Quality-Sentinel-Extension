/* =====================================================================
   Quality Rating & Complaint Analysis Tool - content.js (v1.0.2)
   Combined: QC Complaint Analysis + Retailer Rating QA Alert
   v1.0.2: Walmart __NEXT_DATA__ JSON extraction for reviews pages
   ===================================================================== */

/* ===== SECTION 1: Utilities ===== */
function cleanText(s){return String(s||'').replace(/\s+/g,' ').trim()}
function lower(s){return cleanText(s).toLowerCase()}
function absUrl(href){try{return new URL(href,location.origin).href}catch(e){return href||''}}
function getRetailer(){
  const h=location.hostname;
  if(h.includes('walmart.ca'))return'Walmart Canada';
  if(h.includes('walmart.com'))return'Walmart US';
  if(h.includes('amazon.ca'))return'Amazon Canada';
  if(h.includes('amazon.com'))return'Amazon US';
  if(h.includes('target.com'))return'Target';
  if(h.includes('costco.ca'))return'Costco Canada';
  if(h.includes('costco.com'))return'Costco US';
  return h;
}
function getRetailerKey(){
  const h=location.hostname;
  if(h.includes('walmart'))return'walmart';
  if(h.includes('amazon'))return'amazon';
  if(h.includes('target'))return'target';
  if(h.includes('costco'))return'costco';
  return'other';
}
function parseCostcoNumber(text,url){
  const all=cleanText(text+' '+(url||''));
  const ps=[/(?:Costco\s*#|Costco\s*Item\s*#|Item\s*#|Item\s*No\.?|Item\s*Number)\s*[:#]?\s*(\d{5,12})/i,/\.product\.(\d{5,12})/i,/\/p\/[^\/]*?(\d{5,12})/i];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
function productName(){
  const sels=['#productTitle','h1','[data-test=product-title]','[data-testid*=product-title]','[data-automation-id*=product-title]'];
  for(const s of sels){const el=document.querySelector(s);const t=cleanText(el?.innerText||el?.textContent);if(t)return t}
  return cleanText(document.title);
}

/* ===== SECTION 2: Parsers ===== */
function parseRating(text){
  if(!text)return null;const s=String(text);
  const ps=[
    /(\d(?:\.\d{1,2})?)\s*out\s*of\s*5\s*stars?/i,
    /Rated\s*(\d(?:\.\d{1,2})?)\s*out\s*of\s*5/i,
    /Average\s*rating[:\s]*\s*(\d(?:\.\d{1,2})?)\s*\/?\s*5?/i,
    /^\s*(\d(?:\.\d{1,2})?)\s*\/\s*5\s*$/,
    /(\d(?:\.\d{1,2})?)\s*out\s*of\s*5(?!\s*\d)/i,
    /(\d(?:\.\d{1,2})?)\s*[★☆⭐*]/,
    /(\d(?:\.\d{1,2})?)\s*stars?/i,
    /(\d(?:\.\d{1,2})?)\s*\(\s*\d+\s*(?:ratings?|reviews?)?\s*\)/i
  ];
  for(const p of ps){const m=s.match(p);if(m){const n=parseFloat(m[1]);if(!isNaN(n)&&n>=0&&n<=5)return n}}
  return null;
}
function parseReviewCount(text){
  if(!text)return null;const s=String(text);
  const ps=[
    /([\d,]+)\s*(?:customer\s*)?(?:ratings|reviews)/i,
    /\(\s*([\d,]+)\s*\)/,
    /([\d,]+)\s*global\s*ratings/i,
    /\b([\d,]+)\s*(?:ratings|reviews)\b/i
  ];
  for(const p of ps){const m=s.match(p);if(m){const n=parseInt(m[1].replace(/,/g,''),10);if(!isNaN(n)&&n>=0)return n}}
  return null;
}
function parseWalmartNumber(text,url){
  const all=cleanText(text+' '+(url||''));
  const ps=[/(?:Walmart\s*#|Walmart\s*Item\s*#|Item\s*#|Item\s*No\.?|Item\s*Number)\s*[:#]?\s*(\d{5,20})/i,/\/ip\/[^\/]+\/(\d{5,20})/i,/\/reviews\/product\/(\d{5,20})/i,/(?:productId|itemId)=([0-9]{5,20})/i];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
function parseAmazonNumber(text,url){
  const all=cleanText(text+' '+(url||''));
  const ps=[/(?:ASIN|Amazon\s*#|Amazon\s*Item\s*#)\s*[:#]?\s*([A-Z0-9]{10})/i,/\/dp\/([A-Z0-9]{10})/i,/\/gp\/product\/([A-Z0-9]{10})/i,/\/product-reviews\/([A-Z0-9]{10})/i,/(?:asin)=([A-Z0-9]{10})/i];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
function parseTargetNumber(text,url){
  const all=cleanText(text+' '+(url||''));
  const ps=[/(?:TCIN|Target\s*#|Target\s*Item\s*#)\s*[:#]?\s*(\d{5,20})/i,/\/A-(\d{5,20})/i,/-(\d{5,20})(?:\?|$)/i,/(?:tcin)=([0-9]{5,20})/i];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
function parseUPC(text){
  const all=cleanText(text);
  const ps=[/(?:UPC\s*#?|UPC\s*Code|Barcode|GTIN)\s*[:#]?\s*([0-9]{8,14})/i,/\b(00[0-9]{10,12})\b/];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
/* v1.3.0 (A - data accuracy): capture manufacturer style / model number for
   cross-platform matching (UPC/model preferred over fuzzy name overlap). */
function parseModelNumber(text){
  const all=cleanText(text);
  const ps=[/(?:Model\s*(?:#|No\.?|Number)|Manufacturer\s*Part\s*Number|Style\s*(?:#|No\.?|Number)|Item\s*Model\s*Number)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9\-_.]{2,24})/i];
  for(const p of ps){const m=all.match(p);if(m)return m[1]}return'';
}
/* v1.3.0 (A - data accuracy): read the PRODUCT-LEVEL average rating & review
   count straight from embedded JSON (Walmart __NEXT_DATA__, Target __TGT_DATA__,
   Amazon/any application/ld+json). Used as a cross-check / fallback for the DOM
   rating so the number matches the retailer exactly (no rounding drift). */
function findRatingSummaryInJson(obj,depth){
  if(depth===undefined)depth=0;
  if(depth>14||!obj||typeof obj!=='object')return null;
  const RK=['averageOverallRating','roundedAverageOverallRating','averageRating','ratingValue','starRating'];
  const CK=['totalReviewCount','totalReviewCountFormatted','reviewCount','ratingCount','numberOfReviews'];
  let rating=null,count=null;
  for(const k of RK){if(obj[k]!=null){const n=parseFloat(String(obj[k]).replace(/[^\d.]/g,''));if(!isNaN(n)&&n>0&&n<=5){rating=n;break}}}
  if(rating!=null){for(const k of CK){if(obj[k]!=null){const c=parseInt(String(obj[k]).replace(/[^\d]/g,''),10);if(!isNaN(c)){count=c;break}}}return{rating,count}}
  for(const k of Object.keys(obj)){const found=findRatingSummaryInJson(obj[k],depth+1);if(found)return found}
  return null;
}
function tryJsonRatingSummary(){
  try{
    const scripts=[];
    ['script#__NEXT_DATA__','script#__TGT_DATA__','script#__PRELOADED_STATE__'].forEach(sel=>{const el=document.querySelector(sel);if(el)scripts.push(el)});
    document.querySelectorAll('script[type="application/json"],script[type="application/ld+json"]').forEach(s=>scripts.push(s));
    for(const script of scripts){try{const data=JSON.parse(script.textContent);const f=findRatingSummaryInJson(data);if(f&&f.rating!=null)return f}catch(e){}}
  }catch(e){}
  return null;
}
function detectCountryOfOrigin(text,originKeyword){
  const t=cleanText(text),lo=t.toLowerCase(),key=String(originKeyword||'').toLowerCase().trim();
  /* v1.2.1: tightened patterns.
     - "country of origin" / "origin" now REQUIRE a : or - separator, so words
       like "Original", "originally" no longer match the bare "origin" rule.
     - "made in" / "manufactured in" / "product of" require whitespace + a letter.
     - captured value stops at the first sentence/list boundary and is length-capped. */
  const ps=[
    /country\s*of\s*origin\s*[:\-]\s*([A-Za-z][A-Za-z .-]{1,40})/i,
    /\borigin\s*[:\-]\s*([A-Za-z][A-Za-z .-]{1,40})/i,
    /\bmade\s+in\s+([A-Za-z][A-Za-z .-]{1,40})/i,
    /\bmanufactured\s+in\s+([A-Za-z][A-Za-z .-]{1,40})/i,
    /\bproduct\s+of\s+([A-Za-z][A-Za-z .-]{1,40})/i
  ];
  for(const p of ps){
    const m=t.match(p);
    if(m){
      /* cut at first delimiter that likely ends the country name */
      let v=cleanText(m[1]).split(/[.,;:|/\n]|\s{2,}/)[0];
      v=v.replace(/[.;,\-\s]+$/,'').trim();
      if(v&&v.length>=2&&!/^(the|and|a|an|of|in|is|are)$/i.test(v))return v;
    }
  }
  if(key&&lo.includes(key))return originKeyword;return'UNKNOWN';
}

/* ===== SECTION 3: Classification Rules ===== */
const QA_RULES=[
  {issue:'Safety',words:['unsafe','danger','dangerous','hazard','hurt','injury','injured','sharp','choking','choke','toxic','smell strong','chemical smell','burn','fire','overheat','small parts']},
  {issue:'Function issue',words:['not working','does not work',"doesn't work",'stopped working','defective','malfunction',"won't turn on",'does not turn on','button','sound not working','light not working','battery issue','leak battery']},
  {issue:'Missing parts',words:['missing','missing part','missing parts','not included','piece missing','parts missing','accessory missing','incomplete']},
  {issue:'Damage',words:['broken','damaged','cracked','bent','ripped','torn','scratched','dent','dented','fell apart','break easily','broke']},
  {issue:'Quality',words:['poor quality','bad quality','cheap','flimsy','weak','poorly made','low quality','not durable','durability','paint issue','paint came off','peeling','defect','defective quality']},
  {issue:'Packaging',words:['packaging','package','box','boxed','box damaged','poor packaging','arrived open','open box','crushed box']},
  {issue:'Assembly / Instruction',words:['hard to assemble','difficult to assemble','assembly','instruction','instructions','manual','hard to use','confusing']},
  {issue:'Size / Appearance mismatch',words:['smaller than expected','too small','too big','not as pictured','not like picture','color different','wrong color','wrong size','misleading']},
  {issue:'Delivery',words:['delivery','delivered','late','shipping','ship','arrived late','never arrived','lost package']},
  {issue:'Value',words:['price','expensive','overpriced','not worth','value','waste of money','too costly']}
];
function classifyIssue(text){const lo=lower(text);if(!lo)return null;for(const r of QA_RULES){if(r.words.some(w=>lo.includes(w)))return r.issue}return null}
const NEG_WORDS=['bad','broken','poor','terrible','disappointed','missing','damaged','defective','not working','waste','cheap','unsafe','late','burn','burns','burned'];
const POS_WORDS=['good','great','love','excellent','perfect','cute','nice','happy','quality is good'];
function getSentiment(text){const t=lower(text);if(NEG_WORDS.some(w=>t.includes(w)))return'NEGATIVE';if(POS_WORDS.some(w=>t.includes(w)))return'POSITIVE';return'NEUTRAL'}
function getKeywords(text){const t=lower(text);const pool=['broken','missing','quality','packaging','damaged','poor','defective','not working','delivery','late','cheap','unsafe','price','overpriced','small parts','burn','safety'];return pool.filter(k=>t.includes(k)).slice(0,8)}

/* ===== SECTION 4: Retailer-Specific Selectors ===== */
const REVIEW_SELECTORS={
  amazon:['[data-hook="review"]','#cm_cr-review_list [data-hook="review"]','div[id^="customer_review-"]'],
  walmart:['[itemprop="review"]','[data-testid*="review-card"]','[data-automation-id*="review-card"]','[data-automation-id*="customer-review"]','li.review-list-item'],
  target:['[data-test="review"]','[data-test*="review-card"]','article[data-test*="review"]'],
  costco:['.bazaarvoice-review','.bv-content-item','.bv-review-response','[data-bv-v*="review"]','.review-item']
};
const REVIEW_BODY_SELECTORS={
  amazon:['[data-hook="review-body"] span:not([class])','[data-hook="review-body"] span','[data-hook="review-body"]'],
  walmart:['[itemprop="reviewBody"]','[data-testid*="review-text"]','[data-automation-id*="review-text"]','.review-body','.review-text'],
  target:['[data-test="review-card--review"]','[data-test*="reviewText"]','[data-test*="review-content"]'],
  costco:['.bv-content-summary-body-text','.bv-content-body','.review-text','[itemprop="reviewBody"]']
};
const RATING_NODE_SELECTORS={
  amazon:['[data-hook="rating-out-of-text"]','#acrPopover','i.a-icon-star span.a-icon-alt','[data-hook="average-star-rating"] .a-icon-alt'],
  walmart:['[itemprop="ratingValue"]','[data-testid*="reviews-rating-value"]','[data-automation-id*="rating-value"]','span.rating-number','[aria-label*="out of 5 stars" i]'],
  target:['[data-test="ratings"] [aria-label*="out of 5" i]','[data-test*="ratingValue"]','[aria-label*="out of 5 stars" i]'],
  costco:['[itemprop="ratingValue"]','.bv-rating-ratio-number','.bv-rating-value','[aria-label*="out of 5" i]']
};
const REVIEW_COUNT_NODE_SELECTORS={
  amazon:['#acrCustomerReviewText','[data-hook="total-review-count"]'],
  walmart:['[itemprop="reviewCount"]','[data-testid*="reviews-count"]','[data-automation-id*="review-count"]','a[href*="reviews"]'],
  target:['[data-test*="review-count"]','[data-test="ratings"] a'],
  costco:['[itemprop="reviewCount"]','.bv-rating-ratio-count','.bv-content-summary-item-count','a[href*="#reviews"]']
};

/* ===== SECTION 5: Review Block Scanning (v1.0.2 with __NEXT_DATA__) ===== */
function queryReviewNodes(){
  const key=getRetailerKey(),sels=REVIEW_SELECTORS[key]||[],nodes=[];
  for(const sel of sels){try{document.querySelectorAll(sel).forEach(el=>nodes.push(el))}catch(e){}}
  const seen=new Set();let unique=nodes.filter(el=>{if(seen.has(el))return false;seen.add(el);return true});
  unique=unique.filter(el=>!unique.some(o=>o!==el&&el.contains(o)));
  return unique;
}

/* v1.0.2: Recursively search JSON for review arrays */
function findReviewsInJson(obj,depth){
  if(depth===undefined)depth=0;
  if(depth>12||!obj)return null;
  if(Array.isArray(obj)){
    if(obj.length>0&&typeof obj[0]==='object'&&obj[0]!==null){
      const f=obj[0];
      const hasText='reviewText' in f||'text' in f||'reviewBody' in f||'review' in f;
      const hasMeta='rating' in f||'overallRating' in f||'userNickname' in f||'authorName' in f;
      if(hasText&&hasMeta)return obj;
    }
    for(const item of obj){const found=findReviewsInJson(item,depth+1);if(found)return found}
  }else if(typeof obj==='object'){
    const pk=['customerReviews','reviews','reviewsList','customerReviewList','reviewData'];
    for(const k of pk){if(obj[k]){const found=findReviewsInJson(obj[k],depth+1);if(found)return found}}
    for(const k of Object.keys(obj)){if(pk.includes(k))continue;const found=findReviewsInJson(obj[k],depth+1);if(found)return found}
  }
  return null;
}

/* v1.0.2: Extract reviews from Walmart __NEXT_DATA__ JSON */
function tryWalmartNextData(){
  /* v1.2.1: works for Walmart AND Target (and any site embedding review JSON).
     Scans __NEXT_DATA__, __TGT_DATA__ and any application/json script blocks. */
  const key=getRetailerKey();
  if(key!=='walmart'&&key!=='target')return[];
  try{
    const scripts=[];
    const nd=document.querySelector('script#__NEXT_DATA__');if(nd)scripts.push(nd);
    const tgt=document.querySelector('script#__TGT_DATA__,script#__PRELOADED_STATE__');if(tgt)scripts.push(tgt);
    document.querySelectorAll('script[type="application/json"]').forEach(s=>scripts.push(s));
    let reviews=null;
    for(const script of scripts){
      try{const data=JSON.parse(script.textContent);const found=findReviewsInJson(data);if(found&&found.length){reviews=found;break}}catch(e){}
    }
    if(!reviews||reviews.length===0)return[];
    return reviews.map(r=>({
      el:document.body,
      text:cleanText(r.reviewText||r.text||r.reviewBody||r.review||''),
      _userName:cleanText(r.userNickname||r.authorName||r.reviewer||r.author||'Unknown'),
      _reviewTime:cleanText(r.submissionTime||r.reviewSubmissionTime||r.datePublished||r.submissionDate||''),
      _title:cleanText(r.reviewTitle||r.title||''),
      _rating:r.rating||r.overallRating||null
    })).filter(b=>b.text.length>=15);
  }catch(e){return[]}
}

function fallbackReviewScan(){
  const candidates=document.querySelectorAll('article,li,section,div[class*="review" i],div[class*="Review"],div[id*="review" i]');
  const blocks=[];
  candidates.forEach(el=>{
    const text=(el.innerText||el.textContent||'').trim();
    if(text.length<40||text.length>2000)return;
    const isReview=
      text.includes('Verified purchase')||
      text.includes('Would recommend')||text.includes('Would not recommend')||
      /\d\s*out of\s*5\s*stars/i.test(text)||
      (text.includes('out of 5')&&text.length>50)||
      (text.includes('Helpful?')&&text.includes('Report'))||
      text.includes('Review from');
    /* v1.2.1: only reject when the element ITSELF is structural chrome (nav/header/footer),
       not because its innerHTML happens to contain words like "cart"/"menu".
       The old innerHTML test wrongly dropped whole Target/Amazon review sections. */
    const tag=(el.tagName||'').toLowerCase();
    const role=String(el.getAttribute&&el.getAttribute('role')||'').toLowerCase();
    const isNot=/^(nav|header|footer)$/.test(tag)||/navigation|banner|contentinfo|menubar|menu/.test(role)||!!(el.closest&&el.closest('nav,header,footer'));
    if(isReview&&!isNot)blocks.push({el,text});
  });
  return blocks;
}

function getReviewBlocks(){
  const nodes=queryReviewNodes();
  let blocks=nodes.map(el=>({el,text:cleanText(el.innerText||el.textContent||'')})).filter(b=>b.text.length>=20&&b.text.length<4000);
  /* v1.0.2: Try Walmart __NEXT_DATA__ before fallback */
  if(blocks.length===0){
    const nd=tryWalmartNextData();
    if(nd.length>0)return nd.slice(0,200);
  }
  if(blocks.length===0)blocks=fallbackReviewScan();
  const seenText=new Set();
  return blocks.filter(b=>{const k=b.text.slice(0,180);if(seenText.has(k))return false;seenText.add(k);return true}).slice(0,200);
}

/* v1.0.2: detectUser checks structured data first */
function detectUser(block,idx){
  if(block._userName&&block._userName!=='Unknown')return block._userName;
  const el=block.el,key=getRetailerKey();
  let node=null;
  if(key==='amazon')node=el.querySelector('.a-profile-name');
  if(key==='walmart')node=el.querySelector('[itemprop="author"],[data-testid*="reviewer-name"],[data-automation-id*="reviewer-name"],.review-customer-name');
  if(key==='target')node=el.querySelector('[data-test="review-card--username"],[data-test*="userNickname"]');
  if(node){const t=cleanText(node.textContent);if(t)return t.slice(0,40)}
  const aria=cleanText(el.getAttribute('aria-label')||'');
  const title=cleanText(el.getAttribute('title')||'');
  const text=block.text;
  const patterns=[/By\s+([A-Za-z0-9_ .-]{2,40})/i,/Reviewed by\s+([A-Za-z0-9_ .-]{2,40})/i,/Customer\s+([A-Za-z0-9_ .-]{2,40})/i];
  for(const p of patterns){const m=(aria+' '+title+' '+text).match(p);if(m)return cleanText(m[1]).slice(0,40)}
  return'User '+(idx+1);
}

/* v1.0.2: detectTime checks structured data first, formats ISO dates */
function detectTime(block){
  if(block._reviewTime){
    const iso=block._reviewTime;
    if(/^\d{4}-\d{2}-\d{2}/.test(iso)){
      try{return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}catch(e){}
    }
    return block._reviewTime;
  }
  const el=block.el,key=getRetailerKey();
  let node=null;
  if(key==='amazon')node=el.querySelector('[data-hook="review-date"]');
  if(key==='walmart')node=el.querySelector('[itemprop="datePublished"],time,[data-testid*="review-date"],[data-automation-id*="review-date"],[data-automation-id*="submission-date"]');
  if(key==='target')node=el.querySelector('[data-test="review-card--reviewTime"],time');
  if(node){const raw=cleanText(node.getAttribute('datetime')||node.textContent);const m=raw.match(/on\s+(.+)$/i)||raw.match(/le\s+(.+)$/i);return m?cleanText(m[1]):raw}
  const text=block.text;
  const datePs=[/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/i,/Reviewed in .*? on ([A-Za-z]+ \d{1,2}, \d{4})/i,/Reviewed on\s+([A-Za-z]+ \d{1,2}, \d{4})/i];
  for(const p of datePs){const m=text.match(p);if(m)return cleanText(m[1]||m[0])}
  return'Not visible';
}

/* v1.0.2: extractComment uses structured data when available */
function extractComment(block){
  /* If from __NEXT_DATA__, text is already clean */
  if(block._userName!==undefined){
    let comment=block._title?(block._title+'. '+block.text):block.text;
    return cleanText(comment).slice(0,900);
  }
  const el=block.el,key=getRetailerKey();
  let raw='';
  if(key==='amazon'){
    const body=el.querySelector('[data-hook="review-body"] span:not([class])')||el.querySelector('[data-hook="review-body"] span')||el.querySelector('[data-hook="review-body"]');
    if(body)raw=body.innerText||body.textContent;
  }else if(key==='walmart'){
    const body=el.querySelector('[itemprop="reviewBody"]')||el.querySelector('[data-testid*="review-text"]')||el.querySelector('[data-automation-id*="review-text"]')||el.querySelector('.review-body,.review-text');
    if(body)raw=body.innerText||body.textContent;
  }else if(key==='target'){
    const body=el.querySelector('[data-test="review-card--review"]')||el.querySelector('[data-test*="reviewText"]')||el.querySelector('[data-test*="review-content"]');
    if(body)raw=body.innerText||body.textContent;
  }else if(key==='costco'){
    const body=el.querySelector('.bv-content-summary-body-text')||el.querySelector('.bv-content-body')||el.querySelector('.review-text')||el.querySelector('[itemprop="reviewBody"]');
    if(body)raw=body.innerText||body.textContent;
  }
  if(!raw)raw=block.text;
  let t=raw;
  t=t.replace(/\b\d{1,2}(\.\d+)?\s*out of\s*5\s*(?:stars?|based)/ig,'');
  t=t.replace(/Verified Purchase|Verified purchase|Achat v[ér]rifi[ée]?/ig,'');
  t=t.replace(/Reviewed (in|on|by).*?\d{4}/ig,'');
  t=t.replace(/By\s+[A-Za-z0-9_ .-]+/i,'');
  t=t.replace(/\d+\s+(?:people|guest)s?\s+found this helpful/ig,'');
  t=t.replace(/See all.*?from/ig,'');
  t=t.replace(/Top reviews?.*?See all/is,'');
  t=t.replace(/Would not recommend|Would recommend/ig,'');
  t=t.replace(/(?:broad age appeal|quality|value)\s*:\s*\d+\s*out of 5/ig,'');
  t=t.replace(/^\d+\s*out of 5$/m,'');
  /* v1.0.2 additional cleanup */
  t=t.replace(/Helpful\?\s*/ig,'');
  t=t.replace(/\bReport\b\s*/ig,'');
  t=t.replace(/Review from\s+\S+/ig,'');
  t=t.replace(/Showing\s+\d+-\d+\s+of\s+\d+\s+reviews?/ig,'');
  t=t.replace(/^\s*\d+(\.\d+)?\s*out of\s*5\s*stars?\s*\d+\s*ratings?\s*\|\s*\d+\s*reviews?\s*$/im,'');
  t=cleanText(t);
  if(t.length<10)return'';
  return t.slice(0,900);
}

/* ===== SECTION 6: Rating Node Detection ===== */
function getRatingFromNodes(container){
  const sels=RATING_NODE_SELECTORS[getRetailerKey()]||[];
  for(const sel of sels){try{const nodes=container.querySelectorAll(sel);for(const n of nodes){const bits=[n.getAttribute('aria-label'),n.getAttribute('title'),n.textContent].map(cleanText).filter(Boolean);for(const b of bits){const r=parseRating(b);if(r!==null&&!isNaN(r))return r}}}catch(e){}}
  return null;
}
function getReviewCountFromNodes(container){
  const sels=REVIEW_COUNT_NODE_SELECTORS[getRetailerKey()]||[];
  for(const sel of sels){try{const nodes=container.querySelectorAll(sel);for(const n of nodes){const bits=[n.getAttribute('aria-label'),n.getAttribute('title'),n.textContent].map(cleanText).filter(Boolean);for(const b of bits){const c=parseReviewCount(b);if(c!==null&&!isNaN(c))return c}}}catch(e){}}
  return null;
}

/* ===== SECTION 7: QA Issue Summarization ===== */
function collectCandidateText(container,analyzeVisibleText){
  if(!analyzeVisibleText)return[];
  const key=getRetailerKey(),sels=REVIEW_SELECTORS[key]||[];
  const cards=[],seenEl=new Set();
  for(const sel of sels){try{container.querySelectorAll(sel).forEach(el=>{if(!seenEl.has(el)){seenEl.add(el);cards.push(el)}})}catch(e){}}
  const fc=cards.filter(el=>!cards.some(o=>o!==el&&el.contains(o)));
  const bodySels=REVIEW_BODY_SELECTORS[key]||[],texts=[];
  for(const card of fc){let body=null;for(const bs of bodySels){body=card.querySelector(bs);if(body)break}
  const raw=cleanText((body||card).innerText||(body||card).textContent||'');if(raw&&raw.length>=15&&raw.length<=1200)texts.push(raw)}
  if(texts.length===0){container.querySelectorAll('article,li,section,div[class*="review" i],div[id*="review" i]').forEach(el=>{
    const t=cleanText(el.innerText||el.textContent||'');if(t.length<30||t.length>1500)return;
    const ok=t.includes('Verified purchase')||t.includes('Would recommend')||t.includes('Would not recommend')||/\d\s*out of\s*5\s*stars/i.test(t);if(ok)texts.push(t)})}
  return Array.from(new Set(texts)).slice(0,180);
}
function summarizeIssues(texts){
  const counts={},evidence={};
  for(const t of texts){const issue=classifyIssue(t);if(!issue)continue;counts[issue]=(counts[issue]||0)+1;if(!evidence[issue])evidence[issue]=[];if(evidence[issue].length<2)evidence[issue].push(t)}
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const mainIssue=entries.length?entries[0][0]:'N/A';
  const issueBreakdownText=entries.length?entries.map(([k,v])=>`${k}(${v})`).join(', '):'';
  const qaEvidenceSamples=entries.flatMap(([k])=>(evidence[k]||[]).map(x=>`${k}: ${x}`)).slice(0,5);
  return{mainIssue,issueBreakdown:counts,issueBreakdownText,qaEvidenceSamples};
}

/* ===== SECTION 8: Search Page Helpers ===== */
function bestName(container,link){
  const candidates=[];if(link)candidates.push(link.getAttribute('aria-label'),link.textContent);
  container.querySelectorAll('img[alt],h1,h2,h3,[data-automation-id*=product-title],[data-testid*=product-title],[data-component-type=s-search-result] h2,#productTitle,[data-test=product-title],span').forEach(el=>{
    const t=el.getAttribute('alt')||el.textContent;const c=cleanText(t);if(c&&c.length>8&&c.length<260)candidates.push(c)});
  const filtered=candidates.map(cleanText).filter(Boolean).filter(t=>!/current price|shipping|pickup|delivery|sponsored|options|save with|arrives|add to cart|shop now/i.test(t));
  filtered.sort((a,b)=>b.length-a.length);return filtered[0]||cleanText(document.title);
}
function getProductLinks(){
  /* v1.2.2: scope links to the MAIN search-results container (drop sponsored /
     "you may also like" / carousel links) and de-dupe by product ID so the
     count reflects real results (fixes e.g. Target showing 39 for 7 items). */
  const h=location.hostname;let sels=[],scopeSels=[];
  if(h.includes('walmart')){sels=['a[href*="/ip/"]'];scopeSels=['[data-testid="item-stack"]','[data-testid*="results"]','[data-testid*="search-results"]'];}
  else if(h.includes('amazon')){sels=['a[href*="/dp/"]','a[href*="/gp/product/"]'];scopeSels=['[data-component-type="s-search-results"]','.s-main-slot'];}
  else if(h.includes('target')){sels=['a[href*="/p/"]'];scopeSels=['[data-test="product-grid"]','[data-test*="results"]','[data-test*="search-result"]'];}
  else if(h.includes('costco')){sels=['a[href*=".product."]', 'a[href*="/p/"]'];scopeSels=['.product-list', '#search-results', '.product-results', '[data-testid*="product"]'];}
  let scope=null;
  for(const sc of scopeSels){const el=document.querySelector(sc);if(el){scope=el;break}}
  scope=scope||document;
  const raw=Array.from(scope.querySelectorAll(sels.join(',')));
  const seen=new Set(),out=[];
  for(const a of raw){
    const href=a.getAttribute('href')||'';
    const m=href.match(/\/A-(\d+)/)||href.match(/\/ip\/[^/]+\/(\d+)/)||href.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)||href.match(/\.product\.(\d+)/)||href.match(/\/p\/[^?]+/);
    const id=(m&&(m[1]||m[0]))||href.split('?')[0];
    if(!id||seen.has(id))continue;
    seen.add(id);out.push(a);
  }
  return out.length?out:Array.from(document.querySelectorAll(sels.join(',')));
}
function isProductDetailPage(){
  const h=location.hostname,p=location.pathname;
  if(h.includes('walmart')&&(p.includes('/ip/')||p.includes('/reviews/')))return true;
  if(h.includes('amazon')&&(p.includes('/dp/')||p.includes('/gp/product/')||p.includes('/product-reviews/')))return true;
  if(h.includes('target')&&p.includes('/p/'))return true;
  if(h.includes('costco')&&(p.includes('.product.')||p.includes('/p/')))return true;
  return false;
}
function keywordSummary(complaints){
  const map={};complaints.forEach(c=>(c.keywords||[]).forEach(k=>map[k]=(map[k]||0)+1));
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([keyword,count])=>({keyword,count}));
}

/* ===== SECTION 9: Combined Scan Functions ===== */
function extractFromContainer(container,url,threshold,analyzeVisibleText,originKeyword){
  const allText=cleanText(container.innerText||container.textContent||'');
  let rating=getRatingFromNodes(container),reviewCount=getReviewCountFromNodes(container);
  if(rating===null||reviewCount===null){container.querySelectorAll('[aria-label],[title],span,div,i,a').forEach(el=>{
    const bits=[el.getAttribute('aria-label'),el.getAttribute('title'),el.textContent].map(cleanText).filter(Boolean);
    for(const b of bits){if(rating===null){const r=parseRating(b);if(r!==null)rating=r}if(reviewCount===null){const c=parseReviewCount(b);if(c!==null)reviewCount=c}}})}
  if(rating===null)rating=parseRating(allText);if(reviewCount===null)reviewCount=parseReviewCount(allText);
  let alertStatus='NEED MANUAL CHECK';if(typeof rating==='number'&&!isNaN(rating)){alertStatus=rating<threshold?'ALERT':'OK'}/* v1.2.1: strict < to match WMCA "below 4.0" */
  const issueSummary=summarizeIssues(collectCandidateText(container,analyzeVisibleText));
  return{retailer:getRetailer(),walmartNumber:parseWalmartNumber(allText,url),amazonNumber:parseAmazonNumber(allText,url),targetNumber:parseTargetNumber(allText,url),costcoNumber:parseCostcoNumber(allText,url),upcNumber:parseUPC(allText),modelNumber:parseModelNumber(allText),rating,reviewCount,countryOfOrigin:detectCountryOfOrigin(allText,originKeyword),alertStatus,url,...issueSummary};
}
function scanSearchPage(threshold,analyzeVisibleText,originKeyword){
  const checkedAt=new Date().toISOString(),sourceSite=location.hostname,map=new Map(),links=getProductLinks();
  for(const link of links){
    const url=absUrl(link.getAttribute('href')).split('?')[0];
    if(!url||map.has(url))continue;
    const container=link.closest('[data-test*="ProductCardWrapper"],[data-test*="product-card"],[data-test*="product-grid-item"],[data-item-id],[data-testid*=item],[data-automation-id*=product],[data-component-type="s-search-result"],.product-tile,.product-item,.col-xs-6,.col-lg-3,li,article')||link.parentElement?.parentElement?.parentElement||link.parentElement?.parentElement||link.parentElement||document.body;
    const result=extractFromContainer(container,url,threshold,analyzeVisibleText,originKeyword);
    result.name=bestName(container,link);
    result.sourceSite=sourceSite;
    result.checkedAt=checkedAt;
    map.set(url,result);
  }
  if(map.size===0&&isProductDetailPage()){
    const result=extractFromContainer(document.body,location.href.split('?')[0],threshold,analyzeVisibleText,originKeyword);
    result.name=cleanText(document.querySelector('#productTitle,h1,[data-test=product-title]')?.textContent)||cleanText(document.title);
    result.sourceSite=sourceSite;
    result.checkedAt=checkedAt;
    map.set(result.url,result);
  }
  return Array.from(map.values()).filter(r=>r.name||r.url);
}
function scanDetailPage(threshold,analyzeVisibleText,originKeyword){
  const bodyText=cleanText(document.body.innerText||document.body.textContent||''),url=location.href.split('?')[0];
  let rating=getRatingFromNodes(document.body),reviewCount=getReviewCountFromNodes(document.body);
  if(rating===null||reviewCount===null){document.body.querySelectorAll('[aria-label],[title],span,div,i,a').forEach(el=>{
    const bits=[el.getAttribute('aria-label'),el.getAttribute('title'),el.textContent].map(cleanText).filter(Boolean);
    for(const b of bits){if(rating===null){const r=parseRating(b);if(r!==null)rating=r}if(reviewCount===null){const c=parseReviewCount(b);if(c!==null)reviewCount=c}}})}
  if(rating===null)rating=parseRating(bodyText);if(reviewCount===null)reviewCount=parseReviewCount(bodyText);
  /* v1.3.0 (A - dual insurance): cross-check with the product-level JSON rating.
     Prefer JSON when DOM is missing; flag a mismatch when both exist but differ. */
  const jsonSum=tryJsonRatingSummary();let ratingSource='DOM',ratingCheck='';
  if(jsonSum&&jsonSum.rating!=null){
    if(rating===null){rating=jsonSum.rating;ratingSource='JSON'}
    else if(Math.abs(rating-jsonSum.rating)>0.05){ratingCheck='DOM '+rating+' vs JSON '+jsonSum.rating;rating=jsonSum.rating;ratingSource='JSON(corrected)'}
    else{ratingSource='DOM+JSON'}
    if(reviewCount===null&&jsonSum.count!=null)reviewCount=jsonSum.count;
  }
  let alertStatus='NEED MANUAL CHECK';if(typeof rating==='number'&&!isNaN(rating)){alertStatus=rating<threshold?'ALERT':'OK'}/* v1.2.1: strict < to match WMCA "below 4.0" */
  const meta={retailer:getRetailer(),productName:productName(),walmartNumber:parseWalmartNumber(bodyText,url),amazonNumber:parseAmazonNumber(bodyText,url),targetNumber:parseTargetNumber(bodyText,url),costcoNumber:parseCostcoNumber(bodyText,url),upcNumber:parseUPC(bodyText),modelNumber:parseModelNumber(bodyText),countryOfOrigin:detectCountryOfOrigin(bodyText,originKeyword),rating,reviewCount,ratingSource,ratingCheck,alertStatus,sourceUrl:url,checkedAt:new Date().toISOString()};
  const blocks=getReviewBlocks();
  const complaints=blocks.map((b,idx)=>{const comment=extractComment(b);return{userTag:detectUser(b,idx),reviewTime:detectTime(b),sentiment:getSentiment(comment),issueType:classifyIssue(comment)||'Other',keywords:getKeywords(comment),comment}}).filter(c=>c.comment&&c.comment.length>=15);
  return{mode:'detail',meta,complaints,keywordSummary:keywordSummary(complaints),products:[]};
}
function scanCombined(threshold,analyzeVisibleText,originKeyword){
  if(isProductDetailPage())return scanDetailPage(threshold,analyzeVisibleText,originKeyword);
  return{mode:'search',products:scanSearchPage(threshold,analyzeVisibleText,originKeyword),meta:{},complaints:[],keywordSummary:[]};
}

/* ===== SECTION 10: Platform Domain Validation & Message Listener ===== */
function checkPlatformDomainMatch(expectedPlatform){
  if(!expectedPlatform)return{ok:true};
  const h=location.hostname.toLowerCase();
  const ep=String(expectedPlatform).toLowerCase();
  let expectedDomain='',expectedName='';
  if(ep.includes('walmart_ca')||ep.includes('wmca')){expectedDomain='walmart.ca';expectedName='Walmart CA';}
  else if(ep.includes('walmart')){expectedDomain='walmart.com';expectedName='Walmart US';}
  else if(ep.includes('amazon_ca')||ep.includes('amzca')){expectedDomain='amazon.ca';expectedName='Amazon CA';}
  else if(ep.includes('amazon')){expectedDomain='amazon.com';expectedName='Amazon US';}
  else if(ep.includes('target')){expectedDomain='target.com';expectedName='Target';}
  else if(ep.includes('costco_ca')||ep.includes('costcoca')){expectedDomain='costco.ca';expectedName='Costco CA';}
  else if(ep.includes('costco')){expectedDomain='costco.com';expectedName='Costco US';}
  if(expectedDomain&&!h.includes(expectedDomain)){
    return{ok:false,error:'当前页面不是['+expectedName+']，请确认是否选择了正确的平台标签。'};
  }
  return{ok:true};
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(msg?.type==='QC_COMBINED_SCAN'){
    const domainCheck=checkPlatformDomainMatch(msg.expectedPlatform);
    if(!domainCheck.ok){
      sendResponse({error:domainCheck.error,products:[],complaints:[]});
      return true;
    }
    const threshold=Number(msg.threshold??4.0),analyzeVisibleText=msg.analyzeVisibleText!==false,originKeyword=msg.originKeyword||'China';
    sendResponse(scanCombined(threshold,analyzeVisibleText,originKeyword));
  }
  return true;
});
