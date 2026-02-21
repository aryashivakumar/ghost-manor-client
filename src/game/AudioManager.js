// Audio disabled — all methods are silent no-ops.
// To re-enable: replace this file with the Howler.js implementation.

class AudioManager {
  updateProximityHeartbeat() {}
  playThunder() {}
  playDash() {}
  playBatteryLow() {}
  startGhostAmbient() {}
  stopGhostAmbient() {}
  playRevive() {}
  playAttack() {}
  setListenerPosition() {}
}

export const audioManager = new AudioManager();
