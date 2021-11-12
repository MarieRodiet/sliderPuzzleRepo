class SliderPuzzle {
    constructor() {

        this.$imageInput = document.getElementById("image");
        this.$startPuzzleBtn = document.getElementById("startButton");
        this.$playAgainBtn = document.getElementById("playAgain");


        this.$defaultImage = document.getElementById("defaultImage");
        this.$canvas = document.getElementById("imgCanvas");
        this.context = this.$canvas.getContext("2d");
        this.$canvas.style.cursor = "pointer";
        this.deviceWidth = window.innerWidth;


        this.$status = document.getElementById("status");


        this.image = this.$defaultImage;
 
        this.imageTiles = new Array();
        this.emptyTile = {};
        this.puzzle = {
            rowSize: 4,
            tileHeight: 0,
            tileWidth: 0,
            tiles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        }

        this.createCanvas();
        this.createImage();
        this.addEventListeners();
    }

    createCanvas() {
        this.$canvas.width = Math.min(640, this.deviceWidth - 30);
        this.$canvas.height = Math.min(480, this.deviceWidth);
    }

    createImage() {
        //The canvas context is an object with properties and methods 
        //that you can use to render graphics inside the canvas element.
        this.context.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
        this.$canvas.width = this.image.width;
        this.$canvas.height = this.image.height;
        this.context.drawImage(this.image, 0, 0);
    }

    addEventListeners() {
        this.loadImage = this.loadImage.bind(this);
        this.playAgain = this.playAgain.bind(this);
        this.createPuzzle = this.createPuzzle.bind(this);
        this.tileClick = this.tileClick.bind(this);

        this.$imageInput.addEventListener("change", this.loadImage);
        this.$startPuzzleBtn.addEventListener("click", this.createPuzzle);
        this.$playAgainBtn.addEventListener("click", this.playAgain);
        this.$canvas.addEventListener("click", this.tileClick);
    }

    loadImage() {
        if (this.$imageInput.files && this.$imageInput.files[0]) {
            this.image.width = this.$imageInput.clientWidth;
            this.image.height = this.$imageInput.clientHeight;
            let reader = new FileReader();
            reader.onload = () => {
                this.image = new Image();
                this.image.onload = () => { this.createImage() };
                this.image.src = reader.result;
            }
            reader.readAsDataURL(this.$imageInput.files[0]);
        }
    }

    //define and initialize the virtual board
    createPuzzle() {
        [this.puzzle.tileWidth, this.puzzle.tileHeight] = [this.image.width / 4, this.image.height / 4];
        this.imageTiles = new Array();
        let tile = new Object();
        let xOriginalPosition = 0, yOriginalPosition = 0;
        while (this.imageTiles.length < this.puzzle.tiles.length) {
            tile = {};
            //set the x and y positions of tiles in the original image
            [tile.xOriginal, tile.yOriginal] = [xOriginalPosition, yOriginalPosition];
            //sets empty tile
            if (xOriginalPosition == 0 && yOriginalPosition == 0) {
                [this.emptyTile.xOriginal, this.emptyTile.yOriginal] = [xOriginalPosition, yOriginalPosition];
            }
            this.imageTiles.push(tile);
            //xOriginalPosition doubles at each tile
            xOriginalPosition += this.puzzle.tileWidth;
            //check if tile needs to start a new row
            if (xOriginalPosition >= this.puzzle.tileWidth * this.puzzle.rowSize) {
                xOriginalPosition = 0;
                yOriginalPosition += this.puzzle.tileHeight;
            }
        }
        //shuffles the tiles
        this.imageTiles = this.shuffleArray(this.imageTiles);

        //mixTiles virtually
        this.mixTiles();
        //draws puzzle on the board
        this.drawPuzzle();
        //client can click on tiles
        this.$canvas.addEventListener("mousedown", this.tileClick);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 2));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    //virtually draws the puzzle for the 1st time: xPositions and yPositions manually set to each tile
    mixTiles() {
        let tile = new Object();
        let xPosition = 0, yPosition = 0;
        for (let i = 0; i < this.imageTiles.length; i++) {
            tile = this.imageTiles[i];
            [tile.xPosition, tile.yPosition] = [xPosition, yPosition];
            if (this.imageTiles[i].xOriginal == this.emptyTile.xOriginal && this.imageTiles[i].yOriginal == this.emptyTile.yOriginal) {
                [this.emptyTile.xPosition, this.emptyTile.yPosition] = [xPosition, yPosition];
            }
            //increment horizontally and vertically for the next tile in line
            xPosition += this.puzzle.tileWidth;
            if (xPosition >= this.puzzle.tileWidth * this.puzzle.rowSize) {
                xPosition = 0;
                yPosition += this.puzzle.tileHeight;
            }

        }
    }

    tileClick(event) {
        //check if game is over (all coordinates match)
        if (this.checkWin()) {
            this.playAgain();
        }
        else {
            let canvasCoordinates = this.windowToCanvas(event.clientX, event.clientY);
            let tile = this.checkPieceClicked(canvasCoordinates);
            let tileIndex, emptyTileIndex;
            if (tile && this.canMove(tile)) {
                //if the tile is allowed to move, then it should have its xPositions and yPositions changed
                for (let element of this.imageTiles) {
                    //find index of empty tile in the array
                    if (element.xOriginal == this.emptyTile.xOriginal && element.yOriginal == this.emptyTile.yOriginal) {
                        emptyTileIndex = this.imageTiles.indexOf(element);
                    }
                    //find index of clicked tile in the array
                    if (element == tile) {
                        tileIndex = this.imageTiles.indexOf(element);
                    }
                }
                [this.emptyTile.xPosition, this.emptyTile.yPosition] = [tile.xPosition, tile.yPosition];
                //switch xPositions of emptyTile and tile
                [this.imageTiles[tileIndex].xPosition, this.imageTiles[emptyTileIndex].xPosition] = [this.imageTiles[emptyTileIndex].xPosition, this.imageTiles[tileIndex].xPosition];
                //switch yPositions of emptyTile and tile
                [this.imageTiles[tileIndex].yPosition, this.imageTiles[emptyTileIndex].yPosition] = [this.imageTiles[emptyTileIndex].yPosition, this.imageTiles[tileIndex].yPosition];
                //draw puzzle
                this.drawPuzzle();
            }
        }
    }

    drawPuzzle() {
        this.context.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
        for (let element of this.imageTiles) {
            //if empty tile
            if (element.xOriginal == this.emptyTile.xOriginal && element.yOriginal == this.emptyTile.yOriginal) {
                this.context.fillStyle = "#FFFFFF";
                this.context.fillRect(element.xPosition, element.yPosition, this.puzzle.tileWidth, this.puzzle.tileHeight);
            }
            else {
                this.context.drawImage(this.image, element.xOriginal, element.yOriginal, this.puzzle.tileWidth, this.puzzle.tileHeight, element.xPosition, element.yPosition, this.puzzle.tileWidth, this.puzzle.tileHeight);
            }
            this.context.strokeStyle = "#FFFFFF";
            this.context.strokeRect(element.xPosition, element.yPosition, this.puzzle.tileWidth, this.puzzle.tileHeight);
        }
    }

    checkPieceClicked(coordinates) {
        for (let element of this.imageTiles) {
            if (coordinates.x < element.xPosition || coordinates.x > (element.xPosition + this.puzzle.tileWidth) || coordinates.y < element.yPosition || coordinates.y > (element.yPosition + this.puzzle.tileHeight)) {
                //this.imageTiles[i] has not been clicked on
            }
            else {
                return element;
            }
        }
        return null;
    }

    canMove(tile) {
        /* can swap tile and emptyTile if xPositions and yPositions are horizontally and vertically aligned*/
        let [xPosition, yPosition] = [tile.xPosition, tile.yPosition];
        let [eX, eY, pW, pH] = [this.emptyTile.xPosition, this.emptyTile.yPosition, this.puzzle.tileWidth, this.puzzle.tileHeight];

        if (xPosition + pW == eX && yPosition == eY ||
            xPosition - pW == eX && yPosition == eY ||
            xPosition == eX && yPosition + pH == eY ||
            xPosition == eX && yPosition - pH == eY) {
            return true;
        }
        else {
            return false;
        }
    }

    //converts the x and y coordinates from the mouse event (which are window coordinates) to coordinates on the canvas
    windowToCanvas(x, y) {
        //getBoundingClientRect(); provides information about the size of an element and its position relative to the viewport.
        const bbox = this.$canvas.getBoundingClientRect();
        return {
            x: x - bbox.left * (this.$canvas.width / bbox.width),
            y: y - bbox.top * (this.$canvas.height / bbox.height)
        };
    }

    checkWin() {
        for (let i = 0; i < this.imageTiles.length; i++) {
            if (this.imageTiles[i].xOriginal == this.imageTiles[i].xPosition && this.imageTiles[i].yOriginal == this.imageTiles[i].yPosition) {
                return true;
            }
            else
                return false;
        }
    }

    playAgain() {
        document.getElementById("status").innerHTML = '<p>Would you like to play again?</p><button id="yes" class="btn bg-success">Yes</button><button id="no" class="btn bg-danger">No</button>';
        document.getElementById("yes").onclick = () => { new SliderPuzzle(); }
        document.getElementById("no").onclick = () => {
            document.getElementById("status").innerHTML = null;
        }
    }
}
window.onload = () => { new SliderPuzzle(); }