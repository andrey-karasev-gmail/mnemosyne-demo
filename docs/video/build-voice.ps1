param(
  [string]$NarrationPath = (Join-Path $PSScriptRoot 'narration.md'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot 'work\audio')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$markdown = Get-Content -LiteralPath $NarrationPath -Raw
$sections = [regex]::Split($markdown, '(?m)^##\s+') | Select-Object -Skip 1
$voice = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$voice.SelectVoice('Microsoft Zira Desktop')
$voice.Rate = -2
$audioFormat = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(
  16000,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono
)
$manifest = [System.Collections.Generic.List[object]]::new()
$index = 0

foreach ($section in $sections) {
  $lines = $section -split "`r?`n"
  $title = $lines[0].Trim()
  $body = ($lines | Select-Object -Skip 1) -join "`n"
  $parts = [regex]::Split($body, '(?m)^\*\*(?:Guided pause|Closing card)[^\r\n]*')
  $spoken = ($parts[0] -replace '\*\*|`', '').Trim()
  if (-not $spoken) { continue }
  $index++
  $audioPath = Join-Path $OutputDirectory ('chapter-{0:D2}.wav' -f $index)
  $voice.SetOutputToWaveFile($audioPath, $audioFormat)
  $voice.Speak($spoken)
  $voice.SetOutputToNull()
  $duration = (Get-Item -LiteralPath $audioPath).Length / 32000

  $pauseMatch = [regex]::Match($body, '\*\*(?:Guided pause|Closing card)[^\r\n]*?([0-9]{2}):([0-9]{2})\.\*\*\s*(.*)')
  $pauseSeconds = 0
  if ($pauseMatch.Success) { $pauseSeconds = ([int]$pauseMatch.Groups[1].Value * 60) + [int]$pauseMatch.Groups[2].Value }
  $manifest.Add([pscustomobject]@{
    index = $index
    title = ($title -replace '^.*?—\s*', '')
    time = $title.Substring(0, 5)
    audio = [IO.Path]::GetFileName($audioPath)
    duration = [math]::Round($duration, 3)
    pause = $pauseSeconds
    pauseText = if ($pauseMatch.Success) { ($pauseMatch.Groups[3].Value -replace '\*\*|`', '').Trim() } else { '' }
    text = $spoken
  })
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'manifest.json') -Encoding utf8
$voice.Dispose()
$manifest | Select-Object index,title,duration,pause | Format-Table -AutoSize
'TOTAL_SPOKEN_SECONDS=' + [math]::Round(($manifest | Measure-Object -Property duration -Sum).Sum, 1)
'TOTAL_GUIDED_PAUSE_SECONDS=' + ($manifest | Measure-Object -Property pause -Sum).Sum
