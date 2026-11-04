/* =====================================================================
   Quality Rating & Complaint Analysis Tool - classification_v2.js (v1.4.0)
   IMPROVEMENT #2: Standardized Complaint Classification.
   CONTENT SCRIPT. Load AFTER content.js + deep_review.js so it overrides
   the global classifyIssue()/getKeywords() they define (same isolated-world
   scope). Additive only: same return type (a string issue name) so every
   existing caller (search scan, detail scan, deep scan, summary, exports)
   keeps working unchanged. It only makes the label more accurate & adds a
   standardized severity that the UI can optionally read.

   WHY: the old classifyIssue picked the FIRST rule that matched in list
   order, so a review saying "cheap and the saw stopped working" was tagged
   only by whichever rule came first, not the most important issue. v2 SCORES
   every category, then resolves ties by QA severity priority
   (Safety > Function > Missing > Damage > Quality > ...).
   ===================================================================== */
(function(){
  'use strict';
  /* Standardized QA defect taxonomy, aligned to the team's defect language.
     severity: Critical / Major / Minor  -> lets the report roll up by severity.
     Order in this array = tie-break priority (top = most important). */
  var TAXONOMY = [
    { issue:'Safety',                    severity:'Critical', words:['unsafe','danger','dangerous','hazard','hazardous','hurt','injury','injured','sharp edge','sharp','choking','choke','swallow','toxic','chemical smell','strong smell','burn','burned','fire','overheat','shock','electric','small parts'] },
    { issue:'Function issue',            severity:'Major',    words:['not working','does not work',"doesn't work","won't work",'stopped working','stops working','stop working','malfunction','defective','defect',"won't turn on",'does not turn on','no power','button not','sound not working','light not working','motor','battery issue','battery drain','leak battery','dead on arrival','doa'] },
    { issue:'Missing parts',             severity:'Major',    words:['missing','missing part','missing parts','parts missing','piece missing','pieces missing','not included','accessory missing','incomplete','empty','nothing inside','lost items inside'] },
    { issue:'Damage',                    severity:'Major',    words:['broken','broke','breaks','break easily','cracked','crack','shattered','snapped','bent','ripped','torn','fell apart','falls apart','came apart','damaged item','dent','dented'] },
    { issue:'Quality',                   severity:'Major',    words:['poor quality','bad quality','low quality','cheap','cheaply made','feels cheap','flimsy','weak','poorly made','not durable','durability','falls off','wont stay','won\'t stay','slides off','paint','peeling','peel','scratches easily','defective quality'] },
    { issue:'Packaging',                 severity:'Minor',    words:['packaging','poor packaging','box damaged','damaged box','crushed box','arrived open','open box','no box','box was'] },
    { issue:'Assembly / Instruction',    severity:'Minor',    words:['hard to assemble','difficult to assemble','assembly','instruction','instructions','manual','hard to use','confusing','hard to put together'] },
    { issue:'Size / Appearance mismatch',severity:'Minor',    words:['smaller than expected','too small','too big','not as pictured','not like picture','looks different','color different','wrong color','wrong size','wrong item','misleading','not as described'] },
    { issue:'Delivery',                  severity:'Minor',    words:['arrived late','never arrived','late delivery','delivery','shipping','lost package','delayed'] },
    { issue:'Value',                     severity:'Minor',    words:['overpriced','not worth','waste of money','too expensive','too costly','not worth the price','rip off'] }
  ];
  var PRIORITY = {}; TAXONOMY.forEach(function(r,i){ PRIORITY[r.issue]=TAXONOMY.length-i; });
  var SEVERITY = {}; TAXONOMY.forEach(function(r){ SEVERITY[r.issue]=r.severity; });
  /* expose the taxonomy so the UI / exports can group by severity if wanted */
  try{ window.QC_TAXONOMY = TAXONOMY; window.QC_ISSUE_SEVERITY = SEVERITY; }catch(e){}

  function lc(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }

  /* Scored classifier: count keyword hits per category, then pick the
     highest score; break ties by QA severity priority. Returns the issue
     name (string) or null - identical contract to the old function. */
  function classifyIssueV2(text){
    var t = lc(text); if(!t) return null;
    var best=null, bestScore=0, bestPri=-1;
    for(var i=0;i<TAXONOMY.length;i++){
      var r=TAXONOMY[i], score=0;
      for(var j=0;j<r.words.length;j++){ if(t.indexOf(r.words[j])!==-1) score++; }
      if(score>0){
        var pri=PRIORITY[r.issue];
        if(score>bestScore || (score===bestScore && pri>bestPri)){
          best=r.issue; bestScore=score; bestPri=pri;
        }
      }
    }
    return best;
  }
  /* Return the standardized severity for a classified issue (Critical/Major/Minor). */
  function issueSeverityV2(issue){ return SEVERITY[issue] || 'Minor'; }

  /* Richer keyword pull that also surfaces the standardized-category hits,
     so the "Top Keywords" cell reflects the same taxonomy. Still returns an
     array of short strings (same contract), capped at 8. */
  function getKeywordsV2(text){
    var t=lc(text); if(!t) return [];
    var pool=['broken','missing','quality','packaging','damaged','poor','defective','not working','stopped working','delivery','late','cheap','flimsy','falls off','peeling','unsafe','choking','small parts','overpriced','not worth'];
    var out=[]; for(var i=0;i<pool.length;i++){ if(t.indexOf(pool[i])!==-1) out.push(pool[i]); }
    return out.slice(0,8);
  }

  /* Override the globals content.js/deep_review.js already use.
     Function declarations in the same content-script scope are reassignable. */
  try{ classifyIssue = classifyIssueV2; }catch(e){ try{ window.classifyIssue = classifyIssueV2; }catch(e2){} }
  try{ getKeywords   = getKeywordsV2;   }catch(e){ try{ window.getKeywords   = getKeywordsV2;   }catch(e2){} }
  try{ window.classifyIssue = classifyIssueV2; window.getKeywords = getKeywordsV2; window.issueSeverity = issueSeverityV2; }catch(e){}
})();
