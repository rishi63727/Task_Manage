# Push this project to https://github.com/rishi63727/Task_Manage
# Run from repo root: .\push_to_task_manage.ps1

Set-Location $PSScriptRoot

# Stage all changes (cache/db already untracked if you ran the rm --cached step)
git add .

# Commit
git commit -m "Task management app: backend (FastAPI) + frontend (React/TypeScript)"

# Add remote (skip if already added)
$remote = git remote 2>$null | Select-String "task_manage"
if (-not $remote) { git remote add task_manage https://github.com/rishi63727/Task_Manage.git }

# Push - try master first; if repo expects main, run: git push -u task_manage main
git push -u task_manage master

Write-Host "Done. Repo: https://github.com/rishi63727/Task_Manage"
