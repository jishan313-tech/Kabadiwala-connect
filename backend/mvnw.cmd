@echo off
setlocal

set "MVN_VERSION=3.9.11"
set "BASE=%~dp0.mvn\apache-maven-%MVN_VERSION%"

if not exist "%BASE%\bin\mvn.cmd" (
    echo Maven %MVN_VERSION% not found locally. Downloading...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MVN_VERSION%/apache-maven-%MVN_VERSION%-bin.zip'; $z=Join-Path $env:TEMP 'kabadiwala-maven.zip'; Invoke-WebRequest -Uri $u -OutFile $z; Expand-Archive -Path $z -DestinationPath '%~dp0.mvn' -Force; Remove-Item $z -Force"
    if errorlevel 1 (
        echo Maven Wrapper download failed.
        exit /b 1
    )
)

call "%BASE%\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%