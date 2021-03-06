class Player {
  constructor(startX, startY, gameContainer) {
    this.x = startX;
    this.y = startY;
    this.lastX = startX;
    this.lastY = startY;
    this.dx = 0;
    this.dy = 0;
    this.gravCounter = 0;
    this.height = 25;
    this.width = 23;
    this.lives = 5;

    //values for easing collision calculations
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;

    //movement upgrades
    this.doubleJumpUnlocked = false;
    this.wallJumpUnlocked = false;
    this.dashUnlocked = false;

    //storing key inputs
    this.movingLeft = false;
    this.movingRight = false;
    this.jumping = false;
    this.doubleJump = true;
    this.dashing = 0;

    //html stuff
    this.renderLives();
    this.gameContainer = gameContainer;
    this.container = document.createElement("div");
    this.container.classList.add("player");
    this.gameContainer.appendChild(this.container);
    this.disabled = true;

    //character image
    // this.container.style.backgroundImage = "url(./assets/dinoBlueCharacter/dinoBlueIdleRight.png)";
    // this.rightMovingSpriteArray = [
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight1.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight2.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight3.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight4.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight5.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunRight6.png)"
    // ];
    // this.leftMovingSpriteArray = [
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft1.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft2.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft3.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft4.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft5.png)",
    //   "url(./assets/dinoBlueCharacter/dinoBlueRunLeft6.png)"
    // ];
    // this.idleSpriteArray = ["url(./assets/dinoBlueCharacter/dinoBlueIdleRight.png)", "url(./assets/dinoBlueCharacter/dinoBlueIdleLeft.png)"];
    this.rightMovingSpriteIndex = 0;
    this.leftMovingSpriteIndex = 0;
    this.idleSpriteIndex = 0;
    this.deathSpriteIndex = 0;
  }

  setLevel(level) {
    this.setXY(level.startPositionX, level.startPositionY);
    this.level = level;
  }

  setXY(x, y) {
    this.x = x;
    this.y = y;
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;
  }
  isMoved(dx, dy) {
    if (
      (dx > 0 && this.collidesRight(this.level.blocks, dx, dy)) ||
      (dx < 0 && this.collidesLeft(this.level.blocks, dx, dy)) ||
      (dy > 0 && this.collidesBottom(this.level.blocks, dy, dx)) ||
      (dy < 0 && this.collidesTop(this.level.blocks, dy, dx))
    ) {
      console.log("SQUISH");
      this.die();
    } else {
      this.setXY(this.x + dx, this.y + dy);
    }
  }

  //only spot this.x and this.y should be modified

  //triggered by an early keyup, allows for shorter jumps
  haltJump() {
    console.log("Halt jump");
    this.jumping = false;
    if (this.isAirborne()) {
      if (this.dy < 0) {
        this.dy = this.dy / 2;
        this.dy = Math.floor(this.dy);
      }
    }
  }

  //max jump height set here
  processJumpInput() {
    if (!this.isAirborne()) {
      console.log("jump");
      this.jumping = true;
      this.jump(17);
    } else if (this.wallJumpUnlocked && this.isAgainstWall() !== 0) {
      this.jumping = true;
      console.log("walljump");
      this.wallJump(14, this.isAgainstWall() * 8);
    } else if (this.doubleJumpUnlocked && this.doubleJump && this.dashing === 0) {
      this.jumping = true;
      console.log("djump");
      this.doubleJump = false;
      this.jump(11);
    }
  }

  jump(n) {
    this.dy = -1 * n;
  }
  wallJump(y, x) {
    this.jump(y);
    this.dx = x;
  }

  initiateDash() {
    this.dashing = 7;
    this.dy = 0;
    let direction = 0;
    if (this.isAirborne()) {
      this.jumping = true;
    }

    if (this.movingRight) {
      direction = 1;
    } else if (this.movingLeft) {
      direction = -1;
    }

    this.dx = direction * 20;
  }
  completeDash() {
    this.jumping = false;

    this.dx = 0;
    this.dashing = 1;
    console.log("dash ending");
    setTimeout(() => {
      console.log("dash ended");
      this.dashing = 0;
    }, 200);
  }

  //triggered by keyUp --- applies slow()
  haltLeft() {
    this.movingLeft = false;
  }
  haltRight() {
    this.movingRight = false;
  }

  //gradually fall when airborne
  applyGravity() {
    if (this.gravCounter <= 0) {
      if (this.isAirborne() && this.dashing <= 1 && this.dy <= 20) {
        this.dy += 1;
      }
      if (this.isAgainstWall() && this.wallJumpUnlocked && this.dy > 3) {
        this.dy = 3;
      }
      this.gravCounter = 0;
    } else {
      if (this.dy < 0) {
        this.gravCounter -= 2;
      } else {
        this.gravCounter--;
      }
    }
  }

  //produces a sliding/skidding if you are moving too fast
  slowDown(num) {
    if (this.dx < 2 && this.dx > -2) {
      this.dx = 0;
    } else {
      if (this.dx > 0) {
        this.dx -= this.dx / num;
        //   this.dx = Math.floor(this.dx);
      } else {
        this.dx -= this.dx / num;
        //this.dx = Math.ceil(this.dx);
      }
    }
  }

  //can't instantly change direction in the air, but can slow down/speed up
  moveRight() {
    this.movingRight = true;
    if (this.isAgainstWall() !== -1) {
      if (this.isAirborne()) {
        if (this.dx < 0) {
          this.slowDown(5);
        } else if (this.dx < 6) {
          this.dx += 1;
        }
      } else if (this.dx < -5) {
        this.slowDown(6);
      } else if (this.dx < 2) {
        this.dx = 2;
      } else if (this.dx < 8) {
        this.dx += 0.5;
      }
    }
  }
  moveLeft() {
    this.movingLeft = true;
    if (this.isAgainstWall() !== 1) {
      if (this.isAirborne()) {
        if (this.dx > 0) {
          this.slowDown(5);
        } else if (this.dx > -6) {
          this.dx -= 1;
        }
      } else if (this.dx > 5) {
        this.slowDown(6);
      } else if (this.dx > -2) {
        this.dx = -2;
      } else if (this.dx > -8) {
        this.dx -= 0.5;
      }
    }
  }

  collidesCoin(obj) {
    if (obj.status === "coin") {
      this.level.removeCoin(obj);
      this.level.updateScore(10);
      return true;
    } else if (obj.status === "doubleJump") {
      this.level.removeCoin(obj);
      this.doubleJumpUnlocked = true;
      return true;
    } else if (obj.status === "wallJump") {
      this.level.removeCoin(obj);
      this.wallJumpUnlocked = true;
      return true;
    } else if (obj.status === "dash") {
      this.level.removeCoin(obj);
      this.dashUnlocked = true;
      return true;
    }
    return false;
  }

  //collisions are against each object target
  // first checks if the object is above/below/ahead/behind the given object
  // then determines if the object's relevant side would pass through the object's relevant side if current dx/dy were applied.
  collidesTop(objects, value = this.dy, interceptValue = this.dx, shrink = false) {
    let ret = false;
    if (this.y + value <= 0) {
      return true;
    } else if (objects.length > 0) {
      objects.forEach(obj => {
        if (obj.visible && this.verticallyIntercepts(obj, interceptValue, shrink) && this.top >= obj.bottom && this.top + value <= obj.bottom) {
          if (!this.collidesCoin(obj)) {
            ret = obj;
          }
        }
      });
    }
    return ret;
  }
  //additional paramater here so as to check airborne(doesn't consider dx or)
  //if collision with bottom, reset to original position
  collidesBottom(objects, yValue = this.dy, xValue = this.dx, shrink = false) {
    let ret = false;
    if (this.y + yValue >= this.gameContainer.clientHeight) {
      this.die();
    } else if (objects.length > 0) {
      objects.forEach(obj => {
        if (obj.visible && this.verticallyIntercepts(obj, xValue, shrink) && this.bottom <= obj.top && this.bottom + yValue >= obj.top) {
          if (!this.collidesCoin(obj)) {
            ret = obj;
          }
        }
      });
      return ret;
    }
  }
  collidesLeft(objects, xValue = this.dx, yValue = this.dy, shrink = false) {
    let ret = false;
    if (this.x + this.dx <= 0) {
      return true;
    } else if (objects.length > 0) {
      objects.forEach(obj => {
        if (obj.visible && this.horizontallyIntercepts(obj, yValue, shrink) && this.left + xValue <= obj.right && this.left >= obj.right) {
          if (!this.collidesCoin(obj)) {
            ret = obj;
          }
        }
      });
      return ret;
    }
  }
  collidesRight(objects, xValue = this.dx, yValue = this.dy, shrink = false) {
    let ret = false;
    if (this.x + this.dx + this.width >= this.gameContainer.clientWidth) {
      return true;
    } else if (objects.length > 0) {
      objects.forEach(obj => {
        if (obj.visible && this.horizontallyIntercepts(obj, yValue, shrink) && this.right <= obj.left && this.right + xValue >= obj.left) {
          if (!this.collidesCoin(obj)) {
            ret = obj;
          }
        }
      });
    }
    return ret;
  }

  collidesAll(objects, wiggle) {
    return this.collidesLeft(objects, -1, wiggle, true) || this.collidesRight(objects, 1, wiggle, true) || this.collidesBottom(objects, 1, wiggle, true) || this.collidesTop(objects, -1, wiggle, true);
  }
  specialCollisions() {
    this.goalCollisions();
    this.badCollisions();
  }

  badCollisions() {
    if (typeof this.collidesAll(this.level.hazards, 3) === "object") {
      this.die();
    }
  }
  goalCollisions() {
    if (typeof this.collidesAll(this.level.goal, 0) === "object") {
      this.disabled = true;
      this.level.disabled = true;
      this.level.updateScore(100);
      let time = this.level.time;
      this.level.callTime(true);
      const success = document.createElement("div");
      success.classList.add("option-menu");
      success.innerHTML = `LEVEL COMPLETE <br> TIME: ${time} <br> SCORE: ${this.level.currentScore} <br> HIGH SCORE: ${this.level.highScore}`;
      this.level.submitScore();

      this.gameContainer.appendChild(success);
      setTimeout(() => {
        success.remove();
        this.level.complete(this);
        this.level = currentLevel;
        this.dx = 0;
        this.dy = 0;
        this.setXY(this.level.startPositionX, this.level.startPositionY);
        this.disabled = false;
        this.level.disabled = false;
      }, 2500);
    }
  }
  die() {
    this.disabled = true;
    this.level.disabled = true;
    this.setXY(this.level.startPositionX, this.level.startPositionY);
    this.dx = 0;
    this.dy = 0;
    this.lives--;
    this.renderLives();
    this.deathSpriteInterval = setInterval(deathSprite.bind(this), 150);
    function deathSprite() {
      this.container.style.backgroundImage = this.deathSpriteArray[this.deathSpriteIndex];
      if (this.deathSpriteIndex < 3) {
        this.deathSpriteIndex++;
      } else {
        this.deathSpriteIndex = 0;
      }
    }
    if (this.lives === 0) {
      this.gameOver();
    } else {
      setTimeout(() => {
        this.disabled = false;
        this.level.disabled = false;
        console.log("level enabled", this.level, this.level.disabled);
        clearInterval(this.deathSpriteInterval);
        this.deathSpriteIndex = 0;
      }, 1000);
    }
  }
  gameOver() {
    this.level.callTime(false);
    this.level.renderScore();
    const gameOver = document.createElement("div");
    gameOver.classList.add("option-menu");
    gameOver.innerHTML = `GAME OVER <br>  SCORE: ${this.level.currentScore} <br> HIGH SCORE: ${this.level.highScore}`;
    if (this.level.currentScore > 0) {
      this.level.submitScore();
    }

    this.gameContainer.appendChild(gameOver);
    setTimeout(() => {
      clearInterval(this.deathSpriteInterval);
      this.deathSpriteIndex = 0;
      this.lives = 5;
      this.renderLives();
      gameOver.remove();
      currentGame.restart(this);
      this.level.drop();
      this.setLevel(currentLevel);
      this.level.init();

      this.disabled = false;
      this.level.disabled = false;
    }, 2500);
  }

  //is the object's current position 1px above another object's top?
  isAirborne() {
    return !this.collidesBottom(this.level.blocks, 1, 0);
  }

  isAgainstWall() {
    if (this.collidesLeft(this.level.blocks, -1, 0)) {
      return 1;
    } else if (this.collidesRight(this.level.blocks, 1, 0)) {
      return -1;
    } else {
      return 0;
    }
  }

  //determines if a block is above/beneath/ahead/behind the player
  horizontallyIntercepts(obj, otherValue, shrink) {
    if (shrink) {
      return obj.top < this.bottom - otherValue && obj.bottom > this.top + otherValue;
    } else {
      return obj.top < this.bottom + otherValue && obj.bottom > this.top + otherValue;
    }
  }
  verticallyIntercepts(obj, otherValue, shrink) {
    if (shrink) {
      return obj.left < this.right - otherValue && obj.right > this.left + otherValue;
    } else {
      return obj.left < this.right + otherValue && obj.right > this.left + otherValue;
    }
  }

  //boolean flag is only true if there are no collisions
  //each time a collision is flagged, the relavant dx/dy is brought down/up slightly
  //final dx/dy will move the player to a position exactly against the object
  collisions() {
    let allGood = false;
    while (!allGood) {
      allGood = true;
      if (this.collidesRight(this.level.blocks)) {
        this.dx -= 1;
        allGood = false;
      }
      if (this.collidesLeft(this.level.blocks)) {
        this.dx += 1;
        allGood = false;
      }
      if (this.collidesBottom(this.level.blocks)) {
        this.dy -= 1;
        allGood = false;
      }
      if (this.collidesTop(this.level.blocks)) {
        this.dy += 1;
        allGood = false;
      }
    }
  }

  //Acts, applies slows, then collisions, then sets values
  draw(inputs) {
    if (!this.disabled) {
      this.specialCollisions();
      if (!this.isAirborne()) {
        this.doubleJump = true;
      }
      if (this.dashing > 2) {
        this.dashing -= 1;
        if (this.dashing <= 2) {
          this.completeDash();
        }
      }
      if (inputs.jump && !this.jumping) {
        this.processJumpInput();
      }
      if (this.dashUnlocked && inputs.dash && this.dashing === 0) {
        this.initiateDash();
      }
      if (inputs.left) {
        this.moveLeft();
      }
      if (inputs.right) {
        this.moveRight();
      }
      this.applyGravity();
      if (!this.isAirborne() && !this.movingRight && !this.movingLeft) {
        this.slowDown(5);
      }
      this.collisions();
      this.setXY(this.x + this.dx, this.y + this.dy);
      this.render();
    }
  }

  renderLives() {
    const livesBar = document.getElementById("lives-bar");
    // livesBar.innerText = "";
    while (livesBar.firstChild) {
      livesBar.removeChild(livesBar.firstChild);
    }

    for (let i = 0; i < this.lives; i++) {
      // livesBar.innerText += " <3";
      let liveDiv = document.createElement("div");
      liveDiv.style.float = "left";
      liveDiv.style.height = "17px";
      liveDiv.style.width = "17px";
      liveDiv.style.backgroundImage = "url(./assets/hearts/heart.png)";
      livesBar.appendChild(liveDiv);
    }
  }
  render() {
    if (!this.disabled) {
      this.container.style.minHeight = `${this.height}px`;
      this.container.style.minWidth = `${this.width}px`;
      this.container.style.top = `${this.y}px`;
      this.container.style.left = `${this.x}px`;
      ``;

      if (this.isAgainstWall() === 1 && this.wallJumpUnlocked) {
        this.container.style.backgroundImage = this.idleSpriteArray[0];
      } else if (this.isAgainstWall() === -1 && this.wallJumpUnlocked) {
        this.container.style.backgroundImage = this.idleSpriteArray[1];
      } else if (this.movingRight) {
        this.rightMovingSpriteIndex === 5 ? (this.rightMovingSpriteIndex = 0) : (this.rightMovingSpriteIndex += 1);
        this.leftMovingSpriteIndex = 0;
        this.idleSpriteIndex = 0;
        this.container.style.backgroundImage = this.rightMovingSpriteArray[this.rightMovingSpriteIndex];
      } else if (this.movingLeft) {
        this.leftMovingSpriteIndex === 5 ? (this.leftMovingSpriteIndex = 0) : (this.leftMovingSpriteIndex += 1);
        this.rightMovingSpriteIndex = 0;
        this.idleSpriteIndex = 1;
        this.container.style.backgroundImage = this.leftMovingSpriteArray[this.leftMovingSpriteIndex];
      } else {
        // console.log("idle")
        // this.idleSpriteIndex === 3 ? this.idleSpriteIndex = 0 : this.idleSpriteIndex += 1;
        // this.rightMovingSpriteIndex = 0;
        // this.leftMovingSpriteIndex = 0;
        this.container.style.backgroundImage = this.idleSpriteArray[this.idleSpriteIndex];
      }
    }
  }
}
