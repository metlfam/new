let context: AudioContext | null = null;
export function prepareSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    /* Sound is optional. */
  }
}
export function playSound() {
  if (!context || context.state !== "running") return;
  const osc = context.createOscillator(),
    gain = context.createGain();
  osc.connect(gain);
  gain.connect(context.destination);
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.06, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
  osc.start();
  osc.stop(context.currentTime + 0.6);
}
