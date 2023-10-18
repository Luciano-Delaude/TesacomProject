/**
 * Class representing a Binary Parser for decoding and encoding binary data based on a specified format.
 */
class BinaryParser {
  /**
   * Decodes a binary frame according to the specified format.
   *
   * @param {Buffer} buffer - Binary frame to deserialize
   * @param {Array} format - Serialization format
   * @returns {Object} Deserialized object with tag = value fields
   * @throws {Error} Throws an error if the format specification is invalid or if there are issues with decoding.
   */
   decode(buffer, format) {
    if (!Array.isArray(format) || format.length === 0) {
      throw new Error('Invalid format specification. Format must be a non-empty array.');
    }
    // Define starting values.
    let offset = 0;
    let values = 0;
    let byteOffset = 0;
    let decodedObject = {};

    format.forEach(field => {
      //Mask to get the valid data in function of the type and the lenght.
      let mask = (1 << field.len) - 1;
      //Value where the processed data will be stored.
      let fieldValue;
        switch (field.type) {
          case 'uint':
            //If offset is a multiple of 32, read 32 bits and store them in values.
            if (offset % 32 == 0) {
              if (byteOffset + 4 > buffer.length) {
                values = buffer.readUIntBE(byteOffset,buffer.length - byteOffset);
              } else {
                values = buffer.readUIntBE(byteOffset,4);
                byteOffset = byteOffset + 4;
              }
            }
            /*
            This line extracts the bits corresponding to the current field from the values variable 
            by right shifting to align the bits of interest and then applies a bitmask to filter
             out unwanted bits.
            */
            fieldValue = values >>> ((buffer.length * 8) - (offset + field.len)) & mask;
            
            decodedObject[field.tag] = fieldValue;
            offset += field.len;
            break;
          case 'int':
            if (offset % 32 == 0) {
              if (byteOffset + 4 > buffer.length) {
                values = buffer.readIntBE(byteOffset,buffer.length - byteOffset);
              } else {
                values = buffer.readIntBE(byteOffset,4);
                byteOffset = byteOffset + 4;
              }
            }
            /*
            This line extracts the bits corresponding to the current field from the values variable 
            by right shifting to align the bits of interest and then applies a bitmask to filter
             out unwanted bits.
            */
            fieldValue = values >>> ((buffer.length * 8) - (offset + field.len)) & mask;

            /* This if() checks the most significant bit (MSB) of the fieldValue
            to determine if the value is negative or positive. If negative, obtains
            the two's complement of the value.*/
            if ((fieldValue & (1 << (field.len - 1))) !== 0) {
              fieldValue = fieldValue - (1 << field.len);
            }
            decodedObject[field.tag] = fieldValue;
            offset += field.len;
            break;
          case  'float':
            if (offset % 32 == 0) {
              decodedObject[field.tag] = buffer.readFloatBE(byteOffset,4);
              byteOffset = byteOffset + 4;
            }
            offset += 32;
            break;
          default:
            throw new Error(`Invalid field type: ${field.type}`);
        }
    });
    return decodedObject;
}


   /**
   * Encodes an object according to the specified format.
   *
   * @param {Object} _object - Object to serialize
   * @param {Array} format - Serialization format
   * @returns {Buffer} Encoded binary frame
   * @throws {Error} Throws an error if the value is out of valid range for the specified field or if there are issues with encoding.
   */
  encode(_object, format) {
    // Define starting values.
    let partialData = 0;
    let partialBits = 0;
    const buffers = [];

    format.forEach(field => {
        let value = _object[field.tag];
        const buffer = Buffer.alloc(4);
        if (field.type == 'float') {
          field.len = 32;
        }
        // Validate field value based on field type and length
        const minValidValue = field.type === 'int' ? -(1 << (field.len - 1)) : 0;
        const maxValidValue = field.type === 'int' ? (1 << (field.len - 1)) - 1 : Math.pow(2, field.len) - 1;
        if (value < minValidValue || value > maxValidValue) {
          throw new Error(`Invalid value "${value}" for field "${field.tag}". Valid range: [${minValidValue}, ${maxValidValue}].`);
        }


        switch (field.type) {
          case 'int':
          case 'uint':
            // Convert negative integers to two's complement representation
            if (value < 0) {
              value = (1 << field.len) - Math.abs(value);
            }

            //Concatenate data to reach a 32 bits size of data to not loose information.
            partialData = (partialData << field.len) | value;
            partialBits += field.len; 
            while (partialBits >= 32) {
              if (field.type == 'int') {
                buffer.writeIntBE((partialData >>> (partialBits - 32)) & (0xFFFFFFFF), 0,4);
              } else {
                buffer.writeUInt32BE(partialData >>> (partialBits - 32), 0);
              }
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
            throw new Error(`Invalid field type: ${field.type}`);
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
};

module.exports = BinaryParser;
