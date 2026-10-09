@echo off
rem Construye, guarda los cambios en git y los sube a GitHub (GitHub Pages se actualiza solo).
chcp 65001 >nul
cd /d "%~dp0"
setlocal EnableDelayedExpansion

python tools\build.py || goto :fallo

git rev-parse --is-inside-work-tree >nul 2>&1 || (echo Esta carpeta no es un repositorio git. & goto :fin)
git config user.email >nul 2>&1 || (
  echo Falta tu identidad en git. Ejecuta una vez:
  echo   git config --global user.name "Tu nombre"
  echo   git config --global user.email "tu@correo"
  goto :fin
)

git add -A
git diff --cached --quiet && (echo No hay cambios que publicar. & goto :fin)

rem Hay cambios: nueva version de la cache offline para que los usuarios los reciban
python tools\build.py --no-data --release || goto :fallo
git add -A

echo.
git status --short
echo.
set "MSG="
set /p "MSG=Describe el cambio (Enter = Actualizacion): "
if "!MSG!"=="" set "MSG=Actualizacion"
rem Firma: dos iniciales aleatorias (L.L., sin W X Y Z) como autor y committer de este commit
set "AUTOR="
for /f "delims=" %%i in ('python tools\iniciales.py') do set "AUTOR=%%i"
if "!AUTOR!"=="" goto :fallo
echo Firma del commit: !AUTOR!
git -c user.name="!AUTOR!" commit -q -m "!MSG!" || goto :fallo

git remote get-url origin >nul 2>&1 || (
  echo.
  echo Guardado en git, pero falta el repositorio de GitHub. Ejecuta una vez:
  echo   git remote add origin https://github.com/USUARIO/REPOSITORIO.git
  echo y vuelve a lanzar publicar.bat
  goto :fin
)
git push -u origin main || goto :fallo
echo.
echo Publicado. GitHub Pages tardara uno o dos minutos en actualizarse.
goto :fin

:fallo
echo.
echo Algo ha fallado: revisa los mensajes de arriba.
:fin
pause
