/**
 * INSTRUCCIONES DE DEPLOY:
 * 1. Abre el Google Sheet donde quieres que lleguen los datos
 * 2. Menú → Extensiones → Apps Script
 * 3. Pega este código (reemplaza el contenido existente)
 * 4. Guarda (Ctrl+S)
 * 5. Click en "Implementar" → "Nueva implementación"
 * 6. Tipo: "Aplicación web"
 *    Ejecutar como: Yo (tu cuenta)
 *    Acceso: Cualquier usuario
 * 7. Click en "Implementar" → copia la URL que aparece
 * 8. Esa URL va en el config.js del formulario (webhookUrl)
 *
 * IMPORTANTE: repite este proceso para cada Sheet/formulario diferente.
 */

// ID del Google Sheet (lo encuentras en la URL del Sheet:
// https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit)
const SHEET_ID = 'REEMPLAZAR_CON_ID_DEL_SHEET';

// Nombre de la pestaña (hoja) donde se agregarán las filas
const SHEET_NAME = 'Respuestas';

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Si la hoja no existe, créala
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Si la hoja está vacía, agrega la fila de encabezados
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Nombre',
        'Apellido',
        'Email',
        'Teléfono',
        'RUT',
        'Formulario',
        'Interés',
        'Campo adicional 1',
        'Campo adicional 2'
      ]);
      // Formato encabezados
      const headerRange = sheet.getRange(1, 1, 1, 10);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0f1923');
      headerRange.setFontColor('#ffffff');
    }

    // Agregar fila con los datos recibidos
    sheet.appendRow([
      datos.timestamp || new Date().toISOString(),
      datos.firstname        || '',
      datos.lastname         || '',
      datos.email            || '',
      datos.phone            || '',
      datos.rut              || '',
      datos.formulario       || '',
      datos.interes          || '',
      datos.taller_interes   || datos.carrera_interes || '',
      datos.anio_egreso      || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Necesario para que el webhook acepte peticiones GET (test desde browser)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Webhook activo' }))
    .setMimeType(ContentService.MimeType.JSON);
}
