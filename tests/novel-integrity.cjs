'use strict';
/**
 * 全職法師：萬界法神 — 連載資料完整性與章節字數巡檢。
 * 結構錯誤應使部署失敗；字數不足只列為編輯待辦，不阻擋網站發布。
 * 使用 Unicode code points（含標點與空白）統計正文 text，不含章名。
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '..', 'site', 'books', 'wan-jie-fa-shen');
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
assert(Array.isArray(manifest.chapters), 'manifest.chapters must be an array');
assert.equal(manifest.chapterCount, manifest.chapters.length, 'manifest chapterCount mismatch');
// The public book shelf must never advertise a stale chapter count.
const catalog = JSON.parse(fs.readFileSync(path.join(base, '..', 'catalog.json'), 'utf8'));
const matchingCatalogEntries = catalog.filter(book => book.id === manifest.id);
assert.equal(matchingCatalogEntries.length, 1, 'novel must have exactly one catalog entry');
assert.equal(matchingCatalogEntries[0].chapterCount, manifest.chapterCount,
  'catalog chapterCount must match the published manifest');
assert.equal(matchingCatalogEntries[0].subtitle, manifest.subtitle,
  'catalog subtitle must match the published manifest');
// SHA-256 of published chapter bodies, independently generated from the
// preserved revision ZIP (excluding the chapter title). This prevents a
// web-only edit from silently diverging from the reviewed master manuscript.
const revisionHashes = new Map([
  [421, '0dd87324b1d3aa8e67c8842767c61956e0b12cf58c89dde6af550c55fd53d7ac'],
  [422, 'db449a97f17ec3b19b05d89d8755528f309958f23ff3c58bbbb0c34e5dfcfab7'],
  [423, '5d39567d9bbe8351923ee0d1876e933d2f46c98a71dbcaf5aab1d7aa5ca194e6'],
  [424, '77d881b7d2f2217d91f98f1865bd0ae736cc570390158a955ee9b237c39b988e'],
  [425, 'e7174dc61f1184bfc2bc398074fdf77cf65be81f36a7577094bac5ac74fa7e1e'],
  [426, 'fc80347e00ee6ec8b20acdbd997eef07d31375a89d6f791f904d654eb40e6123'],
  [427, '78bac79e9fe5dfd2a478cf15f8beac73e24e13d1ee7657c152719a9016c634d8'],
  [428, '4aab5d7c8cc56a06e7ac76b906804df514ce4827e38085456255642117f032b9'],
  [429, '7bf0176be7ec480b5ebfbca213538fb7df4e4f28ad0bcc11466be20f5af2dbb2'],
  [430, '26d102b89bee848e1b0192f6f886e5c763792179f707dfa91257e060cc7aeaa2'],
  [431, '879233ae2d6435732da42c4be67fe006c69f6b860c6058953894aeae055e3fa5'],
  [432, '92e127a511990dbe9a50a45b96589e71509e808a165afd493cc6463d27744e10'],
  [433, '30cf7709e385d904d069729a07015d055ba544bc60469cbbfe87c44ab4d96dfe'],
  [434, 'fb74421bb7b8b0263aaefdfa49a9dd96829a2f3a5994ec0c54dd15b42b4727bb'],
  [435, '5ce07f4f1b1b97289565a9bbc74c3b462ebe28652468e6b149ccad0d480cbf11'],
  [436, '375dc8094cdd824d6ee1f14d34d8089cd73c965675ce62f3e5484c594aa7b5ea'],
  [437, '1c04e22656c0f108ad1e76bd6604ca37dc68072422ee98dbca6e74d6bcc2b56d'],
  [438, 'b07d75765b2655b1d3e10e3d5e900986b50ac4e82dd9f2678b3853c8e34fd248'],
  [439, 'bb261d42ea67fb4a29f374507e1fe3fc69b96501ecaa70accc78bea21b4fb40b'],
  [440, 'ff9af0dc5dec152b91e793426a42db1e268e6c2493bd613b5ef6b51218b02982'],
  [441, '4d4f98705b7927931ad13c14e3b7aa80d10389e1b946be69a9d054e24c5433a2'],
  [442, '8f8503319923649c931856b55e897a6fb6c9dc46895fad762684535e5806bd76'],
  [443, '596591ef3a57b78e696fa76de6f97f506b29f898c0e7aa57cd39ddd1d4f7442b'],
  [444, '40e2b432b4c02d385555ea0abb3336e9064ff67329ee5b82e73082be53042da6'],
  [445, 'ee5a076e392acc500ddfed94f7cb83bf19d401164fd6fd04bedaa46dcc5f1016'],
  [446, '9d4d9f98333c554a03692c47b949ec56bc2975ad70607d734ad4e5874983fa56'],
  [447, '0c5db6f1597b350a042b91269f787ca3e76712b13d18378af9288b4a59576dbd'],
  [448, 'fee0bc0dff354a45e9e6b42fe685225fa0f4d7573ddfda07477f0aa5917cbeb3'],
  [449, '3199c9d3c0e999018eba914519ef0bc4bc0129a9c152739defed57c9403d55c0'],
  [450, '1e765463af59d2bccdead4f1dcdad3cd563c25358cd8a316caab64294c9d90f0'],
  [451, 'c894506c7909907e1365f95e0a989a0f5f402e420818694b3df4a2b6dad3b2e0'],
  [452, '5c6463333323056ee571304a3dbcd7b715247a23f925c39afbf1f0c55102026d'],
  [453, '4bfd50ee97c24660725c4d384e4ac920cab5bb0075aee386eab8b14997b0d9ab'],
  [454, 'c770a914441f30e98ad8dc2baad1c7477e72d2bd26b2a4b35e330754c8dc9faf'],
  [455, '8e8be1cd62083aee5d891a6d8c4043fb5e7622f68635cf35b46356819f395058'],
  [456, 'a91d2e61461f4bc0d305a2d7f5552da0ec50f7570a20b70a6dce99ee7e60afad'],
  [457, '5ed0018f73a835290cde306394e0048c1a4a6e6be61af94e32024a96e459c26e'],
  [458, '4bfbfc1da69b2de7cc4bd3f5f173a4207996ea3a3ffa2d210fd7be6f1d97ee68'],
  [459, 'c790608a4806158f416c1c7df0be7d4c567fdbae88ae8f53465c713f9584c3a8'],
  [460, '83a7c41edf93c9ee5f8e46070d0985043062c3874aad2ecbb57b8314570438b9'],
  [461, 'aceb971427b512eed3603f158d937542fd36e35aaf8584cb9bc820379fcd2eb3'],
  [462, '75cbb156b7a147bdffeec75d228eedbe2f2f62a4e30741e13e4ddf4b4666d6a3'],
  [463, '70814f2ddde7e63649f68c928baad59013666c23ccd4c579b3b450acb0ff1eae'],
  [464, 'd05d96fc311cd69e618cd1a9ff18afe9321f9d4f52936b6d3c5178340a851a5b'],
  [465, '2618a5c1aff0f0324d939d772c025c9fa703d4e2833d6785bc98193e85e74f1a'],
  [466, 'b827fe7ce4670dda26edaad1a1f2e592d78615c902198d9b1a548a90ed32f6e5'],
  [467, '3072856f62d5cd1277538f94a32b5b79abbcb4aeada36e36afbaa2ad64e1da34'],
  [468, '4134b360b4b0ea692b327f16ca5dba40c341a4fc008a13256d65a14d36f23dd4'],
  [469, '10caf298c79d5caed33e2233128d60da748c3e937ed0518c7dc68d86a59c849b'],
  [470, 'e7d81836ec15b59745aed2cd077ea2b10a85a9ad79f564fb659607eb40097102'],
  [471, 'badaa0af59b7a7389ec2f0ca9cfea352c4a949a07d4ffff0cc528d8bb3335230'],
  [472, '4db69895ec3438124d60f7596cb30cc7bd276adb07fb829ebaedb46a8f69b48b'],
  [473, 'bc5a3db18be983bb2d56429e82354497b711e460e0e5ebe31cf824ef7d374976'],
  [474, 'c32219322823771c5720269d116f9623f4baa0859834def183c3fa2f2432be96'],
  [475, '433e1628c01b05794f045bf692366fa1fd4c22d4ac4f462f6dd30dc11f429104'],
  [476, 'f97b986807a863b6f89d6fed20699da52d66c40d27b7692f2cfb99a6914f73d2'],
  [477, '57e595e5fb707405d2f264457096ca98bfcfce870914dec7cb9c41a698275462'],
  [478, 'b3c9c8d7af86f550584ba0ce910ebb9315aa1d71d83e2206917f12b737b3d1ee'],
  [479, '8b2033e7389fc1c65a6ae718c55af79f2b72602d6e795bae1b3a14e3f4fb529d'],
  [480, '3f4f80bd0d82e52af2a69b0513e1e5ac4ece15f91a47b5db1904bd660664c06a'],
  [481, '5f38ba78f4c82f64bde9d3f0e588c372db89cde865c0f6a761de9fe414525333'],
  [482, '209b0368fcb5d83cf85a75ca58ff7efcf92ec8a7cdcba9b70ebb39dffa8218a5'],
  [483, '73abd1a16f9762160d0067b3bb35270b35fd03df118588f5f654c25c1e58ef74'],
  [484, '7286865040211a3899120fef3daacd6bbc554131327ac4b3c21f5fbbab473af9'],
  [485, '7ec8547b07a9048655d5361d1b9a762c5540ec2a18df2d8d56e42450f558e04f'],
  [486, '8db3107837489179a9903db0d70a28cf426eb5f4c9426a5bc2f52b399c24131f'],
  [487, '020c6037bc38572df3bd86d58387c1a96f1820732eab7d0baa83a370fc47c1a9'],
  [488, '603498b0f7a733413b710976f1cd25ee8a1cf464be46d3f89dc3b5f3987781a5'],
  [489, 'a16c4c60379bfbef6bf7bc6cb9564b09502d89cff5d9f40e8bb145fac023dd82'],
  [490, 'dac4ee5996f4314094baad3d7b6902a80539dbfa4bce03eec9ed39d4c4b81e74'],
  [491, 'e2ce1700b349229f43d844b798682c0e762da8ce021a54adf82c75654b914e20'],
  [492, '03188414a36615406d56069fc6345156d4a9ff2cdfe7c7a79fc1504a23f41e7b'],
  [493, '84653136984ec9c96e025e5c06af639ac60dd25ef436cc1489627aec00b01477'],
  [494, '275d52d2df2b35becfdc4edd6f4cd70bd59756259614b3087006ff40f9e69340'],
  [495, '79c02e101eb0d0eb269b2515be000e1fc1ace4c051f1c68223ada4c003463c6a'],
  [496, 'ca646325659828308acbee64d05849d849882bf4419d536b5ffa4de9ffa8c332'],
  [497, '21926c0fcff37495666454735e81799d5d13d3e0d5902591e881e792adfb9102'],
  [498, 'fd50f48d8667c0858271a15f14e6f66741fee9a892e9a23ef87a85fbee160791'],
  [499, 'aaec57dc6be1fb362a5f031549a173b33ce190175caed638c67d4b81de225b63'],
  [500, 'de56578fecb1d09c2ed63837564ecc148d9b43375cf147a10694cdcef3e11d8e'],
  [501, '0b8838ae3d9eae239506a834e161845da7413ce0609ec0e3098dc3ba865a8572'],
  [502, '8f1fbfceb245eee4cfd1f5c31c708ad57494757f5d178d96b57603f50ce05578'],
  [503, 'ec9161c303ec2801b660076bd497326382b5f620d1f27510d866dfae1b06afd8'],
  [504, '55798ec098862f9e30e9bd9dc56d4df2b49ca7f48f028a648298d8b415dbb990'],
  [505, '1054ec95c6056a7046df71c6405d0688578ce9ec0f3950991158165d733f776a'],
  [506, 'ba4045cb2df9461072fc9e582073c360a644d2eff5255e13868f109d7eb56464'],
  [507, '43d0e63cb4f8c08637fceeeae6a89a74790ae2ee287360e4716fb5b99d0d5d0c'],
  [508, '79ef4ac67c9a085b488ce512a67bd5cb111bed0cc82815a2ca72987f85146f4e'],
  [509, '237caa86b835fc872cd0b23f70cbf2bbf0b69e51acac6aa928f3d872009cf2d3'],
  [510, '7e0580b8a02730ded6b456ced99569b4955c9ab6780db01812d6f7b031c52c25'],
  [511, '82c5f119b3447ffebee5120b9e6c9450a2a000afa2c8682033ad26124187624e'],
  [512, '65d9d49711041060d3bfbc1602806e1ee2935052e3944b744f214b6547665742'],
  [513, '4f05c671a1138e76dd63af1829829e3c7b2061d8793c5ed69572c039e9b6e180'],
  [514, 'f8617181adfaea89f0342808b6c8a78c2c8212f46362b0b3c383747cc16fcc43'],
  [515, '7068fca3bcbcbccaeae22ca31d2ec8a86df6dceddb364801c0a59f213b300664'],
  [516, 'be21f1e9d1e21718d268e2bfad7d4747095e98ec0782fd6ebf1df83f3de75eb0'],
  [517, '884db3032fa34a2795cd642a9d10622a27cbc2cc339d36d9a4c9dc665187be97'],
  [518, 'f127652fc4992cd81ee500984066f8afda29f947f7d3afe3299e38c60fb8d334'],
  [519, '5a658f62987694c77bb250814b5c0b25843a7511a6f2bf184d05ab89e788b33b'],
  [520, 'a4a882e1c4aba030f261a0e3660759680342985d25ad92fc5f3599b7f35928d8'],
  [521, '5fdca90642c4535bd56db930d422bf5ea651da4be87aff834086314cfadf67d5'],
  [522, 'c142a70963718f247e591867c49a2b7a247251169c8e23515d8f12d49f7e2103'],
  [523, '1eefac4c99c37b94460268673ec109ab5323108878ad6e471f78535794a55a89'],
  [524, '50b89135070a67039f09d7b71f7bd818d3a40ff5a0bd37c64b98504d78e18a14'],
  [525, 'f9a4359e7b8bbe589d6c64e40ec9db775f77dfb7c4ace4af8d27ba756b6caa3c'],
  [526, '10bcf3a08b3b2d7f8b25c70ff7b7dad9965ab0ec4445574006a48037b9207757'],
  [527, '7a1dfcbd836c5b17902c22239a8cfc005409ad362c6a34d16c37cc0ebd89a8f8'],
  [528, 'a643ea7b74e408f566753b9432b731e49ad81e7ec282d283d24db6564ccf0b9d'],
  [529, '8ee554a2ed396b6824a416f1fdd9a4079cc0188845e5cc77d4816d578f128696'],
  [530, '6a80a8fb3f60bc6ab01a5c330fbff0efda871f419c5d7e7b38b4f797e591caed'],
  [531, '56756843577ba6e511334fcf871c534cc668251179dd18a3404ae73f85fc5f17'],
  [532, '11c67b70a5ac7ebf154b4d40a93e92f6f256037ffbdf9eab37f8c178da5339a2'],
  [533, 'a7a880f102425693951af9d4284318d83adacab196af5d389b10e71284e36191'],
  [534, '960cdf293295e0886f2f635675d49ed2b5fbfb8975fc25e2fc92e62c72a5965d'],
  [535, '9b4892246f362d7651dc2bdd7daeaeebfb4803600a32f60a3248e17d659d905c'],
  [536, 'bb1f2f8ed1c75e668eb399d56733937e092e8e706331b0fa54f6d6dc186b5c13'],
]);
const files = new Map();
const allNumbers = new Set();
let under2500 = 0;
let under2500Effective = 0;
let under1500 = 0;
let totalCharacters = 0;
for (let i = 0; i < manifest.chapters.length; i++) {
  const entry = manifest.chapters[i];
  assert.equal(entry.number, i + 1, 'manifest chapter numbering must be consecutive');
  assert(/^chapters-\d{3}\.json$/.test(entry.part), 'unexpected chapter part path');
  if (!files.has(entry.part)) {
    const chapters = JSON.parse(fs.readFileSync(path.join(base, entry.part), 'utf8'));
    assert(Array.isArray(chapters), 'chapter part must be an array: ' + entry.part);
    files.set(entry.part, chapters);
  }
  const matching = files.get(entry.part).filter(c => c.number === entry.number);
  assert.equal(matching.length, 1, 'missing or duplicate chapter ' + entry.number + ' in ' + entry.part);
  const chapter = matching[0];
  assert.equal(typeof chapter.text, 'string', 'missing text in chapter ' + entry.number);
  assert(chapter.text.trim().length > 0, 'empty chapter ' + entry.number);
  assert.equal(chapter.title, entry.title, 'chapter title differs from manifest: ' + entry.number);
  assert(!allNumbers.has(chapter.number), 'duplicate chapter number ' + chapter.number);
  allNumbers.add(chapter.number);
  const length = [...chapter.text].length;
  // Effective length excludes whitespace and punctuation; keep this gate in
  // sync with the last chapter published from the revised master archive.
  const effective = [...chapter.text].filter(ch => /[\p{L}\p{N}]/u.test(ch)).length;
  if (chapter.number >= 376 && chapter.number <= 536) {
    assert(effective >= 2500, 'revised chapter below 2500 effective characters: ' + chapter.number);
  }
  if (revisionHashes.has(chapter.number)) {
    const actualHash = crypto.createHash('sha256').update(chapter.text, 'utf8').digest('hex');
    assert.equal(actualHash, revisionHashes.get(chapter.number),
      'published chapter diverges from reviewed master archive: ' + chapter.number);
  }
  if (effective < 2500) under2500Effective++;
  totalCharacters += length;
  if (length < 2500) under2500++;
  if (length < 1500) under1500++;
}
const partsTotal = [...files.values()].reduce((n, a) => n + a.length, 0);
assert.equal(partsTotal, manifest.chapterCount, 'unindexed chapters exist in parts');
console.log(JSON.stringify({
  project: manifest.title,
  chapterCount: manifest.chapterCount,
  totalCharacters,
  averageCharacters: Math.round(totalCharacters / manifest.chapterCount),
  under2500,
  under2500Effective,
  under1500,
  target: 2500,
  note: '字數不足為待編修警示，不視為通過品質審查。'
}, null, 2));
