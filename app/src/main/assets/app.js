const $ = id => document.getElementById(id);
let selectedImages = [];
let musicFile = null;
let lastVideoUrl = null;
let lastObjectUrls = [];
const historyKey = 'luffy_free_exports_v2';

function openTab(tab){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $(tab+'Page').classList.add('active');
  if(tab==='home') renderRecent();
  if(tab==='videos') renderLibrary();
  window.scrollTo(0,0);
}

function toast(msg){
  const el=$('toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove('show'),2300);
}

function escapeHtml(s=''){
  return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function slugify(s=''){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,40);
}
function fmtTime(ts){
  const d=new Date(ts);
  return d.toLocaleDateString()+' · '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
}
function getHistory(){
  try{return JSON.parse(localStorage.getItem(historyKey)||'[]')}catch{return[]}
}
function saveHistory(items){
  localStorage.setItem(historyKey,JSON.stringify(items.slice(0,20).map(x=>({...x,downloadUrl:null}))));
}
function itemHtml(item){
  return '<div class="generation-item">'+
    '<div class="generation-thumb">▶</div>'+
    '<div class="generation-content"><strong>'+escapeHtml(item.title)+'</strong>'+
    '<div class="generation-meta"><span>'+item.count+' scenes</span><span>•</span><span>'+item.aspectRatio+'</span><span>•</span><span>'+fmtTime(item.createdAt)+'</span></div>'+
    '<div class="row-actions">'+
      (item.downloadUrl?'<a href="'+item.downloadUrl+'" download="'+(slugify(item.title)||'video')+'.webm">Download</a><a href="'+item.downloadUrl+'" target="_blank">Play</a>':'<button disabled>Previous session</button>')+
    '</div></div></div>';
}
function renderRecent(){
  const items=getHistory().slice(0,3);
  $('recentList').innerHTML=items.length?items.map(itemHtml).join(''):'<div class="empty">Your exported videos will appear here.</div>';
}
function renderLibrary(){
  const items=getHistory();
  $('libraryList').innerHTML=items.length?items.map(itemHtml).join(''):'<div class="empty">No exports yet. Make your first free video.</div>';
}
function clearExports(){
  localStorage.removeItem(historyKey);
  renderRecent();
  renderLibrary();
  toast('Export history cleared');
}
function fillSampleCaptions(){
  $('captions').value='Welcome to our special story\nBeautiful moments together\nMemories we will always keep';
}

$('imageInput').addEventListener('change', async e=>{
  const files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));
  if(!files.length){
    selectedImages=[];
    renderImages();
    return;
  }
  try{
    selectedImages=await Promise.all(files.map(fileToDataUrl));
    renderImages();
    toast(files.length+' image(s) selected');
  }catch{
    toast('Could not read one of the images');
  }
});

$('musicInput').addEventListener('change', e=>{
  musicFile=(e.target.files||[])[0]||null;
  $('musicSummary').textContent=musicFile?musicFile.name:'No music selected';
});

function renderImages(){
  $('imageSummary').textContent=selectedImages.length?selectedImages.length+' image(s) selected':'No images selected';
  $('thumbStrip').innerHTML=selectedImages.map(src=>'<img src="'+src+'" alt="Selected image">').join('');
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=src;
  });
}

function getCanvasSize(aspectRatio, quality){
  const high=quality==='high';
  if(aspectRatio==='16:9') return high?{w:1280,h:720}:{w:960,h:540};
  if(aspectRatio==='1:1') return high?{w:900,h:900}:{w:720,h:720};
  return high?{w:720,h:1280}:{w:540,h:960};
}

function drawCover(ctx,img,cw,ch,progress,index){
  const scale=Math.max(cw/img.width,ch/img.height)*(1+0.075*progress);
  const dw=img.width*scale;
  const dh=img.height*scale;
  const panX=(index%2===0?-1:1)*(cw*0.025)*progress;
  const panY=(index%3===0?1:-1)*(ch*0.018)*progress;
  ctx.drawImage(img,(cw-dw)/2+panX,(ch-dh)/2+panY,dw,dh);
}

function wrapText(ctx,text,x,y,maxWidth,lineHeight){
  const words=String(text).split(/\s+/);
  let line='';
  const lines=[];
  words.forEach(word=>{
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxWidth&&line){
      lines.push(line);
      line=word;
    }else line=test;
  });
  if(line) lines.push(line);
  const shown=lines.slice(0,3);
  const startY=y-((shown.length-1)*lineHeight)/2;
  shown.forEach((ln,i)=>ctx.fillText(ln,x,startY+i*lineHeight));
}

function drawCaption(ctx,caption,title,cw,ch){
  const grad=ctx.createLinearGradient(0,ch*0.56,0,ch);
  grad.addColorStop(0,'rgba(0,0,0,0)');
  grad.addColorStop(1,'rgba(0,0,0,0.75)');
  ctx.fillStyle=grad;
  ctx.fillRect(0,ch*0.54,cw,ch*0.46);

  ctx.textAlign='center';
  ctx.fillStyle='white';
  ctx.font='700 '+Math.max(24,Math.round(cw*0.047))+'px sans-serif';
  wrapText(ctx,caption||title||'My Video',cw/2,ch*0.83,cw*0.82,Math.max(30,cw*0.058));

  ctx.font='500 '+Math.max(13,Math.round(cw*0.021))+'px sans-serif';
  ctx.fillStyle='rgba(255,255,255,.72)';
  ctx.fillText('Luffy AI Studio Free Mode',cw/2,ch*0.95);
}

async function makeAudioTrack(file){
  if(!file || !window.AudioContext) return {tracks:[],cleanup:()=>{}};
  const audioUrl=URL.createObjectURL(file);
  lastObjectUrls.push(audioUrl);
  const audio=new Audio(audioUrl);
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  const audioCtx=new AudioCtx();
  await audioCtx.resume().catch(()=>{});
  const source=audioCtx.createMediaElementSource(audio);
  const dest=audioCtx.createMediaStreamDestination();
  source.connect(dest);
  audio.loop=false;
  return {
    tracks:dest.stream.getAudioTracks(),
    start:()=>audio.play().catch(()=>{}),
    stop:()=>{audio.pause();audio.currentTime=0;},
    cleanup:()=>{try{source.disconnect();audioCtx.close();}catch(e){}}
  };
}

async function exportVideo(){
  const title=$('projectTitle').value.trim()||'My Free Video';
  const captions=$('captions').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const sceneDuration=Number($('sceneDuration').value||3);
  const aspectRatio=$('aspectRatio').value;
  const resolution=$('resolution').value;

  if(!selectedImages.length){
    toast('Please select at least one image');
    return;
  }
  if(!window.MediaRecorder){
    toast('This phone WebView does not support video recording');
    return;
  }

  const btn=$('generateBtn');
  btn.disabled=true;
  btn.textContent='Preparing...';

  try{
    const images=await Promise.all(selectedImages.map(loadImage));
    const {w,h}=getCanvasSize(aspectRatio,resolution);
    const canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:false});
    const videoStream=canvas.captureStream(30);

    const audioBundle=await makeAudioTrack(musicFile);
    const combinedTracks=[...videoStream.getVideoTracks(),...(audioBundle.tracks||[])];
    const combinedStream=new MediaStream(combinedTracks);

    const mimeCandidates=[
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    let mimeType='';
    for(const type of mimeCandidates){
      if(MediaRecorder.isTypeSupported(type)){mimeType=type;break;}
    }

    const recorder=mimeType?new MediaRecorder(combinedStream,{mimeType,videoBitsPerSecond:resolution==='high'?4500000:2500000}):new MediaRecorder(combinedStream);
    const chunks=[];
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    const finished=new Promise((resolve,reject)=>{
      recorder.onstop=resolve;
      recorder.onerror=e=>reject(e.error||new Error('Recorder error'));
    });

    const totalMs=images.length*sceneDuration*1000;
    const transitionMs=Math.min(450,sceneDuration*1000*0.2);
    const start=performance.now();

    recorder.start(1000);
    if(audioBundle.start) audioBundle.start();
    btn.textContent='Exporting...';

    function frame(now){
      const elapsed=now-start;
      const sceneMs=sceneDuration*1000;
      const sceneIndex=Math.min(images.length-1,Math.floor(elapsed/sceneMs));
      const sceneElapsed=elapsed-sceneIndex*sceneMs;
      const progress=Math.min(1,sceneElapsed/sceneMs);

      ctx.fillStyle='black';
      ctx.fillRect(0,0,w,h);
      drawCover(ctx,images[sceneIndex],w,h,progress,sceneIndex);

      if(sceneElapsed>sceneMs-transitionMs&&sceneIndex<images.length-1){
        const alpha=(sceneElapsed-(sceneMs-transitionMs))/transitionMs;
        ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
        drawCover(ctx,images[sceneIndex+1],w,h,0,sceneIndex+1);
        ctx.globalAlpha=1;
      }

      drawCaption(ctx,captions[sceneIndex]||'',title,w,h);

      if(elapsed<totalMs){
        requestAnimationFrame(frame);
      }else{
        setTimeout(()=>{
          try{recorder.stop()}catch(e){}
          if(audioBundle.stop)audioBundle.stop();
          if(audioBundle.cleanup)audioBundle.cleanup();
        },200);
      }
    }

    requestAnimationFrame(frame);
    await finished;

    if(!chunks.length) throw new Error('No video data');
    const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'});
    if(lastVideoUrl) URL.revokeObjectURL(lastVideoUrl);
    lastVideoUrl=URL.createObjectURL(blob);
    lastObjectUrls.push(lastVideoUrl);

    const item={title,count:images.length,aspectRatio,createdAt:Date.now(),downloadUrl:lastVideoUrl};
    const history=getHistory();
    history.unshift(item);
    saveHistory(history);

    $('previewVideo').src=lastVideoUrl;
    $('previewCard').classList.remove('hidden');
    renderRecent();
    renderLibrary();
    openTab('videos');
    toast('Video exported successfully');
  }catch(err){
    console.error(err);
    toast('Export failed on this device');
  }finally{
    btn.disabled=false;
    btn.textContent='✦ Export free video';
  }
}

function downloadLastVideo(){
  if(!lastVideoUrl){
    toast('No video available yet');
    return;
  }
  const a=document.createElement('a');
  a.href=lastVideoUrl;
  a.download=(slugify($('projectTitle').value||'my-video')||'my-video')+'.webm';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

renderRecent();
renderLibrary();
