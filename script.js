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
        this.bestScore = parseInt(localStorage.getItem('flynnkityBestScore')) || 0;
        this.bestPlayer = localStorage.getItem('flynnkityBestPlayer') || '';
        
        // Canvas para las ondas
        this.canvas = null;
        this.canvasCtx = null;
        this.animationId = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupCanvas();
        this.loadBestScore();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.micStatus = document.getElementById('micStatus');
        this.decibelValue = document.getElementById('decibelValue');
        this.canvas = document.getElementById('waveCanvas');
        this.currentMax = document.getElementById('currentMax');
        this.bestScoreElement = document.getElementById('bestScore');
        this.bestPlayerElement = document.getElementById('bestPlayer');
        this.recordBtn = document.getElementById('recordBtn');
        this.playerName = document.getElementById('playerName');
        
        // Elementos del modal
        this.modal = document.getElementById('celebrationModal');
        this.modalPlayerName = document.getElementById('modalPlayerName');
        this.modalScore = document.getElementById('modalScore');
        this.modalCloseBtn = document.getElementById('modalCloseBtn');
    }
    
    setupCanvas() {
        if (this.canvas) {
            this.canvasCtx = this.canvas.getContext('2d');
            // Configurar el tamaño del canvas
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleMicrophone());
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Event listeners del modal
        this.modalCloseBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
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
            
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;
            
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
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.isListening = false;
        this.isRecording = false;
        this.startBtn.textContent = '🎤 Iniciar Micrófono';
        this.micStatus.textContent = 'Micrófono desconectado';
        this.micStatus.className = 'mic-status';
        this.recordBtn.disabled = true;
        this.recordBtn.textContent = '🔴 Grabar "Flynnkity"';
        this.recordBtn.className = 'record-button';
        
        // Reset meter and canvas
        this.decibelValue.textContent = '0 dB';
        this.clearCanvas();
    }
    
    clearCanvas() {
        if (this.canvasCtx && this.canvas) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    drawWave() {
        if (!this.canvasCtx || !this.canvas || !this.dataArray) return;
        
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Limpiar canvas
        this.canvasCtx.fillStyle = 'rgba(26, 26, 46, 0.1)';
        this.canvasCtx.fillRect(0, 0, width, height);
        
        // Obtener datos de frecuencia
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Dibujar barras verticales que van de abajo hacia arriba
        const barWidth = width / this.dataArray.length;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            
            // Diferentes colores basados en la frecuencia
            let color;
            if (barHeight < height * 0.2) {
                color = '#00d2d3'; // Azul cian para sonidos bajos
            } else if (barHeight < height * 0.5) {
                color = '#10ac84'; // Verde para sonidos medios
            } else {
                color = '#fdcb6e'; // Amarillo para sonidos altos
            }
            
            // Crear gradiente vertical
            const gradient = this.canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, color + '80'); // Más transparente en la base
            gradient.addColorStop(1, color + 'FF'); // Más opaco en la punta
            
            this.canvasCtx.fillStyle = gradient;
            
            // Dibujar barra desde abajo hacia arriba
            const x = i * barWidth;
            const y = height - barHeight;
            
            this.canvasCtx.fillRect(x, y, barWidth - 1, barHeight);
            
            // Agregar efecto de brillo en la punta
            if (barHeight > height * 0.1) {
                this.canvasCtx.fillStyle = '#ffffff60';
                this.canvasCtx.fillRect(x, y, barWidth - 1, 3);
            }
        }
        
        // Dibujar partículas reactivas al audio
        this.drawParticles();
    }
    
    drawParticles() {
        if (!this.dataArray) return;
        
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Calcular intensidad promedio
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const intensity = sum / this.dataArray.length / 255;
        
        // Dibujar partículas brillantes que suben
        this.canvasCtx.fillStyle = '#ffffff';
        this.canvasCtx.globalAlpha = intensity * 0.8;
        
        for (let i = 0; i < Math.floor(intensity * 15); i++) {
            const x = Math.random() * width;
            const y = height - (Math.random() * height * intensity);
            const size = Math.random() * 2 + 1;
            
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(x, y, size, 0, Math.PI * 2);
            this.canvasCtx.fill();
        }
        
        this.canvasCtx.globalAlpha = 1.0;
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
        const decibel = Math.round(average * 0.78);
        
        // Actualizar display
        this.decibelValue.textContent = `${decibel} dB`;
        
        // Actualizar máximo actual
        if (decibel > this.currentMaxDecibel) {
            this.currentMaxDecibel = decibel;
            this.currentMax.textContent = `${decibel} dB`;
            
            // Actualizar best score en tiempo real si supera el récord actual
            if (decibel > this.bestScore) {
                this.bestScore = decibel;
                
                // Solo actualizar el nombre si hay uno escrito, sino mantener el anterior o poner temporal
                const currentName = this.playerName.value.trim();
                if (currentName) {
                    this.bestPlayer = currentName;
                } else if (!this.bestPlayer) {
                    this.bestPlayer = 'Anónimo';
                }
                
                // Guardar en localStorage
                localStorage.setItem('flynnkityBestScore', this.bestScore.toString());
                localStorage.setItem('flynnkityBestPlayer', this.bestPlayer);
                
                // Actualizar UI inmediatamente
                this.bestScoreElement.textContent = `${this.bestScore} dB`;
                this.bestPlayerElement.textContent = this.bestPlayer;
                
                // Agregar efecto visual de nuevo récord
                this.bestScoreElement.style.animation = 'none';
                this.bestScoreElement.offsetHeight; // Trigger reflow
                this.bestScoreElement.style.animation = 'pulse 0.6s ease-in-out';
            }
        }
        
        // Si está grabando, actualizar máximo de grabación
        if (this.isRecording && decibel > this.recordingMaxDecibel) {
            this.recordingMaxDecibel = decibel;
        }
        
        // Dibujar ondas
        this.drawWave();
        
        this.animationId = requestAnimationFrame(() => this.updateMeter());
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
        this.recordBtn.textContent = '🔴 Grabar "Flynnkity"';
        this.recordBtn.className = 'record-button';
        
        // Procesar resultado
        if (this.recordingMaxDecibel > 0) {
            this.processRecording(this.recordingMaxDecibel);
        }
    }
    
    processRecording(maxDecibel) {
        const playerNameValue = this.playerName.value.trim() || 'Anónimo';
        
        // El best score ya se actualiza en tiempo real, solo verificar si fue récord
        const wasNewRecord = maxDecibel >= this.bestScore;
        
        // Verificar si alcanzó los 100 dB (objetivo)
        const achieved100dB = maxDecibel >= 100;
        
        // Asegurar que el best score esté actualizado con el nombre correcto
        if (wasNewRecord && this.bestScore === maxDecibel) {
            this.bestPlayer = playerNameValue;
            localStorage.setItem('flynnkityBestPlayer', this.bestPlayer);
            this.bestPlayerElement.textContent = this.bestPlayer;
        }
        
        // Mostrar resultado
        this.showResult(maxDecibel, playerNameValue, wasNewRecord, achieved100dB);
    }
    
    showResult(score, playerName, isNewRecord, achieved100dB) {
        if (achieved100dB) {
            // Mostrar modal de celebración para 100+ dB
            this.showCelebrationModal(score, playerName, isNewRecord);
        } else {
            // Mostrar alert normal para puntajes menores
            if (isNewRecord) {
                alert(`¡NUEVO RÉCORD! 🏆\n${playerName}: ${score} dB\n¡Sigue intentando llegar a 100 dB!`);
            } else {
                alert(`¡Buen intento! 🎤\n${playerName}: ${score} dB\n¡Sigue practicando para llegar a 100 dB!`);
            }
        }
    }
    
        loadBestScore() {
        if (this.bestScore > 0) {
            this.bestScoreElement.textContent = `${this.bestScore} dB`;
            this.bestPlayerElement.textContent = this.bestPlayer;
        }
    }

    showCelebrationModal(score, playerName, isNewRecord) {
        // Actualizar contenido del modal
        this.modalPlayerName.textContent = playerName;
        this.modalScore.textContent = `${score} dB`;
        
        // Mostrar el modal
        this.modal.classList.add('show');
        
        // Agregar efectos de sonido o vibración si están disponibles
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    closeModal() {
        this.modal.classList.remove('show');
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
                localStorage.removeItem('flynnkityBestScore');
                localStorage.removeItem('flynnkityBestPlayer');
                location.reload();
            }
        });
        document.body.appendChild(resetBtn);
        
        // Agregar botón para testear modal (solo para desarrollo)
        const testModalBtn = document.createElement('button');
        testModalBtn.textContent = '🎉 Test Modal';
        testModalBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #e913d8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 0.9em;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        testModalBtn.addEventListener('click', () => {
            const testName = meter.playerName.value.trim() || 'Test User';
            meter.showCelebrationModal(120, testName, true);
        });
        document.body.appendChild(testModalBtn);
        
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