import { Controller, Get, Query, Param } from '@nestjs/common';
import { ExternalService } from './external.service';

@Controller('external')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  // --- POKÉMON ---
  @Get('pokemon')
  getPokemon(@Query('page') page: string) {
    return this.externalService.getPokemon(Number(page) || 1);
  }

  @Get('pokemon/:id')
  getPokemonDetails(@Param('id') id: string) {
    return this.externalService.getPokemonDetails(id);
  }

  // --- DECK OF CARDS ---
  @Get('deck/new')
  newDeck() {
    return this.externalService.createNewDeck();
  }

  @Get('deck/:id/draw')
  drawCard(@Param('id') id: string) {
    return this.externalService.drawCard(id);
  }
}
