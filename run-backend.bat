@echo off
title CareSync E-Channeling Backend (Spring Boot 3)
echo ====================================================================
echo Starting CareSync E-Channeling Backend...
echo Connecting to Microsoft SQL Server (Localhost SQLEXPRESS)...
echo ====================================================================

cd /d "%~dp0backend"
if exist "C:\Program Files\Java\jdk-25" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-25"
    set "PATH=C:\Program Files\Java\jdk-25\bin;%PATH%"
)
set "PATH=%~dp0backend;%~dp0backend\lib;%PATH%"

call mvnw.cmd spring-boot:run
pause
