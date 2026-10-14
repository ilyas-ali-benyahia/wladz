/**
 * Headless character audit: builds the player, every NPC from npcs.json and pedestrian variants, then checks
 * the rig contract other systems rely on, soles on the ground, triangle budget and resource sharing.
 * Usage: npm run audit:characters   (exit code 1 when a check fails)
 */
import * as THREE from 'three';
const { CharacterModel } = await import('../src/systems/CharacterModel.js');
const npcs = (await import('../src/data/npcs.json', { with: { type: 'json' } })).default.npcs;
const variants = [['boy_purple', {}], ['girl_yellow', {}], ['girl_green', {}],
  ...npcs.map(d => ['npc_adult', { isNPC: true, npcRole: d.role, primaryColor: parseInt(d.color.slice(1), 16), skinColor: parseInt((d.skinColor || '#f0cbb0').slice(1), 16), gender: d.gender, hijabColor: d.hijabColor ? parseInt(d.hijabColor.slice(1), 16) : undefined, _id: d.id }]),
  ['npc_adult', { isNPC: true, gender: 'female', primaryColor: 0x6d4c7d, hijabColor: 0xe8dcc8, npcRole: 'citizen' }],
  ['npc_adult', { isNPC: true, primaryColor: 0x27ae60, npcRole: 'citizen' }]];
const BONES = ['hips', 'torso', 'head', 'leftArm', 'rightArm', 'leftElbow', 'rightElbow', 'leftHand', 'rightHand', 'leftLeg', 'rightLeg', 'leftKnee', 'rightKnee', 'leftFoot', 'rightFoot'];
const geos = new Set(), mats = new Set();
let fail = 0;
for (const [type, opt] of variants) {
  const m = new CharacterModel(type, opt);
  const missing = BONES.filter(b => !m.bones[b]);
  let tris = 0, boxes = [], hats = 0;
  m.group.traverse(o => {
    if (!o.isMesh) return;
    geos.add(o.geometry.uuid); mats.add(o.material.uuid);
    tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
    const t = o.geometry.type;
    if (/Box/.test(t)) { let p = o, inPack = false; while (p) { if (p.userData.accessory) inPack = true; p = p.parent; } boxes.push(t); }
  });
  for (let i = 0; i < 40; i++) m.update(1 / 30, { isMoving: false });
  const box = new THREE.Box3().setFromObject(m.group);
  const ok = missing.length === 0 && Math.abs(box.min.y) < 0.01 && tris < 22000;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', `${(opt._id || opt.npcRole || type).padEnd(22)} ${opt.gender === 'female' || type.startsWith('girl') ? 'hijab' : m.chooseHairStyle(type, opt.npcRole).padEnd(8)} height ${box.max.y.toFixed(2)}m  feet ${box.min.y.toFixed(3)}  tris ${Math.round(tris)}  boxes:${boxes.length ? boxes.join(',') : 0}${missing.length ? ' MISSING ' + missing : ''}`);
}
console.log(fail ? `${fail} character(s) failed` : 'All characters passed');
console.log(`${variants.length} characters share ${geos.size} geometries and ${mats.size} materials`);
process.exit(fail ? 1 : 0);
