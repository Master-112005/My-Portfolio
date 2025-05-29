$start = Get-Date "2025-05-23"
$end = Get-Date "2025-07-25"

$targetCommits = 12
$targetActiveDays = 8

$messages = @(
"initialize portfolio nextjs project",
"add hero section layout",
"implement animated id card component",
"add skills block ui",
"implement timeline section",
"add education timeline boxes",
"implement project desktop interface",
"add vscode project window",
"add theme toggle support",
"implement contact form",
"add footer section",
"improve animation utilities",
"implement scroll animations"
)

$dates = @()
$d = $start

while ($d -le $end) {
    $dates += $d
    $d = $d.AddDays(1)
}

$activeDays = $dates | Get-Random -Count $targetActiveDays
$activeDays = $activeDays | Sort-Object

$commitCount = 0

foreach ($day in $activeDays) {

    $commitsToday = Get-Random -Minimum 1 -Maximum 3

    for ($i=0; $i -lt $commitsToday; $i++) {

        if ($commitCount -ge $targetCommits) { break }

        $msg = Get-Random $messages

        Add-Content temp.txt "$msg $(Get-Random)"

        git add .

        $time = Get-Date $day -Hour (Get-Random -Minimum 10 -Maximum 22) -Minute (Get-Random -Minimum 0 -Maximum 59)

        $env:GIT_AUTHOR_DATE = $time.ToString("yyyy-MM-ddTHH:mm:ss")
        $env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE

        git commit -m $msg

        $commitCount++
    }

    if ($commitCount -ge $targetCommits) { break }
}