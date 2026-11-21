/* 프리비즈 렌더용: 만화 폰팔이 대신 실사 3D 폰팔이(characters/glb)를 각 노점 자리에 세움.
   GLTFLoader(three r128)를 먼저 불러야 함. 노점(카운터·폰 상자)이 사람의 약 2.6배 크기로 만들어져 있어서, 같은 비율이 되도록 키 1.75m ≈ 4.6 단위로 맞춤 */
// 리깅 때 생긴 팔 벌린 자세(A 포즈)를 팔을 내리고 팔꿈치를 살짝 굽힌 자연스러운 선 자세로 바꿈 (뼈만 돌림, 메시는 스키닝으로 따라옴)
function relax(o) {
  var T = THREE, V = T.Vector3, Q = T.Quaternion;
  o.updateMatrixWorld(true);
  var pos = function (b) { return new V().setFromMatrixPosition(b.matrixWorld); };
  var head = o.getObjectByName("Head"), hf = o.getObjectByName("headfront"), hips = o.getObjectByName("Hips");
  var fwd = pos(hf).sub(pos(head)); fwd.y = 0; fwd.normalize();                    // 얼굴이 향한 쪽
  var right = new V().crossVectors(fwd, new V(0, 1, 0)).normalize();
  function aim(bone, child, dir) {
    var cur = pos(child).sub(pos(bone)).normalize();
    var dq = new Q().setFromUnitVectors(cur, dir.clone().normalize());
    var wq = bone.getWorldQuaternion(new Q()), pq = bone.parent.getWorldQuaternion(new Q());
    bone.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
    o.updateMatrixWorld(true);
  }
  ["Left", "Right"].forEach(function (s) {
    var arm = o.getObjectByName(s + "Arm"), fore = o.getObjectByName(s + "ForeArm"), hand = o.getObjectByName(s + "Hand");
    if (!arm || !fore || !hand) return;
    var side = Math.sign(pos(arm).sub(pos(hips)).dot(right)) || 1, out = right.clone().multiplyScalar(side);
    aim(arm, fore, new V(0, -1, 0).addScaledVector(out, .14).addScaledVector(fwd, .04));   // 위팔: 몸 옆으로 내림
    aim(fore, hand, new V(0, -1, 0).addScaledVector(out, .06).addScaledVector(fwd, .32));  // 아래팔: 팔꿈치를 살짝 굽혀 앞으로
  });
}
window.addRealDealers = function (base) {
  var T = THREE, w = PP.world(), loader = new T.GLTFLoader(), ids = Object.keys(w.dealers);
  return Promise.all(ids.map(function (id) {
    return new Promise(function (res) {
      loader.load(base + id + ".glb", function (g) {
        var o = g.scene; o.scale.setScalar(4.6 / 1.75);
        o.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
        relax(o);
        var d = w.dealers[id]; d.group.visible = false; d.holder.add(o); d.real = o; res(id);
      }, undefined, function (e) { res("fail " + id + " " + e); });
    });
  }));
};
