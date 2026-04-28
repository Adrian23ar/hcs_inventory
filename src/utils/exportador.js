// src/utils/exportador.js
import { Workbook } from 'exceljs'
import { saveAs } from 'file-saver' // file-saver se instala con exceljs
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'


// --- ¡NUEVA FUNCIÓN HELPER 'TRADUCTORA'! ---
const formatSpecKey = (key) => {
  const labels = {
    procesador: 'Procesador',
    ram: 'RAM',
    almacenamiento: 'Almacenamiento',
    pulgadas: 'Pulgadas',
    hercios: 'Hercios',
    entradas_video: 'Entradas de Video',
    tipo_tinta: 'Tipo de Tinta',
    modelo_cartucho: 'Modelo Cartucho',
    capacidad: 'Capacidad',
    bateria: 'Batería'
  };

  // Si la clave existe en 'labels', la devolvemos
  if (labels[key]) {
    return labels[key];
  }

  // Si no, hacemos un formateo genérico (reemplazar '_' por ' ' y capitalizar)
  return key.replace(/_/g, ' ')
             .replace(/\b\w/g, char => char.toUpperCase()); // Capitaliza cada palabra
}


export const formatearSpecsParaExportar = (especificaciones) => {
  if (!especificaciones || Object.keys(especificaciones).length === 0) {
    return 'N/A'
  }

  return Object.entries(especificaciones)
    .map(([key, value]) => {
      const claveFormateada = formatSpecKey(key)
      return `${claveFormateada}: ${value}`
    })
    .join('\n')
}

/**
 * Genera un archivo Excel estilizado a partir de los datos.
 * @param {string} nombreArchivo - Ej: "Inventario_Equipos" (sin .xlsx)
 * @param {string} tituloHoja - Ej: "Inventario"
 * @param {Array<object>} columnas - Array de { header: 'Título Columna', key: 'dataKey' }
 * @param {Array<object>} datos - Los datos del inventarioStore.equipos
 */
export const exportarAExcel = async (nombreArchivo, tituloHoja, columnas, datos) => {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(tituloHoja)

  // Definir las columnas en la hoja de Excel
  worksheet.columns = columnas.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20, // Ancho por defecto
    style: {
      alignment: {
        wrapText: col.key === 'especificaciones',
        vertical: 'top' // Alineamos arriba para que se lea mejor
      }
    }
  }));

  // Estilizar la fila de cabecera
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF22C55E' } // Un verde bonito (Tailwind 'green-500')
    }
    cell.alignment = { vertical: 'center', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  });

  // Agregar los datos
  worksheet.addRows(datos)

  // Estilizar las filas de datos (opcional)
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) { // Omitir la cabecera
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    }
  });

  // Generar el buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), `${nombreArchivo}_${Date.now()}.xlsx`)
}


/**
 * Genera un archivo PDF a partir de los datos.
 * @param {string} nombreArchivo - Ej: "Inventario_Equipos" (sin .pdf)
 * @param {string} tituloDoc - Ej: "Inventario de Equipos HCS"
 * @param {Array<string>} headers - Array de los títulos de columna. Ej: ['Código', 'Tipo']
 * @param {Array<Array>} bodyData - Array de arrays con los datos. Ej: [['CPU-001', 'CPU'], ...]
 */
export const exportarAPDF = (nombreArchivo, tituloDoc, headers, bodyData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  })

  doc.setFontSize(18)
  doc.text(tituloDoc, 40, 40)

  autoTable(doc, {
    head: [headers],
    body: bodyData,
    startY: 60, // Mover el margin aquí

    headStyles: {
      fillColor: [34, 197, 94], // Verde
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 8,
      valign: 'middle'
    },
  })

  doc.save(`${nombreArchivo}_${Date.now()}.pdf`)
}
