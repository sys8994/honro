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
  await globalThis.HonroStartup.firstPaint();
  for (const [index,file] of modules.entries()) {
    await import(new URL(file,document.baseURI));
    globalThis.HonroStartup.progress('게임 준비',index+1,modules.length);
  }
  await globalThis.HONRO_APP_READY;
} catch(error) {
  console.error(error);
  globalThis.HonroStartup.failed();
}
