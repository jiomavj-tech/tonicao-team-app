#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil, sys

ROOT=Path(__file__).resolve().parent

def die(msg):
    raise SystemExit('[v0.32] '+msg)

def read(name):
    p=ROOT/name
    if not p.exists(): die('arquivo ausente: '+name)
    return p.read_text(encoding='utf-8')

def write(name,text):
    p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')

def replace_once(text,old,new,label):
    n=text.count(old)
    if n!=1: die(f'{label}: esperado 1 trecho, encontrei {n}')
    return text.replace(old,new,1)

index=read('index.html')
if 'features-v032-family.js' in index and 'offline-first • v0.32' in index:
    print('[v0.32] já aplicada; nada a fazer.')
    sys.exit(0)
if 'offline-first • v0.31' not in index:
    die('este instalador espera a v0.31 atual')

# versão
index=index.replace('offline-first • v0.31','offline-first • v0.32')

# QR aberto pela câmera normal do celular também passa pelo seletor familiar.
index=replace_once(index,
'''    await checkinBySession(u.studentId,p.sessionId,p.code);''',
'''    if(typeof window.familyCheckinEntryV032==="function")await window.familyCheckinEntryV032(p.sessionId,p.code);
    else await checkinBySession(u.studentId,p.sessionId,p.code);''','QR externo familiar')

# "O que eu treinei" passa a respeitar o perfil familiar ativo.
index=replace_once(index,
'''  window.myLessonsModalV031=async function(){
    const u=await me();if(!u?.studentId)return;
    const techs=await DB.getAll("techniques"),list=await myLessons(u.studentId);''',
'''  window.myLessonsModalV031=async function(){
    const cur=await getCurrentStudent();if(!cur)return;
    const techs=await DB.getAll("techniques"),list=await myLessons(cur.id);''','diário familiar modal')
index=replace_once(index,
'''      const home=document.getElementById("home");const u=await me();if(!home||!u?.studentId||home.querySelector("[data-v031]"))return r;
      const list=await myLessons(u.studentId),techs=await DB.getAll("techniques");''',
'''      const home=document.getElementById("home");const cur=await getCurrentStudent();if(!home||!cur||home.querySelector("[data-v031]"))return r;
      const list=await myLessons(cur.id),techs=await DB.getAll("techniques");''','diário familiar home')

# Carrega a nova camada depois das funções v0.31 e antes da ajuda.
marker='<script>/* ===== help.js ===== */'
if marker not in index: die('marcador help.js não encontrado')
index=index.replace(marker,'<script src="./features-v032-family.js"></script>\n'+marker,1)
write('index.html',index)

# Service Worker
sw=read('sw.js')
sw=sw.replace('const CACHE="tonicao-v0.31.0";','const CACHE="tonicao-v0.32.0";')
if './features-v032-family.js' not in sw:
    sw=replace_once(sw,'const ASSETS=["./", "./index.html",','const ASSETS=["./", "./index.html", "./features-v032-family.js",','cache da família')
write('sw.js',sw)

# Regras Firestore v0.32 ficam também versionadas no repositório.
write('regras-firestore.txt',read('regras-firestore-v032.txt'))

write('CHANGELOG-v0.32.md','''# v0.32 — Família e Dependentes\n\n- Uma conta de responsável pode ter vários dependentes.\n- Criança/dependente não precisa de e-mail ou senha.\n- Responsável troca entre o próprio perfil e os filhos.\n- Professor aprova vínculo e pode usar ficha já existente.\n- Professor pode criar conta de responsável sem ficha esportiva.\n- Check-in por QR permite selecionar quem da família está treinando.\n- Reserva de aula, graduação, pontos e diário respeitam o perfil ativo.\n- Notificações do dependente chegam ao responsável.\n- Remover vínculo não apaga a ficha do aluno.\n- Firestore autoriza somente dependentes explicitamente vinculados.\n''')

node=shutil.which('node')
if node:
    for f in ['features-v032-family.js']:
        p=subprocess.run([node,'--check',str(ROOT/f)],capture_output=True,text=True)
        if p.returncode: die(f'{f} inválido: {p.stderr.strip()}')
print('[v0.32] Arquivos aplicados. Falta publicar regras-firestore.txt no Firebase Console.')
