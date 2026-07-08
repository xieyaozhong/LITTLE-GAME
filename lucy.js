characterSvgs.lucy=`<svg viewBox="0 0 118 145" aria-label="露西像素角色">
  <g class="lucy-glitch" opacity=".8">
    <rect x="11" y="30" width="13" height="4" fill="#47f4ff"/>
    <rect x="92" y="44" width="15" height="4" fill="#ff4fd8"/>
    <rect x="8" y="108" width="10" height="4" fill="#ff4fd8"/>
    <rect x="96" y="116" width="12" height="4" fill="#47f4ff"/>
  </g>
  <g class="lucy-wire">
    <path d="M88 80 C108 73 108 105 96 119" fill="none" stroke="#24173a" stroke-width="8"/>
    <path d="M88 80 C105 75 104 103 96 119" fill="none" stroke="#47f4ff" stroke-width="3"/>
  </g>
  <rect x="28" y="38" width="63" height="57" fill="#24173a"/>
  <rect x="34" y="47" width="51" height="42" fill="#efc5b4"/>
  <g class="lucy-hair">
    <rect x="26" y="25" width="66" height="32" fill="#24173a"/>
    <rect x="31" y="20" width="55" height="34" fill="#e9f4ff"/>
    <rect x="26" y="38" width="17" height="49" fill="#e9f4ff"/>
    <rect x="78" y="37" width="16" height="51" fill="#d7e7f5"/>
    <rect x="35" y="24" width="11" height="29" fill="#b9d4e8"/>
    <rect x="67" y="22" width="13" height="33" fill="#ffffff"/>
    <rect x="47" y="20" width="8" height="37" fill="#f8fcff"/>
  </g>
  <rect x="41" y="63" width="9" height="7" fill="#24173a"/>
  <rect x="70" y="63" width="9" height="7" fill="#24173a"/>
  <rect x="42" y="64" width="6" height="3" fill="#47f4ff"/>
  <rect x="71" y="64" width="6" height="3" fill="#ff4fd8"/>
  <rect x="55" y="79" width="17" height="4" fill="#b46f78"/>
  <rect x="36" y="91" width="55" height="39" fill="#24173a"/>
  <rect x="41" y="95" width="45" height="31" fill="#202836"/>
  <rect x="47" y="95" width="7" height="31" fill="#47f4ff"/>
  <rect x="75" y="95" width="7" height="31" fill="#ff4fd8"/>
  <rect x="54" y="99" width="21" height="8" fill="#e9f4ff"/>
  <rect x="57" y="107" width="15" height="18" fill="#39475d"/>
  <g class="arm-front">
    <rect x="13" y="91" width="42" height="14" fill="#24173a"/>
    <rect x="18" y="95" width="35" height="7" fill="#202836"/>
    <rect x="7" y="86" width="17" height="22" fill="#24173a"/>
    <rect x="10" y="91" width="12" height="14" fill="#efc5b4"/>
    <rect x="8" y="84" width="17" height="5" fill="#47f4ff"/>
  </g>
  <rect x="37" y="124" width="21" height="16" fill="#24173a"/>
  <rect x="69" y="124" width="21" height="16" fill="#24173a"/>
  <rect x="40" y="128" width="17" height="8" fill="#202836"/>
  <rect x="70" y="128" width="17" height="8" fill="#202836"/>
  <rect x="38" y="136" width="22" height="5" fill="#47f4ff"/>
  <rect x="68" y="136" width="22" height="5" fill="#ff4fd8"/>
</svg>`;

characters.lucy={
  name:'露西',
  description:'駭客型：先入侵輪盤，鎖定訊號後高速解碼結果。',
  idle:'訊號穩定，隨時可以入侵。',
  start:'開始連線……別眨眼。',
  result:'目標已解碼。',
  duration:3600,
  windup:520,
  minSpins:8,
  maxSpins:11,
  tickStep:8,
  baseTone:820,
  ease:p=>1-Math.pow(1-p,5.4)
};

try{
  if((localStorage.getItem('luckyWheelCharacter')||'cat')==='lucy')selectCharacter('lucy',false);
}catch{}
