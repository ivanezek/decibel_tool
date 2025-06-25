class DecibelMeter {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.dataArray = null;
        this.isRecording = false;
        this.isListening = false;
        this.currentMaxDecibel = 0;
        this.recordingMaxDecibel = 0;
        this.leaderboard = JSON.parse(localStorage.getItem('fantasticoLeaderboard')) || [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateLeaderboard();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.micStatus = document.getElementById('micStatus');
        this.decibelValue = document.getElementById('decibelValue');
        this.meterBar = document.getElementById('meterBar');
        this.currentMax = document.getElementById('currentMax');
        this.bestScore = document.getElementById('bestScore');
        this.bestPlayer = document.getElementById('bestPlayer');
        this.recordBtn = document.getElementById('recordBtn');
        this.playerName = document.getElementById('playerName');
        this.leaderboardList = document.getElementById('leaderboardList');
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleMicrophone());
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Cargar mejor puntuación al inicio
        this.loadBestScore();
    }
    
    async toggleMicrophone() {
        if (!this.isListening) {
            await this.startMicrophone();
        } else {
            this.stopMicrophone();
        }
    }
    
    async startMicrophone() {
        try {
            this.micStatus.textContent = 'Solicitando acceso al micrófono...';
            this.micStatus.className = 'mic-status';
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.3;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.microphone.connect(this.analyser);
            
            this.isListening = true;
            this.startBtn.textContent = '🔇 Detener Micrófono';
            this.micStatus.textContent = 'Micrófono activo - ¡Listo para competir!';
            this.micStatus.className = 'mic-status active';
            this.recordBtn.disabled = false;
            
            this.updateMeter();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.micStatus.textContent = 'Error: No se pudo acceder al micrófono';
            this.micStatus.className = 'mic-status error';
        }
    }
    
    stopMicrophone() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isListening = false;
        this.isRecording = false;
        this.startBtn.textContent = '🎤 Iniciar Micrófono';
        this.micStatus.textContent = 'Micrófono desconectado';
        this.micStatus.className = 'mic-status';
        this.recordBtn.disabled = true;
        this.recordBtn.textContent = '🔴 Grabar "FANTÁSTICO"';
        this.recordBtn.className = 'record-button';
        
        // Reset meter
        this.decibelValue.textContent = '0 dB';
        this.meterBar.style.width = '0%';
    }
    
    updateMeter() {
        if (!this.isListening || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calcular el nivel de volumen
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        
        const average = sum / this.dataArray.length;
        
        // Convertir a aproximación de decibeles
        // Esta es una aproximación, no una medición real de dB SPL
        const decibel = Math.round(average * 0.78); // Escalado para mejor UX
        
        // Actualizar display
        this.decibelValue.textContent = `${decibel} dB`;
        
        // Actualizar barra de meter (0-100%)
        const percentage = Math.min(100, (decibel / 100) * 100);
        this.meterBar.style.width = `${percentage}%`;
        
        // Actualizar máximo actual
        if (decibel > this.currentMaxDecibel) {
            this.currentMaxDecibel = decibel;
            this.currentMax.textContent = `${decibel} dB`;
        }
        
        // Si está grabando, actualizar máximo de grabación
        if (this.isRecording && decibel > this.recordingMaxDecibel) {
            this.recordingMaxDecibel = decibel;
        }
        
        requestAnimationFrame(() => this.updateMeter());
    }
    
    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        this.recordingMaxDecibel = 0;
        this.recordBtn.textContent = '⏹️ Terminar Grabación';
        this.recordBtn.className = 'record-button recording';
        
        // Auto-stop after 5 seconds
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, 5000);
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.recordBtn.textContent = '🔴 Grabar "FANTÁSTICO"';
        this.recordBtn.className = 'record-button';
        
        // Procesar resultado
        if (this.recordingMaxDecibel > 0) {
            this.processRecording(this.recordingMaxDecibel);
        }
    }
    
    processRecording(maxDecibel) {
        const playerNameValue = this.playerName.value.trim() || 'Anónimo';
        
        // Agregar a leaderboard
        const entry = {
            name: playerNameValue,
            score: maxDecibel,
            timestamp: new Date().toISOString()
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Mantener solo los mejores 10
        this.leaderboard = this.leaderboard.slice(0, 10);
        
        // Guardar en localStorage
        localStorage.setItem('fantasticoLeaderboard', JSON.stringify(this.leaderboard));
        
        // Actualizar UI
        this.updateLeaderboard();
        this.loadBestScore();
        
        // Mostrar resultado
        this.showResult(maxDecibel, playerNameValue);
    }
    
    showResult(score, playerName) {
        const isNewRecord = this.leaderboard.length > 0 && this.leaderboard[0].score === score;
        
        if (isNewRecord) {
            alert(`¡NUEVO RÉCORD! 🏆\n${playerName}: ${score} dB\n¡Felicitaciones por tu grito fantástico!`);
        } else {
            alert(`¡Buen intento! 🎤\n${playerName}: ${score} dB\n¡Sigue practicando para superar el récord!`);
        }
    }
    
    loadBestScore() {
        if (this.leaderboard.length > 0) {
            const best = this.leaderboard[0];
            this.bestScore.textContent = `${best.score} dB`;
            this.bestPlayer.textContent = best.name;
        }
    }
    
    updateLeaderboard() {
        if (this.leaderboard.length === 0) {
            this.leaderboardList.innerHTML = '<div class="empty-leaderboard">¡Sé el primero en gritar!</div>';
            return;
        }
        
        let html = '';
        this.leaderboard.forEach((entry, index) => {
            const isTop = index === 0;
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}°`;
            
            html += `
                <div class="leaderboard-item ${isTop ? 'top' : ''}">
                    <div class="leaderboard-rank">${medal}</div>
                    <div class="leaderboard-name">${entry.name}</div>
                    <div class="leaderboard-score">${entry.score} dB</div>
                </div>
            `;
        });
        
        this.leaderboardList.innerHTML = html;
    }
    
    resetCurrentMax() {
        this.currentMaxDecibel = 0;
        this.currentMax.textContent = '0 dB';
    }
}

// Verificar soporte del navegador
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Tu navegador no soporta acceso al micrófono. Prueba con Chrome, Firefox o Safari.');
} else {
    // Inicializar la aplicación cuando se carga la página
    document.addEventListener('DOMContentLoaded', () => {
        const meter = new DecibelMeter();
        
        // Agregar botón para resetear leaderboard (para testing)
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🗑️ Limpiar Puntuaciones';
        resetBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 0.9em;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres limpiar todas las puntuaciones?')) {
                localStorage.removeItem('fantasticoLeaderboard');
                location.reload();
            }
        });
        document.body.appendChild(resetBtn);
        
        // Agregar funcionalidad de reset de máximo actual
        document.addEventListener('dblclick', () => {
            meter.resetCurrentMax();
        });
    });
}

// Función para manejar cuando el usuario sale de la página
window.addEventListener('beforeunload', () => {
    if (window.decibelMeter && window.decibelMeter.audioContext) {
        window.decibelMeter.audioContext.close();
    }
}); 