# GitHub import preparation

The latest version supplied in this conversation is 15.5.1. Its source and deployment archives were independently CRC-checked and SHA-256-checked. Every one of the 861 site files, including 645 image files, matches the supplied deployment ZIP.

Repository-only additions: a project README, Git ignore/attribute rules, a deployment integrity manifest and Node verification script, dependency notes, contributor safeguards, and the Windows publication helper. No application code, recipe, image, API configuration or saved-data schema was changed. No Cloudflare deployment workflow is enabled.

Re-executed checks during repository preparation: all 861 site file hashes; 44 Worker/security tests with simulated external services; 857 local static HTTP assets. No browser suite, real Turnstile check or live AI request was rerun for this unchanged application import.

The GitHub tools available during preparation expose reads but no repository-creation or push action. No authenticated GitHub CLI was available in the execution environment, and its direct GitHub network request failed DNS resolution. Browser profiles had no saved GitHub sign-in. The connected account was confirmed as douphealth; no accessible daily-table repository was found.

Therefore this preparation is not evidence that a remote repository exists. Publish-Daily-Table.cmd runs the actual authenticated creation, push and remote verification on Windows. It requires Git, GitHub CLI and Node.js 22+. Sign in only through GitHub; never paste tokens into chat.

The original Windows PowerShell publisher failed on a missing Get-FileHash command, because the `.cmd` called `powershell.exe`, not the user's PowerShell 7. The replacement calls Node.js from the `.cmd` and uses built-in SHA-256; it does not depend on Windows PowerShell modules. Offline verification passes with `node Publish-Daily-Table.mjs --verify-only`. The publish flow was also exercised against a local bare Git repository using a simulated `gh` command: private repository creation, main/tag push, all remote file comparisons, idempotent rerun, wrong-account refusal, unrelated-history refusal and altered-file refusal. These are NOT proof of a real GitHub connection or Windows publisher execution. An authenticated remote push still requires the user's GitHub CLI sign-in. Live publication remains untested. The application integrity and Node/HTTP checks listed above were actually executed.

The publication helper creates a private repository, pushes main and the lightweight v15.5.1 tag without force, and checks every remote Git blob against the local commit. It stops if a populated repository contains a different history. Its success message and .git/daily-table-publish-result.json are produced only after the remote verification completes.
