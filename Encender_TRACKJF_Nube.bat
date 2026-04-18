@echo off
title Servidor TRACKJF (Túnel SSH Premium)
color 0B

echo ==============================================================
echo TRACKJF PRO - SISTEMA DE MANTENIMIENTO ON-LINE (SSH)
echo ==============================================================
echo.
echo 1. Encendiendo el Servidor Interno de Vite en el puerto 5173...
start /b cmd /c "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo 2. Activando Tunel de Acceso Directo y Seguro (localhost.run)...
echo Copia el ultimo enlace "https://..." que te de el sistema a continuacion.
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:5173 nokey@localhost.run

pause
