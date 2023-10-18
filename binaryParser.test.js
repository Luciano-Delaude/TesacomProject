/**
 * Test suite for BinaryParser class.
 */

//TEST 1 -----------------------------------------------------------------------------------------------------------------------------
const BinaryParser = require('./binaryParser'); // Import your BinaryParser class
const format = [
  { tag: "var0.Temp_C_2_Avg", type: "float" },
  { tag: "var0.DOppm", type: "float" },
  { tag: "var0.TurbNTU", type: "float" },
  { tag: "var0.Lvl_corr_Avg", type: "float" },
  { tag: "var0.Cond_Avg", type: "float" },
  { tag: "var0.pH_Avg", type: "float" },
  { tag: "var0.TimeStamp", type: "float" },
  { tag: "var0.BattV_Avg", type: "float" },
  { tag: "var0.BattV_Min", type: "float" },
  { tag: "var1.Temp_C_2_Avg", type: "float" },
  { tag: "var1.DOppm", type: "float" },
  { tag: "var1.TurbNTU", type: "float" },
  { tag: "var1.Lvl_corr_Avg", type: "float" },
  { tag: "var1.Cond_Avg", type: "float" },
  { tag: "var1.pH_Avg", type: "float" },
  { tag: "var1.TimeStamp", type: "float" },
  { tag: "var1.BattV_Avg", type: "float" },
  { tag: "var1.BattV_Min", type: "float" },
];

const data = {
  "var0.Temp_C_2_Avg": 25.5,
  "var0.DOppm": 12.3,
  "var0.TurbNTU": 6.8,
  "var0.Lvl_corr_Avg": 3.2,
  "var0.Cond_Avg": 100.5,
  "var0.pH_Avg": 7.2,
  "var0.TimeStamp": 1634937600.123,
  "var0.BattV_Avg": 3.7,
  "var0.BattV_Min": 3.2,
  "var1.Temp_C_2_Avg": 26.0,
  "var1.DOppm": 11.8,
  "var1.TurbNTU": 7.2,
  "var1.Lvl_corr_Avg": 3.5,
  "var1.Cond_Avg": 98.5,
  "var1.pH_Avg": 7.0,
  "var1.TimeStamp": 1634937601.234,
  "var1.BattV_Avg": 3.8,
  "var1.BattV_Min": 3.1
};
 /**
 * Test suite for BinaryParser class, testing encoding and decoding of data with float values.
 */
describe('BinaryParser testing float values', () => {

  it('should encode and decode data correctly', () => {
    const bp = new BinaryParser();
    const encodedData = bp.encode(data, format);
    const decodedData = bp.decode(encodedData, format);
    expect(decodedData).toEqual(data);
  });
});

//TEST 2 -----------------------------------------------------------------------------------------------------------------------------
const format1 = [
  { tag: "PTemp", type: "int", len: 12 },
  { tag: "BattVolt.value", type: "int", len: 12 },
  { tag: "WaterLevel", type: "int", len: 8 },
  { tag: "Pressure", type: "float" }
];

const data1 = { PTemp: -3, "BattVolt.value": -5, WaterLevel: 115, Pressure: 52.4 };

/**
 * Test suite for BinaryParser class, testing encoding and decoding of data with negative integer values.
 */
describe('BinaryParser negative data', () => {
  it('should encode and decode negative data data correctly', () => {
    const bp = new BinaryParser();
    const encodedData = bp.encode(data1, format1);
    const decodedData = bp.decode(encodedData, format1);
    expect(decodedData).toEqual(data1);
  });
});

//TEST 3 -----------------------------------------------------------------------------------------------------------------------------
const format2 = [{ tag: "var0.value", type: "uint", len: 2 },
{ tag: "var1.value", type: "uint", len: 2 },
{ tag: "var2.value", type: "uint", len: 7 },
{ tag: "var3.value", type: "uint", len: 11 },
{ tag: "var4.value", type: "uint", len: 8 },
{ tag: "var5.value", type: "uint", len: 2 }];

const data2 = {"var0.value" : 1, "var1.value" : 3, "var2.value" : 127, "var3.value": 2047,"var4.value": 255,"var5.value" : 1};

/**
 * Test suite for BinaryParser class, testing encoding and decoding of data with multiple fields of various lengths.
 */
describe('BinaryParser multiple data', () => {
    it('should encode and decode multiple data data correctly', () => {
      const bp = new BinaryParser();
      const encodedData = bp.encode(data2, format2);
      const decodedData = bp.decode(encodedData, format2);
      expect(decodedData).toEqual(data2);
    });
  });

//TEST 4 -----------------------------------------------------------------------------------------------------------------------------
const tramaDatos = Buffer.from('010203', 'hex'); // Trama de datos en formato hexadecimal
const formato = [
    { tag: "v0", type: "int", len: 8 },
    { tag: "v1", type: "int", len: 8 },
    { tag: "v2", type: "int", len: 8 }
  ];

  dataTrama = {
    v0: 1,
    v1: 2,
    v2: 3
    };
/**
 * Test suite for BinaryParser class, testing encoding and decoding of data with incomplete byte length.
 */
  describe('BinaryParser trama data', () => {
    it('should encode and decode trama data correctly', () => {
      const bp = new BinaryParser();
      const decodedData = bp.decode(tramaDatos, formato);
      expect(decodedData).toEqual(dataTrama);
    });
  });

