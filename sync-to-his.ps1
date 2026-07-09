$kupolaRoot = "c:\Users\ck\Desktop\TRAE(1)\kupola"
$hisWebRoot = "c:\Users\ck\Desktop\TRAE(1)\his\his-web"

$syncMaps = @(
    @{ Source = "$kupolaRoot\js"; Target = "$hisWebRoot\kupola-js" },
    @{ Source = "$kupolaRoot\css"; Target = "$hisWebRoot\kupola-css" },
    @{ Source = "$kupolaRoot\icons"; Target = "$hisWebRoot\kupola-icons" },
    @{ Source = "$kupolaRoot\dist"; Target = "$hisWebRoot\kupola-dist" }
)

foreach ($map in $syncMaps) {
    $sourceDir = $map.Source
    $targetDir = $map.Target
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Write-Host "Created directory: $targetDir"
    }
    
    Write-Host "`nSyncing files from $sourceDir to $targetDir..."
    
    $count = 0
    Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
        $targetFile = Join-Path $targetDir $relativePath
        
        $targetDirPath = Split-Path $targetFile -Parent
        if (-not (Test-Path $targetDirPath)) {
            New-Item -ItemType Directory -Path $targetDirPath -Force | Out-Null
        }
        
        Copy-Item -Path $_.FullName -Destination $targetFile -Force
        $count++
        Write-Host "Copied: $relativePath"
    }
    
    Write-Host "Synced $count files"
}

Write-Host "`nSync completed successfully!"