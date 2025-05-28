let scene, camera, renderer;
let player1, player2, ball;
let goal1, goal2;
let player1Score = 0, player2Score = 0;
let keys = {};
let ballDirection = new THREE.Vector3();
let playerSpeed = 0.2;
let ballSpeedOnKick = 1;
let normalBallSpeed = 0.05;
let minDistanceToBall = 1;
let ballRadius = 0.5;
let victoryScreenShown = false;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 30, 20);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Campo
  const fieldGeometry = new THREE.PlaneGeometry(30, 20);
  const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x006400 });
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
  field.rotation.x = -Math.PI / 2;
  scene.add(field);

  // Linhas do campo
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const lines = new THREE.Group();

  const perimeter = [
    new THREE.Vector3(-15, 0.01, -10),
    new THREE.Vector3(15, 0.01, -10),
    new THREE.Vector3(15, 0.01, 10),
    new THREE.Vector3(-15, 0.01, 10),
    new THREE.Vector3(-15, 0.01, -10)
  ];
  lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(perimeter), lineMaterial));

  const midline = [
    new THREE.Vector3(0, 0.01, -10),
    new THREE.Vector3(0, 0.01, 10)
  ];
  lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(midline), lineMaterial));

  scene.add(lines);

  // Gols
  goal1 = createGoal(-15);
  scene.add(goal1);

  goal2 = createGoal(15);
  scene.add(goal2);

  // Jogadores maiores
  const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
  const playerMaterial1 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  player1 = new THREE.Mesh(playerGeometry, playerMaterial1);
  player1.position.set(0, 1, -8);
  scene.add(player1);

  const playerMaterial2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  player2 = new THREE.Mesh(playerGeometry, playerMaterial2);
  player2.position.set(0, 1, 8);
  scene.add(player2);

  // Bola
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 0.5, 0);
  scene.add(ball);

  // Controles
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  animate();
}

function createGoal(xPosition) {
  const goal = new THREE.Group();
  const postGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
  const barMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  let post1 = new THREE.Mesh(postGeometry, barMaterial);
  post1.position.set(xPosition, 1.5, -2);
  let post2 = post1.clone();
  post2.position.z = 2;
  let crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4), barMaterial);
  crossbar.position.set(xPosition, 3, 0);

  goal.add(post1, post2, crossbar);
  return goal;
}

function animate() {
  requestAnimationFrame(animate);

  // Movimentação dos jogadores
  if (keys['w']) player1.position.z -= playerSpeed;
  if (keys['s']) player1.position.z += playerSpeed;
  if (keys['a']) player1.position.x -= playerSpeed;
  if (keys['d']) player1.position.x += playerSpeed;

  if (keys['ArrowUp']) player2.position.z -= playerSpeed;
  if (keys['ArrowDown']) player2.position.z += playerSpeed;
  if (keys['ArrowLeft']) player2.position.x -= playerSpeed;
  if (keys['ArrowRight']) player2.position.x += playerSpeed;

  // Limites do campo
  limitPlayer(player1);
  limitPlayer(player2);

  // Drible e defesa automáticos
  handleDribbleAndDefense(player1);
  handleDribbleAndDefense(player2);

  // Chute
  if (keys[' ']) {
    attemptKick(player1);
  }
  if (keys['Enter']) {
    attemptKick(player2);
  }

  // Rebote nas bordas
  if (ball.position.x >= 15 - ballRadius || ball.position.x <= -15 + ballRadius) {
    ballDirection.x = -ballDirection.x;
  }
  if (ball.position.z >= 10 - ballRadius || ball.position.z <= -10 + ballRadius) {
    ballDirection.z = -ballDirection.z;
  }

  // Movimento e desaceleração da bola
  if (ballDirection.length() > 0) {
    ball.position.add(ballDirection);
    ballDirection.multiplyScalar(0.98);
    if (ballDirection.length() < 0.001) ballDirection.set(0, 0, 0);
  }

  // Gols
  if (ball.position.x <= -15 && Math.abs(ball.position.z) < 2) {
    player2Score++;
    updateScoreboard();
    resetBall();
  }
  if (ball.position.x >= 15 && Math.abs(ball.position.z) < 2) {
    player1Score++;
    updateScoreboard();
    resetBall();
  }

  renderer.render(scene, camera);
}

function limitPlayer(player) {
  player.position.x = Math.max(Math.min(player.position.x, 14), -14);
  player.position.z = Math.max(Math.min(player.position.z, 9), -9);
}

function handleDribbleAndDefense(player) {
  const distance = player.position.distanceTo(ball.position);
  if (distance < 0.5 + ballRadius) {
    let direction = new THREE.Vector3().subVectors(ball.position, player.position).normalize();
    ball.position.add(direction.multiplyScalar(0.1));
  }
}

function attemptKick(player) {
  const distance = player.position.distanceTo(ball.position);
  if (distance < 0.5 + ballRadius) {
    let direction = new THREE.Vector3().subVectors(ball.position, player.position).normalize();
    ballDirection.copy(direction).multiplyScalar(ballSpeedOnKick);
  }
}

function resetBall() {
  ball.position.set(0, 0.5, 0);
  ballDirection.set(0, 0, 0);
}

function updateScoreboard() {
  document.getElementById('player-score').textContent = player1Score;
  document.getElementById('enemy-score').textContent = player2Score;
}
function handleDribbleAndDefense(player) {
  const distance = player.position.distanceTo(ball.position);
  if (distance < 0.5 + ballRadius) {
    // Bola fica na frente do jogador
    let direction = new THREE.Vector3().subVectors(ball.position, player.position).normalize();
    ball.position.copy(player.position).add(direction.multiplyScalar(0.6)); // 0.6 pra ela ficar um pouco à frente
  }
}
function animate() {
  requestAnimationFrame(animate);

  // Movimentação dos jogadores
  if (keys['w']) player1.position.z -= playerSpeed;
  if (keys['s']) player1.position.z += playerSpeed;
  if (keys['a']) player1.position.x -= playerSpeed;
  if (keys['d']) player1.position.x += playerSpeed;

  if (keys['ArrowUp']) player2.position.z -= playerSpeed;
  if (keys['ArrowDown']) player2.position.z += playerSpeed;
  if (keys['ArrowLeft']) player2.position.x -= playerSpeed;
  if (keys['ArrowRight']) player2.position.x += playerSpeed;

  // Limites
  limitPlayer(player1);
  limitPlayer(player2);

  // Drible/defesa
  handleDribbleAndDefense(player1);
  handleDribbleAndDefense(player2);

  // Chutes
  if (keys[' ']) attemptKick(player1);
  if (keys['Enter']) attemptKick(player2);

  // Rebote do campo
  if (ball.position.x >= 15 - ballRadius || ball.position.x <= -15 + ballRadius) {
    ballDirection.x = -ballDirection.x;
  }
  if (ball.position.z >= 10 - ballRadius || ball.position.z <= -10 + ballRadius) {
    ballDirection.z = -ballDirection.z;
  }

  // Bola anda
  if (ballDirection.length() > 0) {
    ball.position.add(ballDirection);
    ballDirection.multiplyScalar(0.98); // Desacelera
    if (ballDirection.length() < 0.01) ballDirection.set(0, 0, 0);
  }

  // Gols - ajusta para ficar mais seguro
  if (ball.position.x <= -15 + ballRadius && Math.abs(ball.position.z) < 2) {
    player2Score++;
    updateScoreboard();
    resetBall();
  }
  if (ball.position.x >= 15 - ballRadius && Math.abs(ball.position.z) < 2) {
    player1Score++;
    updateScoreboard();
    resetBall();
  }

  renderer.render(scene, camera);
}
//
//
function updateScoreboard() {
  document.getElementById("player-score").textContent = player1Score;
  document.getElementById("enemy-score").textContent = player2Score;
}

function checkVictory() {
  if (player1Score >= 5) {
    showVictoryScreen("Jogador 1 venceu!");
  } else if (player2Score >= 5) {
    showVictoryScreen("Jogador 2 venceu!");
  }
}

function showVictoryScreen(message) {
  victoryScreenShown = true;

  const victoryDiv = document.createElement("div");
  victoryDiv.style.position = "absolute";
  victoryDiv.style.top = "50%";
  victoryDiv.style.left = "50%";
  victoryDiv.style.transform = "translate(-50%, -50%)";
  victoryDiv.style.fontSize = "48px";
  victoryDiv.style.color = "white";
  victoryDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  victoryDiv.style.padding = "20px";
  victoryDiv.style.borderRadius = "10px";
  victoryDiv.style.textAlign = "center";
  victoryDiv.textContent = message;

  document.body.appendChild(victoryDiv);
}