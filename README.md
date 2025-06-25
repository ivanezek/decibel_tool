# 🎤 Competencia de Gritos "Fantástico"

Una aplicación web divertida que mide el volumen de tu voz cuando gritas "FANTÁSTICO" y crea una competencia entre usuarios.

## ✨ Características

- **Medidor de decibeles en tiempo real** usando el micrófono de tu dispositivo
- **Sistema de competencia** con tabla de puntuaciones
- **Interfaz moderna y atractiva** con efectos visuales
- **Compatible con dispositivos móviles** y computadoras
- **Almacenamiento local** de puntuaciones (persiste entre sesiones)
- **Grabación automática** con límite de 5 segundos

## 🚀 Cómo usar

1. **Abrir la aplicación**: Simplemente abre el archivo `index.html` en tu navegador
2. **Permitir acceso al micrófono**: Haz clic en "🎤 Iniciar Micrófono" y permite el acceso cuando te lo solicite
3. **Ingresar tu nombre**: Escribe tu nombre en el campo de texto
4. **Practicar**: Observa el medidor mientras hablas o haces ruido
5. **Competir**: Haz clic en "🔴 Grabar FANTÁSTICO" y grita la palabra lo más fuerte que puedas
6. **Ver resultados**: Tu puntuación se agregará automáticamente a la tabla de posiciones

## 🎯 Consejos para obtener mejor puntuación

- Acércate al micrófono de tu dispositivo
- Grita con energía y proyección
- Asegúrate de estar en un ambiente sin mucho ruido de fondo
- ¡Practica tu mejor grito de "FANTÁSTICO"!

## 🛠️ Requisitos técnicos

- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Acceso al micrófono** del dispositivo
- **Conexión HTTPS** (para uso del micrófono en producción)

## 📱 Compatibilidad

- ✅ Computadoras (Windows, Mac, Linux)
- ✅ Teléfonos móviles (iOS, Android)
- ✅ Tablets
- ⚠️ Requiere navegador con soporte para Web Audio API

## 🔧 Funcionalidades adicionales

- **Doble clic**: Resetea el máximo actual
- **Botón de limpiar**: Elimina todas las puntuaciones guardadas
- **Auto-stop**: La grabación se detiene automáticamente después de 5 segundos
- **Tabla de líderes**: Muestra los mejores 10 intentos

## 🎵 Cómo funciona

La aplicación utiliza la **Web Audio API** para:
1. Acceder al micrófono del dispositivo
2. Analizar la frecuencia del audio en tiempo real
3. Calcular una aproximación del nivel de decibeles
4. Mostrar el resultado en una interfaz visual atractiva

> **Nota**: Los valores de "decibeles" mostrados son una aproximación para fines de entretenimiento, no una medición científica precisa.

## 🏆 Sistema de puntuación

- Las puntuaciones se guardan localmente en tu navegador
- Se mantienen los mejores 10 intentos
- El líder actual se destaca con colores especiales
- Cada entrada incluye nombre, puntuación y timestamp

¡Diviértete compitiendo y ve quién puede gritar "FANTÁSTICO" más fuerte! 🎉 