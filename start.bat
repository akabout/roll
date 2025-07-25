@echo off
echo ========================================
echo    Roll RPG Platform - Démarrage
echo ========================================
echo.

echo [1/4] Installation des dépendances...
call npm run install-all
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo [2/4] Configuration des fichiers d'environnement...
if not exist "api\.env" (
    copy "api\env.example" "api\.env"
    echo Fichier api\.env créé
)

if not exist "front\.env.local" (
    copy "front\env.example" "front\.env.local"
    echo Fichier front\.env.local créé
)

echo.
echo [3/4] Vérification de MongoDB...
echo Assurez-vous que MongoDB est démarré sur votre système
echo Sur Windows : MongoDB doit être installé comme service
echo Sur Mac/Linux : exécutez 'mongod' dans un terminal séparé
echo.

echo [4/4] Démarrage de l'application...
echo.
echo Frontend : http://localhost:3000
echo API : http://localhost:5000
echo.
echo Appuyez sur Ctrl+C pour arrêter
echo.

call npm run dev

pause 