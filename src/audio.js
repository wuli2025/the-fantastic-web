export class AmbientAudio {
  constructor() { this.enabled = false; this.context = null; }

  async toggle() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    if (!this.context) {
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      // A quiet, generated ambient chord. Audio only starts after the sound button is used.
      [110, 164.81, 220.3, 277.18].forEach((frequency, i) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.value = i === 0 ? .12 : .035;
        oscillator.connect(gain); gain.connect(this.master); oscillator.start();
      });
    }
    await this.context.resume();
    this.enabled = !this.enabled;
    this.master.gain.setTargetAtTime(this.enabled ? .30 : 0, this.context.currentTime, .5);
    return this.enabled;
  }

  morph(index) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const time = this.context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime([440, 523.25, 659.25][index], time);
    oscillator.frequency.exponentialRampToValueAtTime([220, 261.63, 329.63][index], time + .8);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(.10, time + .08);
    gain.gain.exponentialRampToValueAtTime(.001, time + 1.2);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(); oscillator.stop(time + 1.3);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  visibility(hidden) {
    if (!this.context) return;
    if (hidden) this.context.suspend().catch(() => {});
    else if (this.enabled) this.context.resume().catch(() => {});
  }

  dispose() { return this.context?.close(); }
}
