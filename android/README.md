# FreshMind Games para Android

Esta app abre la versión publicada de FreshMind Games en una vista Android WebView. Requiere conexión a internet y usa el almacenamiento local del WebView para conservar la configuración del sitio en el dispositivo.

## Construir el APK de depuración

Requisitos: JDK 17 o posterior, Android SDK Platform 36 y Android Build Tools 36.0.0.

Desde esta carpeta:

```bash
./gradlew assembleDebug
```

El APK se genera en `app/build/outputs/apk/debug/app-debug.apk`.
