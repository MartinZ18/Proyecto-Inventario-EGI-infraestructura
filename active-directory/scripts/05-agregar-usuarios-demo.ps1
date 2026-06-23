<#
============================================================
05-agregar-usuarios-demo.ps1

Agrega dos usuarios adicionales para cumplir el requisito de
al menos 2 miembros por grupo:

  cfunes  (Carlos Funes)  -> Tecnicos, InventarioUsers
  rdiaz   (Roberto Diaz)  -> Docentes, InventarioUsers

Los nombres coinciden con las personas de prueba en la BD SQL.
Contraseña por defecto: Inventario!2025

Ejecutar en DC01-ITU como Administrador del dominio:
  powershell -ExecutionPolicy Bypass -File .\05-agregar-usuarios-demo.ps1

Idempotente: si el usuario ya existe lo omite y solo verifica grupos.
============================================================
#>

#Requires -Modules ActiveDirectory

$ErrorActionPreference = "Stop"

$UserOuDN   = "OU=User,OU=ITU,DC=itu,DC=local"
$PassDefault = "Inventario!2025"
$securePass  = ConvertTo-SecureString $PassDefault -AsPlainText -Force

$NuevosUsuarios = @(
    @{
        Sam    = "cfunes"
        Nombre = "Carlos Funes"
        Grupos = @("Tecnicos")
    }
    @{
        Sam    = "rdiaz"
        Nombre = "Roberto Diaz"
        Grupos = @("Docentes")
    }
)

foreach ($u in $NuevosUsuarios) {
    if (-not (Get-ADUser -Filter "SamAccountName -eq '$($u.Sam)'" -ErrorAction SilentlyContinue)) {
        New-ADUser `
            -Name              $u.Nombre `
            -SamAccountName    $u.Sam `
            -UserPrincipalName "$($u.Sam)@itu.local" `
            -Path              $UserOuDN `
            -AccountPassword   $securePass `
            -Enabled           $true `
            -ChangePasswordAtLogon $false `
            -PasswordNeverExpires  $true
        Write-Host "Usuario creado: $($u.Sam) ($($u.Nombre))"
    } else {
        Write-Host "Usuario ya existe: $($u.Sam) (verificando grupos...)"
    }

    foreach ($g in $u.Grupos) {
        $miembros = Get-ADGroupMember -Identity $g | Select-Object -ExpandProperty SamAccountName
        if ($miembros -notcontains $u.Sam) {
            Add-ADGroupMember -Identity $g -Members $u.Sam
            Write-Host "  -> $($u.Sam) agregado a $g"
        } else {
            Write-Host "  -> $($u.Sam) ya esta en $g (sin cambios)"
        }
    }
}

Write-Host ""
Write-Host "=== Estado final de grupos ==="
foreach ($grp in @("Tecnicos", "Docentes")) {
    $miembros = (Get-ADGroupMember -Identity $grp | Select-Object -ExpandProperty SamAccountName) -join ", "
    Write-Host "$grp : $miembros"
}
