# 📤 Instrucciones para subir GeologgIA Digging a GitHub

## ✅ Estado Actual

- ✅ Repositorio Git inicializado
- ✅ Commit inicial realizado (6 archivos)
- ✅ Velocidad de enemigos ajustada y commiteada

## 🚀 Pasos para subir a GitHub

### Opción 1: Crear repositorio desde GitHub.com (Recomendado)

1. **Ve a GitHub.com** y haz login
2. **Crea un nuevo repositorio**:
   - Click en el botón "+" (arriba derecha) → "New repository"
   - Nombre: `geologgia-digging-game` (o el que prefieras)
   - Descripción: `🎮 Juego de excavación estilo Dig Dug con audio procedural`
   - Visibilidad: **Public** (para que sea accesible)
   - ⚠️ **NO** marques "Initialize with README" (ya tenemos archivos)
   - Click en "Create repository"

3. **Conectar tu repositorio local** (copia y pega estos comandos):

```bash
cd /Users/cavila/.gemini/antigravity/playground/prime-copernicus

# Agregar el remote (reemplaza TU_USUARIO con tu nombre de usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/geologgia-digging-game.git

# Cambiar el nombre de la rama a 'main' (opcional pero recomendado)
git branch -M main

# Subir el código
git push -u origin main
```

### Opción 2: Usar comandos directos (si ya sabes tu usuario)

Si tu usuario de GitHub es conocido, ejecuta:

```bash
# Reemplaza TU_USUARIO con tu nombre de usuario real
git remote add origin https://github.com/TU_USUARIO/geologgia-digging-game.git
git branch -M main
git push -u origin main
```

## 📝 Commits realizados

1. **Commit inicial** (0a169f0):
   - Juego completo con todos los archivos
   - Sistema de audio procedural
   - Controles táctiles y de teclado
   - Diseño responsive

2. **Balance de enemigos** (e080147):
   - ROCK_MONSTER: velocidad reducida de 2.5 → 1.5
   - LAVA_CREATURE: velocidad reducida de 3.5 → 2.0

## 🎯 Próximos pasos después de subir

Una vez que el repositorio esté en GitHub, puedes:

1. **Activar GitHub Pages** para jugar online:
   - Ve a Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save
   - Tu juego estará en: `https://TU_USUARIO.github.io/geologgia-digging-game/`

2. **Agregar badges al README**:
   - ![GitHub stars](https://img.shields.io/github/stars/TU_USUARIO/geologgia-digging-game)
   - ![License](https://img.shields.io/badge/license-MIT-blue)

3. **Compartir el juego**:
   - Copia el link de GitHub Pages
   - Compártelo en redes sociales
   - Agrega screenshots al README

## 🔧 Comandos útiles para futuras actualizaciones

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción del cambio"

# Subir cambios
git push

# Ver historial
git log --oneline
```

---

**¿Necesitas ayuda?** Dime tu usuario de GitHub y puedo darte los comandos exactos listos para copiar y pegar.
