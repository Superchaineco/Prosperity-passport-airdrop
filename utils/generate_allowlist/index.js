import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const flagStrategies = {
  level: {
    getTokens: (value) => {
      const tokensByLevel = {
        1: '10000000000000000000',
        2: '20000000000000000000',
        3: '30000000000000000000',
        4: '40000000000000000000',
        5: '50000000000000000000',
        6: '60000000000000000000',
      };
      return tokensByLevel[value] || '0';
    },
    getReason: (value) => `Reached level ${value}`,
  },
  // Fácil de añadir nuevos flags, por ejemplo:
  // staking: {
  //   getTokens: (value) => ...,
  //   getReason: (value) => ...
  // }
};

/**
 * Genera el objeto con la información de cada fila.
 * @param {Object} row - Fila parseada del CSV.
 */
function createEntry(row) {
  const address = row.superaccount;

  let totalTokens = BigInt(0);
  const reasons = [];

  Object.entries(flagStrategies).forEach(([flagName, strategy]) => {
    if (row[flagName]) {
      const value = parseInt(row[flagName], 10) || 0;
      if (value > 0) {
        totalTokens += BigInt(strategy.getTokens(value));
        reasons.push(strategy.getReason(value));
      }
    }
  });

  return {
    address,
    tokenAmount: totalTokens.toString(),
    reasons,
  };
}

/**
 * Lee un CSV y construye un JSON con la estructura solicitada:
 * {
 *   "types": ["address", "uint"],
 *   "count": <N>,
 *   "values": {
 *       "0": {"0": <address>, "1": <token>, "reasons": [<razones>]},
 *       ...
 *   }
 * }
 */
function generateAllowlist() {
  const csvPath = './input.csv';
  const outputPath = './allowlist.json';
  const entries = [];

  fs.createReadStream(path.resolve(csvPath))
    .pipe(csv())
    .on('data', (row) => {
      const entry = createEntry(row);
      entries.push(entry);
    })
    .on('end', () => {
      const finalOutput = {
        types: ['address', 'uint'],
        count: entries.length,
        values: {},
      };

      entries.forEach((item, index) => {
        finalOutput.values[index] = {
          0: item.address,
          1: item.tokenAmount,
          reasons: item.reasons,
        };
      });

      const jsonOutput = JSON.stringify(finalOutput, null, 2);

      if (outputPath) {
        fs.writeFileSync(path.resolve(outputPath), jsonOutput, 'utf8');
        console.log(`Archivo JSON generado en: ${outputPath}`);
      } else {
        console.log(jsonOutput);
      }
    });
}

generateAllowlist();
