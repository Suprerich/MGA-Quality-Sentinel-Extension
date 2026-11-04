/* =====================================================================
   Quality Rating & Complaint Analysis Tool - deep_review.js (v1.2.2)
   OPT-IN deep crawler for low-rated products. Additive only:
   reuses content.js globals, adds its OWN message listener for
   'QC_DEEP_LOW_SCAN'. Original content.js behavior is untouched.

   v1.2.2 (reliability only; no new features, same message type / output):
     - reveal reviews section + inner-container scroll (Target/Walmart mount
       reviews only when the section becomes visible).
     - click "See all reviews / Show more / Load more" buttons.
     - fire real scroll events so lazy loaders mount even when the tab was
       recently in the background.
     - adaptive wait: keep pulsing until the first reviews render (up to 12s),
       then stop as soon as the count stabilises (faster on rich pages).
   ===================================================================== */
(function(){
  function dSleep(ms){return new Promise(r=>setTimeout(r,ms))}
  function dLower(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function dKey(){const h=location.hostname;if(h.includes('walmart'))return'walmart';if(h.includes('amazon'))return'amazon';if(h.includes('target'))return'target';return'other'}

  /* v1.2.2: scroll the window AND any tall inner scroll container, firing
     real scroll events so IntersectionObserver-based lazy loaders trigger. */
  function dScrollPulse(){
    try{window.scrollTo(0,document.body.scrollHeight);window.dispatchEvent(new Event('scroll'));}catch(e){}
    try{
      document.querySelectorAll('div,section,main').forEach(el=>{
        if(el.scrollHeight>el.clientHeight+400 && el.clientHeight>200){
          el.scrollTop=el.scrollHeight;
          el.dispatchEvent(new Event('scroll',{bubbles:true}));
        }
      });
    }catch(e){}
  }
  /* v1.2.2: bring the reviews section into view - some sites only mount
     reviews once the section is visible. */
  function dRevealReviews(){
    const a=['#reviews','#customer-reviews','[data-test="reviews"]','[data-testid="reviews-section"]','[itemprop="review"]','[data-hook="reviews-medley-footer"]','[data-automation-id*="reviews"]'];
    for(const s of a){const el=document.querySelector(s);if(el){try{el.scrollIntoView({block:'center'});}catch(e){}return true}}
    return false;
  }
  function dClickMore(){
    const labels=['see all reviews','show more reviews','more reviews','load more reviews','load more','show more','see more','view more','next page','next'];
    const btns=Array.from(document.querySelectorAll('button,a,[role="button"]'));
    for(const b of btns){const t=dLower(b.innerText||b.textContent||b.getAttribute('aria-label')||'');if(!t)continue;if(labels.some(l=>t.includes(l))){const rc=b.getBoundingClientRect();if(rc.width>0&&rc.height>0&&!b.disabled){b.scrollIntoView({block:'center'});b.click();return true}}}
    const nx=document.querySelector('li.a-last a,[data-hook="pagination-bar"] a[href*="pageNumber"]');if(nx){nx.click();return true}
    return false;
  }
  /* v1.2.2: poll up to hardTimeout, actively pulsing scroll + revealing the
     reviews section + clicking "more" so lazy content actually mounts,
     instead of a passive wait. */
  async function dWaitForReviews(hardTimeout){
    const t0=Date.now();const limit=hardTimeout||12000;
    dRevealReviews();
    while(Date.now()-t0<limit){
      const n=(typeof getReviewBlocks==='function')?getReviewBlocks().length:0;
      if(n>0)return n;
      dScrollPulse();
      dClickMore();
      await dSleep(600);
    }
    return (typeof getReviewBlocks==='function')?getReviewBlocks().length:0;
  }
  async function dAutoLoad(maxRounds){
    /* First make sure the initial reviews have rendered (fixes Target/Walmart
       lazy-load where a fixed wait was too short or too long). */
    await dWaitForReviews(12000);
    let last=0,stag=0;const mr=maxRounds||40;
    for(let i=0;i<mr;i++){
      dScrollPulse();await dSleep(900);
      const n=(typeof getReviewBlocks==='function')?getReviewBlocks().length:0;
      if(n>last){last=n;stag=0}else{const c=dClickMore();await dSleep(c?1500:600);stag++;if(stag>=4)break}
    }
    window.scrollTo(0,0);
  }
  const PRR={amazon:['[data-hook="review-star-rating"] .a-icon-alt','[data-hook="cmps-review-star-rating"] .a-icon-alt','.a-icon-star .a-icon-alt'],walmart:['[itemprop="ratingValue"]','[aria-label*="out of 5 stars" i]','[data-automation-id*="star-rating"]'],target:['[data-test*="ratingValue"]','[aria-label*="out of 5 stars" i]','[data-test="review-card--rating"]']};
  function dReviewRating(block){
    if(block&&typeof block._rating==='number'&&!isNaN(block._rating))return block._rating;
    const el=block&&block.el,sels=PRR[dKey()]||[];
    if(el&&el.querySelectorAll){for(const sel of sels){try{const nodes=el.querySelectorAll(sel);for(const n of nodes){const bits=[n.getAttribute('aria-label'),n.getAttribute('title'),n.getAttribute('content'),n.textContent].filter(Boolean);for(const b of bits){const r=(typeof parseRating==='function')?parseRating(b):null;if(r!==null)return r}}}catch(e){}}}
    if(typeof parseRating==='function'&&block&&block.text){const r=parseRating(block.text);if(r!==null)return r}
    return null;
  }
  async function deepLowScan(threshold){
    await dAutoLoad(40);
    const blocks=(typeof getReviewBlocks==='function')?getReviewBlocks():[];
    const complaints=blocks.map((b,idx)=>{
      const comment=(typeof extractComment==='function')?extractComment(b):String(b.text||'');
      return{index:idx+1,
        userTag:(typeof detectUser==='function')?detectUser(b,idx):('User '+(idx+1)),
        reviewTime:(typeof detectTime==='function')?detectTime(b):'',
        reviewRating:dReviewRating(b),
        sentiment:(typeof getSentiment==='function')?getSentiment(comment):'NEUTRAL',
        issueType:((typeof classifyIssue==='function')?classifyIssue(comment):null)||'Other',
        keywords:(typeof getKeywords==='function')?getKeywords(comment):[],
        comment};
    }).filter(c=>c.comment&&c.comment.length>=15);
    const bodyText=String(document.body.innerText||document.body.textContent||'').replace(/\s+/g,' ');
    let rating=(typeof getRatingFromNodes==='function')?getRatingFromNodes(document.body):null;
    if(rating===null&&typeof parseRating==='function')rating=parseRating(bodyText);
    let reviewCount=(typeof getReviewCountFromNodes==='function')?getReviewCountFromNodes(document.body):null;
    if(reviewCount===null&&typeof parseReviewCount==='function')reviewCount=parseReviewCount(bodyText);
    let alertStatus='NEED MANUAL CHECK';
    if(typeof rating==='number'&&!isNaN(rating))alertStatus=rating<threshold?'ALERT':'OK';/* v1.2.1: strict < to match WMCA "below 4.0" */
    const counts={};complaints.forEach(c=>counts[c.issueType]=(counts[c.issueType]||0)+1);
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const mainIssue=entries.length?entries[0][0]:'N/A';
    const kw=(typeof keywordSummary==='function')?keywordSummary(complaints):[];
    return{mode:'deepLow',productName:(typeof productName==='function')?productName():document.title,rating:rating,reviewCount:reviewCount,alertStatus:alertStatus,threshold:threshold,mainIssue:mainIssue,issueBreakdownText:entries.map(([k,v])=>k+'('+v+')').join(', '),keywordSummary:kw,complaints:complaints,sourceUrl:location.href.split('?')[0]};
  }
  chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
    if(msg&&msg.type==='QC_DEEP_LOW_SCAN'){
      const threshold=Number(msg.threshold!=null?msg.threshold:4.0);
      deepLowScan(threshold).then(res=>sendResponse(res)).catch(e=>sendResponse({mode:'deepLow',error:String(e&&e.message||e),complaints:[]}));
      return true;
    }
  });
})();
