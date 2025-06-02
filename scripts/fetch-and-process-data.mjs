import fs from 'fs';
import path from 'path';

const DATA_URL = 'https://api.openopus.org/work/dump.json';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all_operas.json');
const MAX_OPERAS_TO_PROCESS = 20; // Limit for debugging

async function fetchAndProcessData() {
  console.log('Fetching OpenOpus data dump...');
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    const rawData = await response.json();

    console.log('Processing data...');
    const processedOperas = [];
    const encounteredGenres = new Set();
    let genresLogged = 0;

    if (rawData && rawData.composers) {
      for (const composer of rawData.composers) {
        if (processedOperas.length >= MAX_OPERAS_TO_PROCESS) break; // Stop if limit reached

        if (composer.works) {
          for (const work of composer.works) {
            if (processedOperas.length >= MAX_OPERAS_TO_PROCESS) break; // Stop if limit reached

            if (work.genre && genresLogged < 10 && !encounteredGenres.has(work.genre)) {
              encounteredGenres.add(work.genre);
              console.log(`Encountered genre: ${work.genre}`);
              genresLogged++;
            }

            // Temporarily broaden the filter to include more genres for inspection, or remove for all works
            // if (work.genre && work.genre.toLowerCase().includes('opera')) {
            // For now, let's include all works to see the structure, then refine the filter
            // Or, let's try a slightly broader filter for opera-like genres
            const operaLike = work.genre && (work.genre.toLowerCase().includes('opera') || work.genre.toLowerCase().includes('stage work') || work.genre.toLowerCase().includes('vocal'));
            if (operaLike) { 
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

    console.log(`Processed ${processedOperas.length} works (limited to ${MAX_OPERAS_TO_PROCESS}).`);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedOperas, null, 2));
    console.log(`Successfully saved processed data to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error fetching or processing data:', error);
    // Exit with error to fail the build if this script is part of it
    process.exit(1); 
  }
}

fetchAndProcessData(); 