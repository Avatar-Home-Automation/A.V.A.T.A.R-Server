# testing commands
# ./installer.ps1 -directory "c:\avatar\server" -shortcut
# ./installer.ps1 -application
# ./installer.ps1 -directory "/avatar/server" -shortcut
# ./installer.ps1 -directory "/avatar/server" -uninstall

# Parameters
param (
    [string[]]$directory,
    [switch]$application,
    [switch]$shortcut,
    [switch]$uninstall,
    [switch]$help
)

function Show-Help {
    Write-Host "Usage: installer.ps1 [options]"
    Write-Host "Installer options:" -ForegroundColor Yellow
    Write-Host "-help            : Display this help."
    Write-Host "-directory       : All platforms. Specify the directory path to be used for installation."
    Write-Host "-application     : macOS and Linux only. Install the client as an application accessible via Finder or the Dock."
    Write-Host "-shortcut        : Windows and Linux only. Create an application icon on the user's desktop."
    Write-Host " "
    Write-Host "Description:" -ForegroundColor Yellow
    Write-Host "This script performs an installation by managing specific directories."
    Write-Host "If an existing directory is detected, it will be removed."
    Write-Host " "
    Write-Host "Uninstaller options:" -ForegroundColor Yellow   
    Write-Host "-uninstall       : Specifies if it is an uninstallation." 
    Write-Host "-directory       : All platforms. Specify the path of the directory to be removed."
    Write-Host "-application     : macOS and Linux only. Uninstall the client accessible via Finder or the Dock."
    Write-Host " "
    Write-Host "More information about the parameters can be found in the installation documentation." -ForegroundColor Yellow
    Write-Host " "
    exit
}

$platform = if ($(Get-Variable IsWindows -Value)) { "win32" } elseif ($(Get-Variable IsLinux -Value)) { "linux" } elseif ($(Get-Variable IsMacOS -Value)) { "darwin" } else { $null }

function CheckDependencies {
    Write-Host "Checking dependencies..." -ForegroundColor Yellow
    # Check if npm is installed
    if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
        Write-Host "npm is not installed. Please install Node.js and npm to continue." -ForegroundColor Green
        Exit 1
    }

    # Check if PowerShell version is sufficient
    if ($PSVersionTable.PSVersion -lt [Version]"7.0") {
        Write-Host "PowerShell version 7.0 or higher is required." -ForegroundColor Red
        Exit 1
    }
}

CheckDependencies

function Uninstall-ElectronPackager {
    # Uninstalling Electron packager
    Write-Host "> Uninstalling Electron packager, please wait..." -ForegroundColor DarkMagenta
    start-process -FilePath "npm" -ArgumentList "uninstall", "@electron/packager" -NoNewWindow -workingdirectory "." -Wait 
    Write-Host "Electron packager uninstalled" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

function Install-Electron {
    param ($workingdirectory)

    Write-Host "> Installing Electron version $electron, please wait..." -ForegroundColor DarkMagenta
    start-process -FilePath "npm" -ArgumentList "install", "--save-dev electron@$electron" -NoNewWindow -workingdirectory $workingdirectory -Wait
    Write-Host "Electron package installation done" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

function Set-NewApplication {
    param (
        $folder, 
        $destination
    )
    # Copy new version as Applications
    Write-Host "> Installing A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
    $omissions = [string[]]@("LICENSE","version","LICENSES.chromium.html")
    Copy-Item -Path "$folder" -Exclude $omissions -Destination "$destination" -Recurse -Force
    Write-Host "A.V.A.T.A.R server application installed" -ForegroundColor Green
    Start-Sleep -Seconds 1
}


function Uninstall-app {

    Write-Host ""
    $confirm = Read-Host -Prompt "Would you really like to uninstall A.V.A.T.A.R server (Y/N)[N]?"
    if ([string]::IsNullOrWhiteSpace($confirm)) {
        $confirm ="N"
    }
    if ($confirm.ToLower() -eq 'n') {
        Write-Host ""
        Write-Host "Bye bye, have a good day!" -ForegroundColor DarkMagenta 
        Write-Host ""
        Stop-Transcript
        exit
    }
    $current_location = Get-Location
    
    $folder = if ($platform -eq "win32" -or ($platform -eq "linux" -and $application -eq $False) -or ($platform -eq "darwin" -and $application -eq $False)) {
        "$directory"
    } elseif ($platform -eq "linux" -and $application -eq $True) {
        "/usr/lib/a.v.a.t.a.r-server"
    } elseif ($platform -eq "darwin" -and $application -eq $True) {
        "/Applications/A.V.A.T.A.R-Server.app"
    } 

    if ((Test-Path "$folder") -eq $True) {

        if ($platform -eq "win32") {

            $checkVersionFile = if ($platform -eq "win32" -or ($platform -eq "linux" -and $application -eq $False)) {
                "$directory/resources/app/assets/config/default/Avatar.prop"
            }

            $json_avatar = Get-Content $checkVersionFile -Encoding utf8 | ConvertFrom-Json
            $version = $json_avatar.version
            $DesktopPath = [Environment]::GetFolderPath('Desktop')
            $ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "A.V.A.T.A.R Server $version.lnk"

            if ($version -and ((Test-Path "$ShortcutPath") -eq $True)) {
                Write-Host "> Removing A.V.A.T.A.R server desktop shortcut" -ForegroundColor DarkMagenta
                Remove-Item "$ShortcutPath" -Force
                Write-Host "A.V.A.T.A.R server desktop shortcut removed" -ForegroundColor Green
            }
        
            Write-Host "> Removing A.V.A.T.A.R server, please wait..." -ForegroundColor DarkMagenta
            Remove-Item "$folder" -Recurse -Force
            if ((Test-Path "$folder") -eq $True) {Remove-Item "$folder" -Recurse -Force}
            if ((Test-Path "$folder") -eq $True) {
                Write-host " "
                Write-Host "WARNING:" -ForegroundColor Yellow
                Write-Host "Unable to completely remove the A.V.A.T.A.R server directory." -ForegroundColor Yellow
                Write-Host "Please, open a Windows Explorer and remove the $folder directory manually." -ForegroundColor Yellow
                Write-host " "
            } else {
                Write-Host "A.V.A.T.A.R Server removed" -ForegroundColor Green
            }

        } elseif ($platform -eq "linux") {

            if ($application -eq $False) {
                $desktopFile = "$env:HOME/.local/share/applications/a.v.a.t.a.r-server.desktop"
                if ((Test-Path "$desktopFile") -eq $True) {
                    Write-Host "> Removing A.V.A.T.A.R server desktop shortcut" -ForegroundColor DarkMagenta
                    Remove-Item "$desktopFile" -Force
                    Write-Host "A.V.A.T.A.R server desktop shortcut removed" -ForegroundColor Green
                }
            }

            Write-Host "> Removing A.V.A.T.A.R server, please wait..." -ForegroundColor DarkMagenta
            if ($application -eq $True) { 
                start-process -FilePath "sudo" -ArgumentList "apt remove a.v.a.t.a.r-server" -NoNewWindow -workingdirectory "." -Wait
            }
            if ((Test-Path "$folder") -eq $True) {
                start-process -FilePath "sudo" -ArgumentList "rm -r $folder" -NoNewWindow -workingdirectory "." -Wait
            }

            if ((Test-Path "$folder") -eq $True) {
                Write-host " "
                Write-Host "WARNING:" -ForegroundColor Yellow
                Write-Host "Unable to completely remove the A.V.A.T.A.R server directory." -ForegroundColor Yellow
                Write-Host "Please, open a Windows Explorer and remove the $folder directory manually." -ForegroundColor Yellow
                Write-host " "
            } else {
                Write-Host "A.V.A.T.A.R Server removed" -ForegroundColor Green
            }

        } elseif ($platform -eq "darwin") {

            Write-Host "> Removing A.V.A.T.A.R server, please wait..." -ForegroundColor DarkMagenta
            Remove-Item "$folder" -Recurse -Force
            if ((Test-Path "$folder") -eq $True) {
                start-process -FilePath "sudo" -ArgumentList "rm -r $folder" -NoNewWindow -workingdirectory "." -Wait
            }
            if ((Test-Path "$folder") -eq $True) {
                Write-host " "
                Write-Host "WARNING:" -ForegroundColor Yellow
                Write-Host "Unable to completely remove the A.V.A.T.A.R server directory." -ForegroundColor Yellow
                Write-Host "Please, open a Windows Explorer and remove the $folder directory manually." -ForegroundColor Yellow
                Write-host " "
            } else {
                Write-Host "A.V.A.T.A.R Server removed" -ForegroundColor Green
            }
            
        }

    } else {
        Write-Host "A.V.A.T.A.R server directory not exists. Ignored." -ForegroundColor Yellow
        Write-Host " "
        Stop-Transcript
        exit
    }
    
    Set-Location -Path $current_location
    # Reset directory location
    Write-Host ""
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
    Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
    Write-Host "█            A.V.A.T.A.R server has been successfully uninstalled!             █" -ForegroundColor DarkMagenta
    Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
    Stop-Transcript
    exit
}

Clear-Host

if ($help) {
    Show-Help
}

$ErrorActionPreference = "Ignore"

if ((Test-Path ./server-installer.log) -eq $True) {
    Remove-Item ./server-installer.log -Force
}
$ErrorActionPreference = "Stop"

Start-Transcript -path ./server-installer.log -append

if ($uninstall -eq $False) {
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
    Write-Host "█                     =========================================                █" -ForegroundColor DarkMagenta
    Write-Host "█                           A.V.A.T.A.R server installer                       █" -ForegroundColor DarkMagenta
    Write-Host "█                     ========== Windows/linux/darwin =========                █" -ForegroundColor DarkMagenta
    Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
    Write-Host "█   Created by:     avatar.home.automation@gmail.com                           █" -ForegroundColor DarkMagenta
    Write-Host "█   Creation date:  11-12-2024                                                 █" -ForegroundColor DarkMagenta
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
} else {
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
    Write-Host "█                   =========================================                  █" -ForegroundColor DarkMagenta
    Write-Host "█                         A.V.A.T.A.R client uninstaller                       █" -ForegroundColor DarkMagenta
    Write-Host "█                   ========== Windows/linux/darwin =========                  █" -ForegroundColor DarkMagenta
    Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
    Write-Host "█   Created by:     avatar.home.automation@gmail.com                           █" -ForegroundColor DarkMagenta
    Write-Host "█   Creation date:  11-17-2024                                                 █" -ForegroundColor DarkMagenta
    Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
}

# Test platform parameter
if ($null -eq $platform) {
    Write-Host ""
    Write-Host "ERROR: The platform is not compatible, must be win32/linux/darwin (see the documentation)." -ForegroundColor DarkRed
    Write-Host ""
    Stop-Transcript
    exit    
}

# Test installation type
if ($null -eq $directory -and $application -eq $False) {
    Write-Host ""
    Write-Host "ERROR: At least one of -directory or -application parameter is required (see installation documentation)." -ForegroundColor DarkRed
    Write-Host ""
    Stop-Transcript
    exit
}

# Test installation path (only for win32)
if ($null -eq $directory -and $platform -eq "win32") {
    Write-Host ""
    Write-Host "ERROR: For a Windows installation, the -directory parameter is required (see installation documentation)." -ForegroundColor DarkRed
    Write-Host ""
    Stop-Transcript
    exit
}

# Test installation type
if ($null -ne $directory -and $application -eq $True) {
    Write-Host ""
    Write-Host "ERROR: Choose between -directory or -application but not both at the same time (see installation documentation)." -ForegroundColor DarkRed
    Write-Host ""
    Stop-Transcript
    exit
}

# Summary
Write-Host ""
Write-Host "> Installation platform: " -NoNewline 
Write-Host "$platform" -ForegroundColor Magenta
Write-Host "> Installation directory: " -NoNewline 
if ($application -eq $True) {
    if ($platform -eq "linux") {
        Write-Host "Application by the debian installer"
    } elseif ($platform -eq "darwin") {
        Write-Host "Application (Finder) by the installer" 
    } else {
        Write-Host "$directory" -ForegroundColor Magenta
    }
} else {
    if ($platform -eq "linux" -or $platform -eq "darwin") {
        $directory = "$env:HOME/$directory"
        Write-Host "$directory" -ForegroundColor Magenta
    } else {
        Write-Host "$directory" -ForegroundColor Magenta
    }
}

if ($uninstall -eq $True) {
    if ($null -eq $directory -and $application -eq $False) {
        Write-Host ""
        Write-Host "ERROR: uninstalling the application required a -directory or -application parameter (see the documentation)." -ForegroundColor DarkRed
        Write-Host ""
        Stop-Transcript
        exit
    }

    Uninstall-app 
}

Write-Host "> Installation as application (launcher): " -NoNewline  
if ($platform -eq "win32" -and $application -eq $True) {
    Write-Host "Installer is not supported on Windows" -ForegroundColor Magenta
} else {
    if ($application -eq $True) {
        Write-Host "Yes" -ForegroundColor Magenta
    } else {
        Write-Host "No" -ForegroundColor Magenta
    }
}
Write-Host "> Shortcut on Desktop: " -NoNewline
if ($shortcut -eq $True) {
    if ($platform -eq "linux"-and (((Test-Path "/usr/share/applications/a.v.a.t.a.r-server.desktop") -eq $True) -or ((Test-Path "$directory") -eq $False -and ((Test-Path "$env:HOME/.local/share/applications/a.v.a.t.a.r-server.desktop")-eq $True)))) {
        Write-Host "No (see the message below)" -ForegroundColor DarkRed
    } elseif ($platform -eq "darwin" -and $null -ne $directory) {
        Write-Host "No (see the message below)" -ForegroundColor DarkRed
    } else {
        Write-Host "Yes" -ForegroundColor Magenta
    }
} else {
    Write-Host "No" -ForegroundColor Magenta
}
Write-Host ""
If (((Test-Path "$directory") -eq $True)  -or ($platform -eq "linux" -and $application -eq $True -and ((Test-Path "/usr/lib/a.v.a.t.a.r-server") -eq $True)) -or ($platform -eq "darwin" -and $application -eq $True -and ((Test-Path "/Applications/A.V.A.T.A.R-Server.app") -eq $True))) {
    Write-Host "> Warning:" -ForegroundColor Yellow
    Write-Host "    An old $directory directory exists and will be removed during the installation." -ForegroundColor Yellow 
    Write-Host "    if you want to backup it, stop the installation now!" -ForegroundColor Yellow

    if ($platform -eq "linux" -and $shortcut -eq $True) {
        if ((Test-Path "/usr/share/applications/a.v.a.t.a.r-server.desktop") -eq $True) {
            Write-Host ""
            Write-Host "> Warning:" -ForegroundColor Yellow
            Write-Host "    An application shortcut already exists in the application launcher." -ForegroundColor Yellow  
            Write-Host "    The installer can't create several shortcuts for the same application." -ForegroundColor Yellow 
            Write-Host "    If you want a shortcut for this new application, you have to create a shortcut manually after the installation." -ForegroundColor Yellow 
            Write-Host "    More information in the documentation." -ForegroundColor Yellow   
            $shortcut = $False
        }
    } 
    Write-Host ""
} Elseif ($platform -eq "linux" -and $application -eq $False -and (Test-Path "$directory") -eq $False -and ((Test-Path "$env:HOME/.local/share/applications/a.v.a.t.a.r-server.desktop")-eq $True)) {
    Write-Host "Warning:" -ForegroundColor DarkRed
    Write-Host "    An application shortcut already exists in the application launcher." -ForegroundColor Yellow  
    Write-Host "    The installer can't create several shortcuts for the same application." -ForegroundColor Yellow 
    Write-Host "    If you want a shortcut for this new application, you have to create a shortcut manually after the installation." -ForegroundColor Yellow 
    Write-Host "    More information in the documentation." -ForegroundColor Yellow  
    $shortcut = $False
} Elseif ($platform -eq "linux" -and $application -eq $True -and ((Test-Path "$env:HOME/.local/share/applications/a.v.a.t.a.r-server.desktop")-eq $True)) {
    Write-Host "ERROR:" -ForegroundColor DarkRed
    Write-Host "    An application shortcut already exists in the application launcher." -ForegroundColor DarkRed  
    Write-Host "    The installer can't create several shortcuts for the same application." -ForegroundColor DarkRed 
    Write-Host "    Because you have choosed an application created by debian installer, a shortcut is mandatory." -ForegroundColor DarkRed 
    Write-Host "    If you want to modify the existing shortcut for the existing application," -ForegroundColor DarkRed 
    Write-Host "    you have to modify the shortcut manually before the installation." -ForegroundColor DarkRed 
    Write-Host "    More information in the documentation." -ForegroundColor DarkRed   
    Write-Host ""
    Stop-Transcript
    exit
} 

$confirm = Read-Host -Prompt "Would you like to continue (Y/N)[Y]?"
if ([string]::IsNullOrWhiteSpace($confirm)) {
    $confirm ="Y"
}
if ($confirm.ToLower() -eq 'n') {
    Write-Host ""
    Write-Host "Bye bye, have a good day!" -ForegroundColor DarkMagenta 
    Write-Host ""
    Stop-Transcript
    exit
}

# Set location
$current_location = Get-Location
$package = "$current_location/dist"
Set-Location -Path $package

# Installing Electron packager
Write-Host "> Installing Electron packager, please wait..." -ForegroundColor DarkMagenta
start-process -FilePath "npm" -ArgumentList "install", "--save-dev @electron/packager" -NoNewWindow -workingdirectory "." -Wait 
Write-Host "Electron packager installed" -ForegroundColor Green
Start-Sleep -Seconds 1

# Finding Electron version
Write-Host "> Electron version: " -NoNewline -ForegroundColor DarkMagenta 
$json_package = Get-Content ./package.json -Encoding utf8 | ConvertFrom-Json
$electron = $json_package.devDependencies.electron
if ($null -eq $electron ) {
    Write-Error "Enable to find the Electron version in the package.json. Exit" -ForegroundColor DarkRed
    Stop-Transcript
    exit
} else {
    $electron = $electron.Substring(1, $electron.Length-1)
    Write-Host $electron -ForegroundColor DarkRed
}

# Finding A.V.A.T.A.R version
Write-Host "> A.V.A.T.A.R version: " -NoNewline -ForegroundColor DarkMagenta 
$json_avatar = Get-Content ./assets/config/default/Avatar.prop -Encoding utf8 | ConvertFrom-Json
$version = $json_avatar.version
if ($null -eq $version ) {
    Write-Error "Enable to find A.V.A.T.A.R version in the Avatar.prop file. Exit" -ForegroundColor DarkRed
    Stop-Transcript
    exit
} else {
    Write-Host $version -ForegroundColor DarkRed
}

# Creating application
Write-Host "> Creating new A.V.A.T.A.R server, please wait..." -ForegroundColor DarkMagenta
start-process -FilePath "npx" -ArgumentList "electron-packager", ".", "--electron-version=$electron", "--overwrite", "--icon=./avatar.ico", "--out=./output" -NoNewWindow -workingdirectory "." -Wait
Write-Host "A.V.A.T.A.R application created" -ForegroundColor Green
Start-Sleep -Seconds 1   

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

$package = "./output/$output_platform"
Start-Sleep -Seconds 1 

if ($platform -eq "win32" -or $platform -eq "linux") {

    if ($application -eq $False) {

        if (-Not (Test-Path $directory)) {
            New-Item -Path "$directory" -ItemType "directory"
        } else {
            # Removing old application directory
            Write-Host "> Removing old A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
            Remove-Item "$directory" -Recurse -Force
            if ((Test-Path $directory) -eq $True) {
                if ($platform -eq "linux") {
                    start-process -FilePath "sudo" -ArgumentList "rm -r $directory" -NoNewWindow -workingdirectory "." -Wait
                } else {
                    Remove-Item "$directory" -Recurse -Force
                }
            }
            New-Item -Path "$directory" -ItemType "directory"
            Write-Host "Old A.V.A.T.A.R client application removed" -ForegroundColor Green
            Start-Sleep -Seconds 1
        }

        # Copy new version to the A.V.A.T.A.R client directory
        Set-NewApplication -folder "$package/*" -destination "$directory"

    } elseif ($platform -eq "linux" -and $application -eq $True) {

        if ((Test-Path "/usr/lib/a.v.a.t.a.r-server") -eq $True) {
            # Removing old application directory
            Write-Host "> Removing old A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
            Write-Host " "
            start-process -FilePath "sudo" -ArgumentList "apt remove a.v.a.t.a.r-server" -NoNewWindow -workingdirectory "." -Wait
            if ((Test-Path "/usr/lib/a.v.a.t.a.r-server") -eq $True) {
                start-process -FilePath "sudo" -ArgumentList "rm -r /usr/lib/a.v.a.t.a.r-server" -NoNewWindow -workingdirectory "." -Wait
            }
            Write-Host "Old A.V.A.T.A.R server application removed" -ForegroundColor Green
        }

        # Uninstalling Electron packager
        Uninstall-ElectronPackager
        # Installing Electron package
        Install-Electron -workingdirectory "$package/resources/app"

        # Installing debian installer
        Write-Host "> Installing debian installer, please wait..." -ForegroundColor DarkMagenta
        start-process -FilePath "npm" -ArgumentList "install", "--save-dev electron-installer-debian" -NoNewWindow -workingdirectory "." -Wait 
        Write-Host "debian installer installed" -ForegroundColor Green
        Start-Sleep -Seconds 1

        # Creating a deb package
        Write-Host "> Creating a .deb package, please wait..." -ForegroundColor DarkMagenta
        start-process -FilePath "electron-installer-debian" -ArgumentList "--src", "$package", "--dest", "./installer/", "--arch", "amd64" -NoNewWindow -workingdirectory "." -Wait
        Write-Host "deb package created" -ForegroundColor Green
        Start-Sleep -Seconds 1   

        # Finding deb package name
        $debfolder = Get-ChildItem -Path "./installer"
        foreach ($MySubFolder in $debfolder) {
            $debpackage = $MySubFolder.name
        }
        if ($null -eq $debpackage) {
            Write-Error "Enable to find the A.V.A.T.A.R deb package. Exit" -ForegroundColor DarkRed
            Stop-Transcript
            exit
        }

        # Installing deb package
        Write-Host "> Installing A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
        Set-Location -Path "./installer"

        start-process -FilePath "sudo" -ArgumentList "apt install ./$debpackage" -NoNewWindow -workingdirectory "." -Wait
        Write-Host "A.V.A.T.A.R server application installed" -ForegroundColor Green
        Start-Sleep -Seconds 1   

        if ((Test-Path "/usr/lib/a.v.a.t.a.r-server") -eq $True) {

            # Gets owner
            $app_name = $MyInvocation.MyCommand.Name
            $user = $(Get-ChildItem $current_location/$app_name | Select-Object User,Group)
            # Changing user,group of all A.V.A.T.A.R files
            Set-Location -Path "/usr/lib/a.v.a.t.a.r-server"
            Write-Host "> Changing owner of A.V.A.T.A.R server application to $user (this may take a while)" -NoNewline -ForegroundColor DarkMagenta
            Get-ChildItem -Path "." -Recurse | ForEach-Object {sudo chown $user.User $_.FullName;sudo chgrp $user.Group $_.FullName}
            Write-Host " done" -ForegroundColor Green
 
            # Changing icon to shorcut
            Set-Location -Path $current_location
            Write-Host "> Update application shortcut" -NoNewline -ForegroundColor DarkMagenta
            Get-Content -Path "/usr/share/applications/a.v.a.t.a.r-server.desktop" | Foreach-Object {
                $_ -replace "Name=A.V.A.T.A.R-Server", "Name=A.V.A.T.A.R Server $version" 
            } | Foreach-Object {
                $_ -replace "Comment=A.V.A.T.A.R server", "Comment=A.V.A.T.A.R Server $version" 
            } | Foreach-Object {
                $_ -replace "Icon=a.v.a.t.a.r-server", "Icon=/usr/lib/a.v.a.t.a.r-server/resources/app/avatar.ico"
            } | Set-Content "./shortcut.txt"
            
            start-process -FilePath "sudo" -ArgumentList "cp ./shortcut.txt /usr/share/applications/a.v.a.t.a.r-server.desktop" -NoNewWindow -workingdirectory "." -Wait
            Remove-Item ./shortcut.txt -Force
            Write-Host " done" -ForegroundColor Green

        } else {
            Write-Error "ERROR: The installation of the A.V.A.T.A.R server as application failed. Exit" -ForegroundColor DarkRed
            Set-Location -Path $current_location
            Stop-Transcript
            exit
        }
        
    } 
    
    if ($platform -eq "win32" -or ($platform -eq "linux" -and $application -eq $False )) {
        
        # Set folder for the Electron package
        Set-Location -Path "$directory/resources/app"

        # Uninstalling Electron packager
        Uninstall-ElectronPackager
        # Installing Electron package
        Install-Electron -workingdirectory "."

    }
} else {

    $folderPath = if ($application -eq $True) {"/Applications/A.V.A.T.A.R-Server.app"} else {"$directory/A.V.A.T.A.R-Server.app"}
    if ((Test-Path "$folderPath") -eq $True) {
        # Removing old application
        Write-Host "> Removing old A.V.A.T.A.R server application, please wait..." -ForegroundColor DarkMagenta
        Remove-Item "$folderPath" -Recurse -Force
        if ((Test-Path "$folderPath") -eq $True) {
            start-process -FilePath "sudo" -ArgumentList "rm -r $folderPath" -NoNewWindow -workingdirectory "." -Wait
        }
        Write-Host "Old A.V.A.T.A.R server application removed" -ForegroundColor Green
    }

    $installPath = if ($application -eq $True) {"/Applications" } else {"$directory/A.V.A.T.A.R-Server.app"}

    # Copy new version as Application
    Set-NewApplication -folder "$package/*" -destination $installPath
    # Set folder for the Electron package
    Set-Location -Path "$folderPath/Contents/Resources/app"
    # Uninstalling Electron packager
    Uninstall-ElectronPackager
    # Installing Electron package
    Install-Electron -workingdirectory "."
   
}   

function Install-Shortcut  {

    # Create shortcut
    if ($platform -eq "win32" -and $shortcut -eq $True) {

        $DesktopPath = [Environment]::GetFolderPath('Desktop')
        $ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "A.V.A.T.A.R Server $version.lnk"
        
        if ((Test-Path "$ShortcutPath") -eq $True) {
            Remove-Item "$ShortcutPath" -Force
        } 

        try {
            Write-Host "> Creating A.V.A.T.A.R server $version shortcut on Desktop" -NoNewline  -ForegroundColor DarkMagenta
            $Shell = New-Object -ComObject Wscript.Shell
            $DesktopShortcut = $Shell.CreateShortcut($ShortcutPath)
            $DesktopShortcut.TargetPath = "$directory\A.V.A.T.A.R-Server.exe"
            $DesktopShortcut.IconLocation = "$directory\A.V.A.T.A.R-Server.exe, 0"
            $DesktopShortcut.WorkingDirectory = "$directory"
            $DesktopShortcut.Description = "A.V.A.T.A.R Server version $version"
            $DesktopShortcut.Save()
            Write-Host " done" -ForegroundColor Green
            Start-Sleep -Seconds 1
        } catch {
            Write-Host " "
            Write-Host "Error of creation of the A.V.A.T.A.R server $version shortcut on Desktop: " -ForegroundColor DarkRed -NoNewline
        }
    } elseif ($platform -eq "linux" -and $shortcut -eq $True) {
        Write-Host "> Creating A.V.A.T.A.R server $version shortcut in the application launcher" -NoNewline  -ForegroundColor DarkMagenta
        $desktopFile = "$env:HOME/.local/share/applications/a.v.a.t.a.r-server.desktop"
        "[Desktop Entry]" | Out-File -FilePath $desktopFile
        "Name=A.V.A.T.A.R Server $version" | Out-File -FilePath $desktopFile -Append
        "Comment=A.V.A.T.A.R Server $version" | Out-File -FilePath $desktopFile -Append
        "GenericName=A.V.A.T.A.R Server $version" | Out-File -FilePath $desktopFile -Append
        "Exec=$directory/A.V.A.T.A.R-Server %U" | Out-File -FilePath $desktopFile -Append
        "Icon=$directory/resources/app/avatar.ico" | Out-File -FilePath $desktopFile -Append
        "Type=Application" | Out-File -FilePath $desktopFile -Append
        "StartupNotify=true" | Out-File -FilePath $desktopFile -Append
        "Categories=GNOME;GTK;Utility;" | Out-File -FilePath $desktopFile -Append
        Write-Host " done" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
}


$ErrorActionPreference = "Ignore"
# Last thing, create 
Install-Shortcut 


# Reset directory location
Set-Location -Path $current_location

Write-Host ""
Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "█       A.V.A.T.A.R server installation has been successfully completed!       █" -ForegroundColor DarkMagenta
Write-Host "█  Launch the application and open the documentation to define the properties. █" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "█                                  Have fun !                                  █" -ForegroundColor DarkMagenta
Write-Host "█                                                                              █" -ForegroundColor DarkMagenta
Write-Host "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■" -ForegroundColor DarkMagenta
