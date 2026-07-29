/**
 * Web Audio API synthesizer for sound alerts and ambient noise generators.
 * Clean, lightweight, and requiring no external audio asset downloads.
 */

let audioCtx = null;
let ambientSource = null;
let ambientGainNode = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play notification sound chime
export function playAlertSound(type = 'chime', volume = 0.7) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.5, now);
    masterGain.connect(ctx.destination);

    if (type === 'chime') {
      // Harmonic 3-note chime (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        
        noteGain.gain.setValueAtTime(0, now + i * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.4, now + i * 0.12 + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.2);
        
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.3);
      });
    } else if (type === 'bell') {
      // Bell synthesis with overtones
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const bellGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now); // A6 overtone

      bellGain.gain.setValueAtTime(0.6, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(bellGain);
      osc2.connect(bellGain);
      bellGain.connect(masterGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 1.9);
      osc2.stop(now + 1.9);
    } else {
      // Short tick/ping
      const osc = ctx.createOscillator();
      const pingGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      pingGain.gain.setValueAtTime(0.3, now);
      pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(pingGain);
      pingGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    console.error('Audio play sound error:', err);
  }
}

// Stop current ambient sound
export function stopAmbientSound() {
  if (ambientSource) {
    try {
      ambientSource.stop();
      ambientSource.disconnect();
    } catch (e) {}
    ambientSource = null;
  }
  if (ambientGainNode) {
    try {
      ambientGainNode.disconnect();
    } catch (e) {}
    ambientGainNode = null;
  }
}

// Start ambient sound generator (white, pink, rain/brown)
export function startAmbientSound(type = 'rain', volume = 0.3) {
  stopAmbientSound();
  if (type === 'none' || !type) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Rain / Brown noise: Brown noise with lowpass filter
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(volume * 0.25, ctx.currentTime);

    if (type === 'rain') {
      // Add lowpass filter for gentle rain effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      ambientSource.connect(filter);
      filter.connect(ambientGainNode);
    } else {
      ambientSource.connect(ambientGainNode);
    }

    ambientGainNode.connect(ctx.destination);
    ambientSource.start();
  } catch (err) {
    console.error('Ambient sound error:', err);
  }
}

export function updateAmbientVolume(volume = 0.3) {
  if (ambientGainNode && audioCtx) {
    ambientGainNode.gain.setValueAtTime(volume * 0.25, audioCtx.currentTime);
  }
}
