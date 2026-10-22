/* v0.65 — O aluno troca a própria foto.
   A ficha do aluno no servidor é um documento só, com a faixa, os pontos e o
   pagamento dentro. Liberar a escrita dela para o aluno deixaria ele mudar a
   própria faixa, então a foto saiu para um documento separado, "studentPhotos",
   que guarda só a imagem. Ali a liberação é segura: não existe nada para
   adulterar dentro dele.
   Quem manda é o documento de foto, quando existe; a foto antiga da ficha
   continua valendo para quem ainda não trocou. O Dono liga e desliga, e o
   interruptor fica no documento da academia, então vale para todos os
   celulares, não só para o dele. */
(()=>{
  "use strict";
  const cache=new Map();

  async function recarregar(){
    try{
      cache.clear();
      for(const f of await DB.getAll("studentPhotos"))if(f&&f.photo)cache.set(f.id,f.photo);
    }catch(e){}
  }
  recarregar();
  for(const ev of ["tonicao:data-synced","tonicao:data-pushed"])window.addEventListener(ev,()=>recarregar());
  window.recarregarFotosV065=recarregar;
  window.fotoDoAlunoV065=id=>cache.get(id)||"";

  /* O avatar passa a olhar primeiro o documento de foto */
  const baseAvatar=window.studentAvatar;
  if(typeof baseAvatar==="function"){
    window.studentAvatar=function(s){
      const nova=s&&cache.get(s.id);
      return nova?baseAvatar.call(this,{...s,photo:nova}):baseAvatar.call(this,s);
    };
  }

  async function liberado(){
    try{return (await getSettings()).studentPhotoSelf!==false}catch(e){return true}
  }

  async function gravarFoto(studentId,dataUrl){
    await DB.put("studentPhotos",{id:studentId,photo:dataUrl,updatedAt:new Date().toISOString()});
    cache.set(studentId,dataUrl);
    try{TonicaoCloud.schedule(300)}catch(e){}
  }
  window.gravarFotoV065=gravarFoto;

  /* O professor salvando a foto também grava no documento novo, senão a foto
     antiga do aluno continuaria ganhando dele na tela. */
  const baseSalvar=window.saveCroppedPhoto;
  if(typeof baseSalvar==="function"){
    window.saveCroppedPhoto=async function(...a){
      const id=cropState?.studentId;
      const c=document.getElementById("cropCanvas");
      const img=c&&cropState?.img?c.toDataURL("image/jpeg",.84):"";
      const r=await baseSalvar.apply(this,a);
      if(id&&img){try{await gravarFoto(id,img)}catch(e){}}
      return r;
    };
  }

  /* ---------- lado do aluno ---------- */
  window.minhaFotoV065=async function(){
    const me=await TonicaoAuth.currentUser();
    const id=me?.studentId;
    if(!id){toast("Sua conta ainda não está ligada a uma ficha.");return}
    if(!(await liberado())){toast("O professor não liberou a troca de foto.");return}
    cropState={studentId:id,img:null,zoom:1,x:0,y:0};
    showModal(`<h3>Minha foto</h3>
      <p class="small muted">Use uma foto do rosto, de kimono se puder. Ela aparece na sua ficha e para o professor.</p>
      <div class="field"><label>Tirar foto ou escolher da galeria</label>
        <input id="photoInput" type="file" accept="image/*" capture="user" onchange="loadCropImage(event)"></div>
      <div id="cropWrap" style="display:none">
        <canvas id="cropCanvas" width="320" height="320" class="crop-canvas"></canvas>
        <div class="field"><label>Zoom</label><input type="range" min="1" max="3" step="0.05" value="1" oninput="cropState.zoom=+this.value;renderCrop()"></div>
        <div class="field"><label>Posição horizontal</label><input type="range" min="-100" max="100" value="0" oninput="cropState.x=+this.value;renderCrop()"></div>
        <div class="field"><label>Posição vertical</label><input type="range" min="-100" max="100" value="0" oninput="cropState.y=+this.value;renderCrop()"></div>
        <button class="btn primary full" onclick="salvarMinhaFotoV065()">Salvar minha foto</button>
      </div>`);
  };
  window.salvarMinhaFotoV065=async function(){
    const me=await TonicaoAuth.currentUser(),id=me?.studentId;
    if(!id)return;
    if(!(await liberado())){toast("O professor não liberou a troca de foto.");return}
    const c=document.getElementById("cropCanvas");
    if(!c||!cropState.img){toast("Escolha uma foto.");return}
    try{
      await gravarFoto(id,c.toDataURL("image/jpeg",.84));
      closeModal();toast("Foto salva. ✅");
      await renderAll();
    }catch(e){toast(e.message||"Não foi possível salvar a foto.")}
  };

  async function botaoDoAluno(){
    try{
      const me=await TonicaoAuth.currentUser();
      if(me?.role!=="aluno"||!me.studentId)return;
      if(!(await liberado()))return;
      const home=document.getElementById("home");
      if(!home||home.querySelector("[data-minha-foto]"))return;
      const hero=home.querySelector(".hero");if(!hero)return;
      const b=document.createElement("button");
      b.dataset.minhaFoto="1";b.className="btn secondary";b.style.cssText="margin-top:12px";
      b.textContent=cache.get(me.studentId)?"📷 Trocar minha foto":"📷 Colocar minha foto";
      b.onclick=()=>minhaFotoV065();
      hero.appendChild(b);
    }catch(e){}
  }
  const baseHome=window.renderStudentHome;
  if(typeof baseHome==="function"){
    window.renderStudentHome=async function(...a){const r=await baseHome.apply(this,a);try{await botaoDoAluno()}catch(e){}return r};
  }

  /* ---------- interruptor do Dono ---------- */
  window.alternarFotoAlunoV065=async function(valor){
    const me=await TonicaoAuth.currentUser();
    if(me?.role!=="admin"){toast("Só o Dono pode mudar isso.");return}
    try{
      await TonicaoCloud.savePolicy({studentPhotoSelf:!!valor});
      toast(valor?"Aluno pode trocar a própria foto.":"Troca de foto pelo aluno desligada.");
      await renderAll();
    }catch(e){toast(e.message||"Não foi possível salvar.")}
  };

  const baseMore=window.renderMore;
  if(typeof baseMore==="function"){
    window.renderMore=async function(mode,...a){
      const r=await baseMore.call(this,mode,...a);
      try{
        if(mode!=="academy")return r;
        const me=await TonicaoAuth.currentUser();
        if(me?.role!=="admin")return r;
        const host=document.getElementById("more");
        if(!host||host.querySelector("[data-foto-cfg]"))return r;
        const on=(await getSettings()).studentPhotoSelf!==false;
        const box=document.createElement("div");
        box.dataset.fotoCfg="1";box.className="card";
        box.innerHTML=`<h3>Foto do aluno</h3>
          <div class="field"><label>O aluno pode trocar a própria foto</label>
            <select id="cfgFotoAluno" onchange="alternarFotoAlunoV065(this.value==='1')">
              <option value="1" ${on?"selected":""}>Pode</option>
              <option value="0" ${on?"":"selected"}>Não pode</option>
            </select></div>
          <p class="small muted">Ligado, aparece um botão "Trocar minha foto" na tela inicial do aluno. O professor continua podendo trocar a foto de qualquer um pela ficha.</p>
          <p class="small muted">O aluno só consegue mexer na própria foto: faixa, graus, pontos e pagamento continuam trancados no servidor.</p>`;
        host.appendChild(box);
      }catch(e){}
      return r;
    };
  }
})();
