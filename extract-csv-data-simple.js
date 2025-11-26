const fs = require('fs');
const path = require('path');

// Get all CSV files in the directory
const getAllCSVFiles = () => {
  const files = fs.readdirSync('.')
    .filter(file => file.startsWith('Driving ranges - ') && file.endsWith('.csv'))
    .sort();

  return files;
};

// Simple CSV parsing function
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(cell => cell.replace(/^"|"$/g, ''));
};

// Extract data from a single CSV file
const extractDataFromCSV = (filename) => {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    // Parse the CSV structure
    const data = [];

    // Get range names from first row
    const rangeNames = parseCSVLine(lines[0]).filter(name => name && name.length > 2);

    // Create structure for each range
    rangeNames.forEach((name, index) => {
      const range = {
        name: name,
        city: filename.replace('Driving ranges - ', '').replace('.csv', ''),
        facilities: [],
        description: '',
        address: '',
        contactDetails: '',
        phone: '',
        email: '',
        totalBays: null,
        price: ''
      };
      data.push(range);
    });

    // Process lines to extract data
    let currentSection = 'facilities';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const columns = parseCSVLine(line);

      // Detect section changes
      if (line.includes('Visit Driving Range')) {
        currentSection = 'description';
        continue;
      } else if (line.includes('Location')) {
        currentSection = 'location';
        continue;
      } else if (line.includes('Contact Details')) {
        currentSection = 'contact';
        continue;
      } else if (line.includes('Range Details')) {
        currentSection = 'range';
        continue;
      } else if (line.includes('Price')) {
        currentSection = 'price';
        continue;
      }

      // Extract data based on current section
      columns.forEach((cell, colIndex) => {
        if (colIndex >= data.length || !cell) return;

        const cleanCell = cell.trim();
        if (!cleanCell) return;

        const range = data[colIndex];

        switch (currentSection) {
          case 'facilities':
            if (cleanCell && !cleanCell.includes('Visit Driving Range') && cleanCell.length < 50) {
              range.facilities.push(cleanCell);
            }
            break;

          case 'description':
            if (cleanCell.length > 50 && !cleanCell.includes('Location')) {
              range.description = cleanCell;
            }
            break;

          case 'location':
            if (cleanCell && !cleanCell.includes('Contact Details') && cleanCell.length > 2 && cleanCell.length < 100) {
              if (range.address) {
                range.address += ', ' + cleanCell;
              } else {
                range.address = cleanCell;
              }
            }
            break;

          case 'contact':
            if (cleanCell.includes('@')) {
              range.email = cleanCell;
            } else if (/^\d[\d\s]{8,}$/.test(cleanCell)) {
              range.phone = cleanCell;
            }
            break;

          case 'range':
            if (cleanCell.includes('Total Bays:')) {
              const bayMatch = cleanCell.match(/Total Bays:\s*(\d+)/);
              if (bayMatch) {
                range.totalBays = parseInt(bayMatch[1]);
              }
            }
            break;

          case 'price':
            if (cleanCell.includes('£')) {
              range.price = cleanCell;
            }
            break;
        }
      });
    }

    return data.filter(range => range.name && range.name.length > 3);

  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
    return [];
  }
};

// Main extraction function
const extractAllCSVData = () => {
  const files = getAllCSVFiles();
  console.log(`Found ${files.length} CSV files to process\n`);

  const allData = [];
  let totalRanges = 0;
  let rangesWithBays = 0;
  let rangesWithAddresses = 0;

  files.forEach(file => {
    console.log(`Processing ${file}...`);
    const data = extractDataFromCSV(file);

    data.forEach(range => {
      totalRanges++;
      if (range.totalBays) rangesWithBays++;
      if (range.address && range.address.length > 5) rangesWithAddresses++;

      console.log(`  ${range.name}: ${range.totalBays || 'No'} bays, Address: ${range.address ? 'Yes' : 'No'}`);
    });

    allData.push(...data);
    console.log('');
  });

  console.log(`\n📊 EXTRACTION SUMMARY:`);
  console.log(`Total ranges extracted: ${totalRanges}`);
  console.log(`Ranges with bay counts: ${rangesWithBays}`);
  console.log(`Ranges with addresses: ${rangesWithAddresses}`);

  // Save all data to JSON file
  fs.writeFileSync('extracted-csv-data.json', JSON.stringify(allData, null, 2));
  console.log(`\n✅ Data saved to extracted-csv-data.json`);

  // Show ranges with both bays and addresses
  const completeRanges = allData.filter(r => r.totalBays && r.address && r.address.length > 5);
  console.log(`\n🎯 RANGES WITH BOTH BAY COUNTS AND ADDRESSES (${completeRanges.length}):`);
  completeRanges.slice(0, 15).forEach(range => {
    console.log(`${range.name} (${range.city}): ${range.totalBays} bays - ${range.address.substring(0, 60)}...`);
  });

  // Show just bay counts
  const bayRanges = allData.filter(r => r.totalBays);
  console.log(`\n🔢 ALL BAY COUNTS FOUND (${bayRanges.length}):`);
  bayRanges.forEach(range => {
    console.log(`${range.name} (${range.city}): ${range.totalBays} bays`);
  });

  return allData;
};

extractAllCSVData();