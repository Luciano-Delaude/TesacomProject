class BinaryParser {
  /**
   * Decodifica una trama binaria según el formato especificado.
   *
   * @param {Buffer} buffer - Trama a deserializar
   * @param {Array} format - Formato de serialización
   * @returns {Object} Objeto deserializado con campos tag = valor
   */
  decode(buffer, format) {
      let offset = 8;
      let decodedObject = {};
      let values = 0;
      buffer.forEach(element => {
        values =(values << offset) | element;
        console.log(values.toString(2));
      });
      let restOfData = buffer.length * 8;
      format.forEach(field => {
        decodedObject[field.tag] = values >> (restOfData - field.len);
        values = values & ((1 << (restOfData - field.len)) - 1)
        restOfData = restOfData - field.len;
      });

      return decodedObject;
  }

  /**
   * Codifica un objeto según el formato especificado.
   *
   * @param {Object} _object - Objeto a serializar
   * @param {Array} format - Formato de serialización
   * @returns {Buffer} Trama binaria codificada
   */
  encode(_object, format) {
    let partialData = 0;
    let partialBits = 0;
    const buffers = [];

    format.forEach(field => {
        const value = _object[field.tag];
        if (field.hasOwnProperty('len')) {
          partialData = (partialData << field.len) | value;
          partialBits += field.len; 
        } else {
          partialData = (partialData << 32) | value;
          partialBits += 32; 
        }
        while (partialBits >= 32) {
            // If we have accumulated 32 or more bits, write it to a new buffer
            const buffer = Buffer.alloc(4);
            buffer.writeUInt32BE(partialData >>> (partialBits - 32), 0);
            buffers.push(buffer);
            
            // Remove the written bits from partialData
            partialData = partialData & ((1 << (partialBits - 32)) - 1);
            partialBits -= 32;
        }
    });
    // Write any remaining data (less than 32 bits) to the buffer
    if (partialBits > 0) {
        const buffer = Buffer.alloc(Math.ceil(partialBits / 8));
        buffer.writeUIntBE(partialData, 0, Math.ceil(partialBits / 8));
        buffers.push(buffer);
    }
    // Concatenate the buffers into a single buffer
    const resultBuffer = Buffer.concat(buffers);
    return resultBuffer;
  }
}


const format1 = [
  { tag: "PTemp", type: "int", len: 12 },
  { tag: "BattVolt.value", type: "int", len: 12 },
  { tag: "WaterLevel", type: "int", len: 8 }
];

const data = { PTemp: 268, "BattVolt.value": 224, WaterLevel: 115 };

// const format1 = [{ tag: "var0.value", type: "uint", len: 2 },
// { tag: "var1.value", type: "uint", len: 2 },
// { tag: "var2.value", type: "uint", len: 7 },
// { tag: "var3.value", type: "uint", len: 11 },
// { tag: "var4.value", type: "uint", len: 10 },
// { tag: "var5.value", type: "uint", len: 8 },
// { tag: "var6.value", type: "uint", len: 8 },
// { tag: "var7.value", type: "uint", len: 8 }];

// const data = {"var0.value" : 1, "var1.value" : 3, "var2.value" : 27, "var3.value": 45,"var4.value": 125487,"var5.value" : 61,
// "var6.value" : 44,"var7.value" : 37};

const bp = new BinaryParser();
const dataEncoded = bp.encode(data, format1);
console.log(dataEncoded.toString('hex')); // Imprime 10c0e073 en hexadecimal
console.log(dataEncoded.length * 8); // Imprime 32 en bits
const dataDecoded = bp.decode(dataEncoded, format1);
console.log(dataDecoded);


// const tramaDatos = Buffer.from('010203', 'hex'); // Trama de datos en formato hexadecimal
// const formato = [
//   { tag: "v0", type: "int", len: 8 },
//   { tag: "v1", type: "int", len: 8 },
//   { tag: "v2", type: "int", len: 8 }
// ];

// const bp = new BinaryParser();
// const datosDeserializados = bp.decode(tramaDatos, formato);
// console.log(datosDeserializados); // Imprime { v0: 1, v1: 2, v2: 3 }

