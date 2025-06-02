import { Opera } from '../types/opera';

export const sampleOperas: Opera[] = [
  {
    id: '1',
    title: 'La Traviata',
    composer: 'Giuseppe Verdi',
    synopsis: 'A young woman sacrifices her life for love.',
    firstPerformance: {
      date: '1853-03-06',
      place: 'La Fenice, Venice',
    },
    imageUrl: '/images/traviata.jpg',
  },
  {
    id: '2',
    title: 'Carmen',
    composer: 'Georges Bizet',
    synopsis: 'A passionate tale of love and jealousy in Spain.',
    firstPerformance: {
      date: '1875-03-03',
      place: 'Opéra-Comique, Paris',
    },
    imageUrl: '/images/carmen.jpg',
  },
  {
    id: '3',
    title: 'The Magic Flute',
    composer: 'Wolfgang Amadeus Mozart',
    synopsis: 'A whimsical tale of love, trials, and the triumph of good over evil, set in a fantastical world.',
    firstPerformance: {
      date: '1791-09-30',
      place: 'Theater auf der Wieden, Vienna',
    },
    imageUrl: '/images/magic-flute.jpg',
  },
  {
    id: '4',
    title: 'Rigoletto',
    composer: 'Giuseppe Verdi',
    synopsis: 'A tale of betrayal and revenge in a Venetian court.',
    firstPerformance: {
      date: '1851-03-11',
      place: 'La Fenice, Venice',
    },
    imageUrl: '/images/rigoletto.jpg',
  },
  {
    id: '5',
    title: 'Tosca',
    composer: 'Giacomo Puccini',
    synopsis: 'A dramatic story of love, betrayal, and political intrigue in Rome.',
    firstPerformance: {
      date: '1900-01-14',
      place: 'Teatro Costanzi, Rome',
    },
    imageUrl: '/images/tosca.jpg',
  },
]; 