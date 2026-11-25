$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# 1. 自动定位 JDK 17 与 Android SDK
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "D:\develop\Java\jdk-17\bin\java.exe") {
        $env:JAVA_HOME = "D:\develop\Java\jdk-17"
    }
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkRoot) {
    $env:ANDROID_HOME = $sdkRoot
    $env:ANDROID_SDK_ROOT = $sdkRoot
    $escapedSdk = $sdkRoot.Replace("\", "\\")
    Set-Content -Path "android\local.properties" -Value "sdk.dir=$escapedSdk" -Encoding ASCII
}

Write-Host ">>> [1/3] 同步前端资源至 Android 原生容器..." -ForegroundColor Cyan
npx cap sync android

Write-Host ">>> [2/3] 编译签名版 Release APK..." -ForegroundColor Cyan
Push-Location android
.\gradlew.bat assembleRelease --no-daemon
Pop-Location

$srcApk = Join-Path $projectRoot "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $srcApk)) {
    throw "未找到编译产物: $srcApk"
}

$outApkCn = Join-Path $projectRoot "屯垦智答_v2.5_手机安装包.apk"
Copy-Item -Path $srcApk -Destination $outApkCn -Force
$sizeMb = [math]::Round((Get-Item $outApkCn).Length / 1MB, 2)
Write-Host ">>> [3/3] 打包完成！输出文件: $outApkCn ($sizeMb MB)" -ForegroundColor Green
