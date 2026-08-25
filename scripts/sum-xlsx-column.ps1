param(
  [Parameter(Mandatory = $true)][string]$WorkbookPath,
  [Parameter(Mandatory = $true)][string]$SheetName,
  [Parameter(Mandatory = $true)][string]$GroupColumn,
  [Parameter(Mandatory = $true)][string]$ValueColumn
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($WorkbookPath)
try {
  function Read-XmlEntry([string]$name) {
    $entry = $archive.GetEntry($name)
    if (-not $entry) { return $null }
    $stream = $entry.Open()
    try { $xml = [xml]::new(); $xml.Load($stream); return $xml } finally { $stream.Dispose() }
  }

  $shared = @()
  $sharedXml = Read-XmlEntry 'xl/sharedStrings.xml'
  if ($sharedXml) {
    $ns = [System.Xml.XmlNamespaceManager]::new($sharedXml.NameTable)
    $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    foreach ($item in $sharedXml.SelectNodes('//x:si', $ns)) {
      $shared += (($item.SelectNodes('.//x:t', $ns) | ForEach-Object { $_.InnerText }) -join '')
    }
  }

  $workbook = Read-XmlEntry 'xl/workbook.xml'
  $relations = Read-XmlEntry 'xl/_rels/workbook.xml.rels'
  $workbookNs = [System.Xml.XmlNamespaceManager]::new($workbook.NameTable)
  $workbookNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $relById = @{}
  foreach ($rel in $relations.Relationships.Relationship) { $relById[$rel.Id] = $rel.Target }
  $sheet = $workbook.SelectNodes('//x:sheets/x:sheet', $workbookNs) | Where-Object name -eq $SheetName | Select-Object -First 1
  if (-not $sheet) { throw "Aba não encontrada: $SheetName" }
  $relId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $target = $relById[$relId]
  if ($target -notlike 'xl/*') { $target = "xl/$target" }
  $sheetXml = Read-XmlEntry $target.Replace('\', '/')
  $sheetNs = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
  $sheetNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

  function Cell-Value($cell) {
    if (-not $cell) { return $null }
    $value = $cell.v
    if ($cell.t -eq 's' -and $null -ne $value) { return $shared[[int]$value] }
    if ($cell.t -eq 'inlineStr') { return (($cell.SelectNodes('.//x:t', $sheetNs) | ForEach-Object { $_.InnerText }) -join '') }
    return $value
  }

  $totals = @{}
  foreach ($row in $sheetXml.SelectNodes('//x:sheetData/x:row', $sheetNs)) {
    if ([int]$row.r -le 1) { continue }
    $groupCell = $row.SelectSingleNode("./x:c[starts-with(@r,'$GroupColumn')]", $sheetNs)
    $valueCell = $row.SelectSingleNode("./x:c[starts-with(@r,'$ValueColumn')]", $sheetNs)
    $group = [string](Cell-Value $groupCell)
    $valueText = [string](Cell-Value $valueCell)
    $value = 0.0
    if (-not $group -or -not [double]::TryParse($valueText, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$value)) { continue }
    if (-not $totals.ContainsKey($group)) { $totals[$group] = [pscustomobject]@{ Grupo = $group; Quantidade = 0; Valor = 0.0 } }
    $totals[$group].Quantidade++
    $totals[$group].Valor += $value
  }
  $totals.Values | Sort-Object Grupo | ForEach-Object { $_.Valor = [math]::Round($_.Valor, 2); $_ }
} finally {
  $archive.Dispose()
}
