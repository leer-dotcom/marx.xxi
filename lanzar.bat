@echo off
rem Construye la web en local y la abre en el navegador (para depurar sin publicar).
rem   lanzar.bat            comprueba los datos + servidor en el puerto 8765
rem   lanzar.bat 8080       otro puerto
rem Antes de arrancar cierra los servidores de Marx XXI anteriores.
rem Nunca cierra otros programas: si el puerto esta ocupado por otra cosa, usa el siguiente libre.
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765
set BUILDARGS=
:args
if "%~1"=="" goto run
if /i "%~1"=="rapido" (set BUILDARGS=--no-data) else (set PORT=%~1)
shift
goto args
:run
where python >nul 2>&1 || (echo No encuentro Python. Instalalo desde https://www.python.org & pause & exit /b 1)
python tools\build.py %BUILDARGS% || (echo. & echo La construccion ha fallado: revisa los mensajes de arriba. & pause & exit /b 1)
python tools\dev_server.py %PORT% --matar
