@echo off
title Xiaolan Preview Server (PowerShell)
echo Starting local preview server...
echo.
echo This script uses PowerShell to create a local web server.
echo No Python or Node.js required.
echo.

:: Bypass execution policy to allow the script to run
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0preview-server.ps1'"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to start PowerShell server.
    pause
)
