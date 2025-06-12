import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const TOKEN_AMOUNT = BigInt('1000000000000000000'); // 1 * 10^18

/**
 * Genera el objeto con la información de cada fila.
 * @param {Object} row - Fila parseada del CSV.
 */
function createEntry(row) {
  const address = row['Super Account'];
  const level = parseInt(row.Level, 10) || 0;
  const badges = JSON.parse(row.Badges || '[]');

  let totalTokens = BigInt(0);
  const reasons = [];

  // Tokens por nivel
  if (level > 0) {
    totalTokens += TOKEN_AMOUNT * BigInt(level);
    reasons.push(`Reached level ${level}`);
  }

  // Tokens por Self Verification badge
  const hasSelfVerification = badges.some(
    (badge) => badge.badgeId === '0x11' && badge.name === 'Self Verification'
  );

  if (hasSelfVerification) {
    totalTokens += TOKEN_AMOUNT;
    reasons.push('Claimed Self verification badge');
  }

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
  const csvPath = './output.csv';
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
