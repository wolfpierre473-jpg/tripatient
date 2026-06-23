# Serveur HTTP local pour TriPatient
# Lance avec : powershell -ExecutionPolicy Bypass -File serveur.ps1

$port   = 8080
$racine = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "TriPatient - serveur sur http://localhost:$port (racine: $racine)"

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
    try {
      $req = $ctx.Request
      $res = $ctx.Response

      $urlPath = $req.Url.LocalPath
      if ($urlPath -eq "/") { $urlPath = "/index.html" }

      $filePath = Join-Path $racine ($urlPath.TrimStart("/").Replace("/", "\"))

      if (Test-Path $filePath -PathType Leaf) {
        $ext   = [System.IO.Path]::GetExtension($filePath)
        $mime  = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType     = $mime
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - $urlPath")
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
      $res.OutputStream.Close()
    } catch {
      Write-Host "Erreur requete: $($_.Exception.Message)"
      try { $ctx.Response.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
