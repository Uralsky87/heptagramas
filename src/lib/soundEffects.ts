/**
 * Sistema de efectos de sonido para el juego
 * Usa Web Audio API para mejor rendimiento en móvil
 */

// Frecuencias musicales para generar sonidos agradables
const NOTES = {
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
};

let audioContext: AudioContext | null = null;

// Inicializar contexto de audio (lazy)
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Reproduce un sonido corto de acierto
 * Usa síntesis de audio para evitar cargar archivos
 */
export function playSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Crear oscilador para generar tono
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configurar tono (Do mayor - C E G)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(NOTES.C5, now);
    oscillator.frequency.setValueAtTime(NOTES.E5, now + 0.05);
    oscillator.frequency.setValueAtTime(NOTES.G5, now + 0.1);
    
    // Configurar volumen con fade out suave
    gainNode.gain.setValueAtTime(0.15, now); // Volumen moderado
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    // Conectar nodos
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Reproducir sonido corto
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    
  } catch (error) {
    // Silenciar errores de audio (no críticos)
    console.debug('Error reproduciendo sonido:', error);
  }
}

/**
 * Reproduce un sonido especial para Super Hepta
 */
export function playSuperHeptaSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Crear dos osciladores para armonía
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configurar tonos (acorde más rico)
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(NOTES.C5, now);
    osc2.frequency.setValueAtTime(NOTES.E5, now);
    
    // Transición melódica
    osc1.frequency.setValueAtTime(NOTES.E5, now + 0.08);
    osc2.frequency.setValueAtTime(NOTES.G5, now + 0.08);
    
    osc1.frequency.setValueAtTime(NOTES.G5 * 1.5, now + 0.16); // Octava superior
    osc2.frequency.setValueAtTime(NOTES.C5 * 1.5, now + 0.16);
    
    // Volumen con fade
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    // Conectar
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Reproducir
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
    
  } catch (error) {
    console.debug('Error reproduciendo sonido Super Hepta:', error);
  }
}
