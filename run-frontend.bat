@echo off
title CareSync E-Channeling Frontend (React + Vite)
echo ====================================================================
echo Starting CareSync E-Channeling Modern Frontend...
echo URL: http://localhost:5173
echo ====================================================================

cd /d "%~dp0frontend"
call npm.cmd run dev
pause
