const game = document.getElementById("game");
const discus = document.getElementById("discus");
const rock = document.getElementById("rock");
const net = document.getElementById("net");
const plant = document.getElementById("plant");
const food = document.getElementById("food");

const startScreen = document.getElementById("startScreen");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const scoreDisplay = document.getElementById("score");
const gameOverScore = document.getElementById("gameOverScore");


// ==========================
// NASTAVENÍ HRY
// ==========================

const groundHeight = 95;

const jumpHeight = 110;

const ascentTime = 310;
const descentTime = 280;

const speed = 550;

const minSpawn = 650;
const maxSpawn = 1000;


// ==========================
// STAV HRY
// ==========================

let started = false;
let gameOverState = false;
let paused = false;

let score = 0;
let scoreStartTime = 0;
let bonusScore = 0;


// ==========================
// STAV SKOKU
// ==========================

let jumping = false;
let holding = false;
let ascending = false;

let y = groundHeight;

let jumpStartTime = 0;
let descentStartTime = 0;


// ==========================
// PŘEKÁŽKY
// ==========================

let obstacles = [];

let nextSpawn = 0;
let lastTime = 0;


// ==========================
// KRMENÍ
// ==========================

let foods = [];

let nextFoodSpawn = 0;
let lastFoodTime = 0;

const foodValue = 3;

const minFoodCount = 1;
const maxFoodCount = 5;


// ==========================
// SKRYTÍ ŠABLON
// ==========================

rock.style.left = "-1000px";
net.style.left = "-1000px";
plant.style.left = "-1000px";

discus.style.bottom = y + "px";


// ==========================
// NÁHODNÝ TYP PŘEKÁŽKY
// ==========================

function randomType() {

  const types = [
    "rock",
    "net",
    "plant"
  ];

  return types[
    Math.floor(
      Math.random() * types.length
    )
  ];
}


// ==========================
// VYTVOŘENÍ PŘEKÁŽKY
// ==========================

function spawn() {

  const type = randomType();


  // ==========================
  // SÍŤ MŮŽE PŘEKRÝVAT FOOD
  // ==========================

  if (type !== "net") {

    const obstacleWidth =
      type === "plant"
        ? plant.offsetWidth
        : rock.offsetWidth;

    const obstacleHeight =
      type === "plant"
        ? plant.offsetHeight
        : rock.offsetHeight;

    const obstacleBottom =
      type === "plant"
        ? parseFloat(
            getComputedStyle(plant).bottom
          )
        : parseFloat(
            getComputedStyle(rock).bottom
          );

    const obstacleTop =
      obstacleBottom +
      obstacleHeight;

    const margin = 80;


    // ==========================
    // KONTROLA EXISTUJÍCÍHO FOODU
    // ==========================

    for (const f of foods) {

      const foodLeft =
        f.position;

      const foodRight =
        foodLeft + 40;

      const foodBottom =
        parseFloat(
          getComputedStyle(
            f.element
          ).bottom
        );

      const foodTop =
        foodBottom + 40;


      const obstacleLeft =
        850;

      const obstacleRight =
        obstacleLeft +
        obstacleWidth;


      const overlap =
        obstacleLeft <
          foodRight + margin &&
        obstacleRight >
          foodLeft - margin &&
        obstacleBottom <
          foodTop + margin &&
        obstacleTop >
          foodBottom - margin;


      if (overlap) {

        return false;
      }
    }
  }


  // ==========================
  // VYTVOŘENÍ PŘEKÁŽKY
  // ==========================

  const template = {
    rock,
    net,
    plant
  }[type];

  const element =
    template.cloneNode(true);

  element.removeAttribute("id");

  element.classList.add(type);

  element.style.left =
    "850px";

  element.style.transform =
    "translateX(0px)";

  game.appendChild(element);

  obstacles.push({
    element: element,
    position: 850
  });

  return true;
}


// ==========================
// VYTVOŘENÍ KRMENÍ
// ==========================

function spawnFood() {

  const count =
    Math.floor(
      Math.random() *
      (maxFoodCount - minFoodCount + 1)
    ) + minFoodCount;

  const foodSpacing = 35;

  let startPosition = 850;

  let bottom =
    Math.random() < 0.5
      ? 220
      : 100;


  // ==========================
  // HLEDÁNÍ BEZPEČNÉ POZICE
  // ==========================

  let safe = false;
  let attempts = 0;

  while (!safe && attempts < 30) {

    safe = true;

    startPosition =
      850 +
      Math.random() * 150;

    bottom =
      Math.random() < 0.5
        ? 220
        : 100;


    // ==========================
    // KONTROLA KAŽDÉHO KUSU FOODU
    // ==========================

    for (let i = 0; i < count; i++) {

      const foodLeft =
        startPosition +
        i * foodSpacing;

      const foodRight =
        foodLeft + 40;

      const foodBottom =
        bottom;

      const foodTop =
        bottom + 40;


      for (const obstacle of obstacles) {

        // Síť může food překrývat
        if (
          obstacle.element.classList.contains("net")
        ) {
          continue;
        }


        // ==========================
        // POZICE PŘEKÁŽKY
        // ==========================

        const obstacleLeft =
          obstacle.position;

        const obstacleRight =
          obstacle.position +
          obstacle.element.offsetWidth;

        const obstacleBottom =
          parseFloat(
            getComputedStyle(
              obstacle.element
            ).bottom
          );

        const obstacleTop =
          obstacleBottom +
          obstacle.element.offsetHeight;


        // ==========================
        // OCHRANNÁ VZDÁLENOST
        // ==========================

        const margin = 80;


        // ==========================
        // KOLIZE
        // ==========================

        const overlap =
          foodLeft <
            obstacleRight + margin &&
          foodRight >
            obstacleLeft - margin &&
          foodBottom <
            obstacleTop + margin &&
          foodTop >
            obstacleBottom - margin;


        if (overlap) {

          safe = false;

          break;
        }
      }


      if (!safe) {

        break;
      }
    }


    attempts++;
  }


  // ==========================
  // VYTVOŘENÍ FOOD
  // ==========================

  for (let i = 0; i < count; i++) {

    const element =
      food.cloneNode(true);

    element.removeAttribute("id");

    element.classList.add("food");

    const position =
      startPosition +
      i * foodSpacing;

    element.style.left =
      "0px";

    element.style.transform =
      `translateX(${position}px)`;

    element.style.bottom =
      bottom + "px";

    game.appendChild(element);

    foods.push({
      element: element,
      position: position
    });
  }
}


// ==========================
// ZAČÁTEK SKOKU
// ==========================

function startJump() {

  if (
    !started ||
    gameOverState ||
    paused ||
    jumping
  ) {
    return;
  }

  jumping = true;
  holding = true;
  ascending = true;

  jumpStartTime =
    performance.now();

  descentStartTime = 0;
}


// ==========================
// KONEC DRŽENÍ
// ==========================

function stopJump() {

  holding = false;
}


// ==========================
// POHYB TERČOVCE
// ==========================

function updateDiscus(time) {

  // ==========================
  // SKÓRE
  // ==========================

  if (
    started &&
    !paused &&
    !gameOverState
  ) {

    score =
      Math.floor(
        (time - scoreStartTime) / 1000
      ) + bonusScore;

    scoreDisplay.textContent =
      score;
  }


  // ==========================
  // SKOK
  // ==========================

  if (
    !paused &&
    jumping
  ) {

    const elapsed =
      time - jumpStartTime;


    // ==========================
    // STOUPÁNÍ
    // ==========================

    if (ascending) {

      const progress =
        Math.min(
          elapsed / ascentTime,
          1
        );

      y =
        groundHeight +
        jumpHeight *
        Math.sin(
          progress * Math.PI / 2
        );

      if (progress >= 1) {

        ascending = false;
      }
    }


    // ==========================
    // DRŽENÍ NAHOŘE
    // ==========================

    else if (holding) {

      y =
        groundHeight +
        jumpHeight;
    }


    // ==========================
    // KLESÁNÍ
    // ==========================

    else {

      if (!descentStartTime) {

        descentStartTime =
          time;
      }

      const progress =
        Math.min(
          (time - descentStartTime) /
          descentTime,
          1
        );

      y =
        groundHeight +
        jumpHeight *
        Math.cos(
          progress * Math.PI / 2
        );

      if (progress >= 1) {

        y = groundHeight;

        jumping = false;
        ascending = false;

        descentStartTime = 0;
      }
    }

    discus.style.bottom =
      y + "px";
  }

  requestAnimationFrame(
    updateDiscus
  );
}

requestAnimationFrame(
  updateDiscus
);


// ==========================
// POHYB PŘEKÁŽEK
// ==========================

function moveObstacles() {

  if (
    !started ||
    paused ||
    gameOverState
  ) {

    requestAnimationFrame(
      moveObstacles
    );

    return;
  }

  const now =
    performance.now();

  if (!lastTime) {

    lastTime = now;
  }

  const dt =
    (now - lastTime) / 1000;

  lastTime = now;


  // ==========================
  // NOVÁ PŘEKÁŽKA
  // ==========================

  if (now >= nextSpawn) {

    const spawned =
      spawn();

    if (spawned) {

      nextSpawn =
        now +
        minSpawn +
        Math.random() *
        (maxSpawn - minSpawn);
    }
  }


  // ==========================
  // POHYB PŘEKÁŽEK
  // ==========================

  obstacles.forEach(o => {

    o.position -=
      speed * dt;

    o.element.style.transform =
      `translateX(${o.position - 850}px)`;
  });


  // ==========================
  // ODSTRANĚNÍ STARÝCH
  // ==========================

  obstacles =
    obstacles.filter(o => {

      if (o.position < -400) {

        o.element.remove();

        return false;
      }

      return true;
    });


  requestAnimationFrame(
    moveObstacles
  );
}

moveObstacles();


// ==========================
// POHYB KRMENÍ
// ==========================

function moveFood() {

  if (
    !started ||
    paused ||
    gameOverState
  ) {

    requestAnimationFrame(
      moveFood
    );

    return;
  }

  const now =
    performance.now();

  if (!lastFoodTime) {

    lastFoodTime = now;
  }

  const dt =
    (now - lastFoodTime) / 1000;

  lastFoodTime = now;


  // ==========================
  // NOVÁ SKUPINKA
  // ==========================

  if (now >= nextFoodSpawn) {

    spawnFood();

    nextFoodSpawn =
      now +
      900 +
      Math.random() * 1100;
  }


  // ==========================
  // POHYB KRMENÍ
  // ==========================

  foods.forEach(f => {

    f.position -=
      speed * dt;

    f.element.style.transform =
      `translateX(${f.position}px)`;
  });


  // ==========================
  // ODSTRANĚNÍ STARÉHO
  // ==========================

  foods =
    foods.filter(f => {

      if (f.position < -100) {

        f.element.remove();

        return false;
      }

      return true;
    });


  requestAnimationFrame(
    moveFood
  );
}

moveFood();


// ==========================
// SBÍRÁNÍ KRMENÍ
// ==========================

function checkFoodCollision() {

  if (
    started &&
    !paused &&
    !gameOverState
  ) {

    const d =
      discus.getBoundingClientRect();

    foods =
      foods.filter(f => {

        const r =
          f.element.getBoundingClientRect();

        const collision =
          d.left <= r.right &&
          d.right >= r.left &&
          d.top <= r.bottom &&
          d.bottom >= r.top;

        if (collision) {

          bonusScore +=
            foodValue;

          score =
            Math.floor(
              (
                performance.now() -
                scoreStartTime
              ) / 1000
            ) + bonusScore;

          scoreDisplay.textContent =
            score;

          f.element.remove();

          return false;
        }

        return true;
      });
  }

  requestAnimationFrame(
    checkFoodCollision
  );
}

requestAnimationFrame(
  checkFoodCollision
);


// ==========================
// KOLIZE
// ==========================

function checkCollision() {

  if (
    started &&
    !paused &&
    !gameOverState
  ) {

    const d =
      discus.getBoundingClientRect();

    for (const o of obstacles) {

      const r =
        o.element.getBoundingClientRect();

      const collision =
        d.left <= r.right &&
        d.right >= r.left &&
        d.top <= r.bottom &&
        d.bottom >= r.top;

      if (collision) {

        if (
          o.element.classList.contains("rock")
        ) {

          endGame(
            "Au! Terčovec narazil do kamene!"
          );
        }

        else if (
          o.element.classList.contains("plant")
        ) {

          endGame(
            "Terčovec se schoval mezi rostliny a odmítá vyplout."
          );
        }

        else if (
          o.element.classList.contains("net")
        ) {

          endGame(
            "Terčovec je v pasti!"
          );
        }

        break;
      }
    }
  }

  requestAnimationFrame(
    checkCollision
  );
}

requestAnimationFrame(
  checkCollision
);


// ==========================
// RESET HRY
// ==========================

function reset() {

  score = 0;
  bonusScore = 0;


  // ==========================
  // ODSTRANĚNÍ PŘEKÁŽEK
  // ==========================

  obstacles.forEach(o => {

    o.element.remove();
  });

  obstacles = [];


  // ==========================
  // ODSTRANĚNÍ KRMENÍ
  // ==========================

  foods.forEach(f => {

    f.element.remove();
  });

  foods = [];


  nextFoodSpawn =
    performance.now() + 900;


  // ==========================
  // SKRYTÍ ŠABLON
  // ==========================

  rock.style.left =
    "-1000px";

  net.style.left =
    "-1000px";

  plant.style.left =
    "-1000px";


  // ==========================
  // TERČOVEC
  // ==========================

  y = groundHeight;

  discus.style.bottom =
    y + "px";


  // ==========================
  // SKOK
  // ==========================

  jumping = false;
  holding = false;
  ascending = false;

  jumpStartTime = 0;
  descentStartTime = 0;


  // ==========================
  // PRVNÍ PŘEKÁŽKA
  // ==========================

  nextSpawn =
    performance.now() + 1000;


  // ==========================
  // ČASOVAČE
  // ==========================

  lastTime =
    performance.now();

  lastFoodTime =
    performance.now();
}


// ==========================
// GAME OVER
// ==========================

function endGame(message) {

  if (gameOverState) {

    return;
  }

  gameOverState = true;

  jumping = false;
  holding = false;


  // ==========================
  // ULOŽENÍ SKÓRE
  // ==========================

  const finalScore =
    score;


  // ==========================
  // ODSTRANĚNÍ OBJEKTŮ
  // ==========================

  obstacles.forEach(o => {

    o.element.remove();
  });

  obstacles = [];


  foods.forEach(f => {

    f.element.remove();
  });

  foods = [];


  // ==========================
  // GAME OVER OBRAZOVKA
  // ==========================

  startScreen.style.display =
    "flex";

  const gameTitle =
    document.querySelector(".gameTitle");

  gameTitle.textContent =
    "GAME OVER";

  gameTitle.classList.add(
    "gameOver"
  );


  document.querySelector(
    ".gameSubtitle"
  ).style.display =
    "none";


  gameOverScore.textContent =
    "SKÓRE: " + finalScore;

  gameOverScore.style.display =
    "block";


  alert(message);


  playButton.textContent =
    "HRÁT ZNOVU";


  // ==========================
  // STAV HRY
  // ==========================

  started = false;
}


// ==========================
// PAUZA
// ==========================

function togglePause() {

  if (
    !started ||
    gameOverState
  ) {

    return;
  }

  paused = !paused;


if (paused) {

  pauseButton.innerHTML =
    '<span class="playIcon"></span>';

  pauseButton.setAttribute(
    "aria-label",
    "Pokračovat"
  );
}

  else {

    lastTime =
      performance.now();

    lastFoodTime =
      performance.now();

    pauseButton.innerHTML =
  '<span class="pauseIcon"></span>';

    pauseButton.setAttribute(
      "aria-label",
      "Pauza"
    );
  }
}


// ==========================
// KLÁVESNICE
// ==========================

document.addEventListener(
  "keydown",
  event => {

    if (event.code === "Space") {

      if (!event.repeat) {

        startJump();
      }

      event.preventDefault();
    }


    if (event.code === "KeyP") {

      togglePause();
    }
  }
);


document.addEventListener(
  "keyup",
  event => {

    if (event.code === "Space") {

      stopJump();
    }
  }
);


// ==========================
// MOBIL
// ==========================

document.addEventListener(
  "touchstart",
  event => {

    if (
      event.target.closest(
        "#playButton"
      ) ||
      event.target.closest(
        "#pauseButton"
      )
    ) {

      return;
    }

    if (
      !started ||
      gameOverState ||
      paused
    ) {

      return;
    }

    startJump();

    event.preventDefault();
  },
  {
    passive: false
  }
);


document.addEventListener(
  "touchend",
  event => {

    if (
      event.target.closest(
        "#playButton"
      ) ||
      event.target.closest(
        "#pauseButton"
      )
    ) {

      return;
    }

    stopJump();

    event.preventDefault();
  },
  {
    passive: false
  }
);


// ==========================
// PAUZA TLAČÍTKEM
// ==========================

pauseButton.addEventListener(
  "click",
  togglePause
);


// ==========================
// PLAY
// ==========================

playButton.addEventListener(
  "click",
  function(event) {

    event.preventDefault();
    event.stopPropagation();


    // ==========================
    // NOVÁ HRA
    // ==========================

    started = true;
    gameOverState = false;
    paused = false;


    // ==========================
    // OBNOVENÍ START OBRAZOVKY
    // ==========================

    const gameTitle =
      document.querySelector(".gameTitle");

    gameTitle.innerHTML =
      '<span class="reallText">ReAll</span><span class="runText"> Run</span>';

    gameTitle.classList.remove(
      "gameOver"
    );


    document.querySelector(
      ".gameSubtitle"
    ).style.display =
      "block";


    gameOverScore.textContent =
      "";

    gameOverScore.style.display =
      "none";


    // ==========================
    // RESET
    // ==========================

    reset();


    score = 0;
    bonusScore = 0;

    scoreStartTime =
      performance.now();

    scoreDisplay.textContent =
      "0";


    // ==========================
    // PAUZA
    // ==========================

    pauseButton.innerHTML =
  '<span class="pauseIcon"></span>';

    pauseButton.setAttribute(
      "aria-label",
      "Pauza"
    );


    // ==========================
    // SKRYTÍ START OBRAZOVKY
    // ==========================

    startScreen.style.display =
      "none";
  }
);