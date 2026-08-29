# OSEL-task2 DB 자동 백업: prisma\dev.db를 날짜별로 복사하고 최근 30개만 유지.
# 작업 스케줄러("OSEL-task2 DB Backup")가 매일 실행한다.
$src = "C:\Users\jhyun\Downloads\OSEL-task2\prisma\dev.db"
$dir = "C:\Users\jhyun\Downloads\OSEL-task2-backups"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
Copy-Item $src (Join-Path $dir "dev_$stamp.db") -Force
Get-ChildItem $dir -Filter "dev_*.db" |
    Sort-Object Name -Descending |
    Select-Object -Skip 30 |
    Remove-Item -Force -Confirm:$false
