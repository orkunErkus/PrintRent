$agentDir = "C:\nodejs-mysql\PrintRent\agent"
$outDir = "C:\nodejs-mysql\PrintRent\client\dist\agent"
$outFile = "$outDir\printrent-agent.zip"

if (!(Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

if (Test-Path -LiteralPath $outFile) {
    Remove-Item -LiteralPath $outFile -Force
}

Compress-Archive -LiteralPath $agentDir -DestinationPath $outFile -CompressionLevel Optimal
Write-Host "Agent zip created: $outFile"
