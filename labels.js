const selectorLabels={
  cat:['🐱','橘貓阿輪'],
  bear:['🐻','大力熊熊'],
  rabbit:['🐰','閃電兔兔'],
  akira:['♟','塔矢亮'],
  sai:['🪭','藤原佐為'],
  lucy:['◈','露西']
};

const characterGridForLabels=document.querySelector('#characterGrid');

if(
  characterGridForLabels&&
  !characterGridForLabels.querySelector('[data-character="lucy"]')
){
  const lucyButton=document.createElement('button');
  lucyButton.type='button';
  lucyButton.className='character-btn mystery';
  lucyButton.dataset.character='lucy';
  lucyButton.setAttribute('aria-pressed','false');
  characterGridForLabels.appendChild(lucyButton);
}

document.querySelectorAll('.character-btn').forEach(button=>{
  const item=selectorLabels[button.dataset.character];
  if(item){
    button.innerHTML=
      `<span class="emoji">${item[0]}</span>${item[1]}`;
  }
});

window.addEventListener('load',()=>{
  let behaviorLoaded=false;
  let effectsLoaded=false;
  const version='20260708-integrated';

  const loadEffects=()=>{
    if(effectsLoaded)return;
    effectsLoaded=true;

    const effects=document.createElement('script');
    effects.src=`lucy-effects.js?v=${version}`;
    document.body.appendChild(effects);
  };

  const loadBehaviors=()=>{
    if(behaviorLoaded)return;
    behaviorLoaded=true;

    const script=document.createElement('script');
    script.src=`behaviors.js?v=${version}`;
    script.onload=loadEffects;
    document.body.appendChild(script);
  };

  const lucyScript=document.createElement('script');
  lucyScript.src=`lucy.js?v=${version}`;
  lucyScript.onload=loadBehaviors;
  lucyScript.onerror=loadBehaviors;
  document.body.appendChild(lucyScript);
},{once:true});
