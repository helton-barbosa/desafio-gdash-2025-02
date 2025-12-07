// --- POKEMON API TYPES ---
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
}

export interface PokemonDetailsResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  stats: { stat: { name: string }; base_stat: number }[];
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

// --- DECK OF CARDS API TYPES ---
export interface DeckResponse {
  deck_id: string;
  remaining: number;
  shuffled: boolean;
  success: boolean;
}

export interface DrawCardResponse {
  success: boolean;
  deck_id: string;
  cards: {
    code: string;
    image: string;
    value: string;
    suit: string;
  }[];
  remaining: number;
}
