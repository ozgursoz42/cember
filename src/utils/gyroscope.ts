// Mobile DeviceOrientation / Gyroscope Motion Controller for ÇEMBER

export type GyroSensitivity = 'low' | 'medium' | 'high';

export interface GyroState {
  isSupported: boolean;
  isEnabled: boolean;
  hasPermission: boolean;
  gamma: number; // left/right tilt [-90, 90]
  beta: number; // front/back tilt [-180, 180]
  normalizedX: number; // 0 (far left) to 1 (far right), 0.5 center
  normalizedY: number; // 0 (top/forward) to 1 (bottom/back)
  isForwardThrust: boolean;
  sensitivity: GyroSensitivity;
}

class GyroscopeController {
  private isEnabled: boolean = false;
  private hasPermission: boolean = false;
  private sensitivity: GyroSensitivity = 'medium';

  private baseGamma: number = 0;
  private baseBeta: number = 45; // default comfortable holding angle

  private currentGamma: number = 0;
  private currentBeta: number = 45;

  private filteredGamma: number = 0;
  private filteredBeta: number = 45;

  private lastBeta: number = 45;
  private betaVelocity: number = 0;
  private lastUpdateTime: number = 0;

  private listeners: Set<(state: GyroState) => void> = new Set();
  private boundOrientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;

  constructor() {
    // Check saved preference
    if (typeof window !== 'undefined') {
      try {
        const savedPref = localStorage.getItem('cember_gyro_enabled');
        if (savedPref === 'true') {
          // Will need user gesture to activate on iOS, but record intent
        }
        const savedSens = localStorage.getItem('cember_gyro_sensitivity') as GyroSensitivity;
        if (savedSens && ['low', 'medium', 'high'].includes(savedSens)) {
          this.sensitivity = savedSens;
        }
      } catch {
        // ignore
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceOrientationEvent' in window;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getSensitivity(): GyroSensitivity {
    return this.sensitivity;
  }

  public setSensitivity(sens: GyroSensitivity) {
    this.sensitivity = sens;
    try {
      localStorage.setItem('cember_gyro_sensitivity', sens);
    } catch {
      // ignore
    }
  }

  public async requestPermissionAndEnable(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('DeviceOrientation is not supported on this device/browser.');
      return false;
    }

    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const permission = await DeviceOrientationEventAny.requestPermission();
        if (permission === 'granted') {
          this.hasPermission = true;
          this.startListening();
          return true;
        } else {
          this.hasPermission = false;
          this.isEnabled = false;
          return false;
        }
      } else {
        // Android / non-iOS standard browsers do not require prompt
        this.hasPermission = true;
        this.startListening();
        return true;
      }
    } catch (err) {
      console.warn('Gyro permission request error:', err);
      // Fallback try listening anyway
      this.startListening();
      return this.isEnabled;
    }
  }

  public disable() {
    this.isEnabled = false;
    if (this.boundOrientationHandler && typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.boundOrientationHandler);
      this.boundOrientationHandler = null;
    }
    try {
      localStorage.setItem('cember_gyro_enabled', 'false');
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  public calibrate() {
    this.baseGamma = this.currentGamma;
    this.baseBeta = this.currentBeta;
    this.filteredGamma = 0;
    this.filteredBeta = 0;
  }

  private startListening() {
    if (typeof window === 'undefined') return;
    if (this.boundOrientationHandler) {
      window.removeEventListener('deviceorientation', this.boundOrientationHandler);
    }

    this.boundOrientationHandler = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;

      const now = performance.now();
      const dt = this.lastUpdateTime > 0 ? Math.max((now - this.lastUpdateTime) / 1000, 0.001) : 0.016;
      this.lastUpdateTime = now;

      this.currentGamma = e.gamma;
      this.currentBeta = e.beta;

      // Filter with low-pass smoothing (EMA)
      const alpha = 0.28;
      const relGamma = this.currentGamma - this.baseGamma;
      const relBeta = this.currentBeta - this.baseBeta;

      this.filteredGamma = this.filteredGamma * (1 - alpha) + relGamma * alpha;
      this.filteredBeta = this.filteredBeta * (1 - alpha) + relBeta * alpha;

      // Track sudden forward tilt speed (thrust / smash trigger)
      const currentBetaVel = (this.currentBeta - this.lastBeta) / dt;
      this.betaVelocity = this.betaVelocity * 0.7 + currentBetaVel * 0.3;
      this.lastBeta = this.currentBeta;

      this.notifyListeners();
    };

    window.addEventListener('deviceorientation', this.boundOrientationHandler, true);
    this.isEnabled = true;
    try {
      localStorage.setItem('cember_gyro_enabled', 'true');
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  public getState(): GyroState {
    // Sensitivity scale multiplier
    let maxAngle = 24; // medium
    if (this.sensitivity === 'low') maxAngle = 32;
    if (this.sensitivity === 'high') maxAngle = 18;

    // Map gamma to normalizedX [0, 1]
    const clampedGamma = Math.max(-maxAngle, Math.min(maxAngle, this.filteredGamma));
    const normalizedX = (clampedGamma + maxAngle) / (maxAngle * 2);

    // Map beta to normalizedY [0, 1] (forward tilt pushes paddle forward)
    const maxBetaSpan = 20;
    const clampedBeta = Math.max(-maxBetaSpan, Math.min(maxBetaSpan, this.filteredBeta));
    // When tilted forward (negative relative beta), normalizedY goes lower (towards top)
    const normalizedY = 0.85 + (clampedBeta / maxBetaSpan) * 0.15;

    const isForwardThrust = this.betaVelocity < -60; // quick forward wrist flick

    return {
      isSupported: this.isSupported(),
      isEnabled: this.isEnabled,
      hasPermission: this.hasPermission,
      gamma: this.currentGamma,
      beta: this.currentBeta,
      normalizedX: Math.max(0, Math.min(1, normalizedX)),
      normalizedY: Math.max(0.45, Math.min(1, normalizedY)),
      isForwardThrust,
      sensitivity: this.sensitivity,
    };
  }

  public subscribe(cb: (state: GyroState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    const s = this.getState();
    this.listeners.forEach((cb) => cb(s));
  }
}

export const gyroController = new GyroscopeController();
