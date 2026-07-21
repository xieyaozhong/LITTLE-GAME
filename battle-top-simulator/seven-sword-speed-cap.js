/* Sevenfold Sword Refinement speed cap: keep every refined dash inside the new balance envelope */
(() => {
 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  launchSwordDash(target,state,speed,window,lead){
   if(this.c?.sevenSword){
    if(state==='flashRush')speed=Math.min(speed,265);
    else if(state==='pierceRush')speed=Math.min(speed,292);
    else if(state==='drawRush')speed=Math.min(speed,312);
    else if(state==='swallowRush')speed=Math.min(speed,(this.swordComboLeft||0)>1?242:255);
   }
   return super.launchSwordDash(target,state,speed,window,lead);
  }
 };
 document.documentElement.dataset.sevenSwordSpeedCap='v1';
})();
