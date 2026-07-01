# Customization Rules

- After implementing edits or updates requested by the user, always provide a copy-pasteable PowerShell command block to stage, commit, and push changes from their local terminal using their portable Git environment:
  ```powershell
  cd "c:\Users\bcano\OneDrive\Documents\Projects\Essensa Live Streams\Template 1"
  $env:PATH = "C:\Users\bcano\.mingit\cmd;$env:PATH"
  git add .
  git commit -m "feat: [Brief description of changes]"
  git push
  ```
