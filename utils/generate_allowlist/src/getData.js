const axios = require('axios');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

async function fetchSuperChainData(superChainIds) {
  const query = `
    {
      superChainSmartAccounts(where: {superChainId_in: ${JSON.stringify(
        superChainIds
      )}}) {
        safe
        superChainId
        level
        badges(where: {badge: "0x11"}) {
          tier
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://api.studio.thegraph.com/query/72352/prosperity-passport/v1.1.2',
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.superChainSmartAccounts;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function transformData(data) {
  return data.map((account) => ({
    superAccount: account.safe,
    level: account.level,
    badges: JSON.stringify(
      account.badges.map((badge) => ({
        badgeId: '0x11',
        name: 'Self Verification',
        tier: badge.tier,
      }))
    ),
  }));
}

async function generateCSV(superChainIds, outputPath) {
  try {
    const data = await fetchSuperChainData(superChainIds);
    const transformedData = transformData(data);

    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'superAccount', title: 'Super Account' },
        { id: 'level', title: 'Level' },
        { id: 'badges', title: 'Badges' },
      ],
    });

    await csvWriter.writeRecords(transformedData);
    console.log('CSV file has been written successfully');
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
}

// Ejemplo de uso:
const superChainIds = [
  'luuk.prosperity',
  'anotherdev.prosperity',
  'sebasor.prosperity',
  'jashdotfi.prosperity',
];
generateCSV(superChainIds, 'output.csv');

module.exports = {
  fetchSuperChainData,
  transformData,
  generateCSV,
};
