<#
  This script has been superseded by the cross-platform Node.js version.
  Use push-nightly.mjs instead — it works on both macOS and Windows.

  macOS / Windows (via npm):
    npm run push -- "feat(events): your message"

  macOS / Windows (direct):
    node push-nightly.mjs "feat(events): your message"
#>
Write-Host "`npush-nightly.ps1 is no longer the primary script." -ForegroundColor Yellow
Write-Host "Please use the cross-platform version instead:`n" -ForegroundColor Yellow
Write-Host "  npm run push -- `"your commit message`"`n" -ForegroundColor Cyan
Write-Host "  node push-nightly.mjs `"your commit message`"`n" -ForegroundColor Cyan
exit 0

<# Original Windows-only script preserved below for reference
.SYNOPSIS
    Safe commit-and-push to the nightly branch, mirroring GitHub Desktop behaviour.

.DESCRIPTION
    1. Ensures the working branch is `nightly`.
    2. Fetches origin to detect remote-ahead commits.
    3. If remote is ahead, merges origin/nightly into local BEFORE committing.
    4. Stages all changes and creates a commit.
    5. Pushes to origin/nightly.
    6. If the push is rejected (someone pushed between our pull and push),
       merges the new remote commits automatically, then retries the push.

.PARAMETER Message
    The commit message (required).

.PARAMETER AddAll
    When set to $false, only staged files are committed (default: $true, stages all changes).

.EXAMPLE
    .\push-nightly.ps1 -Message "feat(events): add certificate expiry field"

.EXAMPLE
    .\push-nightly.ps1 -Message "fix(checkin): resolve null ref on reload" -AddAll $false
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [bool]$AddAll = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── helpers ──────────────────────────────────────────────────────────────────

function Write-Step([string]$text) {
    Write-Host "`n▶  $text" -ForegroundColor Cyan
}

function Write-Ok([string]$text) {
    Write-Host "   ✔  $text" -ForegroundColor Green
}

function Write-Warn([string]$text) {
    Write-Host "   ⚠  $text" -ForegroundColor Yellow
}

function Write-Fail([string]$text) {
    Write-Host "   ✖  $text" -ForegroundColor Red
}

function Invoke-Git {
    param([string[]]$Args)
    $result = & git @Args 2>&1
    $exitCode = $LASTEXITCODE
    return [pscustomobject]@{ Output = $result; ExitCode = $exitCode }
}

# ── 0. Verify we are inside a git repository ─────────────────────────────────

Write-Step "Verifying git repository"
$insideRepo = Invoke-Git @("rev-parse", "--is-inside-work-tree")
if ($insideRepo.ExitCode -ne 0) {
    Write-Fail "Not inside a git repository. Run this script from the project root."
    exit 1
}
Write-Ok "Git repository confirmed"

# ── 1. Ensure we are on the nightly branch ───────────────────────────────────

Write-Step "Checking current branch"
$branchResult = Invoke-Git @("rev-parse", "--abbrev-ref", "HEAD")
$currentBranch = ($branchResult.Output | Out-String).Trim()

if ($currentBranch -ne "nightly") {
    Write-Warn "Currently on '$currentBranch'. Switching to 'nightly'..."
    $switchResult = Invoke-Git @("checkout", "nightly")
    if ($switchResult.ExitCode -ne 0) {
        Write-Fail "Could not switch to 'nightly'. Resolve any conflicts or stash changes first."
        Write-Host ($switchResult.Output | Out-String)
        exit 1
    }
    Write-Ok "Switched to 'nightly'"
} else {
    Write-Ok "Already on 'nightly'"
}

# ── 2. Fetch origin to see remote state ──────────────────────────────────────

Write-Step "Fetching origin/nightly"
$fetchResult = Invoke-Git @("fetch", "origin", "nightly")
if ($fetchResult.ExitCode -ne 0) {
    Write-Fail "Fetch failed. Check your network / remote access."
    Write-Host ($fetchResult.Output | Out-String)
    exit 1
}
Write-Ok "Fetch complete"

# ── 3. Pull if remote is ahead of local ──────────────────────────────────────

Write-Step "Checking if origin/nightly has commits not in local"

$localHash  = (Invoke-Git @("rev-parse", "HEAD")).Output | Out-String | ForEach-Object { $_.Trim() }
$remoteHash = (Invoke-Git @("rev-parse", "origin/nightly")).Output | Out-String | ForEach-Object { $_.Trim() }

# Count commits on origin/nightly that local doesn't have
$aheadResult = Invoke-Git @("rev-list", "--count", "HEAD..origin/nightly")
$remoteAhead = [int]($aheadResult.Output | Out-String).Trim()

if ($localHash -ne $remoteHash -and $remoteAhead -gt 0) {
    Write-Warn "Remote is $remoteAhead commit(s) ahead. Merging origin/nightly into local first..."
    $pullResult = Invoke-Git @("merge", "origin/nightly", "--no-edit")
    if ($pullResult.ExitCode -ne 0) {
        Write-Fail "Merge failed. Resolve the conflicts below, then run the script again."
        Write-Host ($pullResult.Output | Out-String)
        exit 1
    }
    Write-Ok "Successfully merged origin/nightly"
} else {
    Write-Ok "Local is up to date with origin/nightly"
}

# ── 4. Stage changes ─────────────────────────────────────────────────────────

Write-Step "Staging changes"
if ($AddAll) {
    $addResult = Invoke-Git @("add", "--all")
} else {
    # Only staged files (user pre-staged with git add before calling script)
    $addResult = [pscustomobject]@{ Output = ""; ExitCode = 0 }
    Write-Warn "-AddAll is false; using already-staged files only"
}

if ($addResult.ExitCode -ne 0) {
    Write-Fail "git add failed."
    Write-Host ($addResult.Output | Out-String)
    exit 1
}

# Check if there is anything to commit
$statusResult = Invoke-Git @("status", "--porcelain")
$stagedContent = ($statusResult.Output | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($stagedContent)) {
    Write-Warn "Nothing to commit. Working tree is clean."
    exit 0
}
Write-Ok "Changes staged"

# ── 5. Commit ────────────────────────────────────────────────────────────────

Write-Step "Committing: '$Message'"
$commitResult = Invoke-Git @("commit", "-m", $Message)
if ($commitResult.ExitCode -ne 0) {
    Write-Fail "Commit failed."
    Write-Host ($commitResult.Output | Out-String)
    exit 1
}
Write-Ok "Commit created"

# ── 6. Push (with automatic recovery if remote got new commits) ───────────────

Write-Step "Pushing to origin/nightly"
$pushResult = Invoke-Git @("push", "origin", "nightly")

if ($pushResult.ExitCode -eq 0) {
    Write-Ok "Push successful"
} else {
    $pushOutput = ($pushResult.Output | Out-String)

    # Detect a non-fast-forward rejection (someone pushed while we were working)
    if ($pushOutput -match "rejected|non-fast-forward|fetch first") {
        Write-Warn "Push rejected — remote has new commits. Merging remote changes..."

        $pullRetry = Invoke-Git @("fetch", "origin", "nightly")
        if ($pullRetry.ExitCode -ne 0) {
            Write-Fail "Fetch failed during recovery."
            Write-Host ($pullRetry.Output | Out-String)
            exit 1
        }

        $mergeRetry = Invoke-Git @("merge", "origin/nightly", "--no-edit")
        if ($mergeRetry.ExitCode -ne 0) {
            Write-Fail "Merge failed during recovery. Resolve conflicts below, then run:"
            Write-Host "  git push origin nightly" -ForegroundColor Yellow
            Write-Host ($mergeRetry.Output | Out-String)
            exit 1
        }
        Write-Ok "Merged remote changes"

        Write-Step "Retrying push to origin/nightly"
        $pushRetry = Invoke-Git @("push", "origin", "nightly")
        if ($pushRetry.ExitCode -ne 0) {
            Write-Fail "Push failed on retry. Output:"
            Write-Host ($pushRetry.Output | Out-String)
            exit 1
        }
        Write-Ok "Push successful (after merge)"
    } else {
        Write-Fail "Push failed with unexpected error:"
        Write-Host $pushOutput
        exit 1
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Done. Committed and pushed to nightly." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray
