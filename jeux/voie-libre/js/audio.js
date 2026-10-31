// Sons et musique synthétisés avec Web Audio (aucun fichier) : bruitages de la course et une boucle
// de 4 mesures (batterie, basse, accords, mélodie) propre à chaque quartier.
import { QUARTIERS } from './donnees.js';

export class Audio {
  constructor() {
    this.ac = null;
    this.sons = true;
    this.musiqueOn = true;
    this.quartier = 0;
    this.derniere = 0;
    this.suite = 0;
    this.minuterie = 0;
  }
  // le contexte audio ne démarre qu'après un geste du joueur (règle des navigateurs)
  pret() {
    try {
      this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state == 'suspended') this.ac.resume();
      if (!this.bruit) {
        this.bruit = this.ac.createBuffer(1, this.ac.sampleRate * 0.5, this.ac.sampleRate);
        const d = this.bruit.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.maitre = this.ac.createGain();
        this.maitre.connect(this.ac.destination);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  note(f, f2, d, type = 'sine', vol = 0.08, debut = 0, dest) {
    const t = this.ac.currentTime + debut,
      o = this.ac.createOscillator(),
      g = this.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(dest || this.maitre);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  souffle(d, vol, filtre, debut = 0, dest) {
    const t = this.ac.currentTime + debut,
      s = this.ac.createBufferSource(),
      f = this.ac.createBiquadFilter(),
      g = this.ac.createGain();
    s.buffer = this.bruit;
    f.type = 'highpass';
    f.frequency.value = filtre;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(dest || this.maitre);
    s.start(t);
    s.stop(t + d);
  }

  jouer(k) {
    if (!this.sons || !this.pret()) return;
    const t = this.ac.currentTime;
    switch (k) {
      case 'piece': {
        if (t - this.derniere < 0.05) return;
        this.suite = t - this.derniere < 0.4 ? Math.min(8, this.suite + 1) : 0; // les pièces à la suite montent d'une note
        this.derniere = t;
        const f = 988 * 2 ** (this.suite / 12);
        this.note(f, 0, 0.07, 'sine', 0.06);
        this.note(f * 1.335, 0, 0.12, 'sine', 0.06, 0.06);
        break;
      }
      case 'saut':
        return this.note(330, 660, 0.16, 'triangle', 0.1);
      case 'glisse':
        return this.note(520, 200, 0.18, 'triangle', 0.08);
      case 'voie':
        return this.souffle(0.06, 0.05, 3000);
      case 'bonus':
        return [523, 659, 784, 1047].forEach((f, i) => this.note(f, 0, 0.12, 'triangle', 0.08, i * 0.06));
      case 'mission':
        return [784, 988, 1175, 1568].forEach((f, i) => this.note(f, 0, 0.16, 'square', 0.05, i * 0.08));
      case 'lettre':
        return [880, 1320].forEach((f, i) => this.note(f, 0, 0.15, 'triangle', 0.08, i * 0.08));
      case 'victoire':
        return [523, 659, 784, 1047, 1319].forEach((f, i) => this.note(f, 0, 0.25, 'triangle', 0.09, i * 0.1));
      case 'alerte':
        return [440, 330].forEach((f, i) => this.note(f, 0, 0.12, 'square', 0.05, i * 0.13));
      case 'protection':
        return this.note(900, 300, 0.3, 'sawtooth', 0.06);
      case 'justesse':
        return this.note(880, 1760, 0.12, 'sine', 0.06);
      case 'figure':
        return [660, 880, 1320].forEach((f, i) => this.note(f, 0, 0.1, 'triangle', 0.07, i * 0.05));
      case 'coffre':
        this.souffle(0.4, 0.08, 1500);
        return [523, 784, 1047, 1568].forEach((f, i) => this.note(f, 0, 0.3, 'triangle', 0.08, 0.15 + i * 0.07));
      case 'caisse':
      case 'casse':
        this.souffle(0.18, 0.2, 800);
        return this.note(160, 80, 0.15, 'square', 0.06);
      case 'ecrase':
        this.note(120, 40, 0.25, 'sine', 0.2);
        return this.souffle(0.15, 0.12, 400);
      case 'turbo':
        return this.note(300, 1200, 0.35, 'sawtooth', 0.05);
      case 'planche':
        this.note(200, 800, 0.25, 'sine', 0.08);
        return this.souffle(0.3, 0.06, 2000);
      case 'choc':
        this.note(180, 50, 0.45, 'sawtooth', 0.12);
        return this.note(90, 40, 0.5, 'square', 0.06);
      case 'clic':
        return this.note(700, 900, 0.05, 'sine', 0.04);
    }
  }

  // musique : boucle de 4 mesures selon le quartier
  musique(on) {
    const TEMPO = 112;
    if (!on || !this.musiqueOn) {
      clearInterval(this.minuterie);
      this.minuterie = 0;
      if (this.gainM && this.ac) this.gainM.gain.setTargetAtTime(0, this.ac.currentTime, 0.1);
      return;
    }
    if (this.minuterie || !this.pret()) return;
    if (!this.gainM) {
      this.gainM = this.ac.createGain();
      this.gainM.connect(this.ac.destination);
    }
    this.gainM.gain.setTargetAtTime(0.5, this.ac.currentTime, 0.1);
    this.prochain = this.ac.currentTime + 0.05;
    this.pasM = this.pasM || 0;
    this.minuterie = setInterval(() => {
      while (this.prochain < this.ac.currentTime + 0.25) {
        this.jouerPas(this.pasM, this.prochain - this.ac.currentTime);
        this.prochain += 60 / TEMPO / 4;
        this.pasM = (this.pasM + 1) % 64;
      }
    }, 60);
  }
  jouerPas(s, debut) {
    const g = this.gainM,
      q = QUARTIERS[this.quartier] || QUARTIERS[0],
      racine = q.musique[Math.floor(s / 16)],
      b = s % 16,
      freq = m => 440 * 2 ** ((m - 69) / 12);
    if (b % 4 == 0) this.note(140, 45, 0.18, 'sine', 0.35, debut, g);
    if (b == 4 || b == 12) this.souffle(0.12, 0.18, 1500, debut, g);
    if (b % 2 == 0) this.souffle(0.03, 0.05, 7000, debut, g);
    if ([0, 3, 6, 8, 10, 14].includes(b)) this.note(freq(racine + (b == 10 ? 7 : b == 14 ? 12 : 0)), 0, 0.16, 'triangle', 0.16, debut, g);
    if (b == 0 || b == 8) for (const i of [12, q.nuit > 0.5 ? 15 : 16, 19]) this.note(freq(racine + i), 0, 0.5, 'sine', 0.025, debut, g);
    const m = q.melodie[b];
    if (m != null && Math.floor(s / 16) % 2 == 1) this.note(freq(racine + 12 + m), 0, 0.14, 'square', 0.022, debut, g); // la mélodie revient une mesure sur deux
  }
}
