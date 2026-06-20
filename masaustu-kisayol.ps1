$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$Desktop\PrintRent.lnk")
$Shortcut.TargetPath = "C:\nodejs-mysql\PrintRent\start.bat"
$Shortcut.WorkingDirectory = "C:\nodejs-mysql\PrintRent"
$Shortcut.Description = "PrintRent - Yazici Yonetim Sistemi"
$Shortcut.IconLocation = "C:\nodejs-mysql\PrintRent\client\public\printer-192.png"
$Shortcut.WindowStyle = 1
$Shortcut.Save()
Write-Host "Masaustune PrintRent kisayolu olusturuldu!" -ForegroundColor Green
