import{initializeApp}from"https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import{getDatabase,ref,set,onValue,remove,get,update,push}from"https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
const app=initializeApp({apiKey:"AIzaSyBwooreBGBy9WcLylZL8IZJabmoGLjqqf8",authDomain:"stikman-a8811.firebaseapp.com",projectId:"stikman-a8811",storageBucket:"stikman-a8811.firebasestorage.app",messagingSenderId:"287593112770",appId:"1:287593112770:web:53eb52732c8f3a483d475b"});
const db=getDatabase(app);
let myUserId="",myUsername="";
const $=id=>document.getElementById(id);

// ===== SOUND FX (Web Audio API) =====
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let audioCtx=null;
function getAudioCtx(){if(!audioCtx)audioCtx=new AudioCtx();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}
document.addEventListener('click',function _ia(){getAudioCtx();document.removeEventListener('click',_ia);},{once:true});
document.addEventListener('touchstart',function _it(){getAudioCtx();document.removeEventListener('touchstart',_it);},{once:true});
const SFX={
diceTick(){const c=getAudioCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='square';o.frequency.setValueAtTime(800+Math.random()*400,c.currentTime);g.gain.setValueAtTime(0.08,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.05);o.start(c.currentTime);o.stop(c.currentTime+0.05);},
diceLand(){const c=getAudioCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(220,c.currentTime);o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15);g.gain.setValueAtTime(0.25,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.2);o.start(c.currentTime);o.stop(c.currentTime+0.2);const b=c.createBuffer(1,c.sampleRate*0.08,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const n=c.createBufferSource();n.buffer=b;const ng=c.createGain();n.connect(ng);ng.connect(c.destination);ng.gain.setValueAtTime(0.15,c.currentTime);n.start(c.currentTime);},
diceCrit(){const c=getAudioCtx();[523,659,784].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='triangle';o.frequency.setValueAtTime(f,c.currentTime+i*0.08);g.gain.setValueAtTime(0,c.currentTime+i*0.08);g.gain.linearRampToValueAtTime(0.12,c.currentTime+i*0.08+0.02);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.2);o.start(c.currentTime+i*0.08);o.stop(c.currentTime+i*0.08+0.25);});},
coinSound(){const c=getAudioCtx();[880,1100].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(f,c.currentTime+i*0.08);g.gain.setValueAtTime(0.1,c.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.15);o.start(c.currentTime+i*0.08);o.stop(c.currentTime+i*0.08+0.2);});},
badSound(){const c=getAudioCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sawtooth';o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+0.2);g.gain.setValueAtTime(0.1,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.25);o.start(c.currentTime);o.stop(c.currentTime+0.3);}
};

// BOARD TILES (32 tiles around the board)
const TILES=[
{id:0,name:"START",type:"corner",icon:"🏁"},
{id:1,name:"Medan",type:"prop",price:60,rent:6,group:"brown",color:"#8B4513"},
{id:2,name:"Chest",type:"chance",icon:"📦"},
{id:3,name:"Padang",type:"prop",price:80,rent:8,group:"brown",color:"#8B4513"},
{id:4,name:"TAX",type:"tax",amount:100,icon:"💰"},
{id:5,name:"Stasiun A",type:"prop",price:200,rent:25,group:"station",color:"#555"},
{id:6,name:"Semarang",type:"prop",price:100,rent:10,group:"cyan",color:"#00bcd4"},
{id:7,name:"Chance",type:"chance",icon:"❓"},
{id:8,name:"Solo",type:"prop",price:120,rent:12,group:"cyan",color:"#00bcd4"},
{id:9,name:"JAIL",type:"corner",icon:"🔒"},
{id:10,name:"Bandung",type:"prop",price:140,rent:14,group:"pink",color:"#e91e63"},
{id:11,name:"Listrik",type:"prop",price:150,rent:18,group:"util",color:"#fdd835"},
{id:12,name:"Bogor",type:"prop",price:160,rent:16,group:"pink",color:"#e91e63"},
{id:13,name:"Chest",type:"chance",icon:"📦"},
{id:14,name:"Stasiun B",type:"prop",price:200,rent:25,group:"station",color:"#555"},
{id:15,name:"Yogya",type:"prop",price:180,rent:18,group:"orange",color:"#ff9800"},
{id:16,name:"FREE",type:"corner",icon:"🅿️"},
{id:17,name:"Malang",type:"prop",price:200,rent:20,group:"orange",color:"#ff9800"},
{id:18,name:"Chance",type:"chance",icon:"❓"},
{id:19,name:"Denpasar",type:"prop",price:220,rent:22,group:"red",color:"#f44336"},
{id:20,name:"TAX",type:"tax",amount:150,icon:"💰"},
{id:21,name:"Makassar",type:"prop",price:240,rent:24,group:"red",color:"#f44336"},
{id:22,name:"Stasiun C",type:"prop",price:200,rent:25,group:"station",color:"#555"},
{id:23,name:"Air",type:"prop",price:150,rent:18,group:"util",color:"#42a5f5"},
{id:24,name:"Manado",type:"prop",price:260,rent:26,group:"green",color:"#4caf50"},
{id:25,name:"GO JAIL",type:"corner",icon:"🚔"},
{id:26,name:"Surabaya",type:"prop",price:300,rent:30,group:"blue",color:"#1565c0"},
{id:27,name:"Chance",type:"chance",icon:"❓"},
{id:28,name:"Balikpapan",type:"prop",price:280,rent:28,group:"green",color:"#4caf50"},
{id:29,name:"Stasiun D",type:"prop",price:200,rent:25,group:"station",color:"#555"},
{id:30,name:"Chest",type:"chance",icon:"📦"},
{id:31,name:"Jakarta",type:"prop",price:400,rent:50,group:"blue",color:"#1565c0"}
];

const CHANCES=[
"Dapat bonus! +$150","Bayar pajak perbaikan -$100","Maju 3 langkah!","Dapat warisan +$200",
"Bayar denda -$75","Gratis parkir +$100","Mundur 2 langkah!","Ulang tahun! Setiap pemain bayar $25",
"Bayar rumah sakit -$50","Dapat hadiah +$80","Kena tilang -$30","Dapat undian +$120"
];

const PCOLORS=["#4fc3f7","#ef5350","#66bb6a","#ce93d8"];
const PNAMES=["P1","P2","P3","P4"];

let currentRoom=null,roomRef=null,isHost=false,selectedCount=2,gameState=null,myPIndex=-1;
let isLoginMode=true, unsubRoom=null;

// ===== AUTH =====
$('btnToggleAuth').onclick=e=>{e.preventDefault();isLoginMode=!isLoginMode;
if(isLoginMode){$('authSubtitle').textContent="Login to your account";$('emailInput').style.display="none";$('btnSubmitAuth').textContent="LOGIN";$('authToggleText').textContent="Don't have an account?";$('btnToggleAuth').textContent="Register Here";}
else{$('authSubtitle').textContent="Create a new account";$('emailInput').style.display="block";$('btnSubmitAuth').textContent="REGISTER";$('authToggleText').textContent="Already have an account?";$('btnToggleAuth').textContent="Login Here";}};

$('btnSubmitAuth').onclick=async()=>{
const u=$('usernameInput').value.trim(),e=$('emailInput').value.trim(),p=$('passwordInput').value.trim();
if(!u)return alert("Enter username!");if(!p)return alert("Enter password!");
if(!isLoginMode&&!e)return alert("Enter email!");
myUserId=u.replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();
if(!myUserId)return alert("Invalid username!");
$('btnSubmitAuth').disabled=true;$('loginStatus').style.display='block';$('loginStatus').textContent='Checking...';
const snap=await get(ref(db,'usersAuth/'+myUserId));
if(isLoginMode){if(!snap.exists()){$('btnSubmitAuth').disabled=false;$('loginStatus').style.display='none';return alert("User not found!");}
if(snap.val().password!==btoa(p)){$('btnSubmitAuth').disabled=false;$('loginStatus').style.display='none';return alert("Wrong password!");}
myUsername=snap.val().username||u;}
else{if(snap.exists()){$('btnSubmitAuth').disabled=false;$('loginStatus').style.display='none';return alert("Username taken!");}
await set(ref(db,'usersAuth/'+myUserId),{email:e,username:u,password:btoa(p)});myUsername=u;}
$('loginStatus').textContent="Success!";
localStorage.setItem('gameSession',JSON.stringify({userId:myUserId,username:myUsername}));
showScreen('lobby');listenRooms();};

// ===== SCREENS =====
const screens={login:$('loginScreen'),lobby:$('lobbyScreen'),game:$('gameScreen'),end:$('endScreen')};
function showScreen(s){Object.values(screens).forEach(x=>x.classList.remove('active'));screens[s].classList.add('active');}

// ===== LOBBY =====
document.querySelectorAll('.player-count-btn').forEach(b=>{b.onclick=()=>{
document.querySelectorAll('.player-count-btn').forEach(x=>x.classList.remove('active'));
b.classList.add('active');selectedCount=+b.dataset.count;};});

$('btnCreateRoom').onclick=async()=>{
const roomId=myUserId+'_'+Date.now();
const roomData={host:myUserId,hostName:myUsername,maxPlayers:selectedCount,status:'waiting',
players:{[myUserId]:{name:myUsername,index:0,money:1500,pos:0,bankrupt:false,jailTurns:0}}};
await set(ref(db,'monopolyRooms/'+roomId),roomData);
joinRoom(roomId,true);};

function listenRooms(){
onValue(ref(db,'monopolyRooms'),(snap)=>{
const rooms=snap.val()||{};const list=$('roomList');list.innerHTML='';let count=0;
for(let rid in rooms){const r=rooms[rid];if(r.status!=='waiting')continue;
const pCount=Object.keys(r.players||{}).length;
if(pCount>=r.maxPlayers)continue;count++;
list.innerHTML+=`<div class="room-card"><div class="room-info"><div class="room-host">${r.hostName}'s Room</div><div class="room-detail">${pCount}/${r.maxPlayers} players</div></div><button class="room-join-btn" onclick="window._joinRoom('${rid}')">JOIN</button></div>`;}
if(!count)list.innerHTML='<div class="no-rooms">No rooms available. Create one!</div>';});}

window._joinRoom=async(rid)=>{
const snap=await get(ref(db,'monopolyRooms/'+rid));if(!snap.exists())return alert("Room gone!");
const r=snap.val();const pKeys=Object.keys(r.players||{});
if(pKeys.length>=r.maxPlayers)return alert("Room full!");
const idx=pKeys.length;
await update(ref(db,'monopolyRooms/'+rid+'/players/'+myUserId),{name:myUsername,index:idx,money:1500,pos:0,bankrupt:false,jailTurns:0});
joinRoom(rid,false);};

function joinRoom(rid,host){
currentRoom=rid;isHost=host;roomRef=ref(db,'monopolyRooms/'+rid);
$('createRoomSection').style.display='none';$('waitingRoomSection').style.display='block';
$('roomCode').textContent=rid.slice(-6).toUpperCase();
if(unsubRoom)unsubRoom();
unsubRoom=onValue(roomRef,(snap)=>{
const r=snap.val();if(!r){leaveRoom();return;}
if(r.status==='playing'){startGame(r);return;}
const pKeys=Object.keys(r.players||{});
let html='';for(let i=0;i<r.maxPlayers;i++){
const pk=pKeys[i];if(pk){const p=r.players[pk];
html+=`<div class="waiting-player-card filled"><div class="wp-name" style="color:${PCOLORS[i]}">${p.name}</div><div class="wp-status">${pk===r.host?'HOST':'READY'}</div></div>`;}
else html+=`<div class="waiting-player-card empty"><div class="wp-name">Waiting...</div><div class="wp-status">EMPTY</div></div>`;}
$('waitingPlayers').innerHTML=html;
$('btnStartGame').disabled=!(isHost&&pKeys.length>=2);});}

$('btnLeaveRoom').onclick=()=>leaveRoom();
async function leaveRoom(){
if(currentRoom){
if(isHost)await remove(ref(db,'monopolyRooms/'+currentRoom));
else await remove(ref(db,'monopolyRooms/'+currentRoom+'/players/'+myUserId));}
currentRoom=null;roomRef=null;isHost=false;if(unsubRoom){unsubRoom();unsubRoom=null;}
$('createRoomSection').style.display='block';$('waitingRoomSection').style.display='none';}

$('btnStartGame').onclick=async()=>{
if(!isHost||!currentRoom)return;
const snap=await get(ref(db,'monopolyRooms/'+currentRoom));const r=snap.val();
const pKeys=Object.keys(r.players);
const gs={status:'playing',turnIndex:0,turnPlayer:pKeys[0],properties:{},lastDice:[0,0]};
await update(ref(db,'monopolyRooms/'+currentRoom),gs);};

// ===== GAME =====
function startGame(r){
gameState=r;const pKeys=Object.keys(r.players);myPIndex=pKeys.indexOf(myUserId);
showScreen('game');buildBoard();renderGame(r);
if(unsubRoom)unsubRoom();
unsubRoom=onValue(roomRef,(snap)=>{const d=snap.val();if(!d)return;gameState=d;renderGame(d);});}

function buildBoard(){
const grid=$('boardGrid');grid.innerHTML='';
// Map 32 tiles onto 9x9 grid edges: top row(0-8), right col(9-15), bottom row(16-24 reversed), left col(25-31 reversed)
const positions=[];
// Top: tiles 0-8 → row0,col0-8
for(let c=0;c<9;c++)positions.push({r:0,c,tile:c});
// Right: tiles 9-15 → row1-7,col8
for(let r=1;r<8;r++)positions.push({r,c:8,tile:8+r});
// Bottom: tiles 16-24 → row8,col8-0
for(let c=8;c>=0;c--)positions.push({r:8,c,tile:16+(8-c)});
// Left: tiles 25-31 → row7-1,col0
for(let r=7;r>=1;r--)positions.push({r,c:0,tile:24+(8-r)});

const cellMap={};
positions.forEach(p=>{cellMap[p.r+'_'+p.c]=p.tile;});

for(let r=0;r<9;r++){for(let c=0;c<9;c++){
const div=document.createElement('div');
const key=r+'_'+c;
if(cellMap[key]!==undefined){
const t=TILES[cellMap[key]];div.className='board-cell'+(t.type==='corner'?' corner':'')+(t.type==='chance'?' chance':'')+(t.type==='tax'?' tax':'');
div.id='cell-'+t.id;
let inner='';
if(t.color)inner+=`<div class="cell-color-bar" style="background:${t.color}"></div>`;
if(t.icon)inner+=`<div style="font-size:.7rem">${t.icon}</div>`;
inner+=`<div class="cell-name">${t.name}</div>`;
if(t.price)inner+=`<div class="cell-price">$${t.price}</div>`;
div.innerHTML=inner;
}else{div.style.background='transparent';div.style.border='none';}
grid.appendChild(div);}}
}

function renderGame(r){
if(!r||!r.players)return;
const pKeys=Object.keys(r.players);
const currentTurn=r.turnPlayer;
const isMyTurn=currentTurn===myUserId;

// Turn indicator
$('turnIndicator').textContent=isMyTurn?'🎲 YOUR TURN':`⏳ ${r.players[currentTurn]?.name||'...'}'s TURN`;
$('turnIndicator').style.color=isMyTurn?'#f0c040':'#888';
$('btnRollDice').disabled=!isMyTurn;

// Dice
if(r.lastDice&&r.lastDice[0]>0){$('dice1').textContent=dieFace(r.lastDice[0]);$('dice2').textContent=dieFace(r.lastDice[1]);}

// Clear old tokens
document.querySelectorAll('.player-token').forEach(x=>x.remove());
document.querySelectorAll('.cell-owner-dot').forEach(x=>x.remove());

// Place tokens
pKeys.forEach((pk,i)=>{
const p=r.players[pk];if(p.bankrupt)return;
const cell=document.getElementById('cell-'+p.pos);if(!cell){return;}
const tok=document.createElement('div');tok.className='player-token p'+i;
if(r._walkingPlayer===pk)tok.classList.add('walking');
cell.appendChild(tok);});

// Owner dots + level stars
if(r.properties){for(let tid in r.properties){
const ownerVal=r.properties[tid];
let owner=ownerVal, level=1;
if(typeof ownerVal==='object'){owner=ownerVal.uid;level=ownerVal.level||1;}
const pi=pKeys.indexOf(owner);
const cell=document.getElementById('cell-'+tid);if(!cell||pi<0)continue;
const dot=document.createElement('div');dot.className='cell-owner-dot';dot.style.background=PCOLORS[pi];
cell.appendChild(dot);
if(level>1){
const lv=document.createElement('div');lv.className='cell-level'+(level===3?' lv3':' lv2');
lv.textContent='★'.repeat(level);cell.appendChild(lv);}
}}

// Players panel
let ph='';
pKeys.forEach((pk,i)=>{const p=r.players[pk];
const active=pk===currentTurn&&!p.bankrupt;
const propCount=r.properties?Object.values(r.properties).filter(x=>{const uid=typeof x==='object'?x.uid:x;return uid===pk;}).length:0;
ph+=`<div class="player-card ${active?'active-turn':''} ${p.bankrupt?'bankrupt':''}">
<div class="pc-header"><div class="pc-dot" style="background:${PCOLORS[i]}"></div><div class="pc-name">${p.name}${pk===myUserId?' (You)':''}</div></div>
<div class="pc-money">$${p.money}</div>
<div class="pc-props">${propCount} properties${p.jailTurns>0?' | 🔒 Jail('+p.jailTurns+')':''}</div></div>`;});
$('playersPanel').innerHTML=ph;

// Check winner
const alive=pKeys.filter(pk=>!r.players[pk].bankrupt);
if(alive.length<=1&&pKeys.length>1){
setTimeout(()=>{$('endTitle').textContent='🏆 '+r.players[alive[0]].name+' WINS!';
$('endMsg').textContent='Game over! The last player standing wins!';showScreen('end');},1500);}
}

function dieFace(n){return['','⚀','⚁','⚂','⚃','⚄','⚅'][n]||'🎲';}

// ===== ROLL DICE =====
$('btnRollDice').onclick=async()=>{
if(!gameState||gameState.turnPlayer!==myUserId)return;
$('btnRollDice').disabled=true;
const d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1;
const total=d1+d2;

// Animate
$('dice1').classList.add('rolling');$('dice2').classList.add('rolling');
let _tickIv=setInterval(()=>SFX.diceTick(),90);
await delay(700);
clearInterval(_tickIv);
$('dice1').classList.remove('rolling');$('dice2').classList.remove('rolling');
$('dice1').textContent=dieFace(d1);$('dice2').textContent=dieFace(d2);
SFX.diceLand();
if(d1===d2)SFX.diceCrit();
$('dice1').classList.add('settled');$('dice2').classList.add('settled');
setTimeout(()=>{$('dice1').classList.remove('settled');$('dice2').classList.remove('settled');},400);

const snap=await get(roomRef);const r=snap.val();if(!r)return;
const pKeys=Object.keys(r.players);const me=r.players[myUserId];

// Jail check
if(me.jailTurns>0){
if(d1===d2){me.jailTurns=0;addLog(`🔓 ${me.name} rolled doubles and escaped jail!`,'glog-system');}
else{me.jailTurns--;if(me.jailTurns<=0){me.jailTurns=0;addLog(`🔓 ${me.name} served jail time, free now!`,'glog-system');}
else{addLog(`🔒 ${me.name} still in jail (${me.jailTurns} turns left)`,'glog-system');
const ni=(r.turnIndex+1)%pKeys.length;let next=ni;
while(r.players[pKeys[next]]?.bankrupt&&next!==r.turnIndex){next=(next+1)%pKeys.length;}
await update(roomRef,{[`players/${myUserId}`]:me,lastDice:[d1,d2],turnIndex:next,turnPlayer:pKeys[next]});return;}}
}

// Move with walking animation
let oldPos=me.pos;
let newPos=(oldPos+total)%32;
if(newPos<oldPos)me.money+=200;

// Step-by-step walk
await update(roomRef,{_walkingPlayer:myUserId});
for(let step=1;step<=total;step++){
me.pos=(oldPos+step)%32;
await update(roomRef,{[`players/${myUserId}/pos`]:me.pos,lastDice:[d1,d2]});
await delay(150);}
await update(roomRef,{_walkingPlayer:null});

me.pos=newPos;
const tile=TILES[newPos];
addLog(`🎲 ${me.name} rolled ${d1}+${d2}=${total}, landed on ${tile.name}`,'glog-system');

await delay(200);
await handleTile(tile,me,r,pKeys);
};

async function handleTile(tile,me,r,pKeys){
if(tile.type==='corner'){
if(tile.id===25){me.pos=9;me.jailTurns=3;addLog(`🚔 ${me.name} goes to JAIL!`,'glog-system');
await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}
if(tile.id===0&&me.pos===0){}
await nextTurn(r,pKeys);return;}

if(tile.type==='tax'){me.money-=tile.amount;if(me.money<0){me.money=0;me.bankrupt=true;}
addLog(`💰 ${me.name} pays $${tile.amount} tax!`,'glog-tax');
await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}

if(tile.type==='chance'){
const ch=CHANCES[Math.floor(Math.random()*CHANCES.length)];
const m=ch.match(/[+-]\$(\d+)/);
if(ch.includes('Maju 3')){me.pos=(me.pos+3)%32;addLog(`❓ ${ch}`,'glog-chance');
await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}
if(ch.includes('Mundur 2')){me.pos=(me.pos-2+32)%32;addLog(`❓ ${ch}`,'glog-chance');
await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}
if(ch.includes('Setiap pemain')){
for(let pk of pKeys){if(pk===myUserId||r.players[pk].bankrupt)continue;
r.players[pk].money-=25;me.money+=25;await update(roomRef,{[`players/${pk}`]:r.players[pk]});}
addLog(`🎂 ${ch}`,'glog-chance');await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}
if(m){const amt=parseInt(m[1]);if(ch.includes('+'))me.money+=amt;else{me.money-=amt;if(me.money<0){me.money=0;me.bankrupt=true;}}
addLog(`❓ ${ch}`,'glog-chance');}
await update(roomRef,{[`players/${myUserId}`]:me});await nextTurn(r,pKeys);return;}

if(tile.type==='prop'){
const propData=(r.properties||{})[tile.id];
let owner=null,level=1;
if(propData){if(typeof propData==='object'){owner=propData.uid;level=propData.level||1;}else{owner=propData;level=1;}}

if(!owner){
const buy=await showBuyModal(tile);
if(buy&&me.money>=tile.price){me.money-=tile.price;
SFX.coinSound();
await update(roomRef,{[`players/${myUserId}`]:me,[`properties/${tile.id}`]:{uid:myUserId,level:1}});
addLog(`🏠 ${me.name} bought ${tile.name} for $${tile.price}!`,'glog-buy');}
else addLog(`⏭️ ${me.name} skipped ${tile.name}`,'glog-system');
}else if(owner!==myUserId){
// Pay rent (multiplied by level)
const ownerData=r.players[owner];
const sameGroup=Object.entries(r.properties||{}).filter(([tid,o])=>{
const oUid=typeof o==='object'?o.uid:o;
return oUid===owner&&TILES[tid].group===tile.group;}).length;
const LEVEL_MULT=[0,1,2.5,5];
let rent=Math.round(tile.rent*Math.max(1,sameGroup)*LEVEL_MULT[level]);
me.money-=rent;if(me.money<0){me.money=0;me.bankrupt=true;}
ownerData.money+=rent;
SFX.badSound();
addLog(`💸 ${me.name} pays $${rent} rent to ${ownerData.name} for ${tile.name} (Lv${level})!`,'glog-rent');
await update(roomRef,{[`players/${myUserId}`]:me,[`players/${owner}`]:ownerData});
showInfoModal(`Rent Paid!`,`You paid $${rent} to ${ownerData.name} for ${tile.name} (Level ${level})`);}
else{
// Own property — offer upgrade
if(level<3){
const upgCost=Math.round(tile.price*(level===1?0.5:0.75));
const doUpg=await showUpgradeModal(tile,level,upgCost);
if(doUpg&&me.money>=upgCost){me.money-=upgCost;
SFX.coinSound();
await update(roomRef,{[`players/${myUserId}`]:me,[`properties/${tile.id}`]:{uid:myUserId,level:level+1}});
addLog(`⬆️ ${me.name} upgraded ${tile.name} to Level ${level+1}!`,'glog-buy');}
else addLog(`🏡 ${me.name} is home at ${tile.name} (Lv${level})`,'glog-system');}
else addLog(`🏡 ${me.name} is home at ${tile.name} (MAX Lv3)`,'glog-system');}
await nextTurn(r,pKeys);}
}

async function nextTurn(r,pKeys){
const ni=(r.turnIndex+1)%pKeys.length;let next=ni;
let loops=0;
while(r.players[pKeys[next]]?.bankrupt){next=(next+1)%pKeys.length;loops++;if(loops>pKeys.length)break;}
await update(roomRef,{turnIndex:next,turnPlayer:pKeys[next]});}

// ===== MODALS =====
function showBuyModal(tile){return new Promise(res=>{
$('buyModalTitle').textContent=`Buy ${tile.name}?`;
$('buyModalDesc').textContent=`Price: $${tile.price} | Base Rent: $${tile.rent}`;
$('buyModal').classList.add('show');
$('btnBuyYes').onclick=()=>{$('buyModal').classList.remove('show');res(true);};
$('btnBuyNo').onclick=()=>{$('buyModal').classList.remove('show');res(false);};});}

function showUpgradeModal(tile,curLv,cost){return new Promise(res=>{
$('buyModalTitle').textContent=`⬆️ Upgrade ${tile.name}?`;
const LEVEL_MULT=[0,1,2.5,5];
const newRent=Math.round(tile.rent*LEVEL_MULT[curLv+1]);
$('buyModalDesc').textContent=`Level ${curLv} → ${curLv+1} | Cost: $${cost} | New Rent: $${newRent}`;
$('buyModal').classList.add('show');
$('btnBuyYes').onclick=()=>{$('buyModal').classList.remove('show');res(true);};
$('btnBuyNo').onclick=()=>{$('buyModal').classList.remove('show');res(false);};});}

function showInfoModal(title,desc){
$('infoModalTitle').textContent=title;$('infoModalDesc').textContent=desc;
$('infoModal').classList.add('show');
$('btnInfoOk').onclick=()=>$('infoModal').classList.remove('show');}

function addLog(msg,cls='glog-system'){
const d=document.createElement('div');d.className='glog '+cls;d.innerHTML=msg;
$('gameLog').appendChild(d);$('gameLog').scrollTop=$('gameLog').scrollHeight;}

function delay(ms){return new Promise(r=>setTimeout(r,ms));}

function showToast(msg){$('mToastMsg').textContent=msg;$('mToast').style.display='block';
setTimeout(()=>$('mToast').style.display='none',3000);}

$('btnBackToLobby').onclick=()=>{showScreen('lobby');listenRooms();
$('createRoomSection').style.display='block';$('waitingRoomSection').style.display='none';};

$('btnLogout').onclick=()=>{
localStorage.removeItem('gameSession');
myUserId='';myUsername='';
showScreen('login');
};

// Init — check for existing session from Stickman or previous Monopoly login
(async function initApp(){
const saved=localStorage.getItem('gameSession');
if(saved){try{const s=JSON.parse(saved);
if(s.userId&&s.username){myUserId=s.userId;myUsername=s.username;showScreen('lobby');listenRooms();return;}
}catch(e){}}
showScreen('login');})();
