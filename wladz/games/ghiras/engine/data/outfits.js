/**
 * Player appearance options and the clothing catalogue (prices in the game's coins).
 * Outfits only change colours and garment shapes on the shared character rig, so every outfit
 * works with every animation (no separate skeletons, no clipping-prone meshes).
 */

export const SKIN_TONES = [0xf6d2b5, 0xf3c7a5, 0xe3ad85, 0xc98e66, 0x9a6545, 0x6f4630];
export const HAIR_COLORS = [0x1c140f, 0x3d2314, 0x6b3e1f, 0x8b3a1a, 0xa7773f];
export const HIJAB_COLORS = [0x1f7a5a, 0xd9667a, 0x2e86c1, 0x8e44ad, 0xe8dcc8, 0x2c3e50, 0xc0392b, 0xf39c12];
export const HAIR_STYLES = [
  { id: 'sidepart', label: 'فرق جانبي' },
  { id: 'short', label: 'قصير' },
  { id: 'wavy', label: 'مموّج' },
  { id: 'crop', label: 'قصير جداً' }
];

/**
 * Outfit fields (all optional):
 *  shirt, pants, shoes, collar  colours
 *  longSleeves                  sleeves to the wrist
 *  shorts                       knee-length shorts (boys' sportswear only)
 *  robe, robeColor              long garment from the waist (gandoura / dress), length as a share of the leg
 *  bands                        colours of horizontal bands across the chest (kits, hi-vis)
 *  vest                         colour of a sleeveless vest over the shirt
 *  buttons                      gold buttons down the front (embroidered traditional jacket)
 *  scarf                        [colour, colour] striped scarf around the neck
 */
export const OUTFITS = [
  {
    id: 'casual', category: 'يومي', name: 'اللباس اليومي', price: 0, icon: '👕',
    desc: 'ملابس مريحة للتجوال في المدينة.',
    boy: { shirt: 0x7c3aed, pants: 0x242b35, shoes: 0x0984e3, collar: 0xffffff, longSleeves: true, zip: true },
    girl: { shirt: 0x27ae60, pants: 0x2980b9, shoes: 0xf39c12, collar: 0xffffff, longSleeves: true }
  },
  {
    id: 'sport', category: 'رياضي', name: 'قميص المنتخب', price: 60, icon: '⚽',
    desc: 'بذلة رياضية بألوان الراية الوطنية، مثالية للملعب.',
    boy: { shirt: 0xffffff, pants: 0x1e8449, shoes: 0xffffff, collar: 0x1e8449, longSleeves: false, shorts: true, bands: [0x1e8449] },
    girl: { shirt: 0xffffff, pants: 0x1e8449, shoes: 0xffffff, collar: 0x1e8449, longSleeves: true, bands: [0x1e8449] }
  },
  {
    id: 'volunteer', category: 'تطوعي', name: 'سترة المتطوع', price: 40, icon: '🤝',
    desc: 'سترة جمعية شباب التطوع، يعرفك بها الجميع في الحي.',
    boy: { shirt: 0xf4f6f7, pants: 0x34495e, shoes: 0x27ae60, collar: 0xffffff, longSleeves: true, vest: 0x2ecc71, bands: [0xf1c40f] },
    girl: { shirt: 0xf4f6f7, pants: 0x34495e, shoes: 0x27ae60, collar: 0xffffff, longSleeves: true, vest: 0x2ecc71, bands: [0xf1c40f] }
  },
  {
    id: 'traditional', category: 'تقليدي', name: 'اللباس التقليدي', price: 120, icon: '🧵',
    desc: 'قندورة بيضاء للأولاد، وكاراكو مطرّز للبنات: من تراث الجزائر.',
    boy: { shirt: 0xf7f3ea, pants: 0xf7f3ea, shoes: 0x8d6e4f, collar: 0xd4af37, longSleeves: true, robe: 0.92, robeColor: 0xf7f3ea, buttons: true },
    girl: { shirt: 0x7b1e3a, pants: 0x7b1e3a, shoes: 0xd4af37, collar: 0xd4af37, longSleeves: true, robe: 0.95, robeColor: 0x5b1530, buttons: true }
  },
  {
    id: 'work', category: 'عمل', name: 'بذلة الورشة', price: 80, icon: '🔧',
    desc: 'بذلة عمل متينة للورشة والمهام الميدانية.',
    boy: { shirt: 0x2c5f8a, pants: 0x2c5f8a, shoes: 0x3b2a20, collar: 0x2c5f8a, longSleeves: true, bands: [0xf39c12] },
    girl: { shirt: 0x2c5f8a, pants: 0x2c5f8a, shoes: 0x3b2a20, collar: 0x2c5f8a, longSleeves: true, bands: [0xf39c12] }
  },
  {
    id: 'fan', category: 'إكسسوار', name: 'وشاح المشجّع', price: 30, icon: '🧣',
    desc: 'اللباس اليومي مع وشاح أخضر وأبيض لتشجيع الفريق.',
    boy: { shirt: 0x7c3aed, pants: 0x242b35, shoes: 0x0984e3, collar: 0xffffff, longSleeves: true, zip: true, scarf: [0x1e8449, 0xffffff] },
    girl: { shirt: 0x27ae60, pants: 0x2980b9, shoes: 0xf39c12, collar: 0xffffff, longSleeves: true, scarf: [0x1e8449, 0xffffff] }
  }
];

export const DEFAULT_APPEARANCE = {
  boy_purple: { skin: 0xf3c7a5, hair: 0x3d2314, hairStyle: 'sidepart', hijab: null, outfit: 'casual' },
  girl_green: { skin: 0xf2c3a0, hair: 0x8b3a1a, hairStyle: 'short', hijab: 0x1f7a5a, outfit: 'casual' }
};

export function getOutfit(id) {
  return OUTFITS.find(o => o.id === id) || OUTFITS[0];
}
