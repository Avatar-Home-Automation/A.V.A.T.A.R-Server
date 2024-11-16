Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
Write-Host "█                  A.V.A.T.A.R SERVER VERSION UPDATE                █" -ForegroundColor DarkMagenta
Write-Host "█                           MacOS installer                         █" -ForegroundColor DarkMagenta
Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
# A.V.A.T.A.R 29/10/2024

# We have time... 
Start-Sleep -Seconds 3

$ErrorActionPreference = "Ignore"

# Keep new version by filename
$app_name = $MyInvocation.MyCommand.Name
$version = $app_name.Substring(0, ($app_name.Length -4))

if (Test-Path ./update-$version.log -PathType Leaf) {
    Remove-Item ./update-$version.log -Force
}

$ErrorActionPreference = "Stop"

Start-Transcript -path ./update-$version.log -append
Clear-Host

Write-Host "⏳​ New server version: " -NoNewline -ForegroundColor DarkMagenta 
Write-Host "$version" -ForegroundColor DarkRed 

# Get Server URL from property
$properties = Get-Content ../core/Avatar.prop -Encoding utf8 | ConvertFrom-Json
$property = $properties.repository
$url = "https://github.com/"+$property+"/archive/master.zip"

# Download master package
Write-Host "⏳​ Downloading server master package from GitHub" -NoNewline -ForegroundColor DarkMagenta
Invoke-WebRequest -Uri $url -OutFile ./A.V.A.T.A.R-Server-master.zip
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1

# Unzip master package
if (Test-Path ./newVersion-$version) {
    Write-Host "⏳​ Removing old existing server master package" -NoNewline -ForegroundColor DarkMagenta
    Remove-Item ./newVersion-$version -Recurse -Force
    Write-Host " done" -ForegroundColor Green
}
Write-Host "⏳​ Unziping server master package" -NoNewline -ForegroundColor DarkMagenta
Expand-Archive -LiteralPath ./A.V.A.T.A.R-Server-master.zip -DestinationPath ./newVersion-$version -Force
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1

# Set location
$current_location = Get-Location
$package = "./newVersion-$version/A.V.A.T.A.R-Server-master/update/$version"
Set-Location -Path $package

# Test version type
$installType = $null
$del = $null
Write-Host "⏳​ Update type: " -NoNewline -ForegroundColor DarkMagenta 
foreach($line in Get-Content "./README.txt"){
    If ($line -like "*new version*") {
        Write-Host "New server executable version" -ForegroundColor DarkRed
        $installType = "exe"
        $del = $True
    } elseif ($line -like "*requires packages*") {
        Write-Host "New packages in node_modules directory" -ForegroundColor DarkRed
        $installType = "module"
        $del = $True
    } elseif ($line -like "*files to be copied*") {
        Write-Host "Files only" -ForegroundColor DarkRed
        $installType = "file"
    }
}

if ($null -eq $installType) {
    Write-Error "Enable to find the installation type. Exit"
    Stop-Transcript
    exit
}

# perform installation for exe and module only
If (($installType -eq "exe") -or ($installType -eq "module")) {

    Write-Host "⏳​ Electron version: " -NoNewline -ForegroundColor DarkMagenta 
    $json_package = Get-Content ./package.json -Encoding utf8 | ConvertFrom-Json
    $electron_version = $json_package.devDependencies.electron
    if ($null -eq $electron_version ) {
        Write-Error "Enable to find the Electron version in the package.json. Exit"
        Stop-Transcript
        exit
    } else {
        $electron_version = $electron_version.Substring(1, $electron_version.Length-1)
        Write-Host $electron_version -ForegroundColor DarkRed
    }

    If ($installType -eq "exe") {
        Write-Host "⏳​ Installing Electron packager, please wait..." -ForegroundColor DarkMagenta
        start-process -FilePath "npm" -ArgumentList "install", "--save-dev @electron/packager" -NoNewWindow -workingdirectory . -Wait 
        Write-Host "Electron packager installed" -ForegroundColor Green
        Start-Sleep -Seconds 1
        Write-Host "⏳​ Creating a new A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
        start-process -FilePath "npx" -ArgumentList "electron-packager", ".", "--electron-version=$electron_version", "--icon=./avatar.icns", "--out=./output" -NoNewWindow -workingdirectory . -Wait
        Write-Host "A.V.A.T.A.R application created" -ForegroundColor Green

        # get platform
        $output = Get-ChildItem -Path ./output
        foreach ($MySubFolder in $output) {
            $output_platform = $MySubFolder.name
        }

        if ($null -eq $output_platform ) {
            Write-Error "Enable to find the application output directory. Exit"
            Stop-Transcript
            exit
        }
        $package = "$package/output/$output_platform"
        Start-Sleep -Seconds 1 
    } else {
        Write-Host "⏳​ Installing node_modules packages, please wait..." -ForegroundColor DarkMagenta
        start-process -FilePath "npm" -ArgumentList "install" -NoNewWindow -workingdirectory . -Wait
        Write-Host "Node_modules packages installed" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
} 

Set-Location -Path $current_location

# Remove node_modules & Chrome if mandatory to exclude bad version files
if ($del -eq $True) {
    $ErrorActionPreference = 'SilentlyContinue'
    Write-Host "⏳​ Removing node_modules directory" -ForegroundColor DarkMagenta
    Remove-Item ../node_modules -Recurse -Force
    If ((Test-Path "../node_modules") -eq $True) {
        Write-Host "> Unable to remove node_modules directory, wait 3 seconds and retry..." -ForegroundColor DarkRed
        Start-Sleep -Seconds 3
        Remove-Item ../node_modules -Recurse -Force
    } 
    If ((Test-Path "../node_modules") -eq $True) {
        Write-Host "> Unable to remove the old version of node_modules directory, the installation can continue..." -ForegroundColor DarkMagenta
    } else {
        Write-Host "node_modules directory removed" -ForegroundColor Green
    }

    Start-Sleep -Seconds 1
}

# Set installation path
If ($installType -eq "exe") {
    $installPath = "../../../../.."
} Else { 
    $installPath = ".."
}

$ErrorActionPreference = 'Stop'
# Copy new version to the A.V.A.T.A.R client directory
Write-Host "⏳​ Copying new version to the A.V.A.T.A.R server directory, please wait..." -NoNewline -ForegroundColor DarkMagenta
$omissions = [string[]]@("LICENSE","version","LICENSES.chromium.html")
Copy-Item -Path "$package/*" -Exclude $omissions -Destination "$installPath" -Recurse -Force
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1

If (($installType -eq "exe") -or ($installType -eq "module")) {
    Write-Host "⏳​ Installing Electron package in A.V.A.T.A.R application, please wait..." -ForegroundColor DarkMagenta
    start-process -FilePath "npm" -ArgumentList "install", "--save-dev electron@$electron_version" -NoNewWindow -workingdirectory ".." -Wait
    Write-Host "Electron package installation done" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

# Update Properties
Write-Host "⏳​ Updating Properties" -NoNewline -ForegroundColor DarkMagenta
$file = Get-Content "../core/Avatar.prop" -Encoding utf8 | ConvertFrom-Json
$file | ForEach-Object {if($_.version -notmatch $version){$_.version=$version}}
$file | ConvertTo-Json -EscapeHandling EscapeHtml -depth 32 | ForEach-Object { [System.Text.RegularExpressions.Regex]::Unescape($_) } | Out-File "../core/Avatar.prop"
Start-Sleep -Seconds 1

$file = Get-Content "../assets/config/default/Avatar.prop" -Encoding utf8 | ConvertFrom-Json
$file | ForEach-Object {if($_.version -notmatch $version){$_.version=$version}}
$file | ConvertTo-Json -EscapeHandling EscapeHtml -depth 32 | ForEach-Object { [System.Text.RegularExpressions.Regex]::Unescape($_) } | Out-File "../assets/config/default/Avatar.prop"
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1

# Update package.json
Write-Host "⏳​ Updating package.json" -NoNewline -ForegroundColor DarkMagenta
$file = Get-Content "../package.json" -Encoding utf8 | ConvertFrom-Json
$file | ForEach-Object {if($_.version -notmatch $version){$_.version=$version}}
$file | ConvertTo-Json -EscapeHandling EscapeHtml -depth 32 | ForEach-Object { [System.Text.RegularExpressions.Regex]::Unescape($_) } | Out-File "../package.json" 
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1 

$ErrorActionPreference = 'Ignore'

try {
    Write-Host "⏳​ Removing new version temporary files, please wait..." -NoNewline -ForegroundColor DarkMagenta
    Remove-Item ./newVersion-$version -Recurse -Force
    Start-Sleep -Seconds 1

    Remove-Item ./A.V.A.T.A.R-Server-master.zip -Force
    Start-Sleep -Seconds 1

    Remove-Item ./shell.sh -Force
    Remove-Item ./$app_name -Force
    Write-Host " done" -ForegroundColor Green
    Start-Sleep -Seconds 1
}
catch {
    Write-Host ": " -NoNewline
    Write-Error $_.Exception.InnerException.Message -ErrorAction Continue
    Start-Sleep -Seconds 1
}

# Fifo file to send to the application
$end_install = "end installation"
Out-File -FilePath ./step-2.txt -InputObject $version-$end_install -Encoding utf8 -NoNewline

# Restart the A.V.A.T.A.R server
$ErrorActionPreference = 'Stop'
Write-Host "⏳​ Restarting A.V.A.T.A.R server" -NoNewline -ForegroundColor DarkMagenta
$app_location = "$current_location/../../../../.."
start-process -filePath "$app_location/A.V.A.T.A.R-Server.app" -workingdirectory "$app_location" -wait
Write-Host " done" -ForegroundColor Green
Start-Sleep -Seconds 1

Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "█    The new $version version installation has been successfully completed!       █" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "█       You may wish to consult the installation 'update-$version.log' file       █" -ForegroundColor DarkMagenta
Write-Host "█                             in the app/tmp directory                         █" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta

Stop-Transcript
