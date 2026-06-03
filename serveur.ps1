# Serveur HTTP local pour TriPatient
# Lance avec : powershell -ExecutionPolicy Bypass -File serveur.ps1

$port   = 8080
$racine = $PSScriptRoot

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  TriPatient - Serveur démarré" -ForegroundColor Cyan
Write-Host "  Ouvrez : http://localhost:$port" -ForegroundColor Green
Write-Host "  Ctrl+C pour arrêter" -ForegroundColor Gray
Write-Host ""

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath
    if ($urlPath -eq "/") { $urlPath = "/index.html" }

    $filePath = Join-Path $racine ($urlPath.TrimStart("/").Replace("/", "\"))

    if (Test-Path $filePath -PathType Leaf) {
      $ext      = [System.IO.Path]::GetExtension($filePath)
      $mime     = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
      $bytes    = [System.IO.File]::ReadAllBytes($filePath)
      $res.ContentType   = $mime
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg  = [System.Text.Encoding]::UTF8.GetBytes("404 - Fichier introuvable : $urlPath")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }

    $res.OutputStream.Close()
  }
} finally {
  $listener.Stop()
}
