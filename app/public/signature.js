// Bespoke Kira autograph: open K, joined cursive strokes, a sharp guitar tail.
// Keep enough bitmap detail for the 4K OBS source and its transient recoil.
export function drawSignature(studio,color){
 const canvas=studio.querySelector('.guitar-mark canvas'),c=canvas.getContext('2d');
 canvas.width=2160;canvas.height=360;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(6,6);c.lineCap='round';c.lineJoin='round';
 const path=(commands,width,alpha=1)=>{c.strokeStyle=color;c.globalAlpha=alpha;c.lineWidth=width;c.beginPath();for(const [op,...v] of commands)c[op](...v);c.stroke();};
 // K has a long pen-up slash; ira is a loose, connected autograph.
 path([['moveTo',15,43],['bezierCurveTo',19,30,27,12,36,7],['bezierCurveTo',34,18,26,31,24,44]],2.6);
 path([['moveTo',24,31],['bezierCurveTo',37,24,48,14,53,11],['moveTo',27,29],['bezierCurveTo',38,31,36,46,46,40],['bezierCurveTo',54,36,58,26,61,24],['bezierCurveTo',55,38,57,43,64,38],['bezierCurveTo',70,34,73,25,76,23],['lineTo',72,37],['bezierCurveTo',79,23,83,22,89,26],['bezierCurveTo',94,29,92,36,98,35],['bezierCurveTo',109,20,115,19,119,23],['bezierCurveTo',121,29,113,36,108,37],['bezierCurveTo',101,37,109,24,119,23],['bezierCurveTo',116,33,116,39,126,34]],2.4);
 path([['moveTo',64,16],['lineTo',67,13]],2.8);
 // The final a opens into a tapering, bent string rather than a stock bolt icon.
 if(studio.classList.contains('strings')){
  for(let i=0;i<6;i++)path([['moveTo',126,32+i*2.3],['bezierCurveTo',158,31+i*2.3,204,28+i*2.3,248,23+i*1.5],['lineTo',305,10+i*.9]],.65,.25+i*.09);
  path([['moveTo',124,35],['lineTo',178,26],['lineTo',194,38],['lineTo',209,19],['lineTo',332,7]],1.9);
 }else if(studio.classList.contains('slash')){
  path([['moveTo',126,34],['bezierCurveTo',161,28,235,29,286,10]],2.1);
  path([['moveTo',38,52],['bezierCurveTo',114,42,217,42,304,17]],1.2,.6);
  path([['moveTo',276,13],['lineTo',292,7],['lineTo',286,19]],2);
 }else{
  path([['moveTo',125,34],['bezierCurveTo',150,30,174,29,188,23],['lineTo',202,40],['lineTo',224,14],['lineTo',333,5]],2.5);
  path([['moveTo',28,52],['bezierCurveTo',82,42,146,43,177,37]],1,.5);
  path([['moveTo',226,16],['lineTo',319,10]],.85,.4);
 }
 c.restore();
}
