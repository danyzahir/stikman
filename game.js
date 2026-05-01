import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, remove, push, get, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwooreBGBy9WcLylZL8IZJabmoGLjqqf8",
  authDomain: "stikman-a8811.firebaseapp.com",
  projectId: "stikman-a8811",
  storageBucket: "stikman-a8811.firebasestorage.app",
  messagingSenderId: "287593112770",
  appId: "1:287593112770:web:53eb52732c8f3a483d475b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let myUserId = ""; // Will be set after login

// ========== PERSISTENT META STATE ==========
const defaultMeta = {
  username: '', coins: 0, level: 1, exp: 0, expToNext: 100,
  ownedChars: [0], selectedChar: 0
};
let META = { ...defaultMeta };

function saveData() {
  if(myUserId) {
    set(ref(db, 'playerData/' + myUserId), META);
  }
}

let myCurrentStatus = 'idle';

function setMyStatus(status) {
  myCurrentStatus = status;
  if(myUserId) {
    set(ref(db, 'users/' + myUserId), { username: META.username, level: META.level, lastActive: Date.now(), status: myCurrentStatus });
  }
}

// Presence logic wrapped to be called after login
function initFirebasePresence() {
  const myUserRef = ref(db, 'users/' + myUserId);
  const connectedRef = ref(db, '.info/connected');
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(myUserRef).remove();
      set(myUserRef, { username: META.username, level: META.level, lastActive: Date.now(), status: myCurrentStatus });
    }
  });

  setInterval(() => {
    set(myUserRef, { username: META.username, level: META.level, lastActive: Date.now(), status: myCurrentStatus });
  }, 10000);
}

function showToast(msg, isError = false) {
  const t = $('customToast');
  $('toastIcon').textContent = isError ? '❌' : '✅';
  t.style.borderLeftColor = isError ? '#ef5350' : '#f0c040';
  $('toastMsg').innerHTML = msg;
  t.style.display = 'flex';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// ========== CHARACTERS ==========
const CHARS = [
  { id:0, name:'Knight',    cost:0,   hp:100, atk:18, def:5,  potions:3, color:'#4fc3f7', tag:'BALANCED', tagCls:'tag-balanced', desc:'Balanced warrior. Good all-rounder.',
    svg:`<svg viewBox="0 0 64 110" fill="none" width="54" height="90"><circle cx="32" cy="14" r="12" stroke="#4fc3f7" stroke-width="2.5" fill="#1a2a3a"/><circle cx="27" cy="12" r="2" fill="#4fc3f7"/><circle cx="37" cy="12" r="2" fill="#4fc3f7"/><path d="M26 18 Q32 23 38 18" stroke="#4fc3f7" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="32" y1="26" x2="32" y2="68" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="10" y2="54" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="54" y2="34" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="34" x2="60" y2="14" stroke="#f0c040" stroke-width="3.5" stroke-linecap="round"/><line x1="50" y1="27" x2="62" y2="30" stroke="#f0c040" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="68" x2="16" y2="102" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="68" x2="48" y2="102" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id:1, name:'Berserker', cost:80,  hp:80,  atk:30, def:2,  potions:2, color:'#ef5350', tag:'ATTACK',   tagCls:'tag-attack',   desc:'Reckless fighter. Massive ATK, very fragile.',
    svg:`<svg viewBox="0 0 64 110" fill="none" width="54" height="90"><circle cx="32" cy="14" r="12" stroke="#ef5350" stroke-width="2.5" fill="#2a1010"/><path d="M24 10 L30 13" stroke="#ef5350" stroke-width="2" stroke-linecap="round"/><path d="M34 10 L40 13" stroke="#ef5350" stroke-width="2" stroke-linecap="round"/><path d="M26 20 Q32 16 38 20" stroke="#ef5350" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="22" y1="4" x2="18" y2="-2" stroke="#ef5350" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="4" x2="46" y2="-2" stroke="#ef5350" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="26" x2="32" y2="68" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="8" y2="32" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="56" y2="32" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="4" cy="30" rx="6" ry="4" stroke="#ef5350" stroke-width="2" fill="#2a1010"/><ellipse cx="60" cy="30" rx="6" ry="4" stroke="#ef5350" stroke-width="2" fill="#2a1010"/><line x1="32" y1="68" x2="16" y2="102" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="68" x2="48" y2="102" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id:2, name:'Guardian',  cost:100, hp:140, atk:12, def:14, potions:3, color:'#66bb6a', tag:'TANK',     tagCls:'tag-tank',     desc:'Defensive tank. Hard to kill, low damage.',
    svg:`<svg viewBox="0 0 64 110" fill="none" width="54" height="90"><circle cx="32" cy="14" r="12" stroke="#66bb6a" stroke-width="2.5" fill="#102010"/><circle cx="27" cy="12" r="2" fill="#66bb6a"/><circle cx="37" cy="12" r="2" fill="#66bb6a"/><line x1="32" y1="26" x2="32" y2="68" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="10" y2="54" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="54" y2="40" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/><path d="M46 28 C46 28 58 32 58 42 C58 52 46 56 46 56 C46 56 34 52 34 42 C34 32 46 28 46 28Z" stroke="#66bb6a" stroke-width="2" fill="#10200f"/><path d="M40 42 l3 3 6-6" stroke="#66bb6a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="32" y1="68" x2="16" y2="102" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="68" x2="48" y2="102" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id:3, name:'Assassin',  cost:150, hp:70,  atk:38, def:1,  potions:2, color:'#ce93d8', tag:'BURST',    tagCls:'tag-burst',    desc:'Glass cannon. Extreme damage but very low HP.',
    svg:`<svg viewBox="0 0 64 110" fill="none" width="54" height="90"><circle cx="32" cy="14" r="12" stroke="#ce93d8" stroke-width="2.5" fill="#1a102a"/><circle cx="27" cy="12" r="2" fill="#ce93d8"/><circle cx="37" cy="12" r="2" fill="#ce93d8"/><rect x="22" y="2" width="20" height="6" rx="3" stroke="#ce93d8" stroke-width="1.5" fill="#1a102a"/><line x1="32" y1="26" x2="32" y2="68" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="8" y2="50" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="56" y2="30" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/><line x1="4" y1="52" x2="4" y2="38" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/><line x1="56" y1="30" x2="62" y2="14" stroke="#ce93d8" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="68" x2="16" y2="102" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="68" x2="48" y2="102" stroke="#ce93d8" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id:4, name:'Paladin',   cost:220, hp:120, atk:22, def:10, potions:4, color:'#ffd54f', tag:'PREMIUM',  tagCls:'tag-premium',  desc:'Holy knight. Well-rounded elite warrior.',
    svg:`<svg viewBox="0 0 64 110" fill="none" width="54" height="90"><circle cx="32" cy="14" r="12" stroke="#ffd54f" stroke-width="2.5" fill="#1a1800"/><circle cx="27" cy="12" r="2" fill="#ffd54f"/><circle cx="37" cy="12" r="2" fill="#ffd54f"/><circle cx="32" cy="2" r="6" stroke="#ffd54f" stroke-width="1.5" fill="none"/><line x1="32" y1="-4" x2="32" y2="8" stroke="#ffd54f" stroke-width="1.5"/><line x1="26" y1="2" x2="38" y2="2" stroke="#ffd54f" stroke-width="1.5"/><line x1="32" y1="26" x2="32" y2="68" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="10" y2="54" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="40" x2="54" y2="34" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="34" x2="60" y2="10" stroke="#ffd54f" stroke-width="3.5" stroke-linecap="round"/><line x1="50" y1="24" x2="62" y2="27" stroke="#ffd54f" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="68" x2="16" y2="102" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="68" x2="48" y2="102" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round"/></svg>` }
];

const allUsersRef = ref(db, 'users');
const challengesRef = ref(db, 'challenges');

let onlinePlayers = {};
onValue(allUsersRef, (snap) => {
  onlinePlayers = snap.val() || {};
  renderOnlineLobby();
});

function renderOnlineLobby() {
  const list = $('onlineList');
  if(!list) return;
  list.innerHTML = '';
  let count = 0;
  const now = Date.now();
  for(let uid in onlinePlayers) {
    if(uid === myUserId) continue;
    const p = onlinePlayers[uid];
    if(now - p.lastActive > 20000) continue; // Skip if inactive for 20s
    count++;
    
    let btnHtml = '';
    if (p.status === 'duel') {
      btnHtml = `<button style="background:#555; color:#aaa; border:none; padding:6px 12px; border-radius:6px; cursor:not-allowed; font-weight:bold" disabled>Sedang Duel</button>`;
    } else {
      btnHtml = `<button style="background:linear-gradient(90deg, #c62828, #ef5350); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; box-shadow:0 2px 10px #ef535060" onclick="sendChallenge('${uid}', '${p.username}')">⚔️ Challenge</button>`;
    }

    list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a2e; padding:12px; border-radius:12px; border:1px solid #ffffff15">
      <div>
        <div style="color:#fff; font-weight:bold; font-size:1.1rem">${p.username}</div>
        <div style="color:#888; font-size:0.85rem">Level ${p.level} <span style="margin-left:5px; color:${p.status==='duel'?'#ef5350':'#66bb6a'}">• ${p.status==='duel'?'In Battle':'Idle'}</span></div>
      </div>
      ${btnHtml}
    </div>`;
  }
  if(count === 0) list.innerHTML = `<div style="color:#888; text-align:center; margin-top:20px">No one is online.</div>`;
}

// Challenge System
let currentChallengeId = null;

window.sendChallenge = function(targetUid, targetName) {
  const challengeId = myUserId + "_" + Date.now();
  currentChallengeId = challengeId;
  set(ref(db, 'challenges/' + challengeId), {
    from: myUserId,
    fromName: META.username,
    to: targetUid,
    status: 'pending'
  });
  
  $('waitingText').innerHTML = `Waiting for <b>${targetName}</b> to accept...`;
  $('waitingModal').style.display = 'flex';
  
  $('btnCancelChallenge').onclick = () => {
    remove(ref(db, 'challenges/' + challengeId));
    $('waitingModal').style.display = 'none';
    currentChallengeId = null;
    showToast("Challenge cancelled.");
  };
}

onValue(challengesRef, (snap) => {
  const challenges = snap.val() || {};
  for(let cid in challenges) {
    const ch = challenges[cid];
    // Incoming challenge
    if(ch.to === myUserId && ch.status === 'pending' && myCurrentStatus === 'idle') {
      currentChallengeId = cid;
      $('challengeText').innerHTML = `<b>${ch.fromName}</b> has challenged you to a battle!`;
      $('challengeModal').style.display = 'flex';
      
      // Setup buttons
      $('btnAcceptChallenge').onclick = () => {
        set(ref(db, 'challenges/' + cid + '/status'), 'accepted');
        $('challengeModal').style.display = 'none';
        startPvp(cid, ch.from, false); // false = not host
      };
      $('btnDeclineChallenge').onclick = () => {
        set(ref(db, 'challenges/' + cid + '/status'), 'declined');
        $('challengeModal').style.display = 'none';
        currentChallengeId = null;
      };
    }
    // I sent a challenge and it was accepted
    if(ch.from === myUserId && ch.status === 'accepted' && currentChallengeId === cid) {
      $('waitingModal').style.display = 'none';
      startPvp(cid, ch.to, true); // true = host
      currentChallengeId = null;
    }
    // I sent a challenge and it was declined
    if(ch.from === myUserId && ch.status === 'declined' && currentChallengeId === cid) {
      $('waitingModal').style.display = 'none';
      showToast(`Challenge declined by opponent.`, true);
      remove(ref(db, 'challenges/' + cid));
      currentChallengeId = null;
    }
  }
});

let currentBattleId = null;
let isPvpHost = false;
let myPlayerKey = null; // 'p1' or 'p2'
let oppPlayerKey = null; // 'p2' or 'p1'
let battleRef = null;
let lastProcessedAction = null;

function startPvp(battleId, opponentUid, isHost) {
  currentBattleId = battleId;
  isPvpHost = isHost;
  myPlayerKey = isHost ? 'p1' : 'p2';
  oppPlayerKey = isHost ? 'p2' : 'p1';
  battleRef = ref(db, 'battles/' + battleId);
  lastProcessedAction = null;
  setMyStatus('duel');

  const myChar = CHARS.find(c => c.id === META.selectedChar) || CHARS[0];

  if (isHost) {
    update(battleRef, {
      round: 1,
      turn: 'p1',
      p1: { uid: myUserId, name: META.username, charId: myChar.id, hp: myChar.hp, maxHp: myChar.hp, atk: myChar.atk, def: myChar.def, potions: myChar.potions, defending: false }
    }).catch(err => showToast("Firebase Error: " + err.message, true));
  } else {
    update(battleRef, {
      p2: { uid: myUserId, name: META.username, charId: myChar.id, hp: myChar.hp, maxHp: myChar.hp, atk: myChar.atk, def: myChar.def, potions: myChar.potions, defending: false }
    }).catch(err => showToast("Firebase Error: " + err.message, true));
  }

  onValue(battleRef, (snap) => {
    const b = snap.val();
    if (!b) return;
    updatePvpUI(b);
  });
  
  showScreen('game');
  clearLog();
  $('btnShop').style.display = 'none';
  log("⚔️ PVP BATTLE STARTED! Awaiting opponent...", 'log-system');
  setButtons(true);
  $('btnSurrender').disabled = false;
}

async function updatePvpUI(b) {
  const myState = b[myPlayerKey];
  const oppState = b[oppPlayerKey];
  
  if(!myState || !oppState) return; // Wait until BOTH players have written their stats

  // Init SVG on first frame
  if(b.round === 1 && !lastProcessedAction) {
    const mC = CHARS.find(x => x.id === myState.charId) || CHARS[0];
    const oC = CHARS.find(x => x.id === oppState.charId) || CHARS[0];
    $('playerSvgWrap').innerHTML = mC.svg;
    $('enemySvgWrap').innerHTML = oC.svg;
    $('playerFighter').classList.add('idle-anim');
    $('enemyFighter').classList.add('idle-anim');
    $('playerName').textContent = myState.name;
    $('enemyName').textContent = oppState.name;
    log(`PVP MATCH: <b>${myState.name}</b> vs <b>${oppState.name}</b>`, 'log-system');
    lastProcessedAction = 'started';
  }

  // Update Stats
  $('pHp').textContent = `${myState.hp} / ${myState.maxHp}`;
  $('pAtk').textContent = myState.atk;
  $('pDef').textContent = myState.def;
  $('pPot').textContent = myState.potions;
  $('pHpBar').style.width = Math.max(0, myState.hp/myState.maxHp*100) + '%';
  $('pHpBar').style.background = hpColor(myState.hp, myState.maxHp);

  $('eHpText').textContent = `${oppState.hp} / ${oppState.maxHp}`;
  $('eAtk').textContent = oppState.atk;
  $('eDef').textContent = oppState.def;
  $('eHpBar').style.width = Math.max(0, oppState.hp/oppState.maxHp*100) + '%';
  $('eHpBar').style.background = hpColor(oppState.hp, oppState.maxHp);

  // Play animation if new action
  if(b.lastAction && b.lastAction.id !== lastProcessedAction && lastProcessedAction !== 'started') {
    lastProcessedAction = b.lastAction.id;
    await playPvpAnimation(b.lastAction);
  }

  if(b.lastAction && b.lastAction.id !== lastProcessedAction && lastProcessedAction === 'started') {
      lastProcessedAction = b.lastAction.id;
  }

  // Check Win/Loss
  if (myState.hp <= 0 || oppState.hp <= 0) {
    setButtons(true);
    setTimeout(() => {
      showScreen('end');
      $('btnToMeta').style.display = 'block';
      if(myState.hp <= 0 && oppState.hp <= 0) {
        $('endTitle').textContent = 'DRAW';
        $('endMsg').textContent = `Both players died.`;
      }
      else if(myState.hp <= 0) {
        $('endTitle').textContent = 'DEFEAT';
        $('endTitle').className = 'defeat';
        $('endMsg').textContent = `You were defeated by ${oppState.name}.`;
      } else {
        $('endTitle').textContent = 'VICTORY';
        $('endTitle').className = 'victory';
        $('endMsg').textContent = `You defeated ${oppState.name}!`;
      }
      currentBattleId = null;
      setMyStatus('idle');
      if(isPvpHost) remove(battleRef);
    }, 2000);
    return;
  }

  // Toggle buttons
  if(b.turn === myPlayerKey) setButtons(false);
  else setButtons(true);
}

async function playPvpAnimation(act) {
  const isMe = act.by === myPlayerKey;
  const attackerDiv = isMe ? $('playerFighter') : $('enemyFighter');
  const defenderDiv = isMe ? $('enemyFighter') : $('playerFighter');
  const popupX = isMe ? 520 : 120;
  const healX = isMe ? 120 : 520;
  
  if(act.type === 'attack') {
    const roll = act.roll || 1;
    const rollColorClass = roll >= 5 ? 'dice-crit' : roll >= 3 ? 'dice-ok' : 'dice-weak';
    showDice(isMe ? 'player' : 'enemy', roll, DICE_LABEL[roll], rollColorClass);
    await animateDice(isMe ? 'playerDice' : 'enemyDice', roll);
    await delay(200);

    attackerDiv.classList.add(isMe ? 'player-attack-anim' : 'enemy-attack-anim');
    await delay(200);
    
    if (act.dmg > 0) defenderDiv.classList.add('hit-anim');
    
    if (act.blockedDmg > 0) {
      if (act.dmg === 0) {
        log(`[PVP] 🎲 <b>${act.byName}</b> rolled <b>${roll}</b>! Defender <b class="dmg-blue">COMPLETELY BLOCKED</b> the attack!`, 'log-system');
        showPopup('BLOCKED!', popupX, 'dmg-blue');
      } else {
        log(`[PVP] 🎲 <b>${act.byName}</b> rolled <b>${roll}</b>! Shield blocked ${act.blockedDmg}, took <b class="dmg-red">${act.dmg} DMG</b>!`, 'log-system');
        showPopup(`-${act.dmg}`, popupX, 'dmg-red');
      }
    } else {
      log(`[PVP] 🎲 <b>${act.byName}</b> rolled <b>${roll}</b>! Attacked for <b class="${act.crit?'dmg-red':''}">${act.dmg} DMG</b>!`, isMe ? 'log-player' : 'log-enemy');
      showPopup(`-${act.dmg}`, popupX, 'dmg-red');
    }
    
    await delay(300);
    attackerDiv.classList.remove('player-attack-anim', 'enemy-attack-anim');
    defenderDiv.classList.remove('hit-anim');
    hideDice();
  } else if (act.type === 'defend') {
    const roll = act.roll || 1;
    const rollColorClass = roll >= 5 ? 'dice-crit' : roll >= 3 ? 'dice-ok' : 'dice-weak';
    showDice(isMe ? 'player' : 'enemy', roll, DICE_LABEL[roll], rollColorClass + ' dice-defend');
    await animateDice(isMe ? 'playerDice' : 'enemyDice', roll);
    await delay(200);

    attackerDiv.classList.add('defend-anim');
    log(`[PVP] 🎲 <b>${act.byName}</b> rolled <b>${roll}</b> to DEFEND!`, 'log-defend');
    await delay(400);
    attackerDiv.classList.remove('defend-anim');
    hideDice();
  } else if (act.type === 'heal') {
    attackerDiv.classList.add('heal-anim');
    showPopup(`+${act.dmg}`, healX, 'dmg-green');
    log(`[PVP] 💊 <b>${act.byName}</b> used a potion! (+${act.dmg} HP)`, 'log-heal');
    await delay(400);
    attackerDiv.classList.remove('heal-anim');
  } else if (act.type === 'surrender') {
    log(`[PVP] 🏳️ <b>${act.byName}</b> has surrendered the match!`, 'log-system');
    await delay(400);
  }
}

async function doPvpAction(type) {
  setButtons(true);
  const snap = await get(battleRef);
  const b = snap.val();
  const myState = b[myPlayerKey];
  const oppState = b[oppPlayerKey];
  
  let dmg = 0;
  let crit = false;
  let roll = 0;
  let blockedDmg = 0;

  if (type === 'attack') {
    myState.defending = false;
    roll = rollDice();
    const mult = DICE_MULT[roll];
    crit = roll >= 5;
    
    let baseDmg = Math.max(1, myState.atk - oppState.def);
    let rawDmg = Math.max(1, Math.round(baseDmg * mult));
    
    if (oppState.defending && oppState.defendRoll) {
      const blockPct = BLOCK_PCT[oppState.defendRoll];
      blockedDmg = Math.round(rawDmg * blockPct);
      dmg = Math.max(0, rawDmg - blockedDmg);
      oppState.defending = false;
      oppState.defendRoll = 0;
    } else {
      dmg = rawDmg;
    }
    oppState.hp = Math.max(0, oppState.hp - dmg);
  } else if (type === 'defend') {
    roll = rollDice();
    myState.defending = true;
    myState.defendRoll = roll;
  } else if (type === 'heal') {
    myState.defending = false;
    if(myState.potions <= 0) {
      alert("No potions left!");
      setButtons(false);
      return;
    }
    myState.potions--;
    dmg = 40;
    myState.hp = Math.min(myState.maxHp, myState.hp + dmg);
  }

  const updates = {};
  updates[myPlayerKey] = myState;
  updates[oppPlayerKey] = oppState;
  updates.turn = oppPlayerKey;
  updates.lastAction = {
    id: Date.now(),
    by: myPlayerKey,
    byName: myState.name,
    type: type,
    dmg: dmg,
    crit: crit,
    roll: roll,
    blockedDmg: blockedDmg
  };

  await set(battleRef, { ...b, ...updates });
}

function doSurrender() {
  if (G.busy || (!currentBattleId && !G.playerTurn)) return;
  $('surrenderModal').style.display = 'flex';
}

async function confirmSurrender() {
  $('surrenderModal').style.display = 'none';
  $('btnSurrender').disabled = true;
  setButtons(true);
  G.busy = true;
  
  if (currentBattleId) {
    // PVP surrender
    const snap = await get(battleRef);
    const b = snap.val();
    if (!b) return;
    const myState = b[myPlayerKey];
    myState.hp = 0; // kill self
    
    const updates = {};
    updates[myPlayerKey] = myState;
    updates.lastAction = {
      id: Date.now(),
      by: myPlayerKey,
      byName: myState.name,
      type: 'surrender',
      dmg: 0,
      crit: false,
      roll: 1,
      blockedDmg: 0
    };
    await set(battleRef, { ...b, ...updates });
  } else {
    // Offline surrender
    log(`🏃 🏳️ <b>You</b> fled from the battle!`, 'log-system');
    await delay(500);
    gameOver();
  }
}

$('btnCancelSurrender').onclick = () => {
  $('surrenderModal').style.display = 'none';
};
$('btnConfirmSurrender').onclick = confirmSurrender;

// ========== GAME STATE ==========
const G = {
  round: 1, maxRound: 10, coins: 0,
  playerTurn: true, defending: false, busy: false,
  player: { hp: 100, maxHp: 100, atk: 18, def: 5, potions: 3 },
  enemy: null,
  shop: { weapons:[{n:'Iron Sword',d:'+8 ATK',cost:20,atk:8},{n:'Steel Blade',d:'+16 ATK',cost:45,atk:16},{n:'Dragon Fang',d:'+28 ATK',cost:90,atk:28}], armors:[{n:'Leather Armor',d:'+5 DEF',cost:18,def:5},{n:'Iron Mail',d:'+12 DEF',cost:40,def:12},{n:'Dragon Scale',d:'+22 DEF',cost:80,def:22}], potions:{n:'Potion x3',d:'Heal 40 HP each',cost:15,amt:3} }
};

function spawnEnemy(round) {
  const names = ['Shadow Rogue','Dark Knight','Bone Crusher','Blood Mage','Death Stalker','Warlord','Chaos Beast','Dragon Lich','Dark Titan','Void Emperor'];
  const base = 40 + round * 22;
  const atk = 8 + round * 5;
  const def = round * 2;
  return { name: names[round-1]||'Enemy', hp: base, maxHp: base, atk, def };
}

// ========== DOM ==========
function $(id) { return document.getElementById(id); }
const screens = { login: $('loginScreen'), start: $('startScreen'), meta: $('metaScreen'), game: $('gameScreen'), end: $('endScreen') };

function showScreen(s) {
  Object.values(screens).forEach(sc => sc.classList.remove('active'));
  screens[s].classList.add('active');
}

// ========== RENDER ==========
function renderAll() {
  const p = G.player, e = G.enemy;
  // Header
  $('roundInfo').textContent = `ROUND ${G.round} / ${G.maxRound}`;
  $('coinAmount').textContent = G.coins;
  const expPct = Math.min(100, META.exp / META.expToNext * 100);
  $('expMiniBar').style.width = expPct + '%';
  $('gameLevelNum').textContent = META.level;
  // Player status
  $('pHp').textContent = `${p.hp} / ${p.maxHp}`;
  $('pAtk').textContent = p.atk;
  $('pDef').textContent = p.def;
  $('pPot').textContent = p.potions;
  $('pHpBar').style.width = Math.max(0, p.hp/p.maxHp*100) + '%';
  $('pHpBar').style.background = hpColor(p.hp, p.maxHp);
  // Enemy status
  if (e) {
    $('enemyName').textContent = e.name;
    $('eHpText').textContent = `${e.hp} / ${e.maxHp}`;
    $('eAtk').textContent = e.atk;
    $('eDef').textContent = e.def;
    $('eHpBar').style.width = Math.max(0, e.hp/e.maxHp*100) + '%';
    $('eHpBar').style.background = hpColor(e.hp, e.maxHp);
    $('eHpBarSmall').style.width = Math.max(0, e.hp/e.maxHp*100) + '%';
    $('eHpBarSmall').style.background = hpColor(e.hp, e.maxHp);
    $('pHpBarSmall').style.width = Math.max(0, p.hp/p.maxHp*100) + '%';
    $('pHpBarSmall').style.background = hpColor(p.hp, p.maxHp);
  }
  // Buttons
  const potEl = $('btnHeal').querySelector('.pot-count');
  if (potEl) potEl.textContent = `(${p.potions})`;
  $('btnHeal').disabled = p.potions <= 0 || G.busy;
  $('btnAttack').disabled = G.busy;
  $('btnDefend').disabled = G.busy;
  // Defend indicator
  if (G.defending) $('defendIndicator').classList.add('visible');
  else $('defendIndicator').classList.remove('visible');
}

function hpColor(hp, max) {
  const pct = hp/max;
  if (pct > .6) return 'linear-gradient(90deg,#43a047,#66bb6a)';
  if (pct > .3) return 'linear-gradient(90deg,#f9a825,#fdd835)';
  return 'linear-gradient(90deg,#c62828,#ef5350)';
}

// ========== LOG ==========
function log(msg, cls='log-system') {
  const el = document.createElement('div');
  el.className = 'log-msg ' + cls;
  el.innerHTML = msg;
  $('logSection').appendChild(el);
  $('logSection').scrollTop = $('logSection').scrollHeight;
}

function clearLog() { $('logSection').innerHTML = ''; }

// ========== DAMAGE POPUP ==========
function showPopup(text, x, cls) {
  const pop = document.createElement('div');
  pop.className = 'dmg-popup ' + cls;
  pop.textContent = text;
  pop.style.left = x + 'px';
  pop.style.top = '30px';
  $('arena').appendChild(pop);
  setTimeout(() => pop.remove(), 800);
}

// ========== ANIMATIONS ==========
function animFighter(id, cls, ms=400) {
  return new Promise(res => {
    const el = $(id);
    el.classList.remove('idle-anim');
    el.classList.add(cls);
    setTimeout(() => { el.classList.remove(cls); el.classList.add('idle-anim'); res(); }, ms);
  });
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

// ========== DICE SYSTEM ==========
// Multipliers per roll: 1=weak, 6=devastating
const DICE_MULT = [0, 0.35, 0.6, 0.85, 1.15, 1.5, 2.0];
// Block % per roll when defending: 1=weak block, 6=perfect
const BLOCK_PCT = [0, 0.20, 0.38, 0.55, 0.72, 0.85, 0.95];
const DICE_LABEL = ['','WEAK','POOR','OKAY','GOOD','GREAT','CRITICAL'];
const DICE_FACE = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

function rollDice() { return Math.floor(Math.random()*6)+1; }

// Animate dice spinning, resolve to finalRoll after ~700ms
function animateDice(elId, finalRoll) {
  return new Promise(res => {
    const el = $(elId);
    el.classList.add('spinning');
    let t = 0;
    const iv = setInterval(() => {
      const fake = Math.floor(Math.random()*6)+1;
      el.querySelector('.dice-face').textContent = DICE_FACE[fake];
      el.querySelector('.dice-num').textContent = fake;
      t += 80;
      if (t >= 700) {
        clearInterval(iv);
        el.querySelector('.dice-face').textContent = DICE_FACE[finalRoll];
        el.querySelector('.dice-num').textContent = finalRoll;
        el.classList.remove('spinning');
        el.classList.add('settled');
        setTimeout(() => el.classList.remove('settled'), 400);
        res();
      }
    }, 80);
  });
}

function showDice(who, roll, label, colorClass) {
  const el = $(who === 'player' ? 'playerDice' : 'enemyDice');
  el.style.display = 'flex';
  el.className = 'dice-box ' + colorClass;
  el.querySelector('.dice-face').textContent = DICE_FACE[roll];
  el.querySelector('.dice-num').textContent = roll;
  el.querySelector('.dice-label').textContent = label;
}

function hideDice() {
  $('playerDice').style.display = 'none';
  $('enemyDice').style.display = 'none';
}

// ========== COMBAT ==========
async function doAttack() {
  if (G.busy || !G.playerTurn) return;
  G.busy = true; setButtons(true);
  const p = G.player, e = G.enemy;

  // Player rolls dice
  const roll = rollDice();
  const mult = DICE_MULT[roll];
  const baseDmg = Math.max(1, p.atk - e.def);
  const dmg = Math.max(1, Math.round(baseDmg * mult));
  const rollColorClass = roll >= 5 ? 'dice-crit' : roll >= 3 ? 'dice-ok' : 'dice-weak';

  showDice('player', roll, DICE_LABEL[roll], rollColorClass);
  await animateDice('playerDice', roll);
  await delay(200);

  log(`🎲 <b>You</b> rolled <b>${DICE_FACE[roll]} ${roll}</b> — <span class="${rollColorClass}-txt">${DICE_LABEL[roll]}!</span> Attack <b>${e.name}</b> for <b class="dmg-red">${dmg} DMG</b>`, 'log-player');
  await animFighter('playerFighter','player-attack-anim');
  await animFighter('enemyFighter','hit-anim',300);
  showPopup(`-${dmg}`, 520, 'dmg-red');
  e.hp = Math.max(0, e.hp - dmg);
  renderAll();
  await delay(400);
  hideDice();
  if (e.hp <= 0) { await winRound(); return; }
  await enemyTurn();
}

async function doDefend() {
  if (G.busy || !G.playerTurn) return;
  G.busy = true; setButtons(true);

  // Player rolls defend dice
  const roll = rollDice();
  G.defending = true;
  G.defendRoll = roll;
  const blockPct = BLOCK_PCT[roll];
  const rollColorClass = roll >= 5 ? 'dice-crit' : roll >= 3 ? 'dice-ok' : 'dice-weak';

  showDice('player', roll, DICE_LABEL[roll], rollColorClass + ' dice-defend');
  await animateDice('playerDice', roll);
  await delay(200);

  log(`🎲 <b>You</b> rolled <b>${DICE_FACE[roll]} ${roll}</b> — <span class="${rollColorClass}-txt">${DICE_LABEL[roll]} BLOCK!</span> Shield blocks <b class="dmg-blue">${Math.round(blockPct*100)}%</b> damage`, 'log-defend');
  await animFighter('playerFighter','defend-anim');
  renderAll();
  await delay(300);
  await enemyTurn();
}

async function doHeal() {
  if (G.busy || !G.playerTurn || G.player.potions <= 0) return;
  G.busy = true; setButtons(true);
  const p = G.player;
  p.potions--;
  const heal = 40;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + heal);
  const actual = p.hp - before;
  log(`💊 <b>You</b> drink a potion and recover <b class="dmg-green">${actual} HP</b>`, 'log-heal');
  await animFighter('playerFighter','heal-anim');
  showPopup(`+${actual}`, 120, 'dmg-green');
  renderAll();
  await delay(300);
  await enemyTurn();
}

async function enemyTurn() {
  const p = G.player, e = G.enemy;
  await delay(500);

  // Enemy rolls dice
  const eRoll = rollDice();
  const eMult = DICE_MULT[eRoll];
  const eBase = Math.max(1, e.atk - p.def);
  let eDmg = Math.max(1, Math.round(eBase * eMult));
  const eColorClass = eRoll >= 5 ? 'dice-crit' : eRoll >= 3 ? 'dice-ok' : 'dice-weak';

  showDice('enemy', eRoll, DICE_LABEL[eRoll], eColorClass);
  await animateDice('enemyDice', eRoll);
  await delay(200);

  if (G.defending) {
    const blockPct = BLOCK_PCT[G.defendRoll];
    const blocked = Math.round(eDmg * blockPct);
    eDmg = Math.max(0, eDmg - blocked);
    if (eDmg === 0) {
      log(`🎲 <b>${e.name}</b> rolled <b>${DICE_FACE[eRoll]} ${eRoll}</b> — Your shield <b class="dmg-blue">COMPLETELY BLOCKS</b> the attack!`, 'log-enemy');
    } else {
      log(`🎲 <b>${e.name}</b> rolled <b>${DICE_FACE[eRoll]} ${eRoll}</b> (<span class="${eColorClass}-txt">${DICE_LABEL[eRoll]}</span>) — Shield blocks ${blocked}, you take <b class="dmg-red">${eDmg} DMG</b>`, 'log-enemy');
    }
  } else {
    log(`🎲 <b>${e.name}</b> rolled <b>${DICE_FACE[eRoll]} ${eRoll}</b> — <span class="${eColorClass}-txt">${DICE_LABEL[eRoll]}!</span> Attacks you for <b class="dmg-red">${eDmg} DMG</b>`, 'log-enemy');
  }

  await animFighter('enemyFighter','enemy-attack-anim');
  if (eDmg > 0) await animFighter('playerFighter','hit-anim',300);
  if (eDmg > 0) showPopup(`-${eDmg}`, 120, 'dmg-red');
  else showPopup('BLOCKED!', 120, 'dmg-blue');
  p.hp = Math.max(0, p.hp - eDmg);
  G.defending = false;
  G.defendRoll = 0;
  renderAll();
  await delay(400);
  hideDice();
  if (p.hp <= 0) { gameOver(); return; }
  G.busy = false;
  setButtons(false);
}

async function winRound() {
  const expGain = 20 + G.round * 15;
  G.coins += 20;
  log(`🏆 <b>${G.enemy.name}</b> defeated! +${expGain} EXP & +20 Coins!`, 'log-system');
  renderAll();
  await delay(400);
  await gainExp(expGain);
  await delay(300);
  if (G.round >= G.maxRound) { victory(); return; }
  G.round++;
  await showRoundBanner(`ROUND ${G.round}`);
  G.enemy = spawnEnemy(G.round);
  G.defending = false;
  clearLog();
  log(`⚡ Round ${G.round} begins! <b>${G.enemy.name}</b> appears!`, 'log-system');
  renderAll();
  G.busy = false;
  setButtons(false);
}

function setButtons(disabled) {
  ['btnAttack','btnDefend','btnHeal'].forEach(id => {
    if($(id)) $(id).disabled = disabled;
  });
}

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

// ========== EXP / LEVEL UP ==========
async function gainExp(amount) {
  META.exp += amount;
  let leveled = false;
  while (META.exp >= META.expToNext) {
    META.exp -= META.expToNext;
    META.level++;
    const reward = META.level * 30;
    META.coins += reward;
    META.expToNext = META.level * 100;
    leveled = true;
    log(`🌟 <b>LEVEL UP!</b> Now Level <b>${META.level}</b>! +<b class="dmg-green">${reward} Coins</b>!`, 'log-system');
    await delay(200);
  }
  saveData();
  renderAll();
}

// ========== ROUND BANNER ==========
function showRoundBanner(txt) {
  return new Promise(res => {
    const b = $('roundBanner');
    $('roundBannerText').textContent = txt;
    b.classList.add('show');
    setTimeout(() => { b.classList.remove('show'); res(); }, 1400);
  });
}

// ========== SVG ICONS ==========
const SVG = {
  sword:`<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l2-2 3 3-2 2-3-3z"/><line x1="2" y1="22" x2="5" y2="19"/></svg>`,
  shield:`<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  potion:`<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v5.5L5 15a5 5 0 0 0 14 0l-5-6.5V3"/><circle cx="10" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="14" cy="15" r="1" fill="currentColor" stroke="none"/></svg>`,
  coin:`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v1M12 15v1M9.5 10.5C9.5 9.1 10.6 8 12 8s2.5 1.1 2.5 2.5c0 1.2-1.5 1.8-2.5 1.8s-2.5.9-2.5 2.2S10.6 16 12 16s2.5-1.1 2.5-2.5"/></svg>`
};

// ========== SHOP ==========
function openShop() {
  buildShopUI();
  $('shopOverlay').classList.add('open');
}
function closeShop() { $('shopOverlay').classList.remove('open'); }

function buildShopUI() {
  const s = G.shop;
  let html = '';
  s.weapons.forEach((w,i) => {
    const canBuy = G.coins >= w.cost;
    html += `<div class="shop-item"><div class="shop-icon si-weapon">${SVG.sword}</div><div class="shop-item-info"><div class="shop-name">${w.n}</div><div class="shop-desc">${w.d}</div></div><button class="shop-buy" onclick="buyWeapon(${i})" ${canBuy?'':'disabled'}>${SVG.coin} ${w.cost}</button></div>`;
  });
  s.armors.forEach((a,i) => {
    const canBuy = G.coins >= a.cost;
    html += `<div class="shop-item"><div class="shop-icon si-armor">${SVG.shield}</div><div class="shop-item-info"><div class="shop-name">${a.n}</div><div class="shop-desc">${a.d}</div></div><button class="shop-buy" onclick="buyArmor(${i})" ${canBuy?'':'disabled'}>${SVG.coin} ${a.cost}</button></div>`;
  });
  const pot = s.potions;
  html += `<div class="shop-item"><div class="shop-icon si-potion">${SVG.potion}</div><div class="shop-item-info"><div class="shop-name">${pot.n}</div><div class="shop-desc">${pot.d}</div></div><button class="shop-buy" onclick="buyPotion()" ${G.coins>=pot.cost?'':'disabled'}>${SVG.coin} ${pot.cost}</button></div>`;
  $('shopGrid').innerHTML = html;
  $('shopCoins').innerHTML = `${SVG.coin} <b>${G.coins}</b> Coins`;
}

window.buyWeapon = function(i) {
  const w = G.shop.weapons[i];
  if (G.coins < w.cost) return;
  G.coins -= w.cost; G.player.atk += w.atk;
  log(`🛒 Bought <b>${w.n}</b>! ATK +${w.atk}`, 'log-system');
  renderAll(); buildShopUI();
}
window.buyArmor = function(i) {
  const a = G.shop.armors[i];
  if (G.coins < a.cost) return;
  G.coins -= a.cost; G.player.def += a.def;
  log(`🛒 Bought <b>${a.n}</b>! DEF +${a.def}`, 'log-system');
  renderAll(); buildShopUI();
}
window.buyPotion = function(i) {
  const pot = G.shop.potions;
  if (G.coins < pot.cost) return;
  G.coins -= pot.cost; G.player.potions += pot.amt;
  log(`🛒 Bought <b>${pot.n}</b>! +${pot.amt} potions`, 'log-system');
  renderAll(); buildShopUI();
}

// ========== GAME OVER / VICTORY ==========
function gameOver() {
  $('endTitle').textContent = 'DEFEAT';
  $('endTitle').className = 'defeat';
  $('endMsg').textContent = `You fell in Round ${G.round}. Coins & Level kept. Train harder!`;
  setMyStatus('idle');
  showScreen('end');
}
function victory() {
  $('endTitle').textContent = 'VICTORY!';
  $('endTitle').className = 'victory';
  $('endMsg').textContent = `All ${G.maxRound} rounds conquered! You are the champion!`;
  setMyStatus('idle');
  showScreen('end');
}

// ========== META SCREEN ==========
function showMetaScreen() {
  $('metaLevelNum').textContent = META.level;
  $('metaExpNum').textContent = META.exp;
  $('metaExpMax').textContent = META.expToNext;
  $('metaCoinsNum').textContent = META.coins;
  $('metaExpBar').style.width = Math.min(100, META.exp / META.expToNext * 100) + '%';
  buildCharGrid();
  showScreen('meta');
}

function buildCharGrid() {
  $('charGrid').innerHTML = CHARS.map(c => {
    const owned = META.ownedChars.includes(c.id);
    const selected = META.selectedChar === c.id;
    const canBuy = !owned && META.coins >= c.cost;
    const btnCls = owned ? 'cbtn-owned' : canBuy ? 'cbtn-buy' : 'cbtn-broke';
    const btnTxt = owned ? (selected ? '✓ Selected' : 'Select') : `Buy ${c.cost}`;
    const priceBadge = c.cost > 0 ? `<div class="char-price-tag">${SVG.coin} ${c.cost}</div>` : '';
    return `<div class="char-card ${selected?'selected':''} ${!owned&&!canBuy&&c.cost>0?'locked':''}" onclick="selectOrBuyChar(${c.id})">
      ${priceBadge}
      <div class="char-avatar">${c.svg}</div>
      <div class="char-name">${c.name}</div>
      <div class="char-tag ${c.tagCls}">${c.tag}</div>
      <div class="char-stats-mini">
        <span><b>${c.hp}</b>HP</span>
        <span><b>${c.atk}</b>ATK</span>
        <span><b>${c.def}</b>DEF</span>
        <span><b>${c.potions}</b>POT</span>
      </div>
      <div class="char-desc">${c.desc}</div>
      <button class="char-buy-btn ${btnCls}" onclick="event.stopPropagation();selectOrBuyChar(${c.id})">${btnTxt}</button>
    </div>`;
  }).join('');
}

window.selectOrBuyChar = function(id) {
  const c = CHARS.find(x => x.id === id);
  if (!c) return;
  if (META.ownedChars.includes(id)) {
    META.selectedChar = id;
    buildCharGrid();
    return;
  }
  if (META.coins < c.cost) return;
  META.coins -= c.cost;
  META.ownedChars.push(id);
  META.selectedChar = id;
  saveData();
  showMetaScreen();
}

// ========== START OFFLINE ==========
async function startGame() {
  const ch = CHARS.find(c => c.id === META.selectedChar) || CHARS[0];
  Object.assign(G, { round:1, coins:0, playerTurn:true, defending:false, busy:false,
    player:{ hp:ch.hp, maxHp:ch.hp, atk:ch.atk, def:ch.def, potions:ch.potions }
  });
  G.enemy = spawnEnemy(1);
  showScreen('game');
  setMyStatus('duel');
  clearLog();
  $('btnShop').style.display = 'flex';
  log(`⚡ Round 1 begins! <b>${G.enemy.name}</b> appears!`, 'log-system');
  log(`🧐 Playing as <b style="color:${ch.color}">${ch.name}</b>`, 'log-system');
  renderAll();
  $('playerSvgWrap').innerHTML = ch.svg;
  $('playerFighter').classList.add('idle-anim');
  $('enemyFighter').classList.add('idle-anim');
  await delay(200);
  G.busy = false; 
  setButtons(false);
  $('btnSurrender').disabled = false;
}

// ========== EVENTS ==========
let isLoginMode = true;

$('btnToggleAuth').onclick = (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  if(isLoginMode) {
    $('authSubtitle').textContent = "Login to your account";
    $('emailInput').style.display = "none";
    $('btnSubmitAuth').textContent = "LOGIN";
    $('authToggleText').textContent = "Don't have an account?";
    $('btnToggleAuth').textContent = "Register Here";
  } else {
    $('authSubtitle').textContent = "Create a new account";
    $('emailInput').style.display = "block";
    $('btnSubmitAuth').textContent = "REGISTER";
    $('authToggleText').textContent = "Already have an account?";
    $('btnToggleAuth').textContent = "Login Here";
  }
};

$('btnSubmitAuth').onclick = async () => {
  const uname = $('usernameInput').value.trim();
  const email = $('emailInput').value.trim();
  const pass = $('passwordInput').value.trim();
  
  if(!uname) return alert("Please enter a username!");
  if(!pass) return alert("Please enter a password!");
  if(!isLoginMode && !email) return alert("Please enter an email address!");
  
  // Format username to be a safe Firebase key
  myUserId = uname.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(); 
  if(!myUserId) return alert("Invalid username format!");

  $('btnSubmitAuth').disabled = true;
  $('loginStatus').style.display = 'block';
  $('loginStatus').textContent = isLoginMode ? 'Checking account...' : 'Creating account...';

  const authSnap = await get(ref(db, 'usersAuth/' + myUserId));
  
  if(isLoginMode) {
    // LOGIN
    if(!authSnap.exists()) {
      $('btnSubmitAuth').disabled = false;
      $('loginStatus').style.display = 'none';
      return alert("Username not found! Please register first.");
    }
    const authData = authSnap.val();
    // Simple Base64 decoding check
    if(authData.password !== btoa(pass)) {
      $('btnSubmitAuth').disabled = false;
      $('loginStatus').style.display = 'none';
      return alert("Incorrect password!");
    }

    const snap = await get(ref(db, 'playerData/' + myUserId));
    if(snap.exists()) META = snap.val();
    else META = { ...defaultMeta, username: uname };
  } else {
    // REGISTER
    if(authSnap.exists()) {
      $('btnSubmitAuth').disabled = false;
      $('loginStatus').style.display = 'none';
      return alert("Username already taken! Try another one or Login.");
    }
    // Save to usersAuth (Encode password simple base64)
    await set(ref(db, 'usersAuth/' + myUserId), { email: email, username: uname, password: btoa(pass) });
    // Initialize fresh player data
    META = { ...defaultMeta, username: uname };
    saveData();
  }

  $('loginStatus').textContent = "Success! Entering game...";
  initFirebasePresence();
  showScreen('start');
};

$('btnStart').onclick = () => showMetaScreen();
$('btnFight').onclick = startGame;
$('btnRestart').onclick = () => showScreen('meta');
$('btnToMeta').onclick = showMetaScreen;

$('btnAttack').onclick = () => currentBattleId ? doPvpAction('attack') : doAttack();
$('btnDefend').onclick = () => currentBattleId ? doPvpAction('defend') : doDefend();
$('btnHeal').onclick = () => currentBattleId ? doPvpAction('heal') : doHeal();
$('btnSurrender').onclick = doSurrender;

$('btnShop').onclick = openShop;
$('btnCloseShop').onclick = closeShop;

// Init
showScreen('login');
