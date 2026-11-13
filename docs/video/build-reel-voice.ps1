$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$markdown = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'reel-narration.md') -Raw
$text = ($markdown -split "`r?`n`r?`n")[1].Trim()
$text = $text -replace "`r", ''
$outputPath = Join-Path $PSScriptRoot 'reel-voice.wav'
$voice = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$voice.SelectVoice('Microsoft Zira Desktop')
$voice.Rate = -2
$format = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(
  44100,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono
)
$voice.SetOutputToWaveFile($outputPath, $format)
$voice.Speak($text)
$voice.Dispose()
Get-Item -LiteralPath $outputPath | Select-Object FullName,Length
