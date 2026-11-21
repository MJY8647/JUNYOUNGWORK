/* 프리비즈 렌더용: 만화 폰팔이 대신 실사 3D 폰팔이(characters/glb)를 각 노점 자리에 세움.
   GLTFLoader(three r128)를 먼저 불러야 함. 노점(카운터·폰 상자)이 사람의 약 2.6배 크기로 만들어져 있어서, 같은 비율이 되도록 키 1.75m ≈ 4.6 단위로 맞춤 */
window.addRealDealers = function (base) {
  var T = THREE, w = PP.world(), loader = new T.GLTFLoader(), ids = Object.keys(w.dealers);
  return Promise.all(ids.map(function (id) {
    return new Promise(function (res) {
      loader.load(base + id + ".glb", function (g) {
        var o = g.scene; o.scale.setScalar(4.6 / 1.75);
        o.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
        var d = w.dealers[id]; d.group.visible = false; d.holder.add(o); d.real = o; res(id);
      }, undefined, function (e) { res("fail " + id + " " + e); });
    });
  }));
};
