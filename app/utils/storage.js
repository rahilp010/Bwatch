import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bwatch_watches';

const DEFAULT_WATCHES = [
  {
    id: '1',
    brand: 'Rolex',
    name: 'Cosmograph Daytona',
    price: '35000.00',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop',
    isFavorite: true,
    gender: 'Men',
    strap: 'Metal',
    type: 'Analogue',
    color: 'Silver Dial',
    description: 'The Rolex Cosmograph Daytona is a mechanical chronograph wristwatch designed to meet the needs of racing drivers by measuring elapsed time and calculating average speed.',
  },
  {
    id: '2',
    brand: 'Patek Philippe',
    name: 'Nautilus 5711',
    price: '120000.00',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=800&auto=format&fit=crop',
    isFavorite: false,
    gender: 'Men',
    strap: 'Metal',
    type: 'Analogue',
    color: 'Blue Dial',
    description: 'With the rounded octagonal bezel of its case, the ingenious porthole construction of its case, and its horizontally embossed dial, the Nautilus has epitomized the elegant sports watch since 1976.',
  },
  {
    id: '3',
    brand: 'Audemars Piguet',
    name: 'Royal Oak',
    price: '75000.00',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
    isFavorite: false,
    gender: 'Men',
    strap: 'Metal',
    type: 'Analogue',
    color: 'Black Dial',
    description: 'The Audemars Piguet Royal Oak is a luxury watch famous for its octagonal bezel, tapisserie dial, and integrated steel bracelet, originally designed by Gérald Genta in 1972.',
  },
];

export const getWatches = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data !== null) {
      return JSON.parse(data);
    }
    // Pre-populate with default watches if empty
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WATCHES));
    return DEFAULT_WATCHES;
  } catch (error) {
    console.error('Error fetching watches from storage:', error);
    return [];
  }
};

export const saveWatches = async (watches) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(watches));
  } catch (error) {
    console.error('Error saving watches to storage:', error);
  }
};
