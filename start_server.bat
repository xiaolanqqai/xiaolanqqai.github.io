@echo off
setlocal
title Xiaolan Local Server (Port 80)

:: Check for Administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"=""
    echo UAC.ShellExecute "cmd.exe", "/c %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%~dp0"
    cls
    echo ======================================================
    echo           Xiaolan Local Server - Starting
    echo ======================================================
    echo.

    :: Check for Node.js
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js is not installed or not in PATH.
        echo Please install Node.js from https://nodejs.org/
        echo.
        pause
        exit /B
    )

    :: Create a temporary server script if not exists
    set SERVER_JS=%temp%\xiaolan_server.js
    echo const http = require('http'); > "%SERVER_JS%"
    echo const fs = require('fs'); >> "%SERVER_JS%"
    echo const path = require('path'); >> "%SERVER_JS%"
    echo const port = 80; >> "%SERVER_JS%"
    echo const server = http.createServer((req, res) =^> { >> "%SERVER_JS%"
    echo   let filePath = '.' + req.url; >> "%SERVER_JS%"
    echo   if (filePath === './') filePath = './index.html'; >> "%SERVER_JS%"
    echo   const extname = path.extname(filePath); >> "%SERVER_JS%"
    echo   let contentType = 'text/html'; >> "%SERVER_JS%"
    echo   const mimeTypes = { >> "%SERVER_JS%"
    echo     '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', >> "%SERVER_JS%"
    echo     '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg', >> "%SERVER_JS%"
    echo     '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' >> "%SERVER_JS%"
    echo   }; >> "%SERVER_JS%"
    echo   contentType = mimeTypes[extname] ^|^| 'application/octet-stream'; >> "%SERVER_JS%"
    echo   fs.readFile(filePath, (error, content) =^> { >> "%SERVER_JS%"
    echo     if (error) { >> "%SERVER_JS%"
    echo       if(error.code == 'ENOENT') { >> "%SERVER_JS%"
    echo         res.writeHead(404); res.end('File not found'); >> "%SERVER_JS%"
    echo       } else { >> "%SERVER_JS%"
    echo         res.writeHead(500); res.end('Server error: '+error.code); >> "%SERVER_JS%"
    echo       } >> "%SERVER_JS%"
    echo     } else { >> "%SERVER_JS%"
    echo       res.writeHead(200, { 'Content-Type': contentType }); >> "%SERVER_JS%"
    echo       res.end(content, 'utf-8'); >> "%SERVER_JS%"
    echo     } >> "%SERVER_JS%"
    echo   }); >> "%SERVER_JS%"
    echo }).listen(port, () =^> { >> "%SERVER_JS%"
    echo   console.log('Server running at http://localhost/'); >> "%SERVER_JS%"
    echo   console.log('Press Ctrl+C to stop the server.'); >> "%SERVER_JS%"
    echo }).on('error', (err) =^> { >> "%SERVER_JS%"
    echo   if (err.code === 'EADDRINUSE') { >> "%SERVER_JS%"
    echo     console.error('[ERROR] Port 80 is already in use by another application.'); >> "%SERVER_JS%"
    echo     console.error('Please close other programs using port 80 (like IIS, Skype, or other servers) and try again.'); >> "%SERVER_JS%"
    echo   } else { >> "%SERVER_JS%"
    echo     console.error('[ERROR] Failed to start server:', err.message); >> "%SERVER_JS%"
    echo   } >> "%SERVER_JS%"
    echo   process.exit(1); >> "%SERVER_JS%"
    echo }); >> "%SERVER_JS%"
    
    :: Start the server
    echo [INFO] Starting server on port 80...
    
    :: Open browser automatically
    start http://localhost/
    
    node "%SERVER_JS%"

    pause
