export class Input {
    public keys: { [key: string]: boolean } = {};
    public mouseDown: boolean = false;
    public mousePressed: boolean = false; // True only for one frame

    public movementX: number = 0;
    public movementY: number = 0;
    public mouseX: number = 0;
    public mouseY: number = 0;
    public isLocked: boolean = false;

    constructor() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousedown', () => this.onMouseDown());
        window.addEventListener('mouseup', () => this.onMouseUp());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === document.body;
        });
    }

    public requestPointerLock() {
        document.body.requestPointerLock();
    }

    public exitPointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        this.keys[event.code] = true;
    }

    private onKeyUp(event: KeyboardEvent) {
        this.keys[event.code] = false;
    }

    private onMouseDown() {
        this.mouseDown = true;
        this.mousePressed = true;
    }

    private onMouseUp() {
        this.mouseDown = false;
    }

    private onMouseMove(event: MouseEvent) {
        if (this.isLocked) {
            this.movementX = event.movementX || 0;
            this.movementY = event.movementY || 0;
        } else {
            // Fallback or menu mode
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        }
    }

    public update() {
        this.mousePressed = false; // Reset after frame
        this.movementX = 0;
        this.movementY = 0;
    }

    public isDown(code: string): boolean {
        return !!this.keys[code];
    }
}
