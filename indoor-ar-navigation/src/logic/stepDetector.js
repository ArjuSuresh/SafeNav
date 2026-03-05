/**
 * StepDetector — uses the phone's accelerometer to detect walking steps.
 *
 * Algorithm: monitors the magnitude of acceleration. Each "peak" that
 * exceeds a threshold followed by a drop is counted as one step.
 * Average step length ≈ 0.65m (calibrated for indoor walking).
 *
 * Usage:
 *   const detector = new StepDetector();
 *   detector.start(({ stepCount, totalDistance }) => { ... });
 *   detector.stop();
 */

const STEP_THRESHOLD = 1.2;     // m/s² above gravity magnitude to count as a step
const STEP_COOLDOWN_MS = 300;   // minimum ms between two steps (prevents double-counting)
const STEP_LENGTH_M = 0.65;     // average indoor step length in metres
const SMOOTHING = 0.3;          // low-pass filter alpha for accelerometer noise

class StepDetector {
    constructor() {
        this._listening = false;
        this._handler = null;
        this._stepCount = 0;
        this._totalDistance = 0;
        this._lastStepTime = 0;
        this._smoothedMag = 9.81;   // start at gravity
        this._wasPeak = false;
        this._onStep = null;
    }

    /** Start listening for steps. Calls `onStep({ stepCount, totalDistance })` on each step. */
    start(onStep) {
        if (this._listening) return;
        this._onStep = onStep;
        this._stepCount = 0;
        this._totalDistance = 0;
        this._lastStepTime = 0;
        this._smoothedMag = 9.81;
        this._wasPeak = false;

        this._handler = (event) => {
            const { x, y, z } = event.accelerationIncludingGravity || {};
            if (x == null || y == null || z == null) return;

            // Magnitude of acceleration vector
            const mag = Math.sqrt(x * x + y * y + z * z);

            // Low-pass filter to smooth noisy readings
            this._smoothedMag = SMOOTHING * mag + (1 - SMOOTHING) * this._smoothedMag;

            const now = Date.now();
            const deviation = Math.abs(this._smoothedMag - 9.81);

            // Detect step: acceleration deviates above threshold, then drops back
            if (deviation > STEP_THRESHOLD) {
                this._wasPeak = true;
            } else if (this._wasPeak && deviation < STEP_THRESHOLD * 0.5) {
                this._wasPeak = false;

                // Enforce cooldown
                if (now - this._lastStepTime > STEP_COOLDOWN_MS) {
                    this._lastStepTime = now;
                    this._stepCount++;
                    this._totalDistance = Math.round(this._stepCount * STEP_LENGTH_M * 100) / 100;

                    if (this._onStep) {
                        this._onStep({
                            stepCount: this._stepCount,
                            totalDistance: this._totalDistance,
                        });
                    }
                }
            }
        };

        window.addEventListener('devicemotion', this._handler, true);
        this._listening = true;
    }

    /** Stop listening. */
    stop() {
        if (this._handler) {
            window.removeEventListener('devicemotion', this._handler, true);
        }
        this._listening = false;
        this._handler = null;
    }

    /** Reset step counter without stopping the listener. */
    reset() {
        this._stepCount = 0;
        this._totalDistance = 0;
        this._lastStepTime = 0;
    }

    /** Current step count. */
    get stepCount() { return this._stepCount; }

    /** Total estimated distance walked in metres. */
    get totalDistance() { return this._totalDistance; }

    /** Whether the detector is actively listening. */
    get isActive() { return this._listening; }
}

export default StepDetector;
