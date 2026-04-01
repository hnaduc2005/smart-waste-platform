$gitkeeps = Get-ChildItem -Path . -Recurse -Filter ".gitkeep" -Force
foreach ($keep in $gitkeeps) {
    if ($keep.FullName -match "\.git\\") { continue }
    $dir = $keep.Directory
    $otherItems = Get-ChildItem -Path $dir.FullName -Force | Where-Object { $_.Name -ne '.gitkeep' }
    if ($otherItems) {
        Write-Host "Removing $keep"
        Remove-Item -Path $keep.FullName -Force
    }
}
$status = (git status --porcelain | Out-String).Trim()
if ($status) {
    git add .
    git commit -m "update code"
    git push origin main
}
