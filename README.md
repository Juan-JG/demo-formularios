# Formularios UAH

Formularios de inscripción con validación, integración HubSpot y Google Sheets.

## Estructura

```
demo-formularios/
├── shared/
│   ├── styles.css        ← diseño compartido (nunca tocar por formulario)
│   └── form-engine.js    ← validación + envío (nunca tocar por formulario)
├── talleres/
│   └── index.html        ← solo editar el bloque config
├── admision/
│   └── index.html        ← solo editar el bloque config
└── apps-script/
    └── webhook.gs        ← deployar una vez por cada Sheet
```

## Setup inicial (una sola vez)

### 1. GitHub + Vercel
```bash
git init
git add .
git commit -m "init: formularios UAH"
# Crear repo en github.com → copiar remote
git remote add origin https://github.com/TU_USUARIO/formularios-uah.git
git push -u origin main
```
Luego en vercel.com → "Add New Project" → importar el repo → Deploy automático.

### 2. IT: cambio de DNS
Pedirle a TI que creen un registro CNAME:
- **Host:** `formularios`
- **Apunta a:** `cname.vercel-dns.com`
- Resultado: `formularios.uahurtado.cl` funcionará automáticamente.

---

## Por cada formulario nuevo

### Paso 1: Apps Script (Google Sheets)
1. Abre el Google Sheet de destino
2. Menú → **Extensiones → Apps Script**
3. Pega el contenido de `apps-script/webhook.gs`
4. Reemplaza `REEMPLAZAR_CON_ID_DEL_SHEET` con el ID del Sheet
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: Yo
   - Acceso: Cualquier usuario
6. Copia la URL que entrega → la necesitas en el paso 3

### Paso 2: HubSpot
1. En HubSpot: **Marketing → Formularios → Crear formulario**
2. Agregar los mismos campos del Google Form de referencia
3. En **Configuración → Opciones**, copiar el **Portal ID** y el **Form GUID**

### Paso 3: Duplicar carpeta
```bash
cp -r talleres/ nombre-actividad/
```
Editar solo el bloque `config` en `nombre-actividad/index.html`:
- `titulo` y `subtitulo`
- `hubspot.portalId` y `hubspot.formGuid`
- `sheets.webhookUrl` (URL del Apps Script)
- `interes` (ej: "Charla Derecho")
- `campos` (basarse en el Google Form recibido)

### Paso 4: Deploy
```bash
git add .
git commit -m "feat: formulario nombre-actividad"
git push
```
Vercel despliega automáticamente en ~30 segundos.

**URL resultante:** `formularios.uahurtado.cl/nombre-actividad`

---

## Resultado en HubSpot

Cada persona que llena un formulario:
- Se crea o actualiza como **Contacto** en HubSpot
- El campo `interes` acumula valores (multi-select): ej. `Taller de Pintura; Admisión Derecho`
- El historial de submissions queda en la ficha del contacto

Aníbal **ya no carga nada manualmente**. Los datos llegan solos.

## Resultado en Google Sheets

Cada envío agrega una fila nueva al Sheet con:
`Timestamp | Nombre | Apellido | Email | Teléfono | RUT | Formulario | Interés | Campo adicional`

El historial nunca se pisa porque es una fila nueva por cada envío.
