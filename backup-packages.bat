@echo off
echo Sauvegarde des package.json...

REM Créer le dossier de sauvegarde
if not exist "backups" mkdir backups

REM Sauvegarder les package.json
copy "front\package.json" "backups\front-package.json" /Y
copy "api\package.json" "backups\api-package.json" /Y

REM Sauvegarder avec timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

copy "front\package.json" "backups\front-package-%datestamp%.json" /Y
copy "api\package.json" "backups\api-package-%datestamp%.json" /Y

echo Sauvegarde terminée !
pause 