// Apply the requested queue layout once per page load, including saved options.
// Live updates and reconnects must never reset a user's choices mid-session.
export const refreshQueueSettings=Object.freeze({showPrevious:true,previousSongs:2,nextSongs:1,previousSlide:true,nextSlide:true});
export function createRefreshPreset(){
 let received=false;
 return (settings={})=>{
  if(received)return null;received=true;
  return Object.entries(refreshQueueSettings).some(([key,value])=>settings[key]!==value)?{...refreshQueueSettings}:null;
 };
}
