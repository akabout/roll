@echo off
echo Restauration des package.json...

REM Vérifier si les fichiers existent
if exist "backups\front-package.json" (
    copy "backups\front-package.json" "front\package.json" /Y
    echo Frontend package.json restauré !
) else (
    echo ERREUR: Sauvegarde frontend introuvable !
)

if exist "backups\api-package.json" (
    copy "backups\api-package.json" "api\package.json" /Y
    echo API package.json restauré !
) else (
    echo ERREUR: Sauvegarde API introuvable !
)

echo Restauration terminée !
pause 