/* v0.25: adaptador — a biblioteca em vendor/ expõe QRCodeMatrix; o app usa new QRCode(el,{text,width,height}) */
(function(){
  if(window.QRCode||!window.QRCodeMatrix)return;
  var L=window.QRErrorCorrectLevel||{L:1,M:0,Q:3,H:2};
  function build(text,level){
    var last;
    for(var t=1;t<=40;t++){
      try{var q=new window.QRCodeMatrix(t,level);q.addData(String(text));q.make();return q}catch(e){last=e}
    }
    throw last||new Error("Texto grande demais para QR");
  }
  function QRCode(el,opts){
    opts=opts||{};
    var q=build(opts.text||"",opts.correctLevel!=null?opts.correctLevel:L.M);
    var n=q.getModuleCount(),size=opts.width||220,quiet=2,total=n+quiet*2,path="";
    for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))path+="M"+(c+quiet)+","+(r+quiet)+"h1v1h-1z";
    el.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+total+' '+total+'" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" style="background:#fff;max-width:100%;height:auto"><path d="'+path+'" fill="#000"/></svg>';
  }
  QRCode.CorrectLevel=L;
  window.QRCode=QRCode;
})();
