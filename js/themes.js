(function(){
  // Runs in <head> without defer, so the stored look is applied before first paint.
  var KEY="cv-theme",THEMES=["engineer","designer"],root=document.documentElement;

  function stored(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function apply(t){
    if(THEMES.indexOf(t)<0)t=THEMES[0];
    root.setAttribute("data-theme",t);
    var btns=document.querySelectorAll("[data-set-theme]");
    for(var i=0;i<btns.length;i++){
      btns[i].setAttribute("aria-pressed",btns[i].getAttribute("data-set-theme")===t?"true":"false");
    }
  }

  apply(stored());

  document.addEventListener("DOMContentLoaded",function(){
    apply(root.getAttribute("data-theme"));
    var btns=document.querySelectorAll("[data-set-theme]");
    for(var i=0;i<btns.length;i++){
      btns[i].addEventListener("click",function(){
        var t=this.getAttribute("data-set-theme");
        apply(t);
        try{localStorage.setItem(KEY,t);}catch(e){}
      });
    }
  });
})();
