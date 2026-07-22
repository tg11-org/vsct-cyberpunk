@echo off
setlocal

if not defined GITHUB_TOKEN (
    if exist ".env" (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            if /i "%%~A"=="github_pat" set "GITHUB_TOKEN=%%~B"
        )
    )
)

if not defined GITHUB_TOKEN (
    echo GITHUB_TOKEN is not set and github_pat was not found in .env
    endlocal & exit /b 1
)

set "GITHUB_TOKEN=%GITHUB_TOKEN: =%"

echo Packaging extension and uploading latest VSIX to GitHub Release...
npm run release:package:github
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%
