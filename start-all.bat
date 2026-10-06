@echo off
title CareSync E-Channeling System - Full Launcher
echo ====================================================================
echo Starting CareSync E-Channeling System (Backend + Frontend)...
echo ====================================================================

start "CareSync Frontend (Vite)" cmd /c "%~dp0run-frontend.bat"
start "CareSync Backend (Spring Boot)" cmd /c "%~dp0run-backend.bat"

echo.
echo Both Frontend (http://localhost:5173) and Backend (http://localhost:8080) are starting!
