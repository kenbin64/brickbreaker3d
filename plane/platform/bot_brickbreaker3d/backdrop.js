// Landing backdrop: wrecking ball hits a brick wall, bricks fly in colorful wireframe
(function(){
  const container = document.getElementById('container');
  let scene, camera, renderer, bricks = [], ball, pivot;
  const brickData = [];
  const clock = new THREE.Clock();

  init();
  animate();

  function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071019);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.position.set(0, 6, 28);

    renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
    renderer.setPixelRatio(window.devicePixelRatio||1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222244, 0.9);
    scene.add(hemi);

    // Create brick wall grid
    const rows = 6, cols = 12;
    const bw = 1.6, bh = 0.8, gap = 0.12;
    const startX = -((cols*(bw+gap))-gap)/2 + bw/2;
    const startY = 3.2;
    const startZ = -2;
    const palette = [0xff5d73,0xffb86b,0xfff16d,0x6be4ff,0x8aff8a,0xb98aff];

    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const geo = new THREE.BoxGeometry(bw, bh, 0.9);
        const mat = new THREE.MeshStandardMaterial({color: palette[(r*c)%palette.length], wireframe:true, wireframeLinewidth:1});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(startX + c*(bw+gap), startY + r*(bh+gap), startZ);
        mesh.userData = { dynamic:false, vel:new THREE.Vector3(), life:0 };
        scene.add(mesh);
        bricks.push(mesh);
      }
    }

    // Wrecking ball pivot
    pivot = new THREE.Object3D();
    pivot.position.set(0, 10, 6);
    scene.add(pivot);

    const chainGeo = new THREE.CylinderGeometry(0.03,0.03,6,8);
    const chain = new THREE.Mesh(chainGeo, new THREE.MeshBasicMaterial({color:0xaaaaaa}));
    chain.position.set(0,-3,0);
    pivot.add(chain);

    const ballGeo = new THREE.SphereGeometry(1.1, 24, 18);
    const ballMat = new THREE.MeshStandardMaterial({color:0x3333ff,emissive:0x3322ff,metalness:0.6,roughness:0.2});
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(3.5, 6, 6);
    pivot.add(ball);

    window.addEventListener('resize', onResize);
    container.addEventListener('click', triggerSwing);
  }

  let swingActive = false;
  let swingStart = 0;

  function triggerSwing(){
    swingActive = true; swingStart = clock.getElapsedTime();
    // impart initial amplitude
    pivot.userData.amplitude = 1.2;
    pivot.userData.freq = 2.0;
  }

  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // swing calculation
    if(swingActive){
      const a = pivot.userData.amplitude || 1.2;
      const f = pivot.userData.freq || 2.0;
      const damp = Math.exp(-(t - swingStart)*0.7);
      const angle = Math.sin((t - swingStart)*f) * a * damp;
      pivot.rotation.z = angle;

      // compute world position of ball
      const ballWorldPos = new THREE.Vector3();
      ball.getWorldPosition(ballWorldPos);

      // check collisions with bricks
      for(const b of bricks){
        if(b.userData.dynamic) continue;
        const dist = b.position.distanceTo(ballWorldPos);
        if(dist < 2.0){
          // turn dynamic and give velocity
          b.userData.dynamic = true;
          const dir = new THREE.Vector3().subVectors(b.position, ballWorldPos).normalize();
          b.userData.vel.copy(dir.multiplyScalar(6.0 * (1.0 - Math.min(dist,2)/2)));
          b.userData.vel.y = 3 + Math.random()*2;
        }
      }
    } else {
      // idle subtle bob
      pivot.rotation.z = Math.sin(t*0.2)*0.02;
    }

    // update dynamic bricks
    for(let i=bricks.length-1;i>=0;i--){
      const b = bricks[i];
      if(b.userData.dynamic){
        // integrate
        b.userData.vel.y -= 9.8 * dt; // gravity
        b.position.addScaledVector(b.userData.vel, dt);
        b.rotation.x += b.userData.vel.y * 0.02;
        b.userData.life += dt;
        // fade out after a while and remove
        if(b.userData.life > 3.5){ scene.remove(b); bricks.splice(i,1); }
      }
    }

    renderer.render(scene, camera);
  }

  function onResize(){ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

})();
