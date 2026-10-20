(function(){
  var copyBtn=document.getElementById("copy"),addrEl=document.getElementById("addr");
  copyBtn.addEventListener("click",function(){
    var done=function(msg){copyBtn.textContent=msg;setTimeout(function(){copyBtn.textContent="Copy";},1800);};
    var fallback=function(){
      try{var r=document.createRange();r.selectNodeContents(addrEl);var s=window.getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}
      done("Selected");
    };
    try{
      navigator.clipboard.writeText(addrEl.textContent).then(function(){done("Copied");},fallback);
    }catch(e){fallback();}
  });

  fetch("data/cv.json")
    .then(function(res){if(!res.ok)throw new Error(res.status);return res.json();})
    .then(init)
    .catch(function(){
      var p=document.createElement("p");p.className="empty";
      p.textContent="The experience could not be loaded. Please reload the page.";
      document.getElementById("results").appendChild(p);
    });

  function init(cv){
    var GROUPS=cv.groups,ROLES=cv.roles,TITLES=cv.titles;
    var LABEL={};
    GROUPS.forEach(function(g){g.skills.forEach(function(s){LABEL[s.id]=s.label;});});

    document.getElementById("kicker").textContent=cv.hero.kicker;
    var nameEl=document.getElementById("name");
    cv.hero.name.forEach(function(part,i){
      // the space keeps the words apart when a theme hides the line break
      if(i){nameEl.appendChild(document.createTextNode(" "));nameEl.appendChild(document.createElement("br"));}
      nameEl.appendChild(document.createTextNode(part));
    });
    document.getElementById("line").textContent=cv.hero.line;
    document.getElementById("intro").textContent=cv.hero.intro;

    var eduList=document.getElementById("eduList");
    function addEdu(dtText,ddText){
      var wrap=document.createElement("div");
      var dt=document.createElement("dt");dt.textContent=dtText;
      var dd=document.createElement("dd");dd.textContent=ddText;
      wrap.appendChild(dt);wrap.appendChild(dd);eduList.appendChild(wrap);
    }
    cv.education.forEach(function(e){addEdu(e.title,e.place);});
    addEdu("Languages",cv.languages);
    document.getElementById("edu").hidden=false;

    var sel=new Set(), mode="any";
    var groupsEl=document.getElementById("groups"),
        resultsEl=document.getElementById("results"),
        countEl=document.getElementById("count"),
        clearEl=document.getElementById("clear"),
        anyEl=document.getElementById("m-any"),
        allEl=document.getElementById("m-all"),
        chipEls={};

    GROUPS.forEach(function(g,gi){
      var row=document.createElement("div");row.className="row";row.setAttribute("role","group");
      var lab=document.createElement("p");lab.className="label";lab.id="g"+gi;lab.textContent=g.name;
      row.setAttribute("aria-labelledby",lab.id);
      var chips=document.createElement("div");chips.className="chips";
      g.skills.forEach(function(s){
        var b=document.createElement("button");
        b.type="button";b.className="chip";b.textContent=s.label;b.setAttribute("aria-pressed","false");
        b.addEventListener("click",function(){toggle(s.id);});
        chipEls[s.id]=b;chips.appendChild(b);
      });
      row.appendChild(lab);row.appendChild(chips);groupsEl.appendChild(row);
    });

    var titleRow=document.getElementById("titleRow"),
        roleLine=document.getElementById("roleLine"),
        titleEls={};

    function countFor(skills){
      var n=0;
      ROLES.forEach(function(r){r.bullets.forEach(function(x){
        if(x.tags.some(function(t){return skills.indexOf(t)>-1;}))n++;
      });});
      return n;
    }
    function activeTitle(){
      if(mode!=="any")return null;
      for(var i=0;i<TITLES.length;i++){
        var t=TITLES[i];
        if(t.skills.length===sel.size&&t.skills.every(function(s){return sel.has(s);}))return t.id;
      }
      return null;
    }
    function updateTitles(){
      var act=activeTitle(),cur=null;
      TITLES.forEach(function(t){
        titleEls[t.id].setAttribute("aria-pressed",act===t.id?"true":"false");
        if(act===t.id)cur=t;
      });
      roleLine.textContent="";
      if(cur){
        var l=document.createElement("span");l.className="label";l.textContent="Profile for this role";
        roleLine.appendChild(l);roleLine.appendChild(document.createTextNode(cur.line));
        roleLine.hidden=false;
      }else{
        roleLine.hidden=true;
      }
    }
    TITLES.forEach(function(t){
      var b=document.createElement("button");
      b.type="button";b.className="tbtn";b.setAttribute("aria-pressed","false");
      var a=document.createElement("span");a.className="tt";a.textContent=t.name;
      var c=document.createElement("span");c.className="tc";c.textContent=countFor(t.skills)+" matching achievements";
      b.appendChild(a);b.appendChild(c);
      b.addEventListener("click",function(){
        if(activeTitle()===t.id){sel.clear();}else{sel=new Set(t.skills);mode="any";}
        render();
      });
      titleEls[t.id]=b;titleRow.appendChild(b);
    });

    function toggle(id){
      if(sel.has(id)){sel.delete(id);}else{sel.add(id);}
      render();
    }
    function matches(tags){
      var ids=Array.from(sel);
      return mode==="all"?ids.every(function(i){return tags.indexOf(i)>-1;}):ids.some(function(i){return tags.indexOf(i)>-1;});
    }
    function writeHash(){
      try{
        var parts=(mode==="all"?["all"]:[]).concat(Array.from(sel));
        var url=sel.size?("#"+parts.join(".")):(location.pathname+location.search);
        history.replaceState(null,"",url);
      }catch(e){}
    }
    function readHash(){
      var t=location.hash.replace(/^#/,"").split(".").filter(Boolean);
      if(t[0]==="all"){mode="all";t.shift();}
      sel=new Set(t.filter(function(i){return LABEL[i];}));
    }

    function render(){
      Object.keys(chipEls).forEach(function(id){chipEls[id].setAttribute("aria-pressed",sel.has(id)?"true":"false");});
      anyEl.setAttribute("aria-pressed",mode==="any"?"true":"false");
      allEl.setAttribute("aria-pressed",mode==="all"?"true":"false");
      updateTitles();
      clearEl.hidden=sel.size===0;
      resultsEl.textContent="";

      if(sel.size===0){
        countEl.textContent="Nothing selected.";
        var p=document.createElement("p");p.className="empty";
        p.textContent="Select a skill above. The experience that matches it appears here.";
        resultsEl.appendChild(p);
        writeHash();return;
      }

      var totalB=0,totalR=0;
      ROLES.forEach(function(r){
        var hits=r.bullets.filter(function(x){return matches(x.tags);});
        if(!hits.length)return;
        totalB+=hits.length;totalR++;
        var art=document.createElement("article");art.className="role";
        var head=document.createElement("div");head.className="role-head";
        var left=document.createElement("div");
        var h=document.createElement("h3");h.textContent=r.title;
        var o=document.createElement("p");o.className="org";o.textContent=r.org;
        left.appendChild(h);left.appendChild(o);
        var d=document.createElement("p");d.className="dates";
        d.appendChild(document.createTextNode(r.dates+"  "));
        var hb=document.createElement("b");hb.textContent=hits.length+"/"+r.bullets.length;d.appendChild(hb);
        head.appendChild(left);head.appendChild(d);
        var n=document.createElement("p");n.className="note";n.textContent=r.note;
        var ul=document.createElement("ul");
        hits.forEach(function(x){
          var li=document.createElement("li");
          var t=document.createElement("span");t.textContent=x.text;
          var tg=document.createElement("span");tg.className="tags";
          x.tags.forEach(function(id){
            var s=document.createElement("span");s.className="tag"+(sel.has(id)?" on":"");
            s.textContent=LABEL[id];tg.appendChild(s);
          });
          li.appendChild(t);li.appendChild(tg);ul.appendChild(li);
        });
        art.appendChild(head);art.appendChild(n);art.appendChild(ul);resultsEl.appendChild(art);
      });

      countEl.textContent="";
      var num=document.createElement("b");num.textContent=totalB;
      countEl.appendChild(num);
      countEl.appendChild(document.createTextNode(" "+(totalB===1?"achievement":"achievements")+" across "+totalR+(totalR===1?" role":" roles")));
      if(totalB===0){
        var p2=document.createElement("p");p2.className="empty";
        p2.textContent="No experience carries all of these skills together. Switch to Any, or remove one.";
        resultsEl.appendChild(p2);
      }
      writeHash();
    }

    anyEl.addEventListener("click",function(){mode="any";render();});
    allEl.addEventListener("click",function(){mode="all";render();});
    clearEl.addEventListener("click",function(){sel.clear();render();});
    window.addEventListener("hashchange",function(){readHash();render();});

    readHash();render();
  }
})();
