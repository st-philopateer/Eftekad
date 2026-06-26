# Sync files from working folder to deploy folder, excluding git and node_modules
Copy-Item -Path "d:\ghedma2.1\*" -Destination "d:\ghedma2.1_deploy\" -Recurse -Exclude ".git", "node_modules", "ghedma2.1_deploy" -Force

# Deploy to Hugging Face Spaces
cd "d:\ghedma2.1_deploy"
git add .
git commit -m "Auto deploy update"
Write-Host "🚀 Pushing to Hugging Face..." -ForegroundColor Cyan
git push -f hf master:main

# Deploy to GitHub (which triggers Railway)
cd "d:\ghedma2.1"
git add .
git commit -m "Auto deploy update"
Write-Host "🚀 Pushing to GitHub (Railway)..." -ForegroundColor Cyan
git push origin main

Write-Host "🎉 All sites updated successfully!" -ForegroundColor Green
