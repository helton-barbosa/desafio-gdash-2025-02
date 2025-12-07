import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  PokemonListResponse,
  PokemonDetailsResponse,
  DeckResponse,
  DrawCardResponse,
} from './external.interfaces';

@Injectable()
export class ExternalService {
  constructor(private readonly httpService: HttpService) {}

  // --- POKÉMON ---
  async getPokemon(page = 1) {
    try {
      const limit = 20;
      const offset = (page - 1) * limit;

      const { data } = await lastValueFrom(
        this.httpService.get<PokemonListResponse>(
          `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`,
        ),
      );

      return {
        results: data.results,
        total: data.count,
        page: page,
        next: data.next ? page + 1 : null,
        previous: data.previous ? page - 1 : null,
      };
    } catch {
      throw new HttpException('Erro ao buscar Pokémons', 502);
    }
  }

  async getPokemonDetails(id: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<PokemonDetailsResponse>(
          `https://pokeapi.co/api/v2/pokemon/${id}`,
        ),
      );

      return {
        id: data.id,
        name: data.name,
        height: data.height / 10,
        weight: data.weight / 10,
        base_experience: data.base_experience,
        types: data.types.map((t) => t.type.name),
        abilities: data.abilities.map((a) => a.ability.name),
        stats: data.stats.map((s) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        image: data.sprites.other['official-artwork'].front_default,
      };
    } catch {
      throw new HttpException('Erro ao buscar detalhes do Pokémon', 404);
    }
  }

  // --- DECK OF CARDS ---
  async createNewDeck() {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<DeckResponse>(
          'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1',
        ),
      );
      return data;
    } catch {
      throw new HttpException('Erro ao criar baralho', 502);
    }
  }

  async drawCard(deckId: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<DrawCardResponse>(
          `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`,
        ),
      );
      return data;
    } catch {
      throw new HttpException('Erro ao comprar carta', 502);
    }
  }
}
