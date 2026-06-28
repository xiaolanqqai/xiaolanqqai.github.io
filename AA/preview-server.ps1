# Simple Static Web Server using PowerShell (No Python/Node required)
# 适用于没有安装 Python 或 Node.js 的 Windows 环境

$port = 8000
$root = $PSScriptRoot
$url = "http://localhost:$port/"

Write-Host "Starting simple static server..." -ForegroundColor Cyan
Write-Host "Root Directory: $root" -ForegroundColor Gray
Write-Host "URL: $url" -ForegroundColor Green

# Create HTTP Listener
$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add($url)
    $listener.Start()
}
catch {
    Write-Host "Error: Port $port is likely in use or permission denied." -ForegroundColor Red
    Write-Host "Please try closing other applications or changing the port in the script." -ForegroundColor Yellow
    exit
}

# Open browser automatically
Start-Process $url

Write-Host "Server is running. Press Ctrl+C to stop." -ForegroundColor Yellow

# MIME Types mapping
$mimeTypes = @{
    ".html" = "text/html"
    ".htm"  = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain"
    ".xml"  = "application/xml"
    ".map"  = "application/json"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

# Main Loop
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    # Get local path
    $localPath = $root + $request.Url.LocalPath.Replace('/', '\')
    
    # Default to index.html if directory
    if (Test-Path $localPath -PathType Container) {
        $localPath = Join-Path $localPath "index.html"
    }

    Write-Host "$($request.HttpMethod) $($request.Url.LocalPath)" -NoNewline

    if (Test-Path $localPath -PathType Leaf) {
        try {
            # Read file content
            $content = [System.IO.File]::ReadAllBytes($localPath)
            
            # Determine Content-Type
            $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
            if ($mimeTypes.ContainsKey($extension)) {
                $response.ContentType = $mimeTypes[$extension]
            } else {
                $response.ContentType = "application/octet-stream"
            }
            
            # Disable Caching
            $response.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            $response.AddHeader("Pragma", "no-cache")
            
            # Send response
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
            Write-Host " [200 OK]" -ForegroundColor Green
        }
        catch {
            $response.StatusCode = 500
            Write-Host " [500 Error]" -ForegroundColor Red
        }
    } else {
        $response.StatusCode = 404
        Write-Host " [404 Not Found]" -ForegroundColor Red
    }

    $response.Close()
}
