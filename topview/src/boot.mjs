globalThis.HonroTopview={profileKey:'honro-topview-1-profile-v1'};
try {
  const response=await fetch(new URL('../generated/native.json',import.meta.url));
  if(!response.ok) throw Error('데모 빌드가 필요합니다. node topview/build.mjs');
  const {modules,styles}=await response.json();
  const css=styles.map(file=>new Promise((resolve,reject)=>{
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(file,document.baseURI);
    link.onload=resolve;link.onerror=()=>reject(Error(file));document.head.append(link);
  }));
  await Promise.all(css);
  // Keep product-specific overrides after the shared HUD stylesheet.
  document.head.append(document.querySelector('link[href="topview/style.css"]'));
  for (const file of modules) await import(new URL(file,document.baseURI));
  await globalThis.HONRO_APP_READY;
} catch(error) {
  console.error(error);
  const root=document.getElementById('app');
  root.innerHTML='<main class="tv-title"><section><h1>고갯길을 열 수 없습니다</h1><p role="alert"></p><button type="button">다시 시도</button></section></main>';
  root.querySelector('p').textContent=error.message;root.querySelector('button').onclick=()=>location.reload();
}
