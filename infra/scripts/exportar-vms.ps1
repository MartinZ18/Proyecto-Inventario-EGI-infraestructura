# ============================================================
# Exporta las 3 VMs del laboratorio como OVA para migración.
# Ejecutar en la PC original (la que tiene las VMs configuradas).
#
# Uso:
#   .\infra\scripts\exportar-vms.ps1
#   .\infra\scripts\exportar-vms.ps1 -Destino "D:\VMs-Export"
#
# Los archivos resultantes se suben a Google Drive para
# importarlos en la PC de destino con setup-virtualbox-nueva-pc.ps1
# ============================================================
param(
    [string]$Destino = "C:\VMs-Export"
)

$vbm = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"

if (-not (Test-Path $vbm)) {
    Write-Error "VBoxManage no encontrado en $vbm. Verificar instalacion de VirtualBox."
    exit 1
}

New-Item -ItemType Directory -Path $Destino -Force | Out-Null
Write-Host "Destino: $Destino" -ForegroundColor Cyan

# Nombres exactos de las VMs en esta instalacion
$vms = @(
    @{ Nombre = "pfSense-Gateway";                          Archivo = "pfsense-gateway.ova" },
    @{ Nombre = "Window Server AD-DC- Comision B";          Archivo = "dc01-itu.ova"        },
    @{ Nombre = "Window Server SQL - IIS - Comision B";     Archivo = "sqlserver2022.ova"   }
)

foreach ($vm in $vms) {
    $salida = Join-Path $Destino $vm.Archivo
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Exportando '$($vm.Nombre)' -> $salida ..." -ForegroundColor Yellow
    & $vbm export $vm.Nombre --output $salida --ovf20
    if ($LASTEXITCODE -eq 0) {
        $size = [math]::Round((Get-Item $salida).Length / 1GB, 2)
        Write-Host "[OK] $($vm.Archivo) ($size GB)" -ForegroundColor Green
    } else {
        Write-Error "Fallo al exportar $($vm.Nombre)"
    }
}

Write-Host "`nListo. Archivos en $Destino :" -ForegroundColor Cyan
Get-ChildItem $Destino -Filter "*.ova" | Select-Object Name, @{N="GB";E={[math]::Round($_.Length/1GB,2)}}
Write-Host "`nSubir los 3 archivos .ova a Google Drive y compartir el link con la PC de destino."
