# Runs the automated suites against one served build and writes one log per suite.
# usage: pwsh -File run-audit.ps1 <baseUrl> <siteDir> <logDir> [label] [liveSiteDir]
#   liveSiteDir: the package this build replaces (for the name-resolution and recipe-text comparisons and the upgrade test); optional.
param([string]$Base, [string]$Site, [string]$Log, [string]$Label = 'build', [string]$Live = '')
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force $Log | Out-Null
$seed = '..\v15'
"package"  ; node package-check.mjs $Site                          *> "$Log\package.log"
"worker"   ; node worker-test.mjs $Site                            *> "$Log\worker.log"
"rules"    ; node rules-test.mjs $Site                             *> "$Log\rules.log"
if ($Live) { "text" ; node recipe-text-test.mjs $Site $Live        *> "$Log\recipe-text.log" } else { "text" ; node recipe-text-test.mjs $Site *> "$Log\recipe-text.log" }
if ($Live) { "names"; node alias-regress.mjs $Live $Site           *> "$Log\names.log" }
"typed"    ; node typed-test.mjs $Base $seed                       *> "$Log\typed.log"
"photo-390"; node photo-e2e.mjs $Base $seed 390 light              *> "$Log\photo-390-light.log"
"photo-390d"; node photo-e2e.mjs $Base $seed 390 dark              *> "$Log\photo-390-dark.log"
"photo-1440"; node photo-e2e.mjs $Base $seed 1440 light            *> "$Log\photo-1440-light.log"
"photo-768d"; node photo-e2e.mjs $Base $seed 768 dark              *> "$Log\photo-768-dark.log"
if ($Live) { "compat"; node compat-test.mjs $Base $seed ..\v16 $Live ..\base-15.6.3 ..\v14-baseline *> "$Log\compat.log" }
"regress"  ; node regress.mjs $Base $seed $Label                   *> "$Log\regress.log"
"axe"      ; node axe.mjs $Base $seed populated                    *> "$Log\axe.log"
"sweep-l"  ; node sweep.mjs $Base $seed - light populated          *> "$Log\sweep-light.log"
"sweep-d"  ; node sweep.mjs $Base $seed - dark populated           *> "$Log\sweep-dark.log"
"errors"   ; node page-errors.mjs $Base $seed populated / /pantry/ /today/ /recipes/ /weekly-plan/ /shopping-list/ /settings/ /cook/ /family-planner/ /offline/ /about/ /how-it-works/ /privacy/ /recipes/greek-yogurt-oats-banana/ /guides/photo-recognition/ *> "$Log\page-errors.log"
if ($Live) { "upgrade"; node sw-upgrade.mjs $Live $Site 8899       *> "$Log\upgrade.log" }
"done"
