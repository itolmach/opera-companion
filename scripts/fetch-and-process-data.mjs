import fs from 'fs';
import path from 'path';

const DATA_URL = 'https://api.openopus.org/work/dump.json';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all_operas.json');

async function fetchAndProcessData() {
  console.log('Fetching OpenOpus data dump...');
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    const rawData = await response.json();

    console.log('Processing data to include only operas...');
    const processedOperas = [];
    const encounteredGenres = new Set(); 
    let worksProcessedCount = 0;
    let operasIncludedCount = 0;

    if (rawData && rawData.composers) {
      for (const composer of rawData.composers) {
        if (composer.works) {
          for (const work of composer.works) {
            worksProcessedCount++;
            if (work.genre) {
              encounteredGenres.add(work.genre);
              // Stricter filter: genre must explicitly include 'opera' (case-insensitive)
              const isOpera = work.genre.toLowerCase().includes('opera');
              
              if (isOpera) {
                operasIncludedCount++;
                const workId = work.id || `${composer.complete_name.replace(/\s+/g, '-').toLowerCase()}-${work.title.replace(/\s+/g, '-').toLowerCase()}`;
                const opera = {
                  id: workId,
                  title: work.title || 'Unknown Title',
                  composer: composer.complete_name || composer.name || 'Unknown Composer',
                  synopsis: work.subtitle || '', 
                  genre: work.genre,
                  epoch: composer.epoch, 
                  firstPerformance: work.year ? { date: work.year, place: 'N/A' } : undefined, 
                  imageUrl: composer.portrait || '/images/placeholder.jpg', 
                  composerInfo: {
                    id: composer.id,
                    name: composer.name,
                    complete_name: composer.complete_name,
                    birth: composer.birth,
                    death: composer.death,
                    epoch: composer.epoch,
                    portrait: composer.portrait
                  },
                };
                processedOperas.push(opera);
              }
            }
          }
        }
      }
    }

    console.log(`Total works processed from dump: ${worksProcessedCount}`);
    console.log(`Unique genres encountered during processing (this may include non-operas):\n${Array.from(encounteredGenres).join(', ')}`);
    console.log(`Number of works included as operas (genre contains 'opera'): ${operasIncludedCount}`);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedOperas, null, 2));
    console.log(`Successfully saved ${operasIncludedCount} operas to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error fetching or processing data:', error);
    process.exit(1); 
  }
}

fetchAndProcessData(); 