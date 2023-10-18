class BinaryParser {
  /**
   * Decodifica una trama binaria según el formato especificado.
   *
   * @param {Buffer} buffer - Trama a deserializar
   * @param {Array} format - Formato de serialización
   * @returns {Object} Objeto deserializado con campos tag = valor
   */
   decode(buffer, format) {
    let first32Bits = 0;
    // Extract the first 4 bytes (32 bits) from the buffer
    if (buffer.length > 4) {
      first32Bits = buffer.readUIntBE(0,4);
    } else {
      first32Bits = buffer.readUIntBE(0,buffer.length);
    }

    // Extract the next bytes from the buffer
    const remainingBytes = buffer.slice(buffer.length - 4);

    let offset = 0;
    let values = first32Bits;
    let decodedObject = {};

    format.forEach(field => {
        if (field.type == "float") {
            field.len = 32;
        }
        let mask = (1 << field.len) - 1;
        let fieldValue;

        if (offset < 32) {
            // If the field is within the first 32 bits, extract the value from the first32Bits
            fieldValue = values >>> (32 - (offset + field.len)) & mask;
        } else {
            // If the field extends beyond the first 32 bits, extract the value from the remaining bytes
            const byteOffset = Math.ceil(offset / 8) - 4;
            console.log(offset);
            const bitOffset = offset % 8;
            if (field.type == 'float') {
              fieldValue = remainingBytes.readUIntBE(byteOffset, Math.ceil(field.len / 8));
            } else {
              fieldValue = remainingBytes.readUIntBE(byteOffset, Math.ceil(field.len / 8)) >>> bitOffset & mask;
            }
            console.log(fieldValue);
        }
        offset += field.len;

        switch (field.type) {
            case 'int':
                // If the value is negative, convert it to a signed integer
                if ((fieldValue & (1 << (field.len - 1))) !== 0) {
                    fieldValue = fieldValue - (1 << field.len);
                }
                decodedObject[field.tag] = fieldValue;
                break;
            case 'uint':
                decodedObject[field.tag] = fieldValue;
                break;
            case 'float':
                // Create a buffer with the extracted bits and convert it to a float
                const floatBuffer = Buffer.alloc(4);
                floatBuffer.writeUint32BE(fieldValue, 0, 4);
                decodedObject[field.tag] = floatBuffer.readFloatBE(0);
                break;
            default:
                break;
        }
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
        const buffer = Buffer.alloc(4);

        switch (field.type) {
          case 'int':
            partialData = (partialData << field.len) | value;
            partialBits += field.len; 
            while (partialBits >= 32) {
              buffer.writeIntBE(partialData >>> (partialBits - 32), 0, 4);
              // If we have accumulated 32 or more bits, write it to a new buffer
              buffers.push(buffer);
              // Remove the written bits from partialData
              partialData = partialData & ((1 << (partialBits - 32)) - 1);
              partialBits -= 32;
            }

            break;
          case 'uint':
            partialData = (partialData << field.len) | value;
            partialBits += field.len; 
            while (partialBits >= 32) {
              buffer.writeUInt32BE(partialData >>> (partialBits - 32), 0);
              // If we have accumulated 32 or more bits, write it to a new buffer
              buffers.push(buffer);
              // Remove the written bits from partialData
              partialData = partialData & ((1 << (partialBits - 32)) - 1);
              partialBits -= 32;
            }
            break;
          case 'float':
            buffer.writeFloatBE(value, 0, 4);
            buffers.push(buffer);
            break;
          default:
            break;
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
  { tag: "WaterLevel", type: "int", len: 8 },
  {tag: "Pressure", type: "float"}
];

const data = { PTemp: 268, "BattVolt.value":-4, WaterLevel: 115, Pressure: 52.4 };

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

