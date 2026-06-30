# Deploy to Hugging Face Spaces directly from working folder
git add .
git commit -m "Auto deploy update"
Write-Host "🚀 Pushing to Hugging Face..." -ForegroundColor Cyan
git push hf master:main

Write-Host "🎉 Hugging Face Space updated successfully!" -ForegroundColor Green
